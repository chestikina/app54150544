import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {ScreenSpinner, Tooltip, IconButton} from "@vkontakte/vkui";
import {
    Icon24Help,
    Icon28CrownOutline,
    Icon28FavoriteOutline,
    Icon28GiftOutline,
    Icon28MessageOutline,
    Icon28StarsOutline,
    Icon28StorefrontOutline,
    Icon28Play,
    Icon28CupOutline,
    Icon28ServicesOutline,
    Icon28Cards2Outline,
    Icon28SettingsOutline
} from "@vkontakte/icons";
import {
    convertMsToNormalTime,
    decOfNum,
    getSrcUrl, isPlatformDesktop, isPlatformIOS, openUrl,
    shortIntegersK
} from "../../js/utils";
import {getVKUsers} from "../../js/drawerapp/utils";
import {
    app_version,
    MODAL_CARD_OUTDATED_VERSION,
    MODAL_CARD_CHANGE_URL_PARAMETERS
} from "./Drawing";
import {Icon28AddCircleOutline} from "@vkontakte/icons";
import eruda from 'eruda';
import bridge from "@vkontakte/vk-bridge";
import {UserAvatar} from "./UserAvatarFrame";
import {ReactComponent as IconGift} from "../../assets/drawing/icons/icon_gift_28.svg";

let globalCanvasTicker;

