import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    PanelHeader,
    PanelHeaderBack, PromoBanner,
    ScreenSpinner,
    ActionSheet,
    ActionSheetItem, PopoutWrapper
} from "@vkontakte/vkui";
import {
    Icon24Like,
    Icon28ChevronRightOutline,
    Icon28LinkCircleOutline,
    Icon28ReportOutline,
    Icon28StoryCircleFillViolet,
    Icon28UserTagOutline,
    Icon28LikeOutline,
    Icon28ChevronLeftOutline,
    Icon28EditOutline,
    Icon28ClockOutline,
    Icon24Flash,
    Icon28DownloadCloudOutline,
    Icon28AttachOutline,
    Icon28HourglassOutline,
    Icon28ClipCircleFillViolet,
    Icon28VkVideoCircleFillRed,
    Icon28Bookmark,
    Icon28BookmarkOutline, Icon28AchievementCircleFillBlue
} from "@vkontakte/icons";
import bridge from "@vkontakte/vk-bridge";
import {
    adAppApi, ctxDrawImageWithRound, decOfNum, getRandomInt, getSrcUrl,
    getUrlParams, isPlatformDesktop,
    isPlatformIOS, loadCrossOriginImage, openUrl, shortIntegers, sleep
} from "../../js/utils";
import {getVKUsers, vk_local_users} from "../../js/drawerapp/utils";
import {createCanvas} from "canvas";
import {UserAvatar} from "./UserAvatarFrame";
import {shareAlbumPhoto} from "../../js/defaults/bridge_utils";
import {defaultShopItems} from "./Shop";

async function getCanvasPicture(game) {
    const random = getRandomInt(1, 13);
    const background = await loadCrossOriginImage(getSrcUrl(require(`../../assets/drawing/new_stories/${random}.webp`)));
    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(background, 0, 0);
    const pxData = ctx.getImageData(372, 1665, 1, 1);
    const color = `rgb(${pxData.data[0]}, ${pxData.data[1]}, ${pxData.data[2]})`;

    const word = game['Word.nom'] || game.Word.nom;
    ctx.font = `${word.length >= 14 ? 76 : 96}px Inter Black`;
    ctx.textAlign = 'left';
    ctx.fillStyle = color;
    ctx.fillText(word.substring(0, 1).toUpperCase() + word.substring(1), 100, 481 + 93);

    ctx.fillStyle = '#FFFFFF';
    //ctx.beginPath();
    ctx.roundRect(90, 672, 899, 899, 129);
    ctx.fill();

    const image = await loadCrossOriginImage(game['Picture.url'] || game.Picture.url);
    ctxDrawImageWithRound(ctx, image, 129, null, {
        x: 90,
        y: 672,
        width: 899,
        height: 899
    });

    return canvas;
}

export async function shareStory(game) {
    this.props.t.setPopout(<ScreenSpinner/>);
    try {
        await bridge.send('VKWebAppShowStoryBox', {
            background_type: 'image',
            blob: (await getCanvasPicture(game)).toDataURL('image/png'),
            attachment: {
                url: `https://vk.com/app${getUrlParams().vk_app_id}#picture${game.id}`,
                text: 'go_to',
                type: 'url'
            }
        });
        this.props.t.socket.call('games.share', {gameId: game.id});
    } catch (e) {
        console.error(e);
    }
    this.props.t.setPopout(null);
}

export async function shareAlbum(game) {
    this.props.t.setPopout(<ScreenSpinner/>);
    const canvas = await getCanvasPicture(game);
    const result = await shareAlbumPhoto(
        await new Promise(res => canvas.toBlob(blob => res(blob))),
        'Угадай, что нарисовано',
        `Рисунок сделан в мини-приложении vk.com/app${getUrlParams().vk_app_id}. Слово: ${game['Word.nom'] || game.Word.nom}`,
        false,
        true
    );
    if (result >= 0) {
        this.props.t.socket.call('games.save', {gameId: game.id, albumId: result});
    }
    this.props.t.setSnackbar(
        result === -1 ? 'Для сохранения фотографии в альбом необходим доступ' :
            (
                result < 0 ? 'Произошла ошибка при сохранении :('
                    :
                    'Рисунок сохранён в альбом ВКонтакте'
            )
    );
    this.props.t.setPopout(null);
}

