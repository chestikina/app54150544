import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    ActionSheet,
    ActionSheetItem,
    Button,
    IconButton,
    Input,
    ScreenSpinner, Slider,
    WriteBarIcon,
    PopoutWrapper
} from "@vkontakte/vkui";
import {decOfNum, getFadeMiddleColor, isPlatformDesktop, isPlatformIOS, openUrl, rgbToHex} from "../../js/utils";
import {getVKUsers, vk_local_users} from "../../js/drawerapp/utils";
import {ReactComponent as IconErase2} from "../../assets/drawing/icons/IconErase2.svg";
import {
    Icon16Cancel,
    Icon16Done,
    Icon16DoneCircle,
    Icon24ClockOutline, Icon28AchievementCircleFillBlue,
    Icon28ArrowUturnLeftOutline,
    Icon28BrushOutline,
    Icon28EraserOutline,
    Icon28ErrorCircleOutline,
    Icon28PaintRollerOutline,
    Icon28PaletteOutline
} from "@vkontakte/icons";
import bridge from "@vkontakte/vk-bridge";
import {MODAL_PAGE_PALETTE} from "./Drawing";
import {UserAvatar} from "./UserAvatarFrame";

const current = {};
let interval, lastColorIndex = 0, lastFadeColorIndex = 0, emitLines = [], historyLines = [],
    chosenWord = false, votedWord = false;

const isDesktop = isPlatformDesktop();
let artBattleHistory = {}, err_timeout;

export class Game extends PureComponent {

    constructor(props) {
        super(props);

        const
            {t} = props,
            {user, test_game, test_game_drawer, subGameInfo, api_manager} = t.state
        ;
        this.state = {
            drawer: vk_local_users[props.drawerId],
            isDrawer: test_game ? test_game_drawer : ((props.online === false || api_manager === 2) ? true : (props.drawerId === props.t.state.vk_user.id)),
            text: '',
            drawing: false,
            canLeaveGame: false,
            leave_time: 15,
            time: t.state.game_timeout,

            messages: [],

            color: '#000000',
            lineWidth: 2,

            votes: [],
            completed_players: [],

            blockDraw: false,

            isEraser: false,
            isPipette: false,

            //drawMode: 0 // 0: кисть, 1: стерка, 2: пипетка
        };
        if (!vk_local_users[props.drawerId] || !vk_local_users[props.drawerId].first_name) {
            this.state.drawer = {};
            setTimeout(async () => {
                await getVKUsers([props.drawerId]);
                this.setState({drawer: vk_local_users[props.drawerId]})
            }, 1);
        }

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.throttle = this.throttle.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.drawLine = this.drawLine.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.undoDraw = this.undoDraw.bind(this);
        this.updateChooseWordPopout = this.updateChooseWordPopout.bind(this);
        this.updateVoteWordPopout = this.updateVoteWordPopout.bind(this);
        this.funcDraw = this.funcDraw.bind(this);
        this.getAbsoluteCanvasTouch = this.getAbsoluteCanvasTouch.bind(this);

        if (props.online && !test_game) {
            interval = setInterval(() => {
                this.setState({
                    time: this.state.time - 1,
                    leave_time: this.state.leave_time > 0 ? (this.state.leave_time - 1) : 0
                });
                if (this.state.time <= -5) {
                    const platformFormat = isPlatformIOS() ? 'png' : 'webp';
                    this.props.t.setState({
                        canvas_: this.canvas.toDataURL(`image/${platformFormat}`),
                        winnerId: 0,
                        word: {nom: ''},
                        gameId: 0,
                        gameEnd: Date.now()
                    });
                    this.props.t.setActivePanel('result');
                    console.log('Game end (timeout)');
                    clearInterval(interval);
                }
            }, 1000);
        }

        this.canvasSize = (!this.state.isDrawer && !isDesktop && props.t.clientHeight <= 700) ? (319 / 1.5) : 319;
        this.canvasMultiplier = 2;
        if (!isDesktop && props.t.clientWidth >= 600) {
            this.canvasMultiplier /= 1.41065831;
            this.canvasSize = 450;
        }

        this.nCanvasSize = (!this.state.isDrawer && !isDesktop && props.t.clientHeight <= 600 ? 200 : 319);
        document.body.style.setProperty('--n-canvas-size', `${this.nCanvasSize}px`);
    }

