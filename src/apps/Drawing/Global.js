import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import {LineChart, XAxis, Tooltip, CartesianGrid, Line, YAxis, Legend} from 'recharts';
import '../../css/Drawing/Global.css';

import {getUrlParams} from "../../js/utils";
import {
    Panel,
    View,
    PanelHeader,
    AdaptivityProvider,
    ModalCardBase,
    ViewWidth,
    Button, Switch
} from '@vkontakte/vkui';

import Socket from '../../js/socket';
import {
    Icon20AchievementCircleFillBlue,
    Icon24Like,
    Icon28ReportOutline,
    Icon28ShareOutline,
    Icon56PaletteOutline,
    Icon56Users3Outline
} from "@vkontakte/icons";

const
    socket = new Socket(),
    historyDraw = {}
;

class Drawing extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            lobbies: [],
            maxOnline: 0,
            minOnline: -1,
            currentOnline: 0,
            urlParams: getUrlParams(),
            connected: false,
            onlineData: []
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.socket = socket;
        bridge.send('VKWebAppInit');
    }

    async componentDidMount() {
        this.connect();

        socket.unsubscribe('gameStart', 'draw');

        socket.subscribe('exit', r => {
            console.log('Exit application', r);
            this.setState({connected: false});
        });
        socket.onConnectionError((e) => {
            console.log('Connection Error');
            this.setState({connected: false});
            setTimeout(() => {
                this.connect();
            }, 1000);
        });
        socket.onDisconnect(() => {
            console.log('Disconnected');
            this.setState({connected: false});
        });

        socket.subscribe('gameStart', async r => {
            this.setState({lobbies: {...this.state.lobbies, [r.lobbyId]: {end: false}}});
        });
        socket.subscribe('gameEnd', async r => {
            const {lobbyId, gameId, word, winnerId} = r;
            if (this.state.lobbies[lobbyId]) {
                this.setState({lobbies: {...this.state.lobbies, [lobbyId]: {end: true, word, gameId, winnerId}}});
            }
        });
        socket.subscribe('draw', r => {
            for (const data of r.data) {
                const {x0, y0, x1, y1, color, isEraser, lineWidth} = data;
                this.drawLine(r.lobbyId, x0, y0, x1, y1, color, isEraser, lineWidth);
            }
        });
        socket.subscribe('undo', r => {
            this.undoDraw(r.lobbyId);
        });
        socket.subscribe('clear', r => {
            if (this[`canvas${r.lobbyId}`])
                this[`canvas${r.lobbyId}`].getContext('2d').clearRect(0, 0, 319, 319);
        });

        socket.subscribe('changeOnline', r => {
            let
                {maxOnline, minOnline, onlineData} = this.state,
                currentTime = new Date(Date.now()).toLocaleDateString('ru', {
                    hour: 'numeric',
                    minute: 'numeric'
                }).split(', ')[1],
                lastTime = onlineData[onlineData.length - 1],
                index = lastTime ? lastTime.time === currentTime ? onlineData.length - 1 : onlineData.length : 0
            ;

            if (index === onlineData.length) onlineData.push({});
            onlineData[index].time = currentTime;
            onlineData[index].max = Math.max(onlineData[index].max || r.count, r.count);
            onlineData[index].min = Math.min(onlineData[index].min || r.count, r.count);

            this.setState({
                maxOnline: Math.max(maxOnline, r.count),
                minOnline: Math.min(minOnline < 0 ? r.count : minOnline, r.count),
                currentOnline: r.count,
                onlineData
            });
        });

        socket.onConnect(async () => {
            console.log('Connected');
            this.setState({connected: true});
            socket.call('games.joinGlobal');
        })
    }

    connect() {
        socket.connect('https://draw.avocado.special.vk-apps.com', getUrlParams());
    }

    drawLine(lobbyId, x0, y0, x1, y1, color, isEraser, lineWidth) {
        try {
            const
                canvas = this[`canvas${lobbyId}`],
                canvasContext = canvas.getContext('2d')
            ;

            if (!canvas) return;
            if (isEraser) {
                canvasContext.globalCompositeOperation = 'destination-out';
                canvasContext.arc(x0 * 2, y0 * 2, lineWidth * 1.2, 0, Math.PI * 2, false);
                canvasContext.fill();
            } else {
                canvasContext.globalCompositeOperation = 'source-over';
                canvasContext.moveTo(x0 * 2, y0 * 2);
                canvasContext.lineTo(x1 * 2, y1 * 2);
                canvasContext.strokeStyle = color;
                canvasContext.fill();
                canvasContext.lineWidth = lineWidth;
                canvasContext.lineCap = canvasContext.lineJoin = 'round';
                canvasContext.stroke();
            }

            if (!historyDraw[lobbyId]) historyDraw[lobbyId] = [];

            historyDraw[lobbyId].push({x0, y0, x1, y1, color, isEraser, lineWidth});
        } catch (e) {

        }
    }

    undoDraw(lobbyId) {
        try {
            const
                canvas = this[`canvas${lobbyId}`],
                canvasContext = canvas.getContext('2d')
            ;

            if (!canvas || !historyDraw[lobbyId]) return;

            historyDraw[lobbyId].splice(historyDraw[lobbyId].length - 1, 1);
            canvasContext.clearRect(0, 0, 319 * 2, 319 * 2);
            if (historyDraw[lobbyId].length > 0) {
                historyDraw[lobbyId].forEach(history => {
                    history.forEach(({x0, y0, x1, y1, color, isEraser, lineWidth}) => {
                        canvasContext.beginPath();
                        if (isEraser) {
                            canvasContext.globalCompositeOperation = 'destination-out';
                            canvasContext.arc(x0 * 2, y0 * 2, lineWidth * 1.2, 0, Math.PI * 2, false);
                            canvasContext.fill();
                        } else {
                            canvasContext.globalCompositeOperation = 'source-over';
                            canvasContext.moveTo(x0 * 2, y0 * 2);
                            canvasContext.lineTo(x1 * 2, y1 * 2);
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
        } catch (e) {

        }
    }

    render() {
        const
            {
                urlParams,

                lobbies,
                popout,
                maxOnline, minOnline, currentOnline,

                manage_elements, view_games,

                connected,

                onlineData
            } = this.state
        ;

        return (
            <View
                activePanel='global'
                popout={popout}
            >
                <Panel id='global'>
                    <PanelHeader separator={false}>
                        Просмотр игр
                    </PanelHeader>
                    <AdaptivityProvider viewWidth={ViewWidth.MOBILE}>
                        <div className='Stats'>
                            <ModalCardBase
                                style={{width: 320}}
                                icon={<Icon56Users3Outline/>}
                                header='Онлайн'
                                subheader={
                                    <span>Максимальный: {maxOnline}<br/>Минимальный: {minOnline}<br/>Текущий: {currentOnline}</span>}
                                actions={
                                    <Button size='l' onClick={() => {
                                        if (connected) {
                                            socket.getSocket().disconnect();
                                        } else {
                                            this.connect();
                                        }
                                    }}>
                                        {connected ? 'Отключиться' : 'Подключиться'}
                                    </Button>
                                }
                            />
                            <ModalCardBase
                                style={{width: 320}}
                                icon={<Icon56PaletteOutline/>}
                                header='Внешний вид'
                                actionsLayout='vertical'
                                actions={[
                                    <Button
                                        size='l'
                                        mode='neutral'
                                        after={
                                            <Switch
                                                getRef={ref => this.manage_elements_ref = ref}
                                                onChange={() => this.setState({manage_elements: !manage_elements})}/>}
                                        onClick={() => this.manage_elements_ref.click()}
                                    >
                                        Спрятать кнопки
                                    </Button>,
                                    <Button
                                        size='l'
                                        mode='neutral'
                                        after={
                                            <Switch
                                                getRef={ref => this.view_games_ref = ref}
                                                onChange={() => this.setState({view_games: !view_games})}/>}
                                        onClick={() => this.view_games_ref.click()}
                                    >
                                        Спрятать игры
                                    </Button>,
                                ]}
                            />
                            <LineChart
                                width={800}
                                height={268}
                                data={JSON.parse(JSON.stringify(onlineData))}
                            >
                                <XAxis dataKey='time'/>
                                <YAxis/>
                                <Legend/>
                                <Tooltip/>
                                <Line type='monotone' dataKey='max' stroke='#4BB34B'/>
                                <Line type='monotone' dataKey='min' stroke='#E64646'/>
                            </LineChart>
                        </div>
                    </AdaptivityProvider>
                    <div className='CanvasGrid'>
                        {
                            !view_games && Object.keys(lobbies).map((value, index) =>
                                <div
                                    key={`div__${index}`}
                                    className='Canvas_Container'
                                >
                                    {
                                        lobbies[value].end && !manage_elements &&
                                        <React.Fragment>
                                            <h2>{lobbies[value].word.nom.substring(0, 1).toUpperCase() + lobbies[value].word.nom.substring(1)}</h2>
                                            <Icon28ReportOutline
                                                fill={lobbies[value].isReported && '#efefef'}
                                                className='Report'
                                                onClick={() => {
                                                    if (lobbies[value].gameId !== -1 && !lobbies[value].isReported) {
                                                        socket.call('games.report', {game_id: lobbies[value].gameId});
                                                        this.setState({
                                                            lobbies: {
                                                                ...this.state.lobbies,
                                                                [value]: {...lobbies[value], isReported: true}
                                                            }
                                                        });
                                                    }
                                                }}/>
                                            <Icon24Like
                                                fill={lobbies[value].isLiked ? '#F16384' : 'var(--color_secondary)'}
                                                className='Like'
                                                onClick={() => {
                                                    if (lobbies[value].gameId !== -1) {
                                                        socket.call('pictures.like', {game_id: lobbies[value].gameId}, r => {
                                                            this.setState({
                                                                lobbies: {
                                                                    ...this.state.lobbies,
                                                                    [value]: {
                                                                        ...lobbies[value],
                                                                        isLiked: r.response.isLiked
                                                                    }
                                                                }
                                                            });
                                                        });
                                                    }
                                                }}/>
                                            {
                                                urlParams.vk_user_id == 245481845 &&
                                                <Button
                                                    before={<Icon20AchievementCircleFillBlue width={16} height={16}/>}
                                                    size='m' mode='gradient_blue'
                                                    onClick={() => {
                                                        socket.call('users.giveCreative', {
                                                            user_id: lobbies[value].winnerId,
                                                            status: !lobbies[value].gaveTag
                                                        }, r => {
                                                            this.setState({
                                                                lobbies: {
                                                                    ...this.state.lobbies,
                                                                    [value]: {
                                                                        ...lobbies[value],
                                                                        gaveTag: r.response.tag_creative
                                                                    }
                                                                }
                                                            });
                                                        })
                                                    }}
                                                >
                                                    {lobbies[value].gaveTag ? 'Забрать' : 'Выдать'} метку
                                                </Button>
                                            }
                                        </React.Fragment>
                                    }
                                    <canvas
                                        id={lobbies[value].gameId ? `game_${lobbies[value].gameId}` : `lobby_${value}`}
                                        style={{width: 319, height: 319}}
                                        width={319 * 2} height={319 * 2}
                                        ref={ref => this[`canvas${value}`] = ref}/>
                                </div>
                            )
                        }
                    </div>
                </Panel>
            </View>
        );
    }
}

export default Drawing;