export class Main extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            isShowGlobalCanvas: props.t.state.isShowGlobalCanvas,
            canvas_status: {status: false},
            globalCanvasShowTimer: false
        };

        props.t.socket.unsubscribe('changeOnline');
        props.t.socket.subscribe('changeOnline', r => {
            if (props.t.state.activePanel !== 'feed') {
                props.t.setState({online: r.count});
                this.forceUpdate();
            }
        });

        this.goToStats = this.goToStats.bind(this);
    }

    goToStats() {
        const {t} = this.props;
        t.setPopout(<ScreenSpinner/>);
        t.socket.call('users.get', {}, r => {
            t.setState({user: r.response});

            t.socket.call('users.getTop', {type: 'pictures'}, r => {
                t.setState({users_topPictures: r.response});
                let user_ids = r.response.map(value => value.id);

                t.socket.call('users.getTop', {type: 'guessed_pictures'}, r => {
                    t.setState({users_topGuessedPictures: r.response});
                    user_ids = [...user_ids, ...r.response.map(value => value.id)];

                    t.socket.call('users.getTop', {type: 'likes'}, async r => {
                        t.setState({users_topLikes: r.response});
                        user_ids = [...user_ids, ...r.response.map(value => value.id)];
                        await getVKUsers(user_ids);

                        t.setPopout(null);
                        t.go('stats');
                    });
                });
            });
        });
    }

    async componentDidMount() {
        this.props.t.setState({
            voteWords: [],
            chooseWords: []
        });
        const {socket} = this.props.t;
        socket.call('canvas.getStatus', {}, async r => {
            const
                {response} = r,
                timeLost = response.start - Date.now(),
                globalCanvasShowTimer = (timeLost <= 24 * 60 * 60 * 1000) && (timeLost > 0)
            ;

            if (globalCanvasShowTimer) {
                globalCanvasTicker = setInterval(() => {
                    if (response.start - Date.now() <= 0) {
                        this.setState({globalCanvasShowTimer: false});
                        clearInterval(globalCanvasTicker);
                    }
                    this.forceUpdate();
                }, 1000);
            }

            this.setState({canvas_status: response, globalCanvasShowTimer});
        });
    }

    componentWillMount() {
        clearInterval(globalCanvasTicker);
    }

    render() {
        const
            {t} = this.props,
            {_tags} = t,
            {
                vk_user,
                user,
                gamesAsWinner,
                gamesAsDrawer,
                top_number,
                online,
                tooltip_resume_draw,
                activeMiniGame
            } = t.state,
            {lvl, pictures, successfulPictures, guessedPictures} = user,
            isDesktop = isPlatformDesktop(),
            {canvas_status} = this.state,
            needShowGlobalCanvasButton = (canvas_status.status || (
                (canvas_status.admins_allow && user.admin)
                ||
                (canvas_status.donut_allow && (user.premium || user.vk_donut || user.admin))
            )) && (canvas_status.end !== 0 ? canvas_status.end > Date.now() : true)
        ;
        const globalCanvasTime = needShowGlobalCanvasButton && convertMsToNormalTime(canvas_status.start - Date.now()).str;

        return (
            <div className='Profile'>
                {!isDesktop && false && <div
                    className='NativeButtonMiniAppTop'
                    style={{height: !isPlatformIOS() && 37}}
                    onClick={async () => {
                        if (t.state.app_version !== app_version) {
                            t.setActiveModal(MODAL_CARD_OUTDATED_VERSION);
                        }
                        await t.setState({__v_clicks: t.state.__v_clicks === 4 ? 4 : (t.state.__v_clicks + 1)});
                        this.forceUpdate();
                        if (t.state.__v_clicks === 3) {
                            eruda.scale(1);
                        }
                    }}
                >v{app_version} {t.state.app_version !== app_version && <span>(неактуальная)</span>}
                </div>
                }
                {!isDesktop && Date.now() < 1711904400000 && <div
                    className='NativeButtonMiniAppTop'
                    style={{height: !isPlatformIOS() && 37}}
                    onClick={async () => {
                        openUrl('https://vk.com/wall-208964042_16716');
                    }}
                >
                    🎁 Конкурс в нашей группе
                </div>
                }
                <div className='UserAvatarCover'>
                    <img alt='cover' src={vk_user.photo_max_orig}/>
                </div>
                <div className='UserInfoContainer'>
                    <UserAvatar
                        t={t}
                        size={100}
                        src={vk_user.photo_200}
                        frame={user.frame_type}
                        color={user.frame_color}
                    />
                    <div className='UserNameTags'>
                        <h1
                            onClick={() => {
                                if (user.admin) {
                                    t.setActiveModal(MODAL_CARD_CHANGE_URL_PARAMETERS);
                                }
                            }}
                        >
                            {vk_user.first_name} {vk_user.last_name}
                        </h1>
                        <div className='UserTags'>
                            {
                                (user.active_tags || []).map((value, index) => {
                                    const tag = _tags().find(v => v[0] === value);
                                    return React.cloneElement(tag[1], {
                                        key: `tag${index}`,
                                        onClick: () => t.setActiveModal(tag[0])
                                    });
                                })
                            }
                        </div>
                    </div>
                    <div className='UserLvl'>
                        <div className='UserLvlProgress'>
                            <div>
                                <div style={{width: 100 / (user.lvl * 100) * user.xp + '%'}}/>
                            </div>
                            <div>
                                <span>{user.xp}XP <span>/</span> {user.lvl * 100}XP</span>
                                <span>LVL {user.lvl}</span>
                            </div>
                        </div>
                        <IconButton onClick={() => t.go('lvl_help')}>
                            <Icon24Help fill='#DCDCDC'/>
                        </IconButton>
                    </div>
                    <div className='ActionCards'>
                        <div>
                            <div
                                className='ActionCard MainActionCard PlayGlobal'
                                onClick={async () => {
                                    /*if (await isEmptyKeyWithSet('april1')) {
                                        t.go('april1');
                                    } else {
                                        t.go('search');
                                    }*/
                                    await this.props.t.setState({api_manager: 0});
                                    t.go('search_game');
                                }}
                            >
                                <Icon28Play/> Играть
                            </div>
                            <div
                                className='ActionCard MainActionCard PlayLobby'
                                onClick={() => {
                                    if (t.vkChatIntegration || t.isFromCatalogChat || t.isFromChatWidget) {
                                        t.setPopout(<ScreenSpinner/>);
                                        t.socket.call('friends.createLobby', {}, r => {
                                            if (r.response) {
                                                t.setState({friend_lobby: r.response});
                                                t.go('friend_lobby');
                                                t.setPopout(null);
                                            } else {
                                                t.setAlert(
                                                    'Ошибка',
                                                    r.error.message,
                                                    [{
                                                        title: 'Ок',
                                                        mode: 'cancel',
                                                        autoclose: true
                                                    }]
                                                );
                                            }
                                        });
                                    } else {
                                        t.go('friends');
                                    }
                                }}
                            >
                                {
                                    t.vkChatIntegration || t.isFromCatalogChat || t.isFromChatWidget ?
                                        <React.Fragment>
                                            <Icon28MessageOutline/>
                                            <span>Играть в чате</span>
                                        </React.Fragment>
                                        :
                                        <React.Fragment>
                                            <Icon28AddCircleOutline/>
                                            <span>Своя игра</span>
                                        </React.Fragment>
                                }
                            </div>
                        </div>
                        <div>
                            {
                                (new Date() === new Date(2024, 6, 1) || user.admin) ?
                                    <div
                                        className='ActionCard MainActionCard Marathon'
                                        onClick={() => {
                                            t.go('marathon');
                                        }}
                                    >
                                        <IconGift/> Марафон
                                    </div> :
                                    (
                                        (activeMiniGame === 0 || needShowGlobalCanvasButton) ?
                                            <div
                                                className='ActionCard MainActionCard GlobalCanvas'
                                                onClick={() => {
                                                    if (canvas_status.end !== 0 || canvas_status.start !== 0) {
                                                        if (canvas_status.start >= Date.now()) return;
                                                        if (canvas_status.end !== 0 && canvas_status.end <= Date.now()) return;
                                                    }

                                                    bridge.send('VKWebAppStorageSet', {
                                                        key: 'canvas_new_mode',
                                                        value: '1'
                                                    });
                                                    t.setState({isShowGlobalCanvas: false});
                                                    this.setState({isShowGlobalCanvas: false});
                                                    t.go('global_canvas');
                                                }}
                                            >
                                                {
                                                    canvas_status.start >= Date.now() ?
                                                        `${globalCanvasTime.hours}:${globalCanvasTime.minutes}:${globalCanvasTime.seconds}` :
                                                        <React.Fragment>
                                                            <Icon28CrownOutline/> Общий холст
                                                        </React.Fragment>
                                                }
                                            </div>
                                            :
                                            (
                                                activeMiniGame === 1 ?
                                                    <div
                                                        className='ActionCard MainActionCard ArtBattle'
                                                        onClick={() => {
                                                            t.go('art_battle_placeholder');
                                                        }}
                                                    >
                                                        <Icon28CupOutline/> Битва артов
                                                    </div>
                                                    :
                                                    (
                                                        activeMiniGame === 2 &&
                                                        <div
                                                            className='ActionCard MainActionCard Gift'
                                                            style={{
                                                                background: `url(${getSrcUrl(require('../../assets/drawing/backgrounds/gifts.png'))}) no-repeat`,
                                                                backgroundSize: 'cover'
                                                            }}
                                                            onClick={() => t.go('week_gifts')}
                                                        >
                                                            <Icon28GiftOutline/> Розыгрыш
                                                        </div>
                                                    )
                                            )
                                    )
                            }
                            <div
                                className='ActionCard MainActionCard Suggestion'
                                onClick={() => t.go('services')}
                            >
                                <Icon28ServicesOutline/> Сервисы
                            </div>
                        </div>
                        <div>
                            <Tooltip
                                text='Ищите свои рисунки тут. Их ещё можно дорисовать!'
                                isShown={tooltip_resume_draw}
                                onClose={() => t.setState({tooltip_resume_draw: false})}
                                alignX='left'
                                offsetX={-100}
                                offsetY={-20}
                            >
                                <div
                                    className='ActionCard GalleryGuessed'
                                    onClick={() => t.go('gallery')}
                                >
                                    <div className='Images'>
                                        {[1, 0, 2].map((value, index) => <div num={index} key={`div__${index}`}>{
                                            gamesAsDrawer[value] &&
                                            <img alt='img' src={gamesAsDrawer[value]['Picture.url']}/>
                                        }</div>)}
                                    </div>
                                    <div className='Titles'>
                                        <div>
                                            <span>Мои работы</span>
                                            <span>{decOfNum(successfulPictures, ['успешная', 'успешные', 'успешных'])}</span>
                                        </div>
                                        <div>{decOfNum(pictures, ['картина', 'картины', 'картин'])}</div>
                                    </div>
                                </div>
                            </Tooltip>
                        </div>
                        <div>
                            <div
                                className='ActionCard GalleryGuessed'
                                onClick={() => t.go('guessed_pictures')}
                            >
                                <div className='Images'>
                                    {[1, 0, 2].map((value, index) => <div num={index} key={`div__${index}`}>{
                                        gamesAsWinner[value] &&
                                        <img alt='img' src={gamesAsWinner[value]['Picture.url']}/>
                                    }</div>)}
                                </div>
                                <div className='Titles'>
                                    <div>
                                        <span>Отгаданные работы</span>
                                        <span>{top_number && `${shortIntegersK(top_number)} место`}</span>
                                    </div>
                                    <div>{decOfNum(Math.max(0, guessedPictures), ['картина', 'картины', 'картин'])}</div>
                                </div>
                            </div>
                        </div>
                        <div>
                            {
                                [
                                    [<Icon28SettingsOutline/>, 'Настройки', () => t.go('settings')],
                                    [<Icon28StarsOutline/>, 'Статистика', () => this.goToStats()],
                                    [<Icon28StorefrontOutline/>, 'Магазин', () => t.go('shop')]
                                ].map((value, index) =>
                                    <div
                                        key={`SubCard_${index}`}
                                        className='ActionCard'
                                        onClick={() => value[2]()}
                                    >
                                        {value[0]}
                                        <span>{value[1]}</span>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                    <div className='Online' onClick={async () => {
                        if (user.admin) {
                            //t.go('neural');
                            bridge.send('VKWebAppHideBannerAd');
                            // битва артов
                            //t.setState({test_game: true, test_game_drawer: true, isOnlineDrawing: true, api_manager: 2, activePanel: 'game'});
                            // художник
                            //t.setState({test_game: true, test_game_drawer: true, activePanel: 'game'});
                            // зритель
                            t.setState({test_game: true, test_game_drawer: false, activePanel: 'game'});
                        }
                    }}>
                        Онлайн: {online}
                    </div>
                </div>
            </div>
        )
    }
}

Main.defaultProps = {};

Main.propTypes = {
    t: PropTypes.object
};

export default Main;