import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/slides/Home.css';
import '../../../css/ClickerBattle/panels/SearchPlayer.css';
import {ReactComponent as Terra} from "../../../assets/clickerbattle/Terra.svg";
import {ReactComponent as IconPlay} from "../../../assets/clickerbattle/play_16.svg";
import {ReactComponent as IconMiniGame} from "../../../assets/clickerbattle/skins_16.svg";
import Button from "../../../components/ClickerBattle/Button";
import Person from "../../../assets/clickerbattle/persons/Person";
import {decOfNum} from "../../../js/utils";
import {
    getVKUsers
} from '../../../js/drawerapp/utils';

let counterInterval, onlineInterval;

export class Home extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            counter: 0,
            searchPlayer: false,
            online: 1
        };

        const {t} = props;
        this.t = t;

        t.updateUserData();
        t.client.on('player_find', async data => {
            try {
                navigator.vibrate(50);
            } catch (e) {
            }
            const enemy = data['user' + (data.user1.id === t.state.user.id ? '2' : '1')];
            await getVKUsers([enemy.id]);
            this.cancelSearchPlayer();
            t.setState({activePanel: 'game', enemy});
        });

        t.client.emit('persons.get', {}, persons => {
            t.setState({persons: persons.response});
        });

        this.startSearchPlayer = this.startSearchPlayer.bind(this);
    }

    startSearchPlayer() {
        counterInterval = setInterval(() =>
                this.setState({counter: this.state.counter < 3 ? this.state.counter + 1 : 0})
            , 500);
        onlineInterval = setInterval(() =>
            this.t.client.emit('games.getOnline', {}, response => {
                this.setState({online: response.response});
            }), 2000);

        const
            slideBar = document.getElementsByClassName('SlideBar HiddenScrollBar')[0],
            headerTop = document.getElementsByClassName('HeaderTop')[0],
            buttonPlay = document.getElementsByClassName('ButtonsContainer')[0]
        ;

        slideBar.style.transform = 'translateY(-50vh)';
        headerTop.style.transform = 'translateY(-50vh)';
        buttonPlay.style.transform = 'translateY(50vh)';
        buttonPlay.style.pointerEvents = 'none';
        setTimeout(() => {
            this.setState({searchPlayer: true});
        }, 200);
        setTimeout(() => {
            buttonPlay.style.transform = 'translateY(0)';
            buttonPlay.style.pointerEvents = 'painted';
        }, 400);
    }

    cancelSearchPlayer() {
        this.setState({counter: 0});
        clearInterval(counterInterval);
        clearInterval(onlineInterval);
        try {
            const
                slideBar = document.getElementsByClassName('SlideBar HiddenScrollBar')[0],
                headerTop = document.getElementsByClassName('HeaderTop')[0],
                buttonPlay = document.getElementsByClassName('ButtonsContainer')[0],
                searchTitle = document.getElementsByClassName('SearchTitle')[0],
                searchDescription = document.getElementsByClassName('SearchDescription')[0]
            ;

            slideBar.style.transform = 'translateY(0)';
            headerTop.style.transform = 'translateY(0)';
            buttonPlay.style.transform = 'translateY(50vh)';

            searchTitle.style.animation = 'hideOpacity 400ms ease-in-out';
            searchDescription.style.animation = 'hideOpacity 400ms ease-in-out';
            setTimeout(() => {
                this.setState({searchPlayer: false});
                buttonPlay.style.transform = 'translateY(0)';
            }, 300);
        } catch (e) {

        }
    }

    componentWillUnmount() {
        clearInterval(counterInterval);
        clearInterval(onlineInterval);
    }

    componentDidMount() {
        if (this.props.t.state.persons.length === 0)
            setTimeout(() => {
                this.forceUpdate();
            }, 250)
    }

    render() {
        const
            {props, state} = this,
            {searchPlayer, counter, online} = state,
            {t} = props,
            {user, persons} = t.state
        ;

        return persons.length > 0 ? (
            <div className='Home'>
                {
                    searchPlayer && <React.Fragment>
                        <div className='SearchTitle'>
                            Подбираем соперника{new Array(counter).fill('.').join('')}
                        </div>
                        <div className='SearchDescription'>
                            {new Date().toLocaleString('ru', {hour: 'numeric', minute: 'numeric'})}
                            · Онлайн: {decOfNum(online, ['игрок', 'игрока', 'игроков'])}
                        </div>
                    </React.Fragment>
                }
                <div className='PlayerContainer'>
                    <Person
                        name={persons.length > 0 && persons[persons.findIndex(value => value.id === user.activePerson)].file_name}
                        skin={persons[persons.findIndex(value => value.id === user.activePerson)].skins[user.activeSkins[user.activePerson]]}/>
                    <Terra className='Terra'/>
                </div>
                <div className='ButtonsContainer'>
                    {
                        user.energy >= 15 ?
                            <Button
                                onClick={() => {
                                    t.client.emit('games.search', {}, async action => {
                                        if (action.response === 1) {
                                            this.startSearchPlayer();
                                        } else {
                                            this.cancelSearchPlayer();
                                        }
                                    });
                                }} before={!searchPlayer && <IconPlay/>}
                                className='ButtonPlay'
                            >
                                {searchPlayer ? 'Отменить' : 'Играть'}
                            </Button>
                            :
                            <Button style={{color: 'rgba(87, 64, 57, 0.5)'}} className='ButtonPlay'>
                                Недостаточно энергии
                            </Button>
                    }
                    {
                        !searchPlayer &&
                        <Button
                            onClick={() => {
                                t.setState({activePanel: 'mini_game'});
                            }} before={<IconMiniGame/>}
                            className='ButtonMiniGame'
                        >
                            Мини-игра
                        </Button>
                    }
                </div>
            </div>
        ) : (<div/>)
    }
}

Home.defaultProps = {};

Home.propTypes = {
    t: PropTypes.object
};

export default Home;