export async function shareStory1(game) {
    this.props.t.setPopout(<ScreenSpinner/>);
    try {
        const
            {createCanvas} = require('canvas'),
            background = await loadCrossOriginImage('https://photos.avocado.special.vk-apps.com/drawapp_search_images/stories/Story3.png')
        ;

        const
            canvas = createCanvas(background.width, background.height),
            ctx = canvas.getContext('2d')
        ;
        ctx.drawImage(background, 0, 0);
        ctx.drawImage(await loadCrossOriginImage(game['Picture.url'] || game.Picture.url), 198, 618, 683, 683);

        try {
            await bridge.send('VKWebAppShowStoryBox', {
                background_type: 'image',
                blob: canvas.toDataURL('image/png'),
                attachment: {
                    url: `https://vk.com/app${getUrlParams().vk_app_id}#picture${game.id}`,
                    text: 'go_to',
                    type: 'url'
                }
            });
            this.props.t.socket.call('games.share', {gameId: game.id});
            adAppApi('stats.shareStory');
        } catch (e) {
        }
        this.props.t.setPopout(null);
    } catch (e) {
        console.error(e);
        this.props.t.setPopout(null);
        this.props.t.setSnackbar('Произошла ошибка');
    }
}

export async function shareStory2(game) {
    const word = game['Word.nom'] || game.Word.nom;
    this.props.t.setPopout(<ScreenSpinner/>);
    try {
        const
            {createCanvas} = require('canvas'),
            background = await loadCrossOriginImage('https://photos.avocado.special.vk-apps.com/drawapp_search_images/stories/Story1.png')
        ;

        try {
            const
                canvas = createCanvas(background.width, background.height),
                ctx = canvas.getContext('2d'),
                title = word.substring(0, 1).toUpperCase() + word.substring(1)
            ;
            ctx.drawImage(background, 0, 0);

            ctx.font = '64px TT Commons Demibold';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#616161';
            ctx.fillText(title, 539, 708 + 13 + 489);

            ctx.drawImage(await loadCrossOriginImage(game['Picture.url'] || game.Picture.url), 198, 618, 683, 683);

            try {
                await bridge.send('VKWebAppShowStoryBox', {
                    background_type: 'image',
                    blob: canvas.toDataURL('image/png'),
                    attachment: {
                        url: `https://vk.com/app${getUrlParams().vk_app_id}#picture${game.id}`,
                        text: 'go_to',
                        type: 'url'
                    }
                });
            } catch (e) {
            }
            this.props.t.socket.call('games.share', {gameId: game.id});
            adAppApi('stats.shareStory');
        } catch (e) {
            console.error(e);
            this.props.t.setSnackbar('Произошла ошибка');
        }
        this.props.t.setPopout(null);
    } catch (e) {
        console.error(e);
        this.props.t.setPopout(null);
        this.props.t.setSnackbar('Произошла ошибка');
    }
}

