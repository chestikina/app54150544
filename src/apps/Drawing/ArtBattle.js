import React, {PureComponent} from 'react';
import {
    ActionSheet,
    ActionSheetItem,
    Button,
    IconButton,
    Input,
    ScreenSpinner,
    Slider,
    WriteBarIcon
} from "@vkontakte/vkui";
import {
    Icon16Cancel, Icon16Done,
    Icon16DoneCircle,
    Icon16Down,
    Icon24ClockOutline, Icon28ArrowUturnLeftOutline, Icon28BrushOutline,
    Icon28CupOutline, Icon28EraserOutline,
    Icon28PaletteOutline
} from "@vkontakte/icons";
import {UserAvatar} from "./UserAvatarFrame";
import {decOfNum, getRandomInt, getSrcUrl, isPlatformDesktop, isPlatformIOS} from "../../js/utils";
import {getVKUsers, vk_local_users} from "../../js/drawerapp/utils";
import {MODAL_PAGE_PALETTE} from "./Drawing";

const
    isDesktop = isPlatformDesktop()
;

export class ArtBattlePlaceholder extends PureComponent {
    render() {
        return (
            <div className='ArtBattlePlaceholder'>
                <div className='ArtBattlePlaceholder--Title'>
                    <Icon28CupOutline width={36} height={36}/>
                    <h1>Битва артов</h1>
                </div>
                <div className='ArtBattlePlaceholder--Steps'>
                    {
                        [
                            'Выберите, что хотите рисовать',
                            'Постарайтесь сделать красивый рисунок',
                            'Проголосуйте за лучший рисунок'
                        ].map((value, index) =>
                            <div key={`step-${index}`}>
                                <span>{index + 1}</span>
                                <span>{value}</span>
                            </div>
                        )
                    }
                </div>
                <div className='ArtBattlePlaceholder--Actions'>
                    <Button
                        stretched
                        size='l'
                        mode='gradient_red'
                        onClick={async () => {
                            await this.props.t.setState({
                                game_timeout: 120,
                                lobbyId: -1,
                                drawerId: this.props.t.state.user.id,
                                gameStart: Date.now(),
                                isOnlineDrawing: true,
                                subGameInfo: {
                                    battle: true
                                },
                                api_manager: 2
                            });
                            this.props.t.go('search_game');
                        }}
                    >
                        Найти игру
                    </Button>
                    <Button
                        stretched
                        size='l'
                        mode='secondary'
                        onClick={() => this.props.t.back()}
                    >
                        Отмена
                    </Button>
                </div>
            </div>
        )
    }
}

let timeInterval, canvasData = {};

