import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {Button, UsersStack} from "@vkontakte/vkui";
import {getRandomInt, sleep} from "../../js/utils";
import {getVKUsers} from "../../js/drawerapp/utils";
import bridge from "@vkontakte/vk-bridge";

let /*interval,*/ exit = false, lobbyId = 0;

export class SearchGame extends PureComponent {

    constructor(props) {
        super(props);

        const {subGameInfo} = props.t.state;
        this.state = {
            lobbyPlayers: [],
            lobbyPlayers_: [],
            point_count: 0,
            starting: false,
            can_leave: false
        };
    }

    componentWillUnmount() {
        //clearInterval(interval);
        this.props.t.log('game_logs', 'componentWillUnmount', {
            panel: this.props.t.state.activePanel,
            time: Date.now()
        });
        exit = true;
    }

    async componentDidMount() {
        await this.props.t.log('game_logs');
        this.props.t.log('game_logs', 'componentDidMount', {panel: this.props.t.state.activePanel, time: Date.now()});
        exit = false;
        setTimeout(async () => {
            try {
                const container = document.getElementsByClassName('SearchImages')[0];
                for (let i = 0; i < 1; i++) {
                    const
                        imgNumber = getRandomInt(1, 64),
                        img = document.createElement('img')
                    ;
                    img.src = `https://photos.avocado.special.vk-apps.com/drawapp_search_images/image_${imgNumber}.${imgNumber > 25 ? 'webp' : 'png'}`;
                    img.style.left = `${getRandomInt(-10, 90)}%`;
                    container.appendChild(img);
                    if (!this.state.starting && !exit) {
                        i--;
                        await sleep(getRandomInt(100, 1000));
                    } else {
                        this.props.t.log('game_logs', 'animation_end', {starting: this.state.starting, exit});
                    }
                    setTimeout(() => img.remove(), 5000);
                }
            } catch (e) {
                this.props.t.log('game_logs', 'error_lag', {m: e.message});
            }
        }, 100);

        /*interval = setInterval(() => {
            const {point_count} = this.state;
            this.setState({point_count: point_count >= 3 ? 0 : point_count + 1});
        }, 800);*/

        const {socket, state} = this.props.t;
        socket.unsubscribe('changeLobbyUsers', 'gameStart', 'chooseWord', 'voteWord', 'setWord', 'gameStarting', 'message');
        socket.subscribe('changeLobbyUsers', async r => {
            console.log('Change lobby players', r.players);
            const time = Date.now();
            this.props.t.log('game_logs', 'in_changeLobbyUsers', {p: r.players, time: Date.now()});
            this.setState({lobbyPlayers: await getVKUsers(r.players), lobbyPlayers_: r.players});
            this.props.t.log('game_logs', 'end_changeLobbyUsers', {
                ping: Date.now() - time,
                time: Date.now(),
                panel: this.props.t.state.activePanel
            });
        });
        if (state.api_manager === 2) {
            socket.subscribe('voteWord', async r => {
                console.log('voteWord', r);
                this.props.t.log('game_logs', 'in_voteWord', {word: r.words});
                this.props.t.setState({voteWords: r.words});
                setTimeout(() => {
                    this.props.t.forceUpdate();
                }, 400);
            });
        }
        if (state.api_manager === 0) {
            socket.subscribe('chooseWord', async r => {
                console.log('chooseWord', r);
                this.props.t.log('game_logs', 'in_chooseWord', {word: r.words});
                this.props.t.setState({chooseWords: r.words});
                setTimeout(() => {
                    this.props.t.forceUpdate();
                }, 400);
            });
            socket.subscribe('setWord', async r => {
                console.log('setWord', r);
                this.props.t.setState({word: r.word});
                this.props.t.log('game_logs', 'in_setWord', {word: r.word});
                setTimeout(() => {
                    this.props.t.forceUpdate();
                }, 400);
            });
        }
        socket.subscribe('gameStart', async r => {
            console.log('gameStart', r);
            const {players, lobbyId, drawerId, timeout} = r;
            this.props.t.log('game_logs', 'in_gameStart', {
                drawer: drawerId,
                lobby: lobbyId,
                manager: this.props.t.state.api_manager,
                players,
                time: Date.now()
            });

            await this.props.t.setState({
                game_players: players,

                game_timeout: timeout,
                lobbyId,
                drawerId,
                gameStart: Date.now(),
                isOnlineDrawing: true,
                subGameInfo: {friendly: false}
            });
            await new Promise(resolve => {
                const {lobbyPlayers, lobbyPlayers_} = this.state;
                let interval;
                interval = setInterval(() => {
                    if (lobbyPlayers_.length === lobbyPlayers.length) {
                        clearInterval(interval);
                        console.log('All players find');
                        resolve(true);
                    }
                }, 400);
            });
            console.log(`Game start. lobbyId = ${lobbyId}, drawerId = ${drawerId}`);
            bridge.send('VKWebAppHideBannerAd');
            this.props.t.log('game_logs', 'set_panel', {
                current: this.props.t.state.activePanel,
                next: 'game',
                time: Date.now()
            });
            this.props.t.setState({
                history: ['main', 'game'],
                activePanel: 'game'
            });
        });
        socket.subscribe('gameStarting', async r => {
            console.log('gameStarting', r);
            this.setState({starting: true});
            this.props.t.log('game_logs', 'in_gameStarting', {panel: this.props.t.state.activePanel, time: Date.now()});
        });
        setTimeout(() => {

            setTimeout(() => {
                this.setState({can_leave: true});
            }, 1000);

            this.props.t.log('game_logs', 'act_start_search', {time: Date.now()});
            socket.call('games.search', {manager: this.props.t.state.api_manager}, r => {
                this.props.t.log('game_logs', 'games.search', {time: Date.now()});
                console.log('games.search', r);
                if (r.error) {
                    this.props.t.setActivePanel('main');
                    this.props.t.setAlert(
                        'Ошибка',
                        r.error.message,
                        [{
                            title: 'Ок',
                            autoclose: true
                        }]
                    );
                } else {
                    if (typeof r.response === 'number' || typeof r.response === 'string') {
                        lobbyId = r.response;
                    }
                }
            });

        }, 1000);
    }

    render() {
        const
            {t} = this.props,
            lobbyPlayers = this.state.lobbyPlayers.filter(user => user.id !== t.state.vk_user.id),
            {starting, can_leave} = this.state
        ;

        return (
            <div className='SearchGame'>
                <div className='SearchContainer'>
                    <h1>{starting ? 'Очищаем холст' : 'Поиск игроков'}</h1>
                    <UsersStack
                        style={{marginTop: 12}}
                        photos={[
                            t.state.vk_user.photo_100,
                            ...lobbyPlayers.map(value => value.photo_100)
                        ]}
                        size='m'
                        visibleCount={5}
                    />
                    {
                        !starting &&
                        <Button
                            size='l'
                            stretched
                            mode='secondary'
                            style={{marginTop: 32}}
                            disabled={!can_leave}
                            onClick={() => {
                                if (!this.state.starting) {
                                    t.back();
                                }
                            }}
                        >
                            Отмена
                        </Button>
                    }
                </div>
                <div className='SearchImages'/>
            </div>
        )
    }

}

SearchGame.defaultProps = {};

SearchGame.propTypes = {
    t: PropTypes.object
};

export default SearchGame;