export async function pictureActions(isFromPictureInfo, game, toggleRef, {
    keyToSetChange = '',
    indexToSetChange = ''
} = {}) {
    const {t} = this.props;
    const {user} = t.state;
    const inBookmarks = !!(t.bookmarkAction('f', 1, game.id));

    const actionQueueExport = (id, type, action) => {
        let {game_export_} = t.state;
        if (!game_export_) game_export_ = [];
        if (action === 'remove')
            game_export_.splice(game_export_.indexOf(`${id}_${type}`), 1);
        else if (action === 'add')
            game_export_.push(`${id}_${type}`);

        t.setState({game_export_});
    };
    const inQueueExport = (id, type) => {
        return t.state.game_export_ && t.state.game_export_.indexOf(`${game.id}_${type}`) > -1;
    };
    const showAlertQueueExport = (id, type) => {
        const inQueue = inQueueExport(id, type);
        t.setAlert(
            `Экспорт в ${type === 'clip' ? 'клипы' : 'видео'}`,
            'Что нужно сделать?',
            [
                {
                    title: inQueue ? 'Удалить из очереди' : 'Добавить в очередь',
                    action: () => {
                        actionQueueExport(id, type, inQueue ? 'remove' : 'add');
                    },
                    autoclose: true
                },
                {
                    title: 'Экспорт',
                    action: () => {
                        if (!inQueue)
                            actionQueueExport(id, type, 'add');

                        t.go('export_clip');
                    },
                    autoclose: true
                }
            ]
        );
    };

    t.setPopout(
        <ActionSheet
            onClose={() => t.setPopout(null)}
            iosCloseItem={
                <ActionSheetItem autoclose mode='cancel'>
                    Отменить
                </ActionSheetItem>
            }
            toggleRef={toggleRef || this.pictureActionsButton}
        >
            {
                user.admin && <ActionSheetItem
                    autoclose
                    before={<Icon28AchievementCircleFillBlue/>}
                    onClick={async () => {
                        t.setPopout(<ScreenSpinner/>);
                        await new Promise(res => t.socket.call('users.giveCreative', {
                            user_id: game.drawerId,
                            status: true
                        }, r => res(r)));
                        t.setPopout(null);
                    }}
                >
                    Выдать метку
                </ActionSheetItem>
            }
            {
                isFromPictureInfo && game.drawerId === t.state.vk_user.id && <ActionSheetItem
                    autoclose
                    before={<Icon28DownloadCloudOutline/>}
                    onClick={() => {
                        shareAlbum.bind(this)(game);
                    }}
                >
                    Сохранить рисунок
                </ActionSheetItem>
            }
            {
                isFromPictureInfo && game.drawerId === t.state.vk_user.id && <ActionSheetItem
                    autoclose
                    before={<Icon28HourglassOutline/>}
                    onClick={async () => {
                        if (user[defaultShopItems[3].userAttr] > 0) {
                            user[defaultShopItems[3].userAttr] -= 1;
                            t.setState({user});

                            t.setPopout(<ScreenSpinner/>);
                            await new Promise(res => t.socket.call('pictures.extendTime', {id: game.id}, r => {
                                    if (r.response) {
                                        game.deleteTime = r.response;
                                        if (keyToSetChange) {
                                            t.state[keyToSetChange][indexToSetChange] = game;
                                            t.setState({[keyToSetChange]: t.state[keyToSetChange]});
                                        }
                                        this.forceUpdate();
                                        t.setSnackbar('Время удаления перенесено на 1 час.');
                                    } else {
                                        t.setSnackbar(r.error.message || 'Ошибка');
                                    }
                                    res(true);
                                })
                            )
                            t.setPopout(null);
                        }
                    }}
                >
                    Продлить хранение рисунка
                </ActionSheetItem>
            }
            <ActionSheetItem
                autoclose
                before={<Icon28StoryCircleFillViolet/>}
                onClick={() => {
                    shareStory.bind(this)(game);
                }}
            >
                Поделиться в истории
            </ActionSheetItem>
            <ActionSheetItem
                autoclose
                before={inBookmarks ? <Icon28Bookmark/> : <Icon28BookmarkOutline/>}
                onClick={() => {
                    t.bookmarkAction(inBookmarks ? 'r' : 'a', 1, game.id);
                }}
            >
                {inBookmarks ? 'Удалить из избранных' : 'Добавить в избранные'}
            </ActionSheetItem>
            <ActionSheetItem
                autoclose
                before={<Icon28LinkCircleOutline/>}
                onClick={() => {
                    bridge.send('VKWebAppCopyText', {text: `https://vk.com/app${getUrlParams().vk_app_id}#picture${game.id}`});
                    t.setSnackbar('Ссылка скопирована');
                }}
            >
                Скопировать ссылку на картину
            </ActionSheetItem>
            <ActionSheetItem
                autoclose
                before={<Icon28UserTagOutline/>}
                onClick={() => {
                    bridge.send('VKWebAppCopyText', {text: `https://vk.com/app${getUrlParams().vk_app_id}#author${game.drawerId}`});
                    t.setSnackbar('Ссылка скопирована');
                }}
            >
                Скопировать ссылку на автора
            </ActionSheetItem>

            {
                user.admin && <ActionSheetItem
                    autoclose
                    before={<Icon28VkVideoCircleFillRed/>}
                    onClick={async () => {
                        /*if (!game.history) {
                            t.setPopout(<ScreenSpinner/>);
                            await new Promise(res => t.socket.call('games.getHistory', {id: game.id, act: 'clip'}, r => {
                                    if (r.response) {
                                        game.history = r.response;
                                    }
                                    t.setPopout(null);
                                    res(true);
                                })
                            )
                        }
                        await t.setState({game_: game, export_: 'video'});
                        t.go('export_clip');*/
                        showAlertQueueExport(game.id, 'video');
                    }}
                >
                    Экспорт в видео
                </ActionSheetItem>
            }
            <ActionSheetItem
                autoclose
                before={<Icon28ClipCircleFillViolet/>}
                onClick={async () => {
                    if (user[defaultShopItems[2].userAttr] > 0 || user.admin) {
                        if (isPlatformDesktop()) {
                            if (!user.admin) {
                                if (user[defaultShopItems[2].userAttr] > 0) {
                                    user[defaultShopItems[2].userAttr] -= 1;
                                    t.setState({user});
                                }

                                t.setPopout(<ScreenSpinner/>);

                                await new Promise(res => t.socket.call('games.getHistory', {
                                        id: game.id,
                                        act: 'clip',
                                        nfg: !!game.history
                                    }, r => {
                                        if (r.response) {
                                            if (typeof r.response === 'object') {
                                                game.history = r.response;
                                            }
                                        }
                                        t.setPopout(null);
                                        res(true);
                                    })
                                );
                                await t.setState({game_: game, export_: 'clip'});
                                t.go('export_clip');
                            } else {
                                showAlertQueueExport(game.id, 'clip');
                            }
                        } else {
                            t.setSnackbar('Эта функция работает только на компьютере/ноутбуке :(');
                        }
                    } else {
                        t.setSnackbar('Чтобы воспользоваться этим, посетите магазин.', {
                            buttonText: 'Перейти',
                            buttonAction: () => t.go('shop')
                        });
                    }
                }}
            >
                Экспорт в клип
            </ActionSheetItem>
            {
                game.drawerId !== t.state.vk_user.id && isFromPictureInfo && <ActionSheetItem
                    autoclose
                    before={<Icon28ReportOutline/>}
                    onClick={() => {
                        t.setPopout(<ScreenSpinner/>);
                        if (user.admin) {
                            t.socket.call('admin.removeReportedGame', {game: game.id}, r => {
                                if (r.response) {
                                    t.setSnackbar('Игрок был наказан.');
                                } else {
                                    t.setSnackbar('Произошла ошибка.');
                                }
                                t.setPopout(null);
                            });
                        } else {
                            t.socket.call('games.report', {game_id: game.id}, r => {
                                if (r.response) {
                                    t.setSnackbar('Жалоба отправлена');
                                } else {
                                    t.setSnackbar('Жалоба уже отправлена');
                                }
                                t.setPopout(null);
                            });
                        }
                    }}
                >
                    {user.admin ? 'Выдать наказание' : 'Пожаловаться'}
                </ActionSheetItem>
            }
        </ActionSheet>
    );
    this.forceUpdate();
    t.forceUpdate();
}

let animationForceStop = false;

export async function startAnimation(canvas, game, end, {
    speed = 1,
    offset = {x: 0, y: 0},
    canvasSize = {width: 319 * 2, height: 319 * 2},
    onRender = () => {
    }
} = {}) {
    animationForceStop = false;
    const canvasContext = (canvas || this.canvas).getContext('2d');
    if (!game) game = this.props.t.state[this.props.param][this.props.current];
    if (!game.history) return;
    const actionsDraw = [];
    let currentActionDraw = 0;
    game.history.forEach(lines => {
        lines.forEach(({x0, y0, x1, y1, color, isEraser, lineWidth, multiplier}) => {
            actionsDraw.push(async () => {
                try {
                    if (!lineWidth) lineWidth = 2;
                    if (!multiplier) multiplier = 2;

                    canvasContext.beginPath();
                    if (isEraser) {
                        canvasContext.globalCompositeOperation = 'destination-out';
                        canvasContext.arc(x0 * multiplier + offset.x, y0 * multiplier + offset.y, lineWidth * 1.2, 0, Math.PI * 2, false);
                        canvasContext.fill();
                    } else {
                        canvasContext.globalCompositeOperation = 'source-over';
                        canvasContext.moveTo(x0 * multiplier + offset.x, y0 * multiplier + offset.y);
                        canvasContext.lineTo(x1 * multiplier + offset.x, y1 * multiplier + offset.y);
                        canvasContext.strokeStyle = color;
                        canvasContext.fill();
                        canvasContext.lineWidth = lineWidth;
                        canvasContext.lineCap = canvasContext.lineJoin = 'round';
                        canvasContext.stroke();
                    }

                    currentActionDraw++;
                    if (currentActionDraw < actionsDraw.length && !animationForceStop) {
                        await sleep(1000 / 60 / speed);
                        if (onRender && typeof onRender === 'function') await onRender();
                        window.requestAnimationFrame(actionsDraw[currentActionDraw]);
                    } else {
                        // end
                        if (end) {
                            await sleep(100);
                            await end();
                        } else if (this) {
                            await this.setState({mode: 'default'});
                        }
                        canvasContext.clearRect(0, 0, canvasSize.width, canvasSize.height);
                    }
                } catch (e) {

                }
            });
        })
    });

    window.requestAnimationFrame(actionsDraw[currentActionDraw]);
}

