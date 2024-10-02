import React, {PureComponent} from 'react';
import bridge from '@vkontakte/vk-bridge';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/panels/Game.css';
import Background from "../../../components/ClickerBattle/Background";
import Person from "../../../assets/clickerbattle/persons/Person";
import {ReactComponent as Terra} from "../../../assets/clickerbattle/Terra.svg";
import InfoBanner from "../../../components/ClickerBattle/InfoBanner";
import {ReactComponent as IconInfo} from "../../../assets/clickerbattle/info-24.svg";
import {Avatar, ScreenSpinner} from "@vkontakte/vkui";
import {getRandomInt} from "../../../js/utils";
import {vk_local_users} from "../../../js/drawerapp/utils";
import ChampionBanner from "../../../components/ClickerBattle/ChampionBanner";

let countdownInterval, myClicks = 0;

export class Game extends PureComponent {
    constructor(props) {
        super(props);
        myClicks = 0;

        this.state = {
            countdown: 5,
            started: false,
            updateCountdown: false,
            hideCountdown: false,
            game: {},

            clicks_queue: {count: 0, history: [], coords: []},
            next_clicks_queue_send: 1,

            lastWinner: {}
        };

        this.t = props.t;

        countdownInterval = setInterval(async () => {
            const {countdown} = this.state;
            await this.setState({countdown: countdown > 0 ? countdown - 1 : 0, updateCountdown: true});
            setTimeout(() => this.setState({updateCountdown: false}), 100);
            if (countdown === 0)
                clearInterval(countdownInterval);
        }, 900);

        props.t.client.on('fight', async data => {
            await this.setState({
                started: true,
                game: data.game,
                playerNumber: data.game.player1 === props.t.state.user.id ? 1 : 2,
                enemyNumber: data.game.player1 === props.t.state.user.id ? 2 : 1,
                lastWinner: data.lastWinner
            });
            props.t.setState({currentGameId: data.game.id});
            setTimeout(() => this.setState({hideCountdown: true}), 350);
        });

        props.t.client.on('updateGame', async game => {
            this.setState({game: game.game});
        });

        props.t.client.on('finishGame', async data => {
            props.t.setState({
                popout: null,
                activePanel: 'game_result',
                game_result: data,
                currentGameId: -1
            });
        });

        this.personClick = this.personClick.bind(this);
    }

    componentWillUnmount() {
        clearInterval(countdownInterval);
    }

    personClick(event) {
        let
            {clicks_queue, next_clicks_queue_send, game, playerNumber} = this.state,
            {history, coords} = clicks_queue,
            coords_ = {x: event.clientX, y: event.clientY}
        ;

        if (!(myClicks >= game.clicks || game.clicks1 >= game.clicks || game.clicks2 >= game.clicks))
            myClicks++;
        else
            this.t.setState({popout: <ScreenSpinner/>});

        history.push(Date.now());
        coords.push(coords_);
        clicks_queue.count += 1;

        game['clicks' + playerNumber] += 1;

        if (clicks_queue.count >= next_clicks_queue_send && myClicks <= game.clicks) {
            //console.log('send click');
            this.t.client.emit('games.click', {game_id: game.id, clicks_queue});
            next_clicks_queue_send = Math.min(getRandomInt(1, 3), game.clicks - myClicks);
            clicks_queue = {count: 0, history: [], coords: []};
            this.setState({clicks_queue, game, next_clicks_queue_send});
        } else {
            this.setState({clicks_queue, game});
        }
        this.forceUpdate();

        try {
            if (this.t.state.user.cursorChanged > -1) {
                const cursor = document.createElement('img');
                cursor.className = 'cursor';
                cursor.src = require(`../../../assets/clickerbattle/cursors/${this.t.state.cursors.find(value => value.id === this.t.state.user.cursorChanged).file_name}.svg`);
                cursor.style.left = event.clientX + 'px';
                cursor.style.top = event.clientY + 'px';
                document.getElementsByClassName('game')[0].appendChild(cursor);
                setTimeout(() => {
                    cursor.remove();
                }, 150);
            }
        } catch (e) {
            console.error(e);
        }
    }

    render() {
        const
            {props, state} = this,
            {t} = props,
            {countdown, started, updateCountdown, hideCountdown, game, playerNumber, enemyNumber, lastWinner} = state,
            {persons, enemy, user} = t.state,

            enemyPersonId = persons.find(value => value.id === enemy.activePerson).id
        ;

        return (
            <div className='game'>
                {
                    !hideCountdown &&
                    <div className='GameCountDown' style={{
                        opacity: started && 0
                    }}>
                        <div className='GameEnemyInfo'>
                            <Avatar size={30} shadow={false} src={vk_local_users[enemy.id].photo_100}/>
                            <div>
                                <div>
                                    Противник
                                </div>
                                <div>
                                    {vk_local_users[enemy.id].first_name} {vk_local_users[enemy.id].last_name}
                                </div>
                            </div>
                        </div>
                        {countdown > 0 &&
                        <div className={`GameCounter ${updateCountdown ? '' : 'GameCounterAnimated'}`}>
                            {countdown}
                        </div>
                        }
                    </div>
                }
                <div className='HeaderBackground' style={{
                    height: '16vh'
                }}/>
                {
                    (!hideCountdown || lastWinner === null || lastWinner.bannerChanged === -1 || lastWinner.bannerStatChanged === -1) ?
                        <InfoBanner before={<IconInfo/>}>
                            Кликайте по противнику, чтобы набирать очки
                        </InfoBanner>
                        :
                        <ChampionBanner
                            t={t}
                            user={lastWinner}
                            user_id={lastWinner.id}
                            type={lastWinner.bannerChanged}
                            stats_type={lastWinner.bannerStatChanged}
                        />
                }
                {
                    !(!hideCountdown || lastWinner === null || lastWinner.bannerChanged === -1 || lastWinner.bannerStatChanged === -1) &&
                    <div className='ChampionBannerShadow'/>
                }
                <div className='PlayerContainer'>
                    <div className='counter' style={{
                        opacity: !started && 0
                    }}>
                        <div id='GamePlayerClicks'>
                            {true ? myClicks : game['clicks' + playerNumber]} - {game['clicks' + enemyNumber]}
                        </div>
                        <div id='GameAllClicks'>
                            из {game.clicks}
                        </div>
                    </div>
                    <Person
                        name={persons[persons.findIndex(value => value.id === enemyPersonId)].file_name}
                        skin={enemy.activeSkins[enemyPersonId] !== undefined && persons[persons.findIndex(value => value.id === enemyPersonId)].skins[enemy.activeSkins[enemyPersonId]]}
                        onClick={(e) => this.personClick(e)}
                        showAnimation={true}
                    />
                    <Terra className='Terra'/>
                </div>
                <Background arenaOpacity={.50} fogOpacity={.15}/>
            </div>
        )
    }
}

Game.defaultProps = {};

Game.propTypes = {
    t: PropTypes.object
};

export default Game;