    componentWillUnmount() {
        bridge.send('VKWebAppEnableSwipeBack');
        if (this.props.online && this.props.t.state.api_manager !== 2) {
            this.props.t.socket.unsubscribe('gamePreloadEnd', 'gameEnd', 'gameAfkEnd', 'gameErrorEnd', 'draw', 'undo', 'message');
        } else if (this.props.online && this.props.t.state.api_manager === 2) {
            this.props.t.socket.unsubscribe('draw', 'undo', 'message');
        }
        clearInterval(interval);
        clearTimeout(err_timeout);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.color !== this.props.color) {
            if (this.props.color === 'pipette') {
                this.setState({isPipette: true});
            } else {
                this.setState({color: this.props.color});
            }
        }
    }

    updateChooseWordPopout(t, counter, chooseWords, lobbyId) {
        t.setPopout(<PopoutWrapper>
            <div className='GameChooseWord'>
                <div className='GameChooseWord-Timer'>
                    {5 - counter}
                </div>
                <div className='GameChooseWord-Title'>
                    Что будете рисовать?
                </div>
                <div className='GameChooseWord-Words'>
                    {
                        (chooseWords || [{nom: 'слово 1'}, {nom: 'слово 2'}, {nom: 'слово 3'}]).map((value, index) =>
                            <div
                                key={`word_${index}`}
                                onClick={() => {
                                    chosenWord = true;
                                    t.setState({word: value});
                                    t.setPopout(null);
                                    t.socket.call('games.chooseWord', {
                                        lobbyId,
                                        word: index,
                                        manager: t.state.api_manager
                                    });
                                    t.log('game_logs', 'games.chooseWord', {word: value});
                                    this.forceUpdate();
                                }}
                            >
                                {value.nom}
                            </div>
                        )
                    }
                </div>
            </div>
        </PopoutWrapper>);
    }

    updateVoteWordPopout(t, counter, voteWords, lobbyId) {
        const {votes} = this.state;
        t.setPopout(<PopoutWrapper>
            <div className='GameChooseWord'>
                <div className='GameChooseWord-Timer'>
                    {5 - counter}
                </div>
                <div className='GameChooseWord-Title'>
                    Голосуйте за то, что будете рисовать
                </div>
                <div className='GameChooseWord-Words'>
                    {
                        (voteWords || [{nom: 'слово 1'}, {nom: 'слово 2'}, {nom: 'слово 3'}]).map((value, index) =>
                            <div
                                key={`word_${index}`}
                                style={{
                                    background: votedWord === index && 'rgba(255, 255, 255, 0.4)',
                                    pointerEvents: votedWord && 'none'
                                }}
                                onClick={() => {
                                    if (!votedWord) {
                                        votedWord = index;
                                        t.socket.call('games.voteWord', {
                                            lobbyId,
                                            word: index
                                        });
                                        t.log('game_logs', 'games.voteWord', {word: value});
                                    }
                                }}
                            >
                                {value.nom}
                                <span>{votes[index] || 0}</span>
                            </div>
                        )
                    }
                </div>
            </div>
        </PopoutWrapper>);
    }

    async componentDidMount() {
        chosenWord = false;
        votedWord = false;
        artBattleHistory = {};
        const startTime = Date.now();
        this.oldImage = undefined;
        historyLines = [];
        this.clientHeight = parseInt(document.body.attributes.getNamedItem('_height').value);
        this.maxCommentsHeight = isPlatformDesktop() ? false : 114 / (this.clientHeight <= 600 ? 3 : (this.clientHeight <= 700 ? 2 : 1));

        bridge.send('VKWebAppDisableSwipeBack');
        const
            {canvas, onMouseDown, onMouseUp, throttle, onMouseMove, props} = this,
            {isDrawer} = this.state,
            {online, t, lobbyId} = props,
            {chooseWords, voteWords, api_manager} = t.state
        ;
        this.canvasContext = canvas.getContext('2d');
        t.setState({
            color: '#000000', pickedColor: '#000000', color_gradient: undefined, color_percent: 0
        });

        if (online && (!t.state.test_game)) {
            t.socket.unsubscribe('gamePreloadEnd', 'gameStart', 'gameEnd', 'setWord', 'gameVote', 'voteWord', 'completePicture', 'gameAfkEnd', 'gameErrorEnd', 'draw', 'undo', 'message');

            if (api_manager === 2) {
                const {game_players} = t.state;
                for (const p_id of game_players) {
                    artBattleHistory[p_id] = [];
                }
                t.socket.subscribe('gameVote', async () => {
                    await t.setState({artBattleHistory});
                    this.props.t.log('game_logs', 'in_gameVote');
                    t.setActivePanel('art_battle_rate');
                });
                t.socket.subscribe('voteWord', r => {
                    this.props.t.log('game_logs', 'in_voteWord', {votes: r.votes});
                    this.setState({votes: r.votes});
                });
                t.socket.subscribe('setWord', async r => {
                    this.props.t.setState({word: r.word});
                    this.props.t.log('game_logs', 'in_setWord', {word: r.word});
                    this.props.t.forceUpdate();
                    this.forceUpdate();
                });
                t.socket.subscribe('completePicture', r => {
                    this.setState({completed_players: r.completed});
                });
            }

            t.socket.subscribe('gamePreloadEnd', async r => {
                let lobbyId_ = lobbyId;
                err_timeout = setTimeout(() => {
                    if (t.state.activePanel === 'game' && t.state.popout !== null && lobbyId_ === lobbyId) {
                        t.setAlert(
                            'Какие-то проблемы?',
                            'Кажется, что игра зависла. Если это действительно так, нажмите на кнопку "Да", если у вас с интернетом всё в порядке и игра не зависла, нажмите "Нет".',
                            [
                                {
                                    title: 'Да',
                                    action: () => {
                                        const logs = JSON.stringify(t.state.game_logs);
                                        bridge.send('VKWebAppCopyText', {text: logs});
                                        t.setActivePanel('main');
                                        t.showNewAd();
                                        t.setSnackbar(
                                            'Нам жаль, что так вышло. Информация по проблеме скопирована. Вы можете отправить её нам.',
                                            {
                                                buttonText: 'Отправить',
                                                buttonAction: () => openUrl('https://vk.com/write-208964042')
                                            }
                                        );
                                    },
                                    autoclose: true
                                },
                                {
                                    title: 'Нет',
                                    action: () => {
                                        t.setPopout(<ScreenSpinner/>);
                                    },
                                    autoclose: true
                                }
                            ],
                            'horizontal'
                        );
                    }
                }, 10 * 1000);
                t.setPopout(<ScreenSpinner/>);
                clearInterval(interval);
                console.log('Game preload end');
            });

            if (api_manager !== 2) {
                t.socket.subscribe('gameEnd', async r => {
                    const
                        platformFormat = isPlatformIOS() ? 'png' : 'webp',
                        canvasData = this.canvas.toDataURL(`image/${platformFormat}`),
                        {winnerId, word, gameId, lobbyId} = r
                    ;
                    if (winnerId > 0) {
                        t.log('game_logs', 'in_gameEnd', {
                            win: winnerId,
                            word: word,
                            game: gameId,
                            time: Math.floor((Date.now() - startTime) / 1000),
                            lobby_id: lobbyId
                        });
                    } else {
                        t.log('game_logs', 'in_gameEnd_timeout', {
                            word: word, game: gameId,
                            time: Math.floor((Date.now() - startTime) / 1000),
                            lobby_id: lobbyId
                        });
                    }
                    if (winnerId !== 0) await getVKUsers([winnerId]);
                    t.setPopout(null);
                    t.setState({canvas_: canvasData, winnerId, word, gameId, gameEnd: Date.now()});
                    t.setActivePanel('result');
                    clearTimeout(err_timeout);
                    console.log('Game end');
                });
            }

            t.socket.subscribe('gameAfkEnd', async r => {
                t.log('game_logs', 'in_gameAfkEnd');
                t.setState({game_canceled_reason: 'Игра отменена'});
                t.setActivePanel('game_canceled');
                if (t.state.api_manager === 1 && t.state.subGameInfo.owner_id === t.state.user.id) {
                    t.socket.call('friends.leaveLobby', {owner_id: t.state.user.id});
                }
                console.log('Game end afk');
            });

            t.socket.subscribe('gamePlayersLeft', async r => {
                t.log('game_logs', 'in_gamePlayersLeft');
                t.setState({game_canceled_reason: 'Игроки вышли'});
                t.setActivePanel('game_canceled');
                if (t.state.api_manager === 1 && t.state.subGameInfo.owner_id === t.state.user.id) {
                    t.socket.call('friends.leaveLobby', {owner_id: t.state.user.id});
                }
                console.log('Game end players left');
            });

            t.socket.subscribe('gameErrorEnd', async r => {
                t.log('game_logs', 'in_gameErrorEnd');
                await t.setState({gameErrorText: r.message});
                t.setActivePanel('game_error');
                console.log('Game end error');
                if (t.state.api_manager === 1 && t.state.subGameInfo.owner_id === t.state.user.id) {
                    t.socket.call('friends.leaveLobby', {owner_id: t.state.user.id});
                }
                t.setPopout(null);
            });

            if (!isDrawer) {
                t.socket.subscribe('draw', r => {
                    historyLines.push(r.data);
                    for (const data of r.data) {
                        let {x0, y0, x1, y1, color, isEraser, lineWidth, multiplier} = data;
                        if (!lineWidth) lineWidth = 2;
                        if (!multiplier) multiplier = 2;

                        this.drawLine(x0, y0, x1, y1, color, isEraser, lineWidth, multiplier);
                    }
                });

                t.socket.subscribe('undo', r => {
                    this.undoDraw();
                });
            } else if (api_manager === 2) {
                t.socket.subscribe('draw', r => {
                    const {data, player_id} = r;
                    if (!artBattleHistory[player_id]) artBattleHistory[player_id] = [];
                    artBattleHistory[player_id].push(data);
                });

                t.socket.subscribe('undo', r => {
                    const {player_id} = r;
                    if (!artBattleHistory[player_id]) artBattleHistory[player_id] = [];
                    artBattleHistory[player_id].splice(artBattleHistory[player_id].length - 1, 1);
                });
            }

            t.socket.subscribe('message', async r => {
                const {user_id, message, exit} = r;
                console.log(`New message from ${user_id}: ${message}`);
                if (!vk_local_users[user_id]) {
                    await getVKUsers(user_id);
                }
                const {id, first_name, last_name, photo_100, frame_type, frame_color, sex} = vk_local_users[user_id];
                await this.setState({
                    messages: [{
                        user_id,
                        exit,
                        message, ...{id, first_name, last_name, photo_100, frame_type, frame_color, sex}
                    }, ...this.state.messages]
                });
                if (this.comments) {
                    this.comments.scrollTop = this.comments.scrollHeight;
                }

                /*try {
                    const comments = document.getElementsByClassName('Comment');
                    comments[comments.length - 1].scrollIntoView(false);
                } catch (e) {

                }*/
            });
        }

        if (isDrawer) {
            canvas.addEventListener('mousedown', onMouseDown, false);
            canvas.addEventListener('mouseup', onMouseUp, false);
            canvas.addEventListener('mouseout', onMouseUp, false);
            canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

            //Touch support for mobile devices
            canvas.addEventListener('touchstart', onMouseDown, false);
            canvas.addEventListener('touchend', onMouseUp, false);
            canvas.addEventListener('touchcancel', onMouseUp, false);
            canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);

            if (online) {
                chosenWord = false;
                if (chooseWords && chooseWords.length > 0) {
                    t.log('game_logs', 'g_chooseWords', {chooseWords, voteWords});
                    let counter = 0;
                    this.updateChooseWordPopout(t, counter, chooseWords, lobbyId);
                    let _timer_interval = setInterval(() => {
                        counter++;
                        if (!chosenWord) {
                            this.updateChooseWordPopout(t, counter, chooseWords, lobbyId);
                        }
                        if (counter === 5 || chosenWord) {
                            clearInterval(_timer_interval);
                        }
                    }, 1000);
                    setTimeout(() => {
                        if (!chosenWord) {
                            chosenWord = true;
                            t.log('game_logs', 'g_afkWord', {word: chooseWords[0]});
                            t.setState({word: chooseWords[0]});
                            t.setPopout(null);
                        }
                    }, 5000);
                }
                if (voteWords && voteWords.length > 0) {
                    t.log('game_logs', 'g_voteWords', {chooseWords, voteWords});
                    let counter = 0;
                    let counter_ = 0;
                    this.updateVoteWordPopout(t, counter, voteWords, lobbyId);
                    let _timer_interval = setInterval(() => {
                        if (counter_ % 1 === 0) counter++;
                        counter_ += 0.5;
                        this.updateVoteWordPopout(t, counter, voteWords, lobbyId);
                        if (counter === 5) {
                            t.setPopout(null);
                            clearInterval(_timer_interval);
                        }
                    }, 500);
                    setTimeout(() => {
                        t.setPopout(null);
                        if (!votedWord) {
                            votedWord = 0;
                            t.socket.call('games.voteWord', {lobbyId, word: 0});
                            t.log('game_logs', 'games.voteWord_afk', {word: 0});
                        }
                    }, 5000);
                }

                t.socket.subscribe('drawAfkWarning', r => {
                    t.log('game_logs', 'in_drawAfkWarning');
                    if (bridge.supports('VKWebAppTapticNotificationOccurred')) {
                        bridge.send('VKWebAppTapticNotificationOccurred', {type: 'warning'});
                    }
                    t.setPopout(<PopoutWrapper>
                        <div className='GameAfkWarning'>
                            <div className='GameAfkWarning-Icon'>
                                <Icon28ErrorCircleOutline/>
                            </div>
                            <div className='GameAfkWarning-Title'>
                                Начните рисовать!
                            </div>
                            <div className='GameAfkWarning-Description'>
                                Если вы не будете рисовать, вы будете наказаны
                            </div>
                            <div
                                className='GameAfkWarning-Button'
                                onClick={() => t.setPopout(null)}
                            >
                                Окей
                            </div>
                        </div>
                    </PopoutWrapper>);
                });
            }
        }

        if (!online) {
            t.setPopout(<ScreenSpinner/>);
            /*const
                picUrl = t.state.pictureUrl_,
                canvasData = await getBase64Image(picUrl, false),
                {loadImage} = require('canvas')
            ;
            this.oldImage = await loadImage(canvasData);
            this.canvasContext.drawImage(this.oldImage, 0, 0, 319 * 2, 319 * 2);
			*/
            historyLines = t.state.game_.history;
            t.setState({game_: undefined});
            historyLines.forEach(lines => {
                lines.forEach(({x0, y0, x1, y1, color, isEraser, lineWidth, multiplier}) => {
                    if (!lineWidth) lineWidth = 2;
                    if (!multiplier) multiplier = 2;

                    this.funcDraw(this.canvasContext, isEraser, x0, y0, x1, y1, multiplier, lineWidth, color);
                })
            });
            t.setPopout(null);
        }
    }

    getAbsoluteCanvasTouch(e) {
        const
            {canvas} = this,
            canvasRect = canvas.getBoundingClientRect()
        ;
        return {
            x: ((e.clientX || e.touches[0].clientX) - canvasRect.left) * this.canvasMultiplier,
            y: ((e.clientY || e.touches[0].clientY) - canvasRect.top) * this.canvasMultiplier
        }
    }

    onMouseDown(e) {
        if (this.state.blockDraw) return;

        this.setState({drawing: true});
        current.x = e.clientX || e.touches[0].clientX;
        current.y = e.clientY || e.touches[0].clientY;
        emitLines = [];

        if ((this.state.isDrawer && this.props.online) && !this.props.t.state.test_game && !this._startdraw) {
            this._startdraw = true;
            this.props.t.socket.call('games.draw', {
                lobbyId: this.props.lobbyId,
                data: [],
                manager: this.props.t.state.api_manager
            });
        }
    }

    onMouseUp(e) {
        const {drawing, color, lineWidth, isEraser, isPipette} = this.state;
        if (!drawing) {
            return;
        }
        this.setState({drawing: false});
        if (isPipette) {
            this.setState({isPipette: false});
            return;
        }
        try {
            const
                {canvas} = this,
                canvasRect = canvas.getBoundingClientRect()
            ;
            try {
                this.drawLine(current.x - canvasRect.left, current.y - canvasRect.top, (e.clientX || e.touches[0].clientX) - canvasRect.left, (e.clientY || e.touches[0].clientY) - canvasRect.top, color, isEraser, lineWidth, this.canvasMultiplier);
            } catch (e) {
            }

            console.log(`Lines to send: ${emitLines.length}`);
            if (emitLines.length > 0) {
                historyLines.push(emitLines);
                if ((this.state.isDrawer && this.props.online) && !this.props.t.state.test_game) {
                    this.props.t.socket.call('games.draw', {
                        lobbyId: this.props.lobbyId,
                        data: emitLines,
                        manager: this.props.t.state.api_manager
                    });
                }
                emitLines = [];
            }
        } catch (er) {
            console.log(er);
        }
    }

    onMouseMove(e) {
        const {drawing, color, isEraser, isPipette, lineWidth} = this.state;
        if (!drawing) {
            return;
        }

        try {
            const
                {canvas, canvasContext} = this,
                canvasRect = canvas.getBoundingClientRect()
            ;

            if (isPipette) {
                const
                    {x, y} = this.getAbsoluteCanvasTouch(e),
                    pxData = canvasContext.getImageData(x, y, 1, 1),
                    color = rgbToHex(pxData.data[0], pxData.data[1], pxData.data[2])
                ;
                this.setState({color});
                this.props.t.setState({pickedColor: color});
                return;
            }

            this.drawLine(current.x - canvasRect.left, current.y - canvasRect.top, (e.clientX || e.touches[0].clientX) - canvasRect.left, (e.clientY || e.touches[0].clientY) - canvasRect.top, color, isEraser, lineWidth, this.canvasMultiplier);
            current.x = e.clientX || e.touches[0].clientX;
            current.y = e.clientY || e.touches[0].clientY;
        } catch (er) {
            console.log(er);
        }
        return false;
    }

    drawLine(x0, y0, x1, y1, color, isEraser, lineWidth, multiplier) {
        try {
            const
                {t} = this.props,
                {canvasContext} = this
            ;

            if (typeof color === 'object') {
                let firstColor = color[lastColorIndex] || color[0];
                let nextColor = color[lastColorIndex + 1] || color[0];
                color = getFadeMiddleColor(firstColor, nextColor, lastFadeColorIndex, color.length);
                lastFadeColorIndex += (color.length) === lastFadeColorIndex ? -lastFadeColorIndex : 1;
                if (lastFadeColorIndex === 0) {
                    lastColorIndex += color.length === lastColorIndex ? -lastColorIndex : 1;
                }
                /*color = color[lastColorIndex];
                lastColorIndex += (color.length -1) === lastColorIndex ? -lastColorIndex : 1;*/
            }

            this.funcDraw(canvasContext, isEraser, x0, y0, x1, y1, multiplier, lineWidth, color);
            canvasContext.closePath();

            emitLines.push({x0, y0, x1, y1, color, isEraser, lineWidth, multiplier});
        } catch (e) {
        }
    }

    funcDraw(canvasContext, isEraser, x0, y0, x1, y1, multiplier, lineWidth, color) {
        canvasContext.beginPath();
        if (isEraser) {
            canvasContext.globalCompositeOperation = 'destination-out';
            canvasContext.arc(x0 * multiplier, y0 * multiplier, lineWidth * 1.2, 0, Math.PI * 2, false);
            canvasContext.fill();
        } else {
            canvasContext.globalCompositeOperation = 'source-over';
            canvasContext.moveTo(x0 * multiplier, y0 * multiplier);
            canvasContext.lineTo(x1 * multiplier, y1 * multiplier);
            canvasContext.strokeStyle = color;
            canvasContext.fill();
            canvasContext.lineWidth = lineWidth;
            canvasContext.lineCap = canvasContext.lineJoin = 'round';
            canvasContext.stroke();
        }
    }

    throttle(callback, delay) {
        var previousCall = new Date().getTime();
        return function () {
            const time = new Date().getTime();

            if ((time - previousCall) >= delay) {
                previousCall = time;
                callback.apply(null, arguments);
            }
        };
    }

    async sendMessage() {
        const {t, lobbyId} = this.props;
        const {text, messages} = this.state;
        const {test_game, user, api_manager} = t.state;
        if (test_game) {
            this.setState({
                messages: [
                    {
                        user_id: user.id,
                        message: text,
                        ...vk_local_users[user.id]
                    },
                    ...messages
                ],
                text: ''
            })
            /*await this.setState({
                messages: [...messages, {
                    user_id: user.id,
                    message: text,
                    ...vk_local_users[user.id]
                }],
                text: ''
            });*/
            //this.comments.scrollTop = this.comments.scrollHeight;
        } else {
            if (text.replace(/^[0-9 ]+$/, '').length > 0) {
                t.socket.call('games.message', {
                    lobbyId,
                    message: text,
                    manager: api_manager
                }, r => {
                    console.log(`Response message`, r);
                    if (r.response) {
                        this.setState({text: ''});
                    } else {
                        t.setSnackbar(r.error.message);
                    }
                });
            } else {
                this.setState({text: ''});
                t.setSnackbar('Сообщение должно содержать слово.');
                console.log(`Message is empty: ${text}`);
            }
        }
    }

    undoDraw() {
        const {canvasContext, oldImage} = this;
        historyLines.splice(historyLines.length - 1, 1);
        canvasContext.clearRect(0, 0, 319 * 2, 319 * 2);
        if (oldImage) {
            canvasContext.globalCompositeOperation = 'source-over';
            canvasContext.drawImage(oldImage, 0, 0, 319 * 2, 319 * 2);
        }
        if (historyLines.length > 0) {
            historyLines.forEach(history => {
                history.forEach(({x0, y0, x1, y1, color, isEraser, lineWidth, multiplier}) => {
                    this.funcDraw(canvasContext, isEraser, x0, y0, x1, y1, multiplier, lineWidth, color);
                })
            })
            canvasContext.closePath();
        }
    }

    render() {
        let
            {t, lobbyId, online, word} = this.props,
            {user, vk_user, test_game, api_manager, game_players} = t.state,
            {
                drawer,
                isDrawer,
                text,
                color,
                time,
                leave_time,
                messages,
                lineWidth,
                completed_players,
                isEraser,
                isPipette,
                blockDraw
            } = this.state,
            pipetteStyle = isPipette ? {background: color, color} : {},

            buttonExitGameOnClick = () => {
                if (leave_time <= 1) {
                    t.setAlert(
                        'Подтверждение',
                        'Вы уверены, что хотите выйти из игры? Вы можете получить блокировку за многократный выход из игры.',
                        [
                            {
                                title: 'Да',
                                action: () => {
                                    if (t.state.api_manager === 1) {
                                        t.socket.call('friends.leaveLobby', {owner_id: t.state.subGameInfo.owner_id});
                                    } else {
                                        t.socket.call('games.leaveGame', {lobbyId});
                                    }
                                    t.setActivePanel('main');
                                    t.showNewAd();
                                },
                                autoclose: true
                            },
                            {
                                title: 'Нет',
                                mode: 'cancel',
                                autoclose: true
                            }
                        ],
                        'horizontal'
                    );
                } else {
                    t.setAlert(
                        'Пока рано',
                        `Вы сможете выйти из игры через ${decOfNum(leave_time, ['секунду', 'секунды', 'секунд'])}`,
                        [
                            {
                                title: 'Ок',
                                mode: 'cancel',
                                autoclose: true
                            }
                        ],
                        'horizontal'
                    );
                }
            }
        ;
        // api_manager: 0 (обычная игра), 1 (дружеское лобби), 2 (битва артов)
        if (test_game) {
            word = {nom: 'Жираф'};
            isDrawer = false;
            drawer = t.state.vk_user
        }

        return <div
            className={`DrawPanel DrawPanel-${isDrawer ? 'Task' : 'Drawer'} DrawPanel-${isDesktop ? 'Desktop' : 'Mobile'}`}>
            <div
                className='DrawPanel--Header'
                ref={ref => this.header = ref}
                onClick={() => {
                    t.setPopout(
                        <ActionSheet
                            onClose={() => t.setPopout(null)}
                            iosCloseItem={
                                <ActionSheetItem autoclose mode='cancel'>
                                    Отменить
                                </ActionSheetItem>
                            }
                            toggleRef={this.header}
                        >
                            <ActionSheetItem
                                autoclose
                                onClick={buttonExitGameOnClick}
                            >
                                Покинуть игру
                            </ActionSheetItem>
                        </ActionSheet>
                    )
                }}
            >
                {
                    isDrawer ?
                        <React.Fragment>
                            <h1>Задача: {(word ? word.nom : '')}</h1>
                            <h3>{decOfNum(time, ['секунда', 'секунды', 'секунд'])}</h3>
                        </React.Fragment>
                        :
                        <React.Fragment>
                            <UserAvatar
                                size={36}
                                src={drawer.photo_100}
                                frame={drawer.frame_type}
                                color={drawer.frame_color}
                            />
                            <div style={{width: '70%'}}>
                                <h1>{drawer.first_name} рисует</h1>
                                <h3>Осталось {decOfNum(time, ['секунда', 'секунды', 'секунд'])}</h3>
                            </div>
                        </React.Fragment>
                }
            </div>
            {
                online && api_manager === 2 && <div className='DrawPanel--Users'>
                    {
                        game_players.map((p_id, index) =>
                            <div
                                key={`user-${index}`}
                                style={completed_players.indexOf(p_id) === -1 ? {opacity: .5} : {}}
                            >
                                <UserAvatar
                                    size={50}
                                    src={vk_local_users[p_id].photo_100}
                                    frame={vk_local_users[p_id].frame_type}
                                    color={vk_local_users[p_id].frame_color}
                                />
                                <div>
                                    {
                                        completed_players.indexOf(p_id) > -1 ?
                                            <Icon16DoneCircle width={16} height={16}/> :
                                            <Icon24ClockOutline width={16} height={16}/>
                                    }
                                </div>
                            </div>
                        )
                    }
                </div>
            }
            <div
                className='DrawPanel--MessageBox'
                style={{
                    display: online && api_manager === 2 && 'none'
                }}
            >
                {
                    messages.map((
                        {
                            id,
                            exit,
                            message,
                            first_name,
                            last_name,
                            photo_100,
                            frame_type,
                            frame_color,
                            sex
                        }, index) =>
                        <div className='DrawPanel--Message'
                             onClick={() => this.setState({ccc: [(this.state.ccc || [0]).length, ...(this.state.ccc || [0])]})}>
                            <UserAvatar
                                size={36}
                                src={photo_100}
                                frame={frame_type}
                                color={frame_color}
                            />
                            <div>
                                {
                                    exit ?
                                        <p>{first_name} {sex === 1 ? 'покинула' : 'покинул'} игру</p>
                                        :
                                        <React.Fragment>
                                            <p>{first_name}</p>
                                            <p>{message}</p>
                                        </React.Fragment>
                                }
                            </div>
                        </div>
                    )
                }
                {
                    !isDrawer &&
                    <div className='DrawPanel--Input-Container'>
                        <Input
                            autocomplete='off'
                            className='DrawPanel--Input'
                            value={text}
                            onChange={(e) => {
                                const value = e.currentTarget.value;
                                if ((value.match(/^[0-9a-zA-Zа-яА-Я ,.:-]+$/) || value === '') && value.length <= 120) {
                                    this.setState({text: value});
                                }
                            }}
                            placeholder='Место вашего ответа'
                            onFocus={() => {

                            }}
                            onKeyDown={(e) => {
                                const k = e.key;
                                console.log(`Pressed key = ${k}`);
                                if (k === 'Enter') {
                                    console.log(`Send message (key) (lobbyId = ${lobbyId}): ${text}`);
                                    this.sendMessage();
                                }
                            }}
                        />
                        <WriteBarIcon
                            disabled={text.trim().length === 0}
                            mode='send'
                            onClick={() => {
                                console.log(`Send message (btn) (lobbyId = ${lobbyId}): ${text}`);
                                this.sendMessage();
                            }}
                        />
                    </div>
                }
            </div>
            <div
                className='DrawPanel--CanvasContainer'
            >
                <div
                    className='DrawPanel--Canvas'
                    style={{
                        minWidth: this.nCanvasSize,
                        minHeight: this.nCanvasSize,
                        maxWidth: this.nCanvasSize,
                        maxHeight: this.nCanvasSize,
                    }}
                >
                    <canvas
                        style={{
                            width: 'inherit',
                            height: 'inherit',
                            pointerEvents: blockDraw && 'none'
                        }}
                        width={319 * 2} height={319 * 2}
                        ref={ref => this.canvas = ref} id='canvas'
                    />
                </div>
                <div className='DrawPanel--CanvasBottom'>
                    <div
                        className='DrawPanel--CanvasController'
                        style={{
                            visibility: completed_players.indexOf(user.id) > -1 && 'hidden'
                        }}
                    >
                        <Slider
                            step={1}
                            min={2}
                            max={30}
                            value={Number(lineWidth)}
                            onChange={(lineWidth) => this.setState({lineWidth})}
                        />
                        <div className='DrawPanel--CanvasController-Mode'>
                            <IconButton
                                style={pipetteStyle}
                                hasHover={false} onClick={() => {
                                t.setActiveModal(MODAL_PAGE_PALETTE);
                            }}>
                                <Icon28PaletteOutline width={21} height={21}/>
                            </IconButton>
                            <IconButton
                                style={{
                                    ...pipetteStyle,
                                    border: isEraser === false && '2px solid var(--color_secondary)'
                                }}
                                hasHover={false} onClick={() => {
                                this.setState({isEraser: false});
                            }}>
                                <Icon28BrushOutline width={21} height={21}/>
                            </IconButton>
                            <IconButton
                                style={{
                                    ...pipetteStyle,
                                    border: isEraser && '2px solid var(--color_secondary)'
                                }}
                                hasHover={false} onClick={() => {
                                this.setState({isEraser: true});
                            }}>
                                <Icon28EraserOutline width={21} height={21}/>
                            </IconButton>
                            <IconButton
                                style={pipetteStyle}
                                hasHover={false} onClick={() => {
                                if (historyLines.length > 0) {
                                    if (blockDraw) return;

                                    if (online) {
                                        t.socket.call('games.undo', {lobbyId, manager: api_manager});
                                    }

                                    this.undoDraw();
                                }
                            }}>
                                <Icon28ArrowUturnLeftOutline width={21} height={21}/>
                            </IconButton>
                        </div>
                    </div>
                    {
                        online && api_manager === 2 &&
                        <Button
                            disabled={completed_players.indexOf(user.id) > -1}
                            size='l' mode='gradient_blue'
                            style={{
                                marginTop: 12,
                                width: this.nCanvasSize
                            }}
                            onClick={() => {
                                t.setAlert(
                                    'Подтверждение',
                                    'Вы уверены, что вы закончили? Продолжить рисунок не получится.',
                                    [
                                        {
                                            title: 'Да',
                                            action: () => {
                                                t.socket.call('games.completePicture', {lobbyId});
                                                this.setState({blockDraw: true});
                                            },
                                            autoclose: true
                                        },
                                        {
                                            title: 'Нет',
                                            mode: 'cancel',
                                            autoclose: true
                                        }
                                    ],
                                    'horizontal'
                                )
                            }}
                        >
                            {completed_players.indexOf(user.id) > -1 ? 'Ждём остальных' : `Я нарисовал${vk_user.sex === 1 ? 'а' : ''}`}
                        </Button>
                    }
                    {
                        !online &&
                        <div
                            style={{
                                marginTop: 12,
                                width: this.nCanvasSize,
                                display: 'flex',
                                gap: 10
                            }}
                        >
                            <Button
                                before={<Icon16Cancel fill='var(--color_secondary)'/>}
                                size='m' mode='secondary'
                                onClick={() => {
                                    t.setAlert(
                                        'Подтверждение',
                                        'Вы уверены, что хотите выйти без сохранения?',
                                        [
                                            {
                                                title: 'Да',
                                                action: () => {
                                                    t.back();
                                                    t.showNewAd();
                                                },
                                                autoclose: true
                                            },
                                            {
                                                title: 'Нет',
                                                mode: 'cancel',
                                                autoclose: true
                                            }
                                        ],
                                        'horizontal'
                                    )
                                }}
                                stretched
                            >
                                Отменить
                            </Button>
                            <Button
                                before={<Icon16Done fill='var(--color_secondary)'/>}
                                size='m' mode='secondary'
                                onClick={() => {
                                    t.setAlert(
                                        'Подтверждение',
                                        'Вы уверены, что хотите сохранить рисунок?',
                                        [
                                            {
                                                title: 'Да',
                                                action: async () => {
                                                    if (historyLines.length === 0) {
                                                        t.back();
                                                        t.showNewAd();
                                                        return;
                                                    }
                                                    t.setPopout(<ScreenSpinner/>);
                                                    const
                                                        platformFormat = isPlatformIOS() ? 'png' : 'webp',
                                                        canvasData = await new Promise(resolve => {
                                                            setTimeout(() => {
                                                                try {
                                                                    this.canvas.toBlob(() => {
                                                                        resolve(this.canvas.toDataURL(`image/${platformFormat}`));
                                                                    });
                                                                } catch (er) {
                                                                    console.error(er);
                                                                    resolve(null);
                                                                }
                                                            }, 100);
                                                        }),
                                                        {gameId_} = t.state
                                                    ;
                                                    if (isDrawer) {
                                                        for (let i = 0; i < historyLines.length; i++) {
                                                            const history = historyLines[i];
                                                            await new Promise(res =>
                                                                this.props.t.socket.call('games.editPicture', {
                                                                    history,
                                                                    historyLength: historyLines.length,
                                                                    gameId: gameId_
                                                                }, async r => {
                                                                    if (i === historyLines.length - 1) {
                                                                        // Image saved
                                                                        if (r.response) {
                                                                            t.setState({n_canvasData: canvasData});
                                                                            t.setSnackbar('Картинка сохранена');
                                                                            await new Promise(resolve =>
                                                                                this.props.t.socket.call('games.getByDrawerId', {
                                                                                    id: this.props.t.state.vk_user.id,
                                                                                    limit: this.props.t.state.gamesAsDrawer.length
                                                                                }, async r => {
                                                                                    await this.props.t.setState({gamesAsDrawer: r.response});
                                                                                    resolve(true);
                                                                                })
                                                                            );
                                                                            t.forceUpdate();
                                                                        } else {
                                                                            t.setSnackbar('Не удалось сохранить');
                                                                        }
                                                                        setTimeout(() => {
                                                                            t.setPopout(null);
                                                                            t.back();
                                                                            t.back();
                                                                            t.showNewAd();
                                                                            t.forceUpdate();
                                                                        }, 1000);
                                                                    }
                                                                    res(true);
                                                                })
                                                            )
                                                        }
                                                    }
                                                },
                                                autoclose: true
                                            },
                                            {
                                                title: 'Нет',
                                                mode: 'cancel',
                                                autoclose: true
                                            }
                                        ],
                                        'horizontal'
                                    )
                                }}
                                stretched
                            >
                                Сохранить
                            </Button>
                        </div>
                    }
                </div>
            </div>
        </div>
    }

    renderOldDrawPanel() {
        let
            {t, lobbyId, online, word} = this.props,
            {user, vk_user, test_game, api_manager, game_players} = t.state,
            {
                drawer,
                isDrawer,
                text,
                color,
                time,
                leave_time,
                messages,
                isEraser,
                lineWidth,
                isPipette,
                completed_players
            } = this.state,
            isAndroid = !isPlatformIOS(),
            buttonExitGameOnClick = () => {
                if (leave_time <= 1) {
                    t.setAlert(
                        'Подтверждение',
                        'Вы уверены, что хотите выйти из игры? Вы можете получить блокировку за многократный выход из игры.',
                        [
                            {
                                title: 'Да',
                                action: () => {
                                    if (t.state.api_manager === 1) {
                                        t.socket.call('friends.leaveLobby', {owner_id: t.state.subGameInfo.owner_id});
                                    } else {
                                        t.socket.call('games.leaveGame', {lobbyId});
                                    }
                                    t.setActivePanel('main');
                                    t.showNewAd();
                                },
                                autoclose: true
                            },
                            {
                                title: 'Нет',
                                mode: 'cancel',
                                autoclose: true
                            }
                        ],
                        'horizontal'
                    );
                } else {
                    t.setAlert(
                        'Пока рано',
                        `Вы сможете выйти из игры через ${decOfNum(leave_time, ['секунду', 'секунды', 'секунд'])}`,
                        [
                            {
                                title: 'Ок',
                                mode: 'cancel',
                                autoclose: true
                            }
                        ],
                        'horizontal'
                    );
                }
            }
        ;
        if (test_game) {
            word = {nom: 'Жираф'};
            isDrawer = false;
            drawer = t.state.vk_user
        }

        if ([245481845, 246549084, 822029716, 264822661, 752207593, 544816081, 496351114, 780489500].indexOf(vk_user.id) > -1) {
            return this.renderDrawpanel();
        }

        return (
            <div className='Game'>
                {online && !isDesktop && (api_manager === 0 || api_manager === 1) && <div
                    className='NativeButtonMiniAppTop'
                    onClick={() => {
                        if (!isDrawer) {
                            buttonExitGameOnClick();
                        }
                    }}
                    style={{height: !isPlatformIOS() && 37}}
                >
                    {isDrawer ? `id${lobbyId}` : 'Покинуть игру'}
                </div>}
                <div style={{width: isDesktop ? 319 : '100%', alignSelf: 'flex-start'}} ref={ref => this.header = ref}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            {
                                !isDrawer &&
                                <UserAvatar
                                    size={24}
                                    src={drawer.photo_100}
                                    frame={drawer.frame_type}
                                    color={drawer.frame_color}
                                />
                            }
                            <h2 style={{textAlign: 'left', marginLeft: 6}}>
                                {isDrawer ? 'Задача: ' + (word ? word.nom : '') : 'Рисует: ' + drawer.first_name}
                            </h2>
                        </div>
                        {
                            online && <h2 style={{
                                textAlign: 'right',
                                width: '25%',
                                color: 'var(--color_secondary)',
                                wordWrap: 'normal'
                            }}>
                                {time >= 0 ? time : 0} сек
                            </h2>
                        }
                    </div>
                </div>
                <div style={{display: (isDesktop && online) && 'flex'}}>
                    <div className='Canvas__'>
                        <div
                            className='Canvas_Container_Clear'
                            style={{width: this.canvasSize, height: this.canvasSize}}
                        >
                            <canvas
                                style={{
                                    width: this.canvasSize,
                                    height: this.canvasSize,
                                    pointerEvents: this.state.blockDraw && 'none'
                                }}
                                width={319 * 2} height={319 * 2}
                                ref={ref => this.canvas = ref} id='canvas'
                            />
                        </div>
                        <div style={{display: !isDrawer && 'none'}} className='Canvas_Items_Container'>
                            <Slider
                                step={1}
                                min={4}
                                max={30}
                                value={Number(lineWidth)}
                                onChange={(lineWidth) => this.setState({lineWidth})}
                            />
                            <div className='Canvas_SubItems_Container'>
                                <IconButton
                                    style={{
                                        ...(isPipette ? {background: color, color} : {})
                                    }}
                                    hasHover={false} onClick={() => {
                                    t.setActiveModal(MODAL_PAGE_PALETTE);
                                }}>
                                    <Icon28PaletteOutline width={21} height={21}/>
                                </IconButton>
                                <IconButton
                                    style={{
                                        border: isEraser && '2px solid var(--color_secondary)'
                                    }}
                                    hasHover={false} onClick={() => {
                                    this.setState({isEraser: !isEraser});
                                }}>
                                    <IconErase2/>
                                </IconButton>
                                <IconButton
                                    hasHover={false} onClick={() => {
                                    /*if (online) {
                                        t.socket.call('games.clear', {lobbyId});
                                    }
                                    this.canvasContext.clearRect(0, 0, 319 * 2, 319 * 2);*/

                                    if (historyLines.length > 0) {
                                        if (this.state.blockDraw) return;

                                        if (online) {
                                            t.socket.call('games.undo', {lobbyId, manager: api_manager});
                                        }

                                        this.undoDraw();
                                    }
                                }}>
                                    <Icon28ArrowUturnLeftOutline width={21} height={21}/>
                                </IconButton>
                            </div>
                        </div>

                        {
                            online && api_manager === 2 &&
                            <Button
                                style={{
                                    marginTop: isDesktop ? 18 : 32, ...!isDesktop ? {width: '74.6666667vw'} : {}
                                }}
                                disabled={completed_players.indexOf(user.id) > -1}
                                size='l' mode='gradient_blue' stretched
                                onClick={() => {
                                    t.setAlert(
                                        'Подтверждение',
                                        'Вы уверены, что вы закончили? Продолжить рисунок не получится.',
                                        [
                                            {
                                                title: 'Да',
                                                action: () => {
                                                    t.socket.call('games.completePicture', {lobbyId});
                                                    this.setState({blockDraw: true});
                                                },
                                                autoclose: true
                                            },
                                            {
                                                title: 'Нет',
                                                mode: 'cancel',
                                                autoclose: true
                                            }
                                        ],
                                        'horizontal'
                                    )
                                }}
                            >
                                {completed_players.indexOf(user.id) > -1 ? 'Ждём остальных' : `Я нарисовал${vk_user.sex === 1 ? 'а' : ''}`}
                            </Button>
                        }
                        {
                            online && isDesktop && (api_manager === 0 || api_manager === 1) &&
                            <Button
                                style={{marginTop: 28}}
                                stretched size='l' mode='secondary'
                                onClick={() => {
                                    if (!isDrawer) {
                                        buttonExitGameOnClick();
                                    }
                                }}
                            >
                                {isDrawer ? `id${lobbyId}` : 'Покинуть игру'}
                            </Button>
                        }
                    </div>
                    {
                        !online &&
                        <div className='Offline_Drawing__Buttons' style={{width: !isDesktop && this.canvasSize}}>
                            <Button
                                before={<Icon16Cancel fill='var(--color_secondary)'/>}
                                size='m' mode='secondary'
                                onClick={() => {
                                    t.setAlert(
                                        'Подтверждение',
                                        'Вы уверены, что хотите выйти без сохранения?',
                                        [
                                            {
                                                title: 'Да',
                                                action: () => {
                                                    t.back();
                                                    t.showNewAd();
                                                },
                                                autoclose: true
                                            },
                                            {
                                                title: 'Нет',
                                                mode: 'cancel',
                                                autoclose: true
                                            }
                                        ],
                                        'horizontal'
                                    )
                                }}
                            >
                                Отменить
                            </Button>
                            <Button
                                style={{marginLeft: !isDesktop && 10, marginTop: isDesktop && 10}}
                                before={<Icon16Done fill='var(--color_secondary)'/>}
                                size='m' mode='secondary'
                                onClick={() => {
                                    t.setAlert(
                                        'Подтверждение',
                                        'Вы уверены, что хотите сохранить рисунок?',
                                        [
                                            {
                                                title: 'Да',
                                                action: async () => {
                                                    if (historyLines.length === 0) {
                                                        t.back();
                                                        t.showNewAd();
                                                        return;
                                                    }
                                                    t.setPopout(<ScreenSpinner/>);
                                                    const
                                                        platformFormat = isPlatformIOS() ? 'png' : 'webp',
                                                        canvasData = await new Promise(resolve => {
                                                            setTimeout(() => {
                                                                try {
                                                                    this.canvas.toBlob(() => {
                                                                        resolve(this.canvas.toDataURL(`image/${platformFormat}`));
                                                                    });
                                                                } catch (er) {
                                                                    console.error(er);
                                                                    resolve(null);
                                                                }
                                                            }, 100);
                                                        }),
                                                        {gameId_} = t.state
                                                    ;
                                                    if (this.state.isDrawer) {
                                                        for (let i = 0; i < historyLines.length; i++) {
                                                            const history = historyLines[i];
                                                            await new Promise(res =>
                                                                this.props.t.socket.call('games.editPicture', {
                                                                    history,
                                                                    historyLength: historyLines.length,
                                                                    gameId: gameId_
                                                                }, async r => {
                                                                    if (i === historyLines.length - 1) {
                                                                        // Image saved
                                                                        if (r.response) {
                                                                            t.setState({n_canvasData: canvasData});
                                                                            t.setSnackbar('Картинка сохранена');
                                                                            await new Promise(resolve =>
                                                                                this.props.t.socket.call('games.getByDrawerId', {
                                                                                    id: this.props.t.state.vk_user.id,
                                                                                    limit: this.props.t.state.gamesAsDrawer.length
                                                                                }, async r => {
                                                                                    await this.props.t.setState({gamesAsDrawer: r.response});
                                                                                    resolve(true);
                                                                                })
                                                                            );
                                                                            t.forceUpdate();
                                                                        } else {
                                                                            t.setSnackbar('Не удалось сохранить');
                                                                        }
                                                                        setTimeout(() => {
                                                                            t.setPopout(null);
                                                                            t.back();
                                                                            t.back();
                                                                            t.showNewAd();
                                                                            t.forceUpdate();
                                                                        }, 1000);
                                                                    }
                                                                    res(true);
                                                                })
                                                            )
                                                        }
                                                    }
                                                },
                                                autoclose: true
                                            },
                                            {
                                                title: 'Нет',
                                                mode: 'cancel',
                                                autoclose: true
                                            }
                                        ],
                                        'horizontal'
                                    )
                                }}
                            >
                                Сохранить
                            </Button>
                        </div>
                    }
                    {
                        online && (api_manager === 0 || api_manager === 1) &&
                        <div className='Comments_Container' style={{width: !isDesktop && this.canvasSize}}>
                            <div className='Comments' ref={ref => this.comments = ref} style={this.maxCommentsHeight ? {
                                maxHeight: this.maxCommentsHeight
                            } : {}}>
                                {
                                    messages.map((
                                        {
                                            id,
                                            exit,
                                            message,
                                            first_name,
                                            last_name,
                                            photo_100,
                                            frame_type,
                                            frame_color,
                                            sex
                                        }, index) =>
                                        <div
                                            className={exit ? 'UserActivity' : 'UserMessage'} key={`div__${index}`}
                                            style={{
                                                marginTop: index > 0 && 6,
                                                cursor: id === t.state.vk_user.id && 'default'
                                            }}
                                            ref={ref => this[`comment${index}`] = ref}
                                            onClick={() => {
                                                return;
                                                if (id !== t.state.vk_user.id && message.replaceAll('*', '').length > 0) {
                                                    t.setPopout(<ActionSheet
                                                        onClose={() => t.setPopout(null)}
                                                        iosCloseItem={<ActionSheetItem
                                                            autoclose mode='cancel'>
                                                            Отменить
                                                        </ActionSheetItem>}
                                                        toggleRef={this[`comment${index}`]}
                                                    >
                                                        <ActionSheetItem
                                                            autoclose mode='destructive'
                                                            onClick={() => {
                                                                t.socket.call('games.reportWord', {message});
                                                                t.setSnackbar('Жалоба отправлена');
                                                            }}
                                                        >
                                                            Пожаловаться
                                                        </ActionSheetItem>
                                                    </ActionSheet>)
                                                }
                                            }}
                                        >
                                            <UserAvatar
                                                size={32}
                                                src={photo_100}
                                                frame={frame_type}
                                                color={frame_color}
                                            />
                                            <div>
                                                {
                                                    exit ?
                                                        `${first_name} ${sex === 1 ? 'покинула' : 'покинул'} игру`
                                                        :
                                                        <React.Fragment>
                                                            <div>{first_name} {last_name}</div>
                                                            <div>{message}</div>
                                                        </React.Fragment>
                                                }
                                            </div>
                                        </div>
                                    )
                                }
                            </div>
                            {
                                !isDrawer &&
                                <div className='Comment_Input'>
                                    <Input
                                        autoFocus={true}
                                        id='inputComment'
                                        value={text}
                                        onChange={(e) => {
                                            const value = e.currentTarget.value;
                                            if ((value.match(/^[0-9a-zA-Zа-яА-Я ,.:-]+$/) || value === '') && value.length <= 120) {
                                                console.log(`Set text1 = ${value}`);
                                                this.setState({text: value});
                                            }
                                        }}
                                        placeholder='Есть догадки?'
                                        onKeyDown={(e) => {
                                            const k = e.key;
                                            console.log(`Pressed key = ${k}`);
                                            if (k === 'Enter') {
                                                console.log(`Send message (key) (lobbyId = ${lobbyId}): ${text}`);
                                                this.sendMessage();
                                            }
                                        }}
                                        onFocus={() => {
                                            /*setTimeout(() => {
                                                document.getElementById('inputComment').scrollIntoView(false);
                                            }, 100);*/
                                        }}
                                    />
                                    <WriteBarIcon
                                        style={{display: text.trim().length === 0 && 'none'}} mode='send'
                                        onClick={() => {
                                            console.log(`Send message (btn) (lobbyId = ${lobbyId}): ${text}`);
                                            this.sendMessage();
                                        }}
                                    />
                                </div>
                            }
                        </div>
                    }
                    {
                        online && api_manager === 2 && <div className='ArtBattle--Users'>
                            {
                                game_players.map((p_id, index) =>
                                    isDesktop ?
                                        <div key={`user-${index}`}
                                             style={completed_players.indexOf(p_id) === -1 ? {opacity: .5} : {}}>
                                            <UserAvatar
                                                size={32}
                                                src={vk_local_users[p_id].photo_100}
                                                frame={vk_local_users[p_id].frame_type}
                                                color={vk_local_users[p_id].frame_color}
                                            />
                                            <span>{vk_local_users[p_id].first_name} {vk_local_users[p_id].last_name.substring(0, 1)}.</span>
                                            <div>
                                                {
                                                    completed_players.indexOf(p_id) > -1 ?
                                                        <Icon16DoneCircle/> :
                                                        <Icon24ClockOutline width={16} height={16}/>
                                                }
                                            </div>
                                        </div>
                                        :
                                        <div key={`user-${index}`}
                                             style={completed_players.indexOf(p_id) === -1 ? {opacity: .5} : {}}>
                                            <UserAvatar
                                                size={32}
                                                src={vk_local_users[p_id].photo_100}
                                                frame={vk_local_users[p_id].frame_type}
                                                color={vk_local_users[p_id].frame_color}
                                            />
                                            <div>
                                                {
                                                    completed_players.indexOf(p_id) > -1 ?
                                                        <Icon16DoneCircle width={10} height={10}/> :
                                                        <Icon24ClockOutline width={10} height={10}/>
                                                }
                                            </div>
                                        </div>
                                )
                            }
                        </div>
                    }
                </div>
            </div>
        )
    }
}

Game.defaultProps = {};

Game.propTypes = {
    t: PropTypes.object,
    drawerId: PropTypes.number.isRequired,
    lobbyId: PropTypes.number.isRequired,
    online: PropTypes.bool,
    chooseWords: PropTypes.any,
    voteWords: PropTypes.any,
    word: PropTypes.object
};

export default Game;