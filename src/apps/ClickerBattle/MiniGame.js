import React from 'react';
import eruda from 'eruda';
import bridge from '@vkontakte/vk-bridge';
import '../../css/ClickerBattle/MiniGame.css';
import {decOfNum, getRandomInt} from "../../js/utils";
import {
    getVKUsers
} from '../../js/drawerapp/utils';
import Person from "../../assets/clickerbattle/persons/Person";
import {Avatar} from "@vkontakte/vkui";
import {ReactComponent as IconUlt} from "../../assets/clickerbattle/runner/ult_24.svg";

let
    checkerInterval,
    timeouts = {},
    lastId,
    percentRange = [82, 20],
    percent = Math.max(...percentRange),
    needClicks = 10
;

class MiniGame extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            clicks: 0,
            levitation: false,
            lobby_id: 0
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.initializeGame = this.initializeGame.bind(this);
        this.componentWillUnmount = this.componentWillUnmount.bind(this);
        this.click = this.click.bind(this);
        this.levitation = this.levitation.bind(this);
    }

    async componentDidMount() {
        const {t} = this.props;
        t.client.emit('runner.join', {}, async data => {
            console.log('emit runner.join', data);

            const
                {players, lobby_id, lobby} = data.response,
                players_vk = await getVKUsers(players.map(value => value.id))
            ;

            await this.setState({
                lobby_id,
                lobby,
                players: players.map(value => {
                    return {...players_vk.find(value1 => value1.id === value.id), ...value}
                })
            });

            t.client.on('runner.join', async data => {
                console.log('on runner.join', data);

                const
                    {user, lobby} = data,
                    player_vk = await getVKUsers([user.id]),
                    playerIndex = this.state.players.findIndex(value => value.id === player_vk[0].id)
                ;

                if (playerIndex === -1) {
                    this.setState({players: [...this.state.players, {...player_vk[0], ...user}], lobby});
                }
            });

            t.client.on('runner.leave', async data => {
                console.log('on runner.leave', data);

                const
                    {user_id} = data,
                    {players} = this.state
                ;
                players.splice(players.findIndex(value => value.id === user_id), 1);
                this.setState({players});
            });

            t.client.on('runner.jump', async data => {
                console.log('on runner.jump', data);

                if (this.state.gameBroken)
                    return;

                const
                    {lobby, user_id, type} = data,
                    players = this.state.players.filter(value => lobby.findIndex(value1 => value1.vk_id === value.id) > -1)
                ;
                this.setState({lobby, players});
                if (!this[`player_${user_id}`]) return;

                this[`player_${user_id}`].className = this[`player_${user_id}`].className.replaceAll(' Person__Animated', '').replaceAll(' Person__Levitation', '');
                setTimeout(() =>
                    this[`player_${user_id}`].className += type === 'jump' ? ' Person__Animated' : ' Person__Levitation', 10
                );
            });

            t.client.on('runner.broke', async data => {
                console.log('on runner.broke', data);
                const {user_id} = data;
                if (!this[`player_${user_id}`]) return;
                this[`player_${user_id}`].className = this[`player_${user_id}`].className.replaceAll(' Person__Animated', '').replaceAll(' Person__Levitation', '');
                setTimeout(() =>
                    this[`player_${user_id}`].className += ' Person__Broke', 10
                );
            });

            t.client.on('runner.return', async data => {
                console.log('on runner.return', data);
                const {user_id} = data;
                if (!this[`player_${user_id}`]) return;
                this[`player_${user_id}`].className = this[`player_${user_id}`].className.replaceAll(' Person__Broke', '');
            });
        });
        this.initializeGame();
    }

    async initializeGame() {
        lastId = 0;
        this.setState({gameBroken: false});
        timeouts = {};
        if (this.container && this.person) {
            const
                cactuses = document.getElementsByClassName('MainContainer')[0].getElementsByClassName('Cactus'),
                cactusesCount = cactuses.length
            ;

            for (let i = 0; i < cactusesCount; i++) {
                cactuses[0].remove();
            }

            this.person.style.animationPlayState = 'running';
            this.background.style.animationPlayState = 'running';
            this.person.style.transform = '';
        }

        this.props.t.client.off('cactus.spawn');

        setTimeout(() => {
            this.props.t.client.on('cactus.spawn', async data => {
                console.log('on cactus.spawn', data);

                const {type} = data;

                if (this.state.gameBroken) return;

                if (this.container) {
                    const
                        cactus = document.createElement('img')
                    ;
                    cactus.src = require(`../../assets/clickerbattle/runner/${type}.png`);
                    cactus.className = `Cactus ${type}`;
                    cactus.id = 'Cactus__' + lastId;
                    this.container.appendChild(cactus);
                    timeouts[cactus.id] = setTimeout(() =>
                        cactus.remove(), 1500 * (100 / 375 * document.documentElement.clientWidth / 100)
                    );
                    lastId++;
                }
            });
        }, 250);
        checkerInterval = setInterval(() => {
            if (this.state.gameBroken) return;

            const
                cactuses = this.container.getElementsByClassName('Cactus'),
                cactus = cactuses[0]
            ;

            if (!cactus) return;

            const
                person = this.person,
                cactusClient = cactus.getBoundingClientRect(),
                personClient = person.getBoundingClientRect(),
                cactusX = cactusClient.left,
                cactusX2 = cactusX + cactus.clientWidth,
                cactusY = cactus.clientHeight,
                personX = personClient.left,
                personX2 = personX + person.clientWidth,
                personY = Math.abs(personClient.bottom - this.container.getBoundingClientRect().bottom)
            ;

            /*document.getElementById('person_temp').style.transform = `translateY(${-personY}px)`;
            document.getElementById('cactus_temp').style.transform = `translateX(${cactusX}px)`;
            document.getElementById('cactus_temp').style.width = `${cactus.clientWidth}px`;
            document.getElementById('cactus_temp').style.height = `${cactus.clientHeight}px`;*/

            if ((cactusX <= personX2 && cactusX >= personX && personY <= cactusY) || (personX <= cactusX2 && personX >= cactusX && personY <= cactusY)) {
                this.setState({
                    gameBroken: true, popout: <div className='MiniGame__Popout'>
                        <img src={require('../../assets/clickerbattle/runner/emoji.png')} alt='emoji'
                             className='Emoji'/>
                        <div className='PopoutText'>Продолжить?</div>
                        <div className='ButtonsContainer'>
                            <div
                                className='Button'
                                onClick={() => {
                                    this.setState({popout: null});
                                    this.props.t.client.emit('runner.return', {lobby_id: this.state.lobby_id}, () => {
                                    });
                                    this.initializeGame();
                                }}
                            >
                                Да
                            </div>
                            <div
                                className='Button'
                                onClick={async () => {
                                    const t = this.props.t;
                                    await t.updateUserData();
                                    try {
                                        await bridge.send('VKWebAppShowNativeAds', {ad_format: 'preloader'});
                                    } catch (e) {
                                    }
                                    t.setState({activePanel: 'minigame_placeholder', slideBarIndex: 0});
                                }}
                            >
                                Выйти
                            </div>
                        </div>
                    </div>
                });
                this.props.t.client.emit('runner.broke', {lobby_id: this.state.lobby_id, type: 'jump'}, () => {
                });
                cactus.style.animationPlayState = 'paused';
                person.style.animationPlayState = 'paused';
                this.background.style.animationPlayState = 'paused';
                cactus.style.transform = `translateX(${cactusX}px)`;
                person.style.transform = `translateY(${-personY}px) scaleX(-1)`;

                for (const i in cactuses) {
                    if (i > 0)
                        cactuses[i].style.animationPlayState = 'paused';

                    clearTimeout(timeouts[cactuses[i].id]);
                }

                this.forceUpdate();
            }
        }, 0);
    }

    componentWillUnmount() {
        clearInterval(checkerInterval);
        this.props.t.client.emit('runner.leave', {lobby_id: this.state.lobby_id}, () => {
        });
        this.props.t.client.off('runner.join');
        this.props.t.client.off('runner.leave');
        this.props.t.client.off('runner.jump');
        this.props.t.client.off('runner.broke');
        this.props.t.client.off('runner.return');
        this.props.t.client.off('cactus.spawn');
    }

    async click() {
        if (this.state.gameBroken)
            return;

        if (this.person.className.indexOf('Person__Animated') > -1 || this.person.className.indexOf('Person__Levitation') > -1) return;

        this.props.t.client.emit('runner.jump', {lobby_id: this.state.lobby_id, type: 'jump'}, () => {
        });

        const {levitation} = this.state;

        if (percent > Math.min(...percentRange)) {
            percent -= (percentRange[0] - percentRange[1]) / needClicks;

            if (percent <= Math.min(...percentRange))
                this.setState({levitation: true});
        } else if (!levitation) {
            percent = Math.max(...percentRange);
        }
        const text = document.getElementById('ScoreText');

        text.style.background = `linear-gradient(180deg, #514E3C ${percent}%, #3A3A37 ${percent + 0.10}%)`;
        text.style.webkitBackgroundClip = 'text';

        this.person.className += ' Person__Animated';
        setTimeout(() =>
            this.person.className = this.person.className.replaceAll(' Person__Animated', '').replaceAll(' Person__Levitation', ''), 1100
        );

        await this.setState({needScoreTextTemp: true});
        setTimeout(() => {
            this.setState({clicks: this.state.clicks + 1});
            setTimeout(() => this.setState({needScoreTextTemp: false}), 100);
        }, 300);
    }

    async levitation() {
        if (this.state.gameBroken)
            return;

        if (this.person.className.indexOf('Person__Animated') > -1 || this.person.className.indexOf('Person__Levitation') > -1) return;

        if (this.state.levitation) {
            this.props.t.client.emit('runner.jump', {lobby_id: this.state.lobby_id, type: 'levitation'}, () => {
            });

            percent = Math.max(...percentRange);
            this.setState({levitation: false});

            const text = document.getElementById('ScoreText');
            text.style.background = `linear-gradient(180deg, #796158 ${percent}%, #3F2C25 ${percent + 0.10}%)`;
            text.style.webkitBackgroundClip = 'text';

            this.person.className += ' Person__Levitation';

            setTimeout(() =>
                this.person.className = this.person.className.replaceAll(' Person__Animated', '').replaceAll(' Person__Levitation', ''), 1800
            );

            await this.setState({needScoreTextTemp: true});
            setTimeout(() => {
                this.setState({clicks: this.state.clicks + 1});
                setTimeout(() => this.setState({needScoreTextTemp: false}), 100);
            }, 300);
        }
    }

    render() {
        const
            {clicks, needScoreTextTemp, players, levitation, lobby, gameBroken, popout} = this.state,
            {t} = this.props,
            {persons, user} = t.state
        ;

        return <React.Fragment>
            {popout && popout}
            <img className='Fog' src={require('../../assets/clickerbattle/Fog.png')} alt='fog'/>
            <img
                ref={ref => this.background = ref} alt='bg2' className='RunnerBackground'
                src={require('../../assets/clickerbattle/runner/Background.png')}
            />
            <div id='ScoreText'>
                {clicks}
            </div>
            {needScoreTextTemp && <div id='ScoreText_temp'>+1</div>}
            <div className='MainContainer' ref={ref => this.container = ref}>
                {
                    false && <React.Fragment>
                        <div id='person_temp'/>
                        <div id='cactus_temp'/>
                    </React.Fragment>
                }
                <div style={{opacity: gameBroken && 0}} id='Person_Container' ref={ref => this.person = ref}>
                    <Person
                        width={155} height={180.46}
                        name={persons.length > 0 && persons[persons.findIndex(value => value.id === user.activePerson)].file_name}
                        skin={persons[persons.findIndex(value => value.id === user.activePerson)].skins[user.activeSkins[user.activePerson]]}
                    />
                </div>
                {
                    players && players.filter(value => value.id !== user.id).map(player =>
                        <div style={{opacity: gameBroken && 0}} id='Player_Container'
                             ref={ref => this[`player_${player.id}`] = ref}>
                            <Person
                                width={155} height={180.46}
                                name={persons.length > 0 && persons[persons.findIndex(value => value.id === player.activePerson)].file_name}
                                skin={persons[persons.findIndex(value => value.id === player.activePerson)].skins[player.activeSkins[player.activePerson]]}
                            />
                        </div>
                    )
                }
            </div>
            {
                levitation ?
                    <div className='Button__Levitation' onClick={this.levitation}>
                        <IconUlt/>
                        <span>Левитировать</span>
                    </div>
                    :
                    <div className='MiniGame__PlayersContainer'>
                        {lobby && players && players.sort((a, b) => lobby.find(value1 => value1.vk_id === a.id).clicks - lobby.find(value1 => value1.vk_id === b.id).clicks).reverse().map((value, index) =>
                            <div
                                style={{
                                    marginTop: index > 0 && 8
                                }}
                                key={`player_${index}`}
                                className='MiniGame__Player'
                            >
                                <span>#{index + 1}</span>
                                <span>
                                    <Avatar src={value.photo_100} size={36} shadow={false}/>
                                    <span>
                                        {value.first_name} <span style={{color: 'rgba(255, 255, 255, 0.5)'}}>
                                            — {decOfNum((lobby.find(value1 => value1.vk_id === value.id) || {clicks: 0}).clicks, ['клик', 'клика', 'кликов'])}
                                        </span>
                                    </span>
                                </span>
                            </div>
                        )}
                    </div>
            }
            <div className='ButtonClick' onClick={this.click}/>
            <div className='Bottom__Tone'/>
        </React.Fragment>
    }
}

export default MiniGame;