export function forceStopAnimation() {
    animationForceStop = true;
}

export class PictureInfo extends PureComponent {

    constructor(props) {
        super(props);

        const
            {t, param, current} = this.props,
            {socket, state} = t,
            list = state[param]
        ;

        this.state = {
            canGetMore: list.length > 1,
            isReported: false,

            mode: 'default'
        };

        socket.call('pictures.isLiked', {game_id: list[current].id}, r => {
            this.setState({isLiked: r.response});
        });

        this.startAnimation = startAnimation.bind(this);
    }

    componentDidMount() {

    }

    render() {
        const
            isIos = isPlatformIOS(),
            {t, current, method, param, user_id} = this.props,
            {n_canvasData, banners, user} = t.state,
            list = t.state[param],
            game = list[current],
            vk_data = vk_local_users[game.drawerId],
            {isLiked, isReported, isDeleted, canGetMore, mode} = this.state,
            timeLost = game.deleteTime - Date.now(),
            timeTitles = timeLost >= 24 * 60 * 60 * 1000 ? ['день', 'дня', 'дней'] : (timeLost >= 60 * 60 * 1000 ? ['час', 'часа', 'часов'] : 'мин'),
            time = timeLost / 1000 / 60,
            timeText = decOfNum(time >= (24 * 60) ? Math.floor(time / 24 / 60) : (time >= 60 ? Math.floor(time / 60) : Math.floor(time)), timeTitles)
        ;

        return (
            <React.Fragment>
                <PanelHeader
                    left={<PanelHeaderBack onClick={async () => {
                        t.back();
                    }}/>}
                    separator={false}
                />
                {game && <div className='PictureInfo'>
                    <div className='PictureInfo-Word-Time'>
                        <span>
                            {(game['Word.nom'] || game.Word.nom) && ((game['Word.nom'] || game.Word.nom).substring(0, 1).toUpperCase() + (game['Word.nom'] || game.Word.nom).substring(1))}
                        </span>
                        <span style={{display: game.savedGame && 'none'}}>
                            {Math.round((game.endTime - game.startTime) / 1000)} с.
                        </span>
                    </div>
                    <div className='PictureInfo-CanvasContainer'>
                        <img
                            crossOrigin='anonymous'
                            alt='im' src={game['Picture.url'] || n_canvasData || game.Picture.url}
                            ref={ref => this.imageRef = ref}
                            style={{
                                display: mode !== 'default' && 'none'
                            }}
                            onClick={async () => {
                                if (user[defaultShopItems[1].userAttr] > 0 || user.admin) {
                                    if (user[defaultShopItems[1].userAttr] > 0) {
                                        user[defaultShopItems[1].userAttr] -= 1;
                                    }
                                    t.setState({user});
                                    this.forceUpdate();
                                    await this.setState({mode: 'animation'});
                                    t.setPopout(<ScreenSpinner/>);
                                    await new Promise(res => t.socket.call('games.getHistory', {
                                            id: game.id,
                                            act: 'animation',
                                            nfg: !!game.history
                                        }, r => {
                                            if (r.response) {
                                                if (typeof r.response === 'object') {
                                                    game.history = r.response;
                                                    list[current] = game;
                                                    t.setState({[param]: list});
                                                }
                                            } else {
                                                t.setSnackbar(r.error.message || 'Ошибка');
                                            }
                                            res(true);
                                        })
                                    )
                                    t.setPopout(null);
                                    this.startAnimation();
                                } else {
                                    t.setSnackbar('Чтобы воспользоваться этим, посетите магазин.', {
                                        buttonText: 'Перейти',
                                        buttonAction: () => t.go('shop')
                                    });
                                }
                            }}
                        />
                        <canvas
                            style={{
                                width: 220, height: 220,
                                display: mode !== 'animation' && 'none'
                            }}
                            width={319 * 2} height={319 * 2}
                            ref={ref => this.canvas = ref}
                        />
                    </div>
                    <div className='PictureInfo-Actions' style={{display: game.savedGame && 'none'}}>
                        {
                            [
                                [
                                    isLiked ?
                                        <Icon24Like fill='#FD5C81' width={28} height={28}/> :
                                        <Icon28LikeOutline/>,
                                    shortIntegers(game['Picture.likes']),
                                    () => {
                                        t.setPopout(<ScreenSpinner/>);
                                        t.socket.call('pictures.like', {game_id: game.id}, r => {
                                            if (r.response) {
                                                list[current] = {...game, ['Picture.likes']: r.response.likes};
                                                t.setState({like_picturesList: list});
                                                this.setState({isLiked: r.response.isLiked});
                                            }
                                            t.setPopout(null);
                                        });
                                    }
                                ],
                                [
                                    <Icon28AttachOutline/>,
                                    'Действия',
                                    () => pictureActions.bind(this)(true, game, this.pictureActionsButton, {
                                        keyToSetChange: param,
                                        indexToSetChange: current
                                    }),
                                    (ref) => this.pictureActionsButton = ref
                                ],
                                [
                                    <Icon28HourglassOutline/>,
                                    timeText,
                                    () => {
                                        if (!t.privilege && game.drawerId === user.id) {
                                            t.setPopout(<PopoutWrapper>
                                                <div className='GameAfkWarning'>
                                                    <div className='GameAfkWarning-Icon'>
                                                        <Icon28ClockOutline/>
                                                    </div>
                                                    <div className='GameAfkWarning-Title'>
                                                        Картина удалится через {timeText}
                                                    </div>
                                                    <div className='GameAfkWarning-Description'>
                                                        {isIos ?
                                                            'В статье указано, как продлить автоудаление рисунков' :
                                                            'Оформите подписку avocado+, чтобы продлить автоудаление рисунков'}
                                                    </div>
                                                    <div
                                                        className='GameAfkWarning-Button'
                                                        style={{background: 'rgba(255, 75, 75, 0.15)'}}
                                                        onClick={() => {
                                                            if (isIos) {
                                                                openUrl('https://vk.com/@draw_app-avocadoplus');
                                                            } else {
                                                                t.go('vk_donut_avocado');
                                                            }
                                                        }}
                                                    >
                                                        {isIos && <Icon24Flash width={20} height={20}/>}
                                                        {isIos ? 'Перейти' : 'Оформить'}
                                                    </div>
                                                    <div
                                                        className='GameAfkWarning-Button'
                                                        style={{marginTop: 8}}
                                                        onClick={() => t.setPopout(null)}
                                                    >
                                                        Закрыть
                                                    </div>
                                                </div>
                                            </PopoutWrapper>);
                                        }
                                    }
                                ]
                                /*[
                                    <Icon28DeleteOutlineAndroid/>,
                                    'Удалить',
                                    () => {
                                        t.setPopout(<PopoutWrapper>
                                            <div className='GameAfkWarning'>
                                                <div className='GameAfkWarning-Icon'>
                                                    <Icon28ErrorCircleOutline/>
                                                </div>
                                                <div className='GameAfkWarning-Title'>
                                                    Вы уверены?
                                                </div>
                                                <div className='GameAfkWarning-Description'>
                                                    Если вы удалите свой рисунок, вернуть его будет невозможно
                                                </div>
                                                <div
                                                    className='GameAfkWarning-Button'
                                                    style={{background: 'rgba(255, 75, 75, 0.15)'}}
                                                    onClick={() => {
                                                        t.setPopout(<ScreenSpinner/>);
                                                        t.socket.call('games.remove', {game_id: game.id}, async r => {
                                                            await t.updateData();
                                                            t.setPopout(null);
                                                            if (r.response) {
                                                                t.back();
                                                                if (list.length === 0) {
                                                                    t.back();
                                                                }
                                                                t.setSnackbar('Рисунок удалён');
                                                            } else if (r.not_found) {
                                                                t.setSnackbar('Рисунок уже удалён');
                                                            } else {
                                                                t.setSnackbar('Не получилось удалить рисунок :(');
                                                            }
                                                            this.setState({isReported: true, isDeleted: true});
                                                        });
                                                    }}
                                                >
                                                    Удалить
                                                </div>
                                                <div
                                                    className='GameAfkWarning-Button'
                                                    style={{marginTop: 8}}
                                                    onClick={() => t.setPopout(null)}
                                                >
                                                    Отмена
                                                </div>
                                            </div>
                                        </PopoutWrapper>);
                                    }
                                ]*/
                            ].map((value, index) =>
                                <div
                                    key={`action_${index}`} onClick={value[2]} ref={value[3]}
                                    style={isReported && index === 2 ? {opacity: .5, pointerEvents: 'none'} : {}}
                                >
                                    {value[0]}
                                    <span>{value[1]}</span>
                                </div>
                            )
                        }
                    </div>
                    <div
                        className='PictureInfo-Author'
                        onClick={() => {
                            if (game.savedGame) return;
                            t.setPopout(<ScreenSpinner/>);
                            t.socket.call('users.getById', {id: game.drawerId}, async r1 => {
                                t.socket.call('games.getByDrawerId', {id: game.drawerId}, async r2 => {
                                    await t.setState({
                                        author: {id: game.drawerId, ...r1.response || {}},
                                        author_works: r2.response
                                    });
                                    t.go('author');
                                    t.setPopout(null);
                                });
                            });
                        }}
                        style={{
                            ...(vk_data ? {} : {
                                display: 'none'
                            })
                        }}
                    >
                        <div>Автор</div>
                        <div>
                            <UserAvatar
                                size={36}
                                src={vk_data && vk_data.photo_100}
                                frame={vk_data && vk_data.frame_type}
                                color={vk_data && vk_data.frame_color}
                            />
                            <div>{vk_data && vk_data.first_name} {vk_data && vk_data.last_name}</div>
                        </div>
                    </div>
                    <div className='PictureInfo-Arrows-ResumeDraw' style={{display: game.savedGame && 'none'}}>
                        <div
                            style={current === 0 ? {opacity: .5, pointerEvents: 'none'} : {}}
                            onClick={() => {
                                t.setPopout(<ScreenSpinner/>);
                                t.socket.call('pictures.isLiked', {game_id: list[current - 1].id}, r => {
                                    this.setState({isLiked: r.response, canGetMore: true, isReported: false});
                                    t.setState({like_currentPictureSelected: current - 1, n_canvasData: undefined});
                                    t.setPopout(null);
                                });
                            }}
                        >
                            <Icon28ChevronLeftOutline/>
                        </div>
                        <div
                            style={{
                                background: 'var(--gradient_green)',
                                color: '#FFFFFF',
                                display: game.drawerId !== t.state.vk_user.id && 'none'
                            }}
                            onClick={() => {
                                t.socket.call('games.canResumeDrawing', {gameId: game.id}, async r => {
                                    if (r.response) {
                                        if (!t.state.user.vk_donut) {
                                            try {
                                                if (bridge.supports('VKWebAppShowNativeAds'))
                                                    await bridge.send('VKWebAppShowNativeAds', {ad_format: 'reward'});
                                            } catch (e) {
                                            }
                                        }

                                        if (!game.history) {
                                            t.setPopout(<ScreenSpinner/>);
                                            await new Promise(res => t.socket.call('games.getHistory', {
                                                    id: game.id,
                                                    nfg: true,
                                                    act: 'edit_pic'
                                                }, r => {
                                                    if (r.response) {
                                                        game.history = r.response;
                                                        list[current] = game;
                                                        t.setState({[param]: list});
                                                    } else {
                                                        t.setSnackbar(r.error.message || 'Ошибка');
                                                    }
                                                    t.setPopout(null);
                                                    res(true);
                                                })
                                            )
                                        }
                                        console.log(game);
                                        await t.setState({
                                            isOnlineDrawing: false,
                                            word: {nom: game['Word.nom'] || game.Word.nom},
                                            pictureUrl_: game['Picture.url'] || game.Picture.url,
                                            game_: game,
                                            gameId_: game.id
                                        });
                                        console.log(t.state.word);
                                        t.go('game');
                                    } else {
                                        if (isIos) {
                                            t.go('vk_donut_blocked');
                                        } else {
                                            t.go('vk_donut_avocado');
                                        }
                                    }
                                });
                            }}
                        >
                            <Icon28EditOutline/>
                        </div>
                        <div
                            style={!canGetMore ? {opacity: .5, pointerEvents: 'none'} : {}}
                            onClick={() => {
                                let needUpdate = false;
                                if (current === (list.length - 1)) {
                                    if (method && method.length > 0) {
                                        needUpdate = true;
                                    } else {
                                        this.setState({canGetMore: false});
                                    }
                                } else {
                                    t.socket.call('pictures.isLiked', {game_id: list[current + 1].id}, r => {
                                        this.setState({isLiked: r.response});
                                        t.setState({like_currentPictureSelected: current + 1, n_canvasData: undefined});
                                    });
                                    if ((current + 1) === (list.length - 1)) {
                                        this.setState({canGetMore: false});
                                        needUpdate = true;
                                    }
                                }
                                if (needUpdate && method) {
                                    t.setPopout(<ScreenSpinner/>);
                                    t.socket.call(method, {
                                        offset: list.length,
                                        limit: 10,
                                        id: user_id
                                    }, async r => {
                                        if (r.response.length > 0) {
                                            await getVKUsers(r.response.map(value => value.drawerId));
                                            t.setState({
                                                [param]: [...new Set([...list, ...r.response])],
                                                n_canvasData: undefined
                                            });
                                        }
                                        this.setState({canGetMore: r.response.length > 0});
                                        t.setPopout(null);
                                    });
                                }
                                this.setState({isReported: false});
                            }}
                        >
                            <Icon28ChevronRightOutline/>
                        </div>
                    </div>
                    {
                        !t.newAdSupports && banners[8] &&
                        <PromoBanner
                            bannerData={banners[8]}
                            onClose={async () => {
                                banners[8] = false;
                                await t.setState({banners});
                                this.forceUpdate();
                            }}
                        />
                    }
                </div>}
            </React.Fragment>
        )
    }

}

PictureInfo.defaultProps = {};

PictureInfo.propTypes = {
    t: PropTypes.object,
    current: PropTypes.number,
    method: PropTypes.string,
    param: PropTypes.string,
    user_id: PropTypes.number
};

export default PictureInfo;