export class ArtBattleRate extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            timeStep: 10,
            time: 10,
            step: 0,
            steps: Object.keys(props.t.state.artBattleHistory).length,
            rates: []
        }

        this.componentDidMount = this.componentDidMount.bind(this);
        this.renderCanvas = this.renderCanvas.bind(this);

        this.nCanvasSize = 319;
    }

    componentDidMount() {
        this.renderCanvas();
        timeInterval = setInterval(async () => {
            let {rates, time, step, steps, timeStep} = this.state;
            time--;
            if (time < 0) {
                if (step === steps - 1) {
                    console.log('interval clear');
                    clearInterval(timeInterval);
                } else {
                    time = timeStep;
                    step++;
                    await this.setState({time, step});
                    this.renderCanvas();
                }
            } else {
                if (time === timeStep && !rates[step - 1]) {
                    const {lobbyId, t} = this.props;
                    const {artBattleHistory} = t.state;
                    const author = Object.keys(artBattleHistory)[step - 1];
                    rates[step - 1] = getRandomInt(1, 5);
                    t.socket.call('games.rateAuthor', {
                        lobbyId, author, rate: rates[step - 1] - 1
                    });
                    this.setState({rates});
                }
                this.setState({time});
            }
        }, 1000);

        this.props.t.socket.unsubscribe('gameEnd', 'gamePreloadEnd');
        this.props.t.socket.subscribe('gameEnd', async r => {
            const {winnerId, word, gameId, lobbyId} = r;
            this.props.t.log('game_logs', 'in_gameEnd', {
                win: winnerId,
                word: word,
                game: gameId,
                lobby_id: lobbyId
            });
            if (winnerId !== 0) await getVKUsers([winnerId]);
            this.props.t.setState({canvas_: canvasData[winnerId], winnerId, word, gameId, gameEnd: Date.now()});
            this.props.t.setActivePanel('result');
            this.props.t.setPopout(null);
            console.log('Game end');
        });
    }

    componentWillUnmount() {
        this.props.t.socket.unsubscribe('gamePreloadEnd', 'gameEnd', 'gameAfkEnd', 'gameErrorEnd', 'draw', 'clear', 'message');
    }

    renderCanvas() {
        const {artBattleHistory} = this.props.t.state;
        if (artBattleHistory) {
            this.props.t.setPopout(<ScreenSpinner/>);
            const historyLines = artBattleHistory[Object.keys(artBattleHistory)[this.state.step]];

            if (historyLines.length > 0) {
                const canvasContext = this.canvas.getContext('2d');
                canvasContext.clearRect(0, 0, 319 * 2, 319 * 2);
                historyLines.forEach(history => {
                    history.forEach(({x0, y0, x1, y1, color, isEraser, lineWidth, multiplier}) => {
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
                    })
                })
                canvasContext.closePath();
            }
            canvasData[Object.keys(artBattleHistory)[this.state.step]] = this.canvas.toDataURL('image/png');
            this.props.t.setPopout(null);
        }
    }

    render() {
        const {time, rates, step} = this.state;
        const {t, lobbyId} = this.props;
        const {artBattleHistory, vk_user} = t.state;
        const players = Object.keys(artBattleHistory);
        const author = players[step];

        if ([245481845, 246549084, 822029716, 264822661, 752207593, 544816081, 496351114, 780489500].indexOf(vk_user.id) > -1) {
            return (
                <div
                    className={`DrawPanel DrawPanel-Task DrawPanel-${isDesktop ? 'Desktop' : 'Mobile'}`}>
                    <div className='DrawPanel--Header'>
                        <h1>Оцените рисунок</h1>
                        <h3>{decOfNum(time, ['секунда', 'секунды', 'секунд'])}</h3>
                    </div>
                    <div className='DrawPanel--Users'>
                        {
                            players.map((p_id, index) =>
                                <div
                                    key={`user-${index}`}
                                    style={{
                                        opacity: step !== index && .5
                                    }}
                                >
                                    <UserAvatar
                                        size={50}
                                        src={vk_local_users[p_id].photo_100}
                                        frame={vk_local_users[p_id].frame_type}
                                        color={vk_local_users[p_id].frame_color}
                                    />
                                    <div
                                        style={{
                                            display: (step !== index || index === (players.length - 1)) && 'none',
                                            transform: 'rotate(-90deg)'
                                        }}
                                    >
                                        <Icon16Down/>
                                    </div>
                                </div>
                            )
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
                                    pointerEvents: 'none'
                                }}
                                width={319 * 2} height={319 * 2}
                                ref={ref => this.canvas = ref} id='canvas'
                            />
                        </div>
                        <div className='DrawPanel--CanvasBottom'>
                            <div className='ArtBattleRate--RateActions'>
                                {
                                    new Array(5).fill(0).map((value, index) =>
                                        <div
                                            key={`act-${index}`}
                                            style={{
                                                opacity: rates[step] && rates[step] !== index + 1 && .25,
                                                pointerEvents: rates[step] && 'none'
                                            }}
                                            onClick={() => {
                                                if (!rates[step]) {
                                                    rates[step] = index + 1;
                                                    this.setState({rates});
                                                    t.socket.call('games.rateAuthor', {
                                                        lobbyId, author, rate: index
                                                    });
                                                    this.forceUpdate();
                                                }
                                            }}
                                        >
                                            <img alt='icon'
                                                 src={getSrcUrl(require(`../../assets/drawing/icons/art_battle/reaction-${index}.webp`))}/>
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div className='ArtBattleRate'>
                <div style={{width: isDesktop ? 319 : '100%', alignSelf: 'flex-start'}} ref={ref => this.header = ref}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <h2 style={{textAlign: 'left', marginLeft: 6}}>
                                Оцените рисунок
                            </h2>
                        </div>
                        <h2 style={{
                            textAlign: 'right',
                            width: '25%',
                            color: 'var(--color_secondary)',
                            wordWrap: 'normal'
                        }}>
                            {time >= 0 ? time : 0} сек
                        </h2>
                    </div>
                </div>
                <div style={{display: isDesktop && 'flex'}}>
                    <div className='Canvas__'>
                        <div
                            className='Canvas_Container_Clear'
                            style={{width: 319, height: 319}}
                        >
                            <canvas
                                style={{width: 319, height: 319}}
                                width={319 * 2} height={319 * 2}
                                ref={ref => this.canvas = ref} id='canvas'
                            />
                        </div>
                        <div className='ArtBattleRate--RateActions'>
                            {
                                new Array(5).fill(0).map((value, index) =>
                                    <div
                                        key={`act-${index}`}
                                        style={{
                                            opacity: rates[step] && rates[step] !== index + 1 && .25,
                                            pointerEvents: rates[step] && 'none'
                                        }}
                                        onClick={() => {
                                            if (!rates[step]) {
                                                rates[step] = index + 1;
                                                this.setState({rates});
                                                t.socket.call('games.rateAuthor', {
                                                    lobbyId, author, rate: index
                                                });
                                                this.forceUpdate();
                                            }
                                        }}
                                    >
                                        <img alt='icon'
                                             src={getSrcUrl(require(`../../assets/drawing/icons/art_battle/reaction-${index}.webp`))}/>
                                    </div>
                                )
                            }
                        </div>
                        {
                            !isDesktop &&
                            <div className='ArtBattleRate--Author'>
                                <UserAvatar
                                    size={36}
                                    src={vk_local_users[author].photo_100}
                                    frame={vk_local_users[author].frame_type}
                                    color={vk_local_users[author].frame_color}
                                />
                                <span>{vk_local_users[author].first_name} {vk_local_users[author].last_name}</span>
                                <div style={{display: players[step + 1] === undefined && 'none'}}>
                                    {
                                        players[step + 1] &&
                                        <React.Fragment>
                                            <UserAvatar
                                                size={32}
                                                src={vk_local_users[players[step + 1]].photo_100}
                                                frame={vk_local_users[players[step + 1]].frame_type}
                                                color={vk_local_users[players[step + 1]].frame_color}
                                            />
                                            <div>
                                                <Icon16Down width={10} height={10} fill='#99A2AD'/>
                                            </div>
                                        </React.Fragment>
                                    }
                                </div>
                            </div>
                        }
                    </div>
                    {
                        isDesktop &&
                        <div className='ArtBattle--Users'>
                            {
                                players.map((value, index) =>
                                    <div
                                        key={`author-${index}`}
                                        style={{
                                            opacity: step !== index && .5
                                        }}
                                    >
                                        <UserAvatar
                                            size={32}
                                            src={vk_local_users[value].photo_100}
                                            frame={vk_local_users[value].frame_type}
                                            color={vk_local_users[value].frame_color}
                                        />
                                        <span>{vk_local_users[value].first_name} {vk_local_users[value].last_name.substring(0, 1)}.</span>
                                        <Icon16Down
                                            style={{display: (step !== index || index === (players.length - 1)) && 'none'}}
                                            fill='#99A2AD'
                                        />
                                    </div>
                                )
                            }
                        </div>
                    }
                </div>
            </div>
        );
    }

}