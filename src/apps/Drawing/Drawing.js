import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../../css/Drawing/Global.css';
import eruda from 'eruda';
import {HexColorPicker} from "react-colorful";
import {
    adAppApi, getSrcUrl,
    getUrlParams, hexToRgb, isDarkColor,
    isPlatformDesktop, loadCssFontsODR,
    loadFonts,
    openUrl, sleep, toBlob
} from "../../js/utils";
import {vk_local_users, getVKUsers} from "../../js/drawerapp/utils";
import {
    Button,
    ModalCard,
    ModalPage,
    ModalRoot,
    Panel,
    ScreenSpinner,
    Snackbar,
    View,
    ModalPageHeader,
    PanelHeaderButton,
    Input,
    SplitLayout,
    SplitCol, FormLayout, FormItem, PanelHeaderBack, PanelHeader,
    Alert, IconButton
} from '@vkontakte/vkui';
import {
    Icon20AchievementCircleFillBlue,
    Icon20FireCircleFillRed,
    Icon20RecentCircleFillYellow,
    Icon20ThumbsUpCircleFillGreen,
    Icon20StoryReplyCircleFillViolet,
    Icon24Dismiss,
    Icon28ChevronRightOutline,
    Icon28ClockCircleFillGray,
    Icon56CakeCircleFillPurple,
    Icon56ErrorTriangleOutline,
    Icon20CancelCircleFillRed,
    Icon56PaletteOutline,
    Icon20FavoriteCircleFillYellow,
    Icon20ListLikeCircleFillBlue, Icon20ViewCircleFillRed, Icon20FavoriteCircleFillGreen, Icon28ScanViewfinderOutline
} from "@vkontakte/icons";

//import {ReactComponent as IconOnboard} from "../../assets/drawing/icons/Icon.svg";
import {ReactComponent as IconOnboard} from "../../assets/drawing/icons/IconClean.svg";
//import {ReactComponent as IconError} from "../../assets/drawing/icons/IconError.svg";
import {ReactComponent as IconError} from "../../assets/drawing/icons/IconErrorClean.svg";
import {ReactComponent as IconCleanDark} from "../../assets/drawing/icons/IconCleanDark.svg";
import {ReactComponent as IconDonut} from "../../assets/drawing/icons/IconDonut.svg";
import {ReactComponent as IconDone} from "../../assets/drawing/icons/IconDone.svg";
import {ReactComponent as IconCancel} from "../../assets/drawing/icons/IconCancel.svg";
import {ReactComponent as Icon20BananaCircleFill} from "../../assets/drawing/icons/banana_circle_fill_20.svg";
import {ReactComponent as Icon20CloudCircleFill} from "../../assets/drawing/icons/cloud_circle_fill_20.svg";
import {ReactComponent as Icon20TargetCircleFill} from "../../assets/drawing/icons/target_circle_fill_20.svg";
import {ReactComponent as Icon20SkullCircleFill} from "../../assets/drawing/icons/skull_circle_fill_20.svg";
import {ReactComponent as Icon20BrainCircleFill} from "../../assets/drawing/icons/brain_circle_fill_20.svg";

import Main from "./Main";
import Gallery from "./Gallery";
import GuessedPictures from "./GuessedPictures";
import SearchGame from "./SearchGame";
import Game from "./Game";
import Result from "./Result";
import Placeholder from "./Placeholder";

import Socket from '../../js/socket';
import Feed from "./Feed";
import PictureInfo from "./PictureInfo";
import Author from "./Author";
import Tags from "./Tags";
import Friends from "./Friends";
import FriendLobby from "./FriendLobby";
import Stats from "./Stats";
import Shop from "./Shop";
import GlobalCanvas from "./GlobalCanvas";
import GlobalCanvasInfo from "./GlobalCanvasInfo";
import FriendLobbySettings from "./FriendLobbySettings";
import GlobalCanvasHistory from "./GlobalCanvasHistory";
import Suggestions from "./Suggestions";
import SuggestionsIdea from "./SuggestionsIdea";
import SuggestionsWord from "./SuggestionsWord";
import SuggestionsList from "./SuggestionsList";
import UserAvatarFrame, {UserAvatarFrames} from "./UserAvatarFrame";
import UserLvlHelp from "./UserLvlHelp";
import WeekGifts from "./WeekGifts";
import result from "./Result";
import Neural from "./Neural";
import {ArtBattlePlaceholder, ArtBattleRate} from "./ArtBattle";
import {getStorageKeys, getStorageValue, isEmptyKeyWithSet, setStorageValue} from "../../js/defaults/bridge_utils";
import {Alabuga, currentAdSettings, OprosStartGameRSV} from "./AdvertIntegration";
import ExportClip from "./ExportClip";
import Services from "./Services";
import FriendList from "./FriendList";
import Bookmarks from "./Bookmarks";
import Search from "./Search";
import Settings from "./Settings";
import Reports, {ReportView} from "./Reports";
import Marathon from "./Marathon";

import (`../../css/Drawing/${window.location.search.length > 0 && JSON.parse('{"' + decodeURI(window.location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}').vk_platform === 'desktop_web' ? 'Desktop' : 'Mobile'}.css`);

const
    socket = new Socket()
;
let
    bannersInterval,
    connectInterval,

    friend_ids,

    firstInsetBottom = false
;

export const
    app_version = '1.4.3',

    MODAL_CARD_PLAY_MODE = 'play-mode',
    MODAL_CARD_NEW_UPDATE = 'new-update',
    MODAL_CARD_OUTDATED_VERSION = 'outdated-version',
    MODAL_CARD_GLOBAL_CANVAS_ONBOARD = 'global-canvas',
    MODAL_CARD_CHANGE_URL_PARAMETERS = 'change-url-params',

    MODAL_PAGE_PALETTE = 'palette'
;

class Drawing extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            bridge_inited: false,
            appearance: 'light',

            notifications_allowed: getUrlParams().vk_are_notifications_enabled === '1',

            isNotApp: false,

            activePanel: 'main',
            history: ['main'],

            activeModal: null,
            modalHistory: [],

            color: undefined,
            pickedColor: '#000000',
            color_percent: 0,
            colors: [
                ['#FD5C5C', '#FE77C4', '#C47EFF', '#508DFA', '#5FE3FF', '#50E98E', '#FFED63', '#FFB063'], '#000000', '#FFFFFF', '#E63902', '#EA5A03', '#FA8A00', '#FBB101', '#FDE401', '#85B201', '#019317', '#019C8B', '#035AA2', '#00247A', '#500A6D', '#A9236B', '#964B00', '#F57C7C'
            ],
            gradients: [
                ['#FFB063', '#FD5C5C', '#FE77C4', '#C47EFF', '#508DFA', '#5FE3FF', '#50E98E', '#FFED63', '#FFB063', '#FD5C5C'],
                ['#34A5D2', '#508DFA', '#38587E', '#3A8DD7', '#466AC0', '#3D5164', '#34A5D2'],
                ['#F8D465', '#FF5990', '#FF635C', '#E08B53', '#DDB173', '#FFBC78', '#F8D465', '#FF5990'],
                ['#B970E6', '#F2B888', '#8ED6FF', '#FF6746', '#CC976F', '#B970E6', '#F2B888'],
                ['#DCD6FF', '#EFBED0', '#FF75E1', '#FF7CE2', '#FEBFFF', '#DCD6FF'],
                ['#666CFF', '#6653DF', '#92B0FF', '#57AAD9', '#666CFF', '#6653DF'],
                ['#FFCD4B', '#FC71FF', '#FF8C67', '#8471F9', '#FFCD4B', '#FC71FF'],
                ['#2A0567', '#8C3CFF', '#FFA7E6', '#2A0567', '#8C3CFF'],
                ['#99E600', '#FFB36D', '#C2D357', '#FFC886', '#99E600', '#FFB36D']
            ],
            btnSelectColorPaletteDefault: '#6862DA',

            __v_clicks: 0,

            online: 0,

            chooseWords: [],
            voteWords: [],
            drawerId: 0,
            lobbyId: 0,

            isOnlineDrawing: true,

            bannersCount: 9,
            banners: [],
            defaultBannerData: {
                title: 'Заголовок',
                domain: 'vk.com',
                trackingLink: 'https://vk.com',
                ctaText: 'Перейти',
                advertisingLabel: 'Реклама',
                iconLink: 'https://sun9-7.userapi.com/c846420/v846420985/1526c3/ISX7VF8NjZk.jpg',
                description: 'Описание рекламы',
                ageRestrictions: "14+",
                statistics: [
                    {url: '', type: 'playbackStarted'},
                    {url: '', type: 'click'}
                ]
            },
            connected: false,
            trying_reconnect: false,
            dataUpdated: false,

            author_works: [],
            gamesSaves: [],

            subGameInfo: {},

            watchedShopItems: [],
            boughtShopItems: [],

            user: {},
            friend_lobby: {},
            game_timeout: 90,

            suggestions_type: '',
            suggestions_list: [],

            game_canceled_reason: '',

            showStaticFeed: 0,

            game_logs: [],

            api_manager: 0,

            warning_saves: 0,

            connectStep: 'Подключаемся к серверу...'
        };

        setTimeout(async () => {
            await this.setState({
                tooltip_resume_draw: await isEmptyKeyWithSet('resume_draw')
            })
        });

        this.componentDidMount = this.componentDidMount.bind(this);
        this.updateData = this.updateData.bind(this);
        this.setAlert = this.setAlert.bind(this);
        this.actionAfterGame = this.actionAfterGame.bind(this);
        this.showCustomAdvert = this.showCustomAdvert.bind(this);
        this.getFriendsIds = this.getFriendsIds.bind(this);
        this.back = () => {
            const {history, popout, activeModal} = this.state;
            const currentPanel = history[history.length - 1];

            if (popout !== null && popout !== undefined) {
                if (popout.type.name !== 'ScreenSpinner') {
                    this.setPopout(null);
                }
                return;
            }

            if (activeModal !== null) {
                this.setState({activeModal: null});
                window.history.pushState({pop: 'popout'}, 'Title');
                return;
            }

            if (currentPanel === 'game') {
                const {lobbyId, isOnlineDrawing} = this.state;
                if (isOnlineDrawing) {
                    this.socket.call('games.leaveGame', {lobbyId});
                    this.setActivePanel('main');
                    return;
                }
                this.showNewAd();
            } else if (currentPanel === 'result') {
                this.showNewAd();
                this.setActivePanel('main');
                this.actionAfterGame();
                return;
            }

            if (currentPanel === 'author' && history[history.length - 2] === 'picture_info' && history[history.length - 3] === 'guessed_pictures') {
                this.setState({
                    like_currentPictureSelected: this.state.like_currentPictureSelected_,
                    like_method: 'games.getByWinnerId',
                    like_param: 'gamesAsWinner',
                    like_user_id: this.state.vk_user.id
                });
            }

            if (history.length <= 1 && history[0] !== 'main' && history[0] !== 'placeholder') {
                this.setActivePanel('main');
                return;
            }

            if (history.length > 1) {
                if (currentPanel === 'search_game') {
                    socket.call('games.search', {manager: this.state.api_manager});
                    this.setSnackbar('Поиск игры отменён');
                } else if (currentPanel === 'friend_lobby') {
                    socket.call('friends.leaveLobby', {owner_id: this.state.friend_lobby.owner_id});
                } else if (currentPanel === 'gallery' || currentPanel === 'guessed_pictures') {
                    this.setState({scrollPosition: null});
                } else if (currentPanel === 'feed') {
                    this.setState({scrollPositionFeed: null});
                } else if (currentPanel === 'bookmarks') {
                    this.setState({scrollPositionBookmarks: null});
                } else if (currentPanel === 'search') {
                    this.setState({scrollPositionSearch: null});
                } else if (currentPanel === 'author') {
                    this.setState({scrollPositionAuthor: null});
                }

                history.pop();
                this.setState({activePanel: history[history.length - 1], history});
                if (history[history.length - 1] !== 'search_game')
                    this.setState({snackbar: null});
            } else {
                bridge.send('VKWebAppClose', {status: 'success'});
            }
        };
        this.go = (panel) => {
            const {history, activeModal} = this.state;
            if (activeModal !== null) {
                this.setState({activeModal: null, modalHistory: []});
            }
            if (history[history.length - 1] !== panel) {
                history.push(panel);
                window.history.pushState({activePanel: panel}, 'Title');
                if (panel === 'game') {
                    bridge.send('VKWebAppHideBannerAd');
                }
                this.setState({activePanel: panel, history, snackbar: null});
            }
        };
        this.setActivePanel = (panel, history = []) => {
            this.setState({activePanel: panel, history: [...history, panel], snackbar: null});
        };
        this.setActiveModal = (activeModal = null) => {
            let {modalHistory} = this.state;

            if (activeModal === null) {
                modalHistory = [];
            } else if (modalHistory.indexOf(activeModal) !== -1) {
                modalHistory = modalHistory.splice(
                    0,
                    modalHistory.indexOf(activeModal) + 1
                );
            } else {
                modalHistory.push(activeModal);
            }

            this.setState({
                activeModal,
                modalHistory,
            });
            window.history.pushState({activeModal}, 'Modal');
        };
        this.setPopout = (popout) => {
            this.setState({popout});
        };
        this.setSnackbar = async (text, {
            buttonText, buttonAction
        } = {}) => {
            if (this.state.snackbar) {
                await this.setState({snackbar: null});
                await sleep(100);
            }
            this.setState({
                snackbar: <Snackbar
                    onClose={() => this.setState({snackbar: null})}
                    action={buttonText}
                    onActionClick={buttonAction}
                >
                    {text}
                </Snackbar>
            });
        };
        this.socket = socket;
        this.newAdSupports = bridge.supports('VKWebAppShowBannerAd');
        console.log({newAdSupports: this.newAdSupports});
        this.showNewAd = () => {
            try {
                bridge.send('VKWebAppShowBannerAd', {
                    banner_location: 'bottom',
                    layout_type: 'resize'
                });
            } catch (e) {
            }
        };

        this.log = async (key, event, data) => {
            if (event) {
                await this.setState({[key]: [...this.state[key] || [], {e: event, d: data}]});
            } else {
                await this.setState({[key]: []});
            }
        };

        eruda.init();
    }

    async componentDidMount() {
        const isDesktop = isPlatformDesktop();
        const urlParams = getUrlParams();
        this.vkChatIntegration = urlParams.vk_ref === 'im_attach_picker' && window.location.hash === '';
        this.isFromCatalogChat = urlParams.vk_ref === 'catalog_messenger_apps_with_action';
        this.isFromChatWidget = urlParams.vk_ref === 'im_app_action';
        console.log({
            urlParams,
            vkChatIntegration: this.vkChatIntegration,
            isFromCatalogChat: this.isFromCatalogChat,
            isFromChatWidget: this.isFromChatWidget
        });
        bridge.send('VKWebAppInit');


        setTimeout(async () => {
            if (this.newAdSupports) {
                this.showNewAd();
            } else {
                clearInterval(bannersInterval);
                if (bridge.supports('VKWebAppGetAds')) {
                    bannersInterval =
                        setInterval(async () => {
                            const {banners, bannersCount} = this.state;
                            const data = await bridge.send('VKWebAppGetAds', {});
                            for (let i = 0; i < bannersCount; i++) {
                                if (banners[i] !== false)
                                    banners[i] = data;
                            }
                            this.setState({banners});
                        }, 3000);
                }
            }
        }, 5000);

        this.setState({bridge_inited: true});
        loadCssFontsODR([
                // CSS files

                /*
                * export code:
                [...new Set(data2.split('\n').filter(value => value.includes('font-family')).map(value => {
                    const str = 'font-family: ';
                    return value.substring(value.indexOf(str) + str.length).replace(';', '').replaceAll('"', '').replaceAll("'", '')
                }))]
                * */

                'Manrope',
                'Manrope Medium',
                'Manrope Semibold',
                'Manrope Bold',
                'Manrope ExtraBold',

                'SF Pro Text',
                'SF Pro Text Medium',
                'SF Pro Text Semibold',
                'SF Pro Text Bold',

                'SF Pro Rounded',
                'SF Pro Rounded Medium',
                'SF Pro Rounded Semibold',
                'SF Pro Rounded Bold',

                'SF Pro Display Medium',
                'SF Pro Display Semibold',
                'SF Pro Display',

                'Inter Bold',

                // VK STORY
                'TT Commons Demibold',
                'Inter Black',
            ]
        );
        //loadFonts();
        //loadFonts(['Inter Black']);

        window.addEventListener('popstate', e => {
            e.preventDefault();
            this.back();
        });

        bridge.subscribe(async ({detail: {type, data}}) => {
            if (type !== undefined) {
                if (type === 'vk-connect' && !data) {
                    /*if (!this.state.isNotApp) {
                        await this.setState({isNotApp: true});
                        document.body.style.width = '660px';
                        document.body.style.height = '600px';
                        document.body.style.position = 'absolute';
                        document.body.style.top = '50%';
                        document.body.style.left = '50%';
                        document.body.style.transform = 'translate(-50%, -50%)';
                        console.log('Log in as not app version');
                        this.componentDidMount();
                    }*/
                } else {
                    console.log(type, data);
                }
            }
            if (type === 'VKWebAppUpdateConfig') {
                if (!firstInsetBottom) {
                    document.body.setAttribute('keyboard_on', '0');
                }

                if (data.insets && data.insets.bottom && !isDesktop) {
                    const nInsetBottom = data.insets.bottom;
                    if (!firstInsetBottom) {
                        firstInsetBottom = nInsetBottom;
                    }
                    if (firstInsetBottom && nInsetBottom > firstInsetBottom) {
                        // keyboard open
                        const keyboardHeight = nInsetBottom - firstInsetBottom;
                        console.log('Keyboard open, height = ' + keyboardHeight);
                        document.body.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
                        document.body.setAttribute('keyboard_on', '1');
                    } else if (firstInsetBottom && nInsetBottom <= firstInsetBottom) {
                        // keyboard close
                        console.log('Keyboard close');
                        document.body.setAttribute('keyboard_on', '0');
                    }
                }

                const schemeAttribute = document.createAttribute('scheme');
                schemeAttribute.value = data.scheme ? data.scheme === 'client_light' ? 'bright_light' : data.scheme : 'bright_light';
                document.body.attributes.setNamedItem(schemeAttribute);
                this.setState({
                    appearance: data.scheme ?
                        ((data.scheme.indexOf('light') > -1) ? 'light' : 'dark')
                        : 'dark'
                });

                const
                    windowHeight = data.viewport_height || document.documentElement.clientHeight,
                    windowWidth = data.viewport_width || document.documentElement.clientWidth,
                    scale = 100 / 812 * (windowHeight > 0 ? windowHeight : 812) / 100
                ;
                document.body.style.setProperty('--scale-value', scale);
                document.body.setAttribute('_width', windowWidth);
                document.body.setAttribute('_height', windowHeight);
                this.clientHeight = windowHeight;
                this.clientWidth = windowWidth;
                console.log(`windowHeight = ${windowHeight}`);
            } else if (type === 'VKWebAppViewRestore') {
                this.setState({popout: null});
                if (this.state.activePanel === 'global_canvas') {
                    setTimeout(() => document.body.setAttribute('scheme', 'bright_light'), 500);
                }
            } else if (type === 'VKWebAppChangeFragment') {
                window.location.hash = `#${data.location}`;
            } else if (type === 'VKWebAppAllowNotificationsResult') {
                socket.call('users.enableNotifications', {allow: true});
                this.setState({notifications_allowed: true});
            } else if (type === 'VKWebAppDenyNotificationsResult') {
                socket.call('users.enableNotifications', {allow: false});
                this.setState({notifications_allowed: false});
            }
        });

        const
            {isNotApp} = this.state,
            isShowOnboard = !isNotApp && (await getStorageValue('onboard_welcome')) === '',
            isShowVkGroup = !isNotApp && (await getStorageValue('vk_group3')) === '',
            isShowVkChat = !isNotApp && (await getStorageValue('vk_chat')) === '',
            isShowUpdate = !isNotApp && (await getStorageValue('update_01062023')) === '',
            isShowGlobalCanvas = !isNotApp && (await getStorageValue('canvas_new_mode')) === '',
            isShowGlobalCanvasOnboard = !isNotApp && (await getStorageValue('canvas_new_mode_onboard_2')) === '',
            vk_user = !isNotApp && await bridge.send('VKWebAppGetUserInfo')
        ;
        let vk_user_;
        try {
            vk_user_ = await getVKUsers([urlParams.vk_user_id])
        } catch (e) {

        }

        await this.setState({
            isShowOnboard,
            isShowVkGroup,
            isShowVkChat,
            isShowGlobalCanvasOnboard,
            isShowGlobalCanvas,
            vk_user: vk_user.id == urlParams.vk_user_id ? vk_user : (vk_user_[0] || vk_user)
        });

        if (bridge.supports('VKWebAppEnableSwipeBack')) {
            bridge.send('VKWebAppEnableSwipeBack');
        }

        this.connect();

        socket.subscribe('exit', async r => {
            await this.setState({
                placeholderText: r.title,
                banned: r.banned,
                ban_reason: r.ban_reason,
                dataUpdated: true
            });
            this.setPopout(null);
            if (r.banned) {
                this.setState({placeholderNeed: 2});
                this.setActivePanel('banned');
            } else {
                this.setState({placeholderNeed: 1});
                this.setActivePanel('placeholder');
            }
            if (!this.state.bridge_inited) {
                bridge.send('VKWebAppInit');
                this.setState({bridge_inited: true});
            }
        });
        socket.subscribe('app_version', r => {
            this.setState({app_version: r.app_version});
        });
        socket.subscribe('restart', r => {
            this.setAlert(
                'Внимание',
                'По окончании всех игр будет выполнен рестарт сервера.',
                [{
                    title: 'Ок',
                    autoclose: true
                }]
            );
        });
        /*socket.subscribe('gameError', r => {
            this.setAlert(
                'Упс',
                'Не удалось создать игру. Кажется скоро будет рестарт. Ждите :(',
                [{
                    title: 'Ок',
                    autoclose: true
                }]
            );
            this.setActivePanel('main');
        });*/
        socket.onConnectionError((e) => {
            console.log('Connection error');
            this.setState({connected: false});
            if (!this.state.trying_reconnect) {
                this.setState({placeholderText: 'Не удалось подключиться к серверу', placeholderNeed: 1});
                this.setPopout(null);
                this.setActivePanel('placeholder');
            }
            if (!this.state.bridge_inited) {
                bridge.send('VKWebAppInit');
                this.setState({bridge_inited: true});
            }
        });
        socket.onDisconnect((reason) => {
            console.log('Disconnected. Reason: ', reason);
            this.setState({connected: false});
            this.setPopout(null);
            if (this.state.placeholderNeed === 0) {
                this.setState({placeholderText: ''});
                this.setActivePanel('placeholder');
            }
            if (!this.state.bridge_inited) {
                bridge.send('VKWebAppInit');
                this.setState({bridge_inited: true});
            }
        });

        await new Promise(resolve =>
            socket.onConnect(async () => {
                eruda.scale(0);
                await this.setState({connected: true, placeholderNeed: 0});
                console.log('Connected');
                //this.setState({test_game: true});
                this.setActivePanel('main');
                console.log('Update user data...');
                await new Promise(async res => {
                    this.updateData();
                    let tick = 0;
                    for (let i = 0; i < 1; i++) {
                        if (!this.state.dataUpdated || tick >= 30) {
                            i--;
                        }

                        tick++;
                        await sleep(100);
                    }
                    res(true);
                });
                console.log('Data updated');

                console.log({isShowVkGroup, isShowVkChat, isShowUpdate, isShowOnboard});
                if (!isShowOnboard) {
                    if (isShowVkGroup) {
                        setTimeout(() => {
                            this.go('group_vk');
                        }, 1000);
                    } else if (isShowVkChat) {
                        setTimeout(() => {
                            this.go('chat_vk');
                            bridge.send('VKWebAppStorageSet', {key: 'vk_chat', value: '1'});
                            this.setState({isShowVkChat: false});
                        }, 1000);
                    } else if (isShowUpdate) {
                        setTimeout(() => {
                            this.setActiveModal(MODAL_CARD_NEW_UPDATE);
                            bridge.send('VKWebAppStorageSet', {key: 'update_01062023', value: '1'});
                        }, 1000);
                    } else {
                        console.log('Trying to check hash...');
                        this.onChangeHash();
                    }
                } else {
                    bridge.send('VKWebAppStorageSet', {key: 'onboard_welcome', value: '1'});
                    this.setState({isShowOnboard: false});
                    this.showOnboard('welcome');
                    console.log('Trying to check hash...');
                    this.onChangeHash();
                }

                resolve(true);
            })
        );

        adAppApi('stats.join');

        let bookmarks_count = await getStorageValue('bookmarks');
        let bookmarks = [];
        if (bookmarks_count === '') {
            await setStorageValue('bookmarks', '0');
            bookmarks_count = 0;
        } else {
            bookmarks_count = parseInt(bookmarks_count);
            for (let i = 1; i < bookmarks_count + 1; i++) {
                const nbookmarks = JSON.parse(await getStorageValue(`bookmarks_${i}`));
                bookmarks = bookmarks.concat(nbookmarks);
            }
        }
        this.setState({bookmarks_count, bookmarks});
        console.log({
            bookmarks_count,
            bookmarks,
            test0: await getStorageValue('bookmarks_0'),
            test1: await getStorageValue('bookmarks_1'),
            keys: await getStorageKeys()
        });
    }

    /*
    * @param {string} action a (add); r (remove); f (find)
    * @param {int} type 0 (user); 1 (picture)
    * */
    bookmarkAction(action, type, object) {
        console.log('bookmarkAction', {action, type, object});
        if (action === 'a') {
            const currentListIndex = Math.max(1, Math.ceil(this.state.bookmarks_count / 100));
            const currentList = this.state.bookmarks.slice((currentListIndex - 1) * 100, (currentListIndex - 1) * 100 + 100) || [];
            currentList.push(`${type}_${object}`);
            let bookmarks = this.state.bookmarks.concat(currentList[currentList.length - 1]);
            let {bookmarks_count} = this.state;
            if (currentListIndex > bookmarks_count || bookmarks_count === 0) {
                bookmarks_count++;
                setStorageValue('bookmarks', bookmarks_count + '');
            }
            setStorageValue(`bookmarks_${currentListIndex}`, JSON.stringify(currentList));
            this.setState({bookmarks, bookmarks_count});
            console.log('add bookmark', {currentListIndex, currentList});
            socket.call('marathon.addBookmark', {type, object});
        } else if (action === 'r') {
            let {bookmarks, bookmarks_count} = this.state;
            const currentBookmarkIndex = this.state.bookmarks.findIndex(value => value === `${type}_${object}`);
            bookmarks.splice(currentBookmarkIndex, 1);
            const indexFromChangeData = Math.ceil(currentBookmarkIndex / 100);
            const nbookmarks_count = Math.ceil(bookmarks.length / 100);
            if (bookmarks_count !== nbookmarks_count) {
                bookmarks_count = nbookmarks_count;
                setStorageValue('bookmarks', bookmarks_count + '');
                setStorageValue(`bookmarks_${bookmarks_count}`, '');
            }
            console.log('remove bookmark', {currentBookmarkIndex});
            for (let i = indexFromChangeData; i < bookmarks_count; i++) {
                setStorageValue(`bookmarks_${i + 1}`, JSON.stringify(bookmarks.slice(i * 100, i * 100 + 100)));
                console.log('save bookmarks ' + (i + 1), {bookmarks: bookmarks.slice(i * 100, i * 100 + 100)});
            }
            this.setState({bookmarks, bookmarks_count});
        } else if (action === 'f') {
            return this.state.bookmarks.find(value => value === `${type}_${object}`);
        }
    }

    setAlert(title, description, buttons, actionsLayout = 'vertical') {
        this.setPopout(
            <Alert
                actions={buttons}
                actionsLayout={actionsLayout}
                onClose={() => this.setPopout(null)}
                header={title}
                text={description}
            />
        );
        window.history.pushState({pop: 'alert'}, 'Alert');
    }

    connect() {
        console.log('Try to connect...');
        this.setState({connectStep: 'Подключаемся к серверу...'});
        socket.connect('https://draw.avocado.special.vk-apps.com', getUrlParams());
        setTimeout(() => {
            if (this.state.banned) return;

            if (!this.state.dataUpdated) {
                this.updateData();
            }
            if (!this.state.connected && !this.state.placeholderText) {
                clearInterval(connectInterval);
                connectInterval = setInterval(() => {
                    if (!this.state.connected) {
                        console.log('connecting...');
                        this.setState({connectStep: 'Подключаемся к серверу...'});
                        socket.connect('https://draw.avocado.special.vk-apps.com', getUrlParams());
                    } else {
                        clearInterval(connectInterval);
                    }
                }, 1000);
            }
        }, 1000);
    }

    async updateData() {
        this.setState({connectStep: 'Загружаем данные...'});
        await new Promise(resolve => {
            socket.call('users.getTopNumber', {}, r => {
                this.setState({top_number: r.response});
            });
            socket.call('users.getTop', {}, async r => {
                const user_ids = r.response.map(value => value.id);
                await getVKUsers(user_ids);

                this.setState({top: r.response.map(value => ({...vk_local_users[value.id], ...value}))});
            });
            socket.call('minigames.getCurrentGame', {}, async r => {
                this.setState({connectStep: 'Нашли вас в базе данных...'});

                const activeMiniGame = r.response;
                if (activeMiniGame === 2) {
                    socket.call('users.getTop', {type: 'week_pictures'}, async r => {
                        const user_ids = r.response.map(value => value.id);
                        await getVKUsers(user_ids);

                        this.setState({week_gift_top: r.response.map(value => ({...vk_local_users[value.id], ...value}))});
                    });
                }
                this.setState({activeMiniGame});

                socket.call('users.get', {}, r => {
                    this.setState({connectStep: 'Обновляем профиль...'});
                    //r.response = {...r.response, admin: false}
                    const user = r.response;
                    this.setState({user});
                    this.privilege = user.vk_donut || user.premium || user.admin;

                    socket.call('games.getByDrawerId', {id: this.state.vk_user.id, limit: 50}, r => {
                        this.setState({connectStep: 'Грузим рисунки...'});
                        this.setState({gamesAsDrawer: r.response});
                        let user_ids = r.response.map(value => value.drawerId);

                        socket.call('games.getByWinnerId', {id: this.state.vk_user.id, limit: 50}, r => {
                            this.setState({connectStep: 'Почти готово...'});
                            user_ids = [...user_ids, ...r.response.map(value => value.drawerId)];

                            getVKUsers(user_ids);
                            setTimeout(async () => {
                                this.setState({connectStep: 'Ещё чуть-чуть...'});
                                await this.setState({gamesAsWinner: r.response, dataUpdated: true});
                                resolve(true);
                            }, 400);
                        });
                    });
                });
            });
        });

        this.setState({time: Date.now()});
        return true;
    }

    onChangeHash() {
        console.log(`Watch hash: ${window.location.hash}`);
        if (this.vkChatIntegration) {
            console.log('create chat lobby');
            this.setPopout(<ScreenSpinner/>);
            socket.call('friends.createLobby', {}, r => {
                if (r.response) {
                    this.setState({friend_lobby: r.response});
                    this.go('friend_lobby');
                    this.setPopout(null);
                } else {
                    this.setAlert(
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
            return;
        }

        if (window.location.hash.startsWith('#')) {
            const
                hash = window.location.hash.substring(1),
                keys = [
                    {
                        key: 'author',
                        do: async value => {
                            this.setPopout(<ScreenSpinner/>);
                            const userData = await getVKUsers([value]);
                            if (userData[0]) {
                                this.socket.call('users.getById', {id: value}, async r1 => {
                                    this.socket.call('games.getByDrawerId', {id: value}, async r2 => {
                                        await this.setState({
                                            author: {id: value, ...r1.response || {}},
                                            author_works: r2.response
                                        });
                                        setTimeout(() => {
                                            this.go('author');
                                            this.setPopout(null);
                                        }, 400);
                                    });
                                });
                            } else {
                                this.setPopout(null);
                            }
                        }
                    },
                    {
                        key: 'picture',
                        do: async value => {
                            try {
                                const
                                    gameId = parseInt(value)
                                ;

                                this.setPopout(<ScreenSpinner/>);
                                this.socket.call('games.getById', {id: gameId}, async r => {
                                    if (r.response !== null) {
                                        const {drawerId} = r.response;
                                        const userData = await getVKUsers([drawerId]);
                                        if (userData[0]) {
                                            await this.setState({
                                                gamesAsAuthor: [r.response],
                                                like_currentPictureSelected: 0,
                                                like_method: '',
                                                like_param: 'gamesAsAuthor',
                                                like_user_id: drawerId
                                            });
                                            setTimeout(() => {
                                                this.go('picture_info');
                                                this.setPopout(null);
                                            }, 400);
                                        } else {
                                            this.setPopout(null);
                                        }
                                    } else {
                                        this.setPopout(null);
                                    }
                                });
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    },
                    {
                        key: 'lobby',
                        do: value => {
                            if (value === '') {
                                this.go('friends');
                            } else {
                                this.setPopout(<ScreenSpinner/>);
                                this.socket.call('friends.joinLobby', {
                                    owner_id: parseInt(value),
                                    url: true
                                }, async r => {
                                    if (r.response) {
                                        await getVKUsers([...r.response.members, r.response.owner_id]);
                                        await this.setState({
                                            friend_lobby: r.response
                                        });
                                        setTimeout(() => {
                                            this.go('friend_lobby');
                                            this.setPopout(null);
                                        }, 400);
                                    } else {
                                        this.setPopout(null);
                                        if (!r.error) {
                                            return;
                                        }
                                        const {code, message} = r.error;
                                        if (code === 6) {
                                            this.setAlert(
                                                'Упс',
                                                message,
                                                [
                                                    {
                                                        title: 'Создать лобби',
                                                        action: () => {
                                                            this.setPopout(<ScreenSpinner/>);
                                                            socket.call('friends.createLobby', {}, r => {
                                                                if (r.response) {
                                                                    this.setState({friend_lobby: r.response});
                                                                    this.go('friend_lobby');
                                                                    this.setPopout(null);
                                                                } else {
                                                                    this.setAlert(
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
                                                        }
                                                    }, {
                                                    title: 'На главную',
                                                    mode: 'cancel',
                                                    autoclose: true
                                                }]
                                            );
                                        } else {
                                            this.setAlert(
                                                'Упс',
                                                message,
                                                [{
                                                    title: 'На главную',
                                                    mode: 'cancel',
                                                    autoclose: true
                                                }]
                                            );
                                        }
                                    }
                                });
                            }
                        }
                    },
                    {
                        key: 'tpnl-',
                        do: panel => {
                            this.go(panel);
                        }
                    }
                ]
            ;

            for (const key of keys) {
                console.log(`${key.key} === ${hash} ?`);
                if (hash.startsWith(key.key)) {
                    console.log('Did action with key = ' + key.key);
                    key.do(hash.substring(key.key.length));
                    break;
                }
            }
        }
    }

    _tags() {
        return [
            [
                'tag_interesting',
                <Icon20FireCircleFillRed/>,
                'Интересный автор',
                'Метка выдаётся при достижении 1.000 лайков'
            ],
            [
                'tag_rater',
                <Icon20ThumbsUpCircleFillGreen/>,
                'Оценщик',
                'Оценить 100 картин'
            ],
            [
                'tag_agitator',
                <Icon20StoryReplyCircleFillViolet/>,
                'Агитатор',
                'Рассказать о своих работах друзьям (10 раз)'
            ],
            [
                'tag_savepoint',
                <Icon20CloudCircleFill/>,
                'Точка сохранения',
                'Сохраните 10 рисунков'
            ],
            [
                'tag_rapidfire',
                <Icon20TargetCircleFill/>,
                'Скорострел',
                'Метка выдаётся за картину, нарисованную и угаданную за 5 секунд'
            ],
            [
                'tag_turtle',
                <Icon20SkullCircleFill width={20} height={20}/>,
                'Черепаха',
                'Метка выдаётся за картину, нарисованную и угаданную за 85-90 секунд'
            ],
            [
                'tag_creative',
                <Icon20AchievementCircleFillBlue/>,
                'Креативный',
                'Метка выдаётся вручную администрацией, если та посчитает твои картины креативными'
            ],
            [
                'tag_veteran',
                <Icon20FavoriteCircleFillYellow/>,
                'Ветеран',
                'У владельца этой метки больше 500 картин'
            ],
            [
                'tag_banana',
                <Icon20BananaCircleFill/>,
                'Банановый остров',
                'Нарисуйте 100 бананов'
            ],
            [
                'tag_smart',
                <Icon20BrainCircleFill/>,
                'Умник',
                'Владелец метки предложил в сумме 100 идей и слов'
            ],
            [
                'tag_psychic',
                <Icon20ViewCircleFillRed/>,
                'Экстрасенс',
                'Угадайте, какое задание выпало игроку, которое он не изобразил на холсте'
            ],
        ];
    }

    _tag_modal(tag_name) {
        const tag_info = this._tags().find(value => value[0] === tag_name);
        return (
            <ModalCard
                key={tag_name}
                id={tag_name}
                onClose={() => this.setActiveModal(null)}
                icon={React.cloneElement(tag_info[1], {width: 56, height: 56})}
                header={tag_info[2]}
                subheader={tag_info[3]}
                actions={
                    <Button
                        size='l'
                        onClick={() => this.showOnboard('tag')}
                    >
                        Подробнее
                    </Button>
                }
            ></ModalCard>
        );
    }

    isNonScrollingElement(element_id) {
        return ['global_canvas', 'search_game', 'game'].indexOf(element_id) > -1;
    }

    isPanelWithContainerCards(element_id) {
        return ['friends', 'gallery', 'guessed_pictures', 'feed', 'stats', 'shop', 'lvl_help', 'services', 'friend_list', 'suggestions', 'suggestions_word', 'suggestions_idea', 'bookmarks', 'search', 'settings', 'tags', 'reports', 'marathon'].indexOf(element_id) > -1;
    }

    async actionAfterGame(onlyNativeAd = false) {
        this.setPopout(<ScreenSpinner/>);

        const canViewNativeAd = bridge.supports('VKWebAppShowNativeAds') && (await bridge.send('VKWebAppCheckNativeAds', {ad_format: 'interstitial'})).result;

        const customAdvertData = await new Promise(resolve =>
            this.socket.call('advert.get', {t: currentAdSettings.id}, r => resolve(r.response))
        );

        const showCustomAdvert =
            onlyNativeAd === false &&
            //customAdvertData.show < 100000 &&
            currentAdSettings.condition() &&
            (canViewNativeAd ? (Math.random() < 0.5) : true); // random 50%

        if (showCustomAdvert) {
            this.go(currentAdSettings.panel);
        } else if (canViewNativeAd) {
            try {
                await bridge.send('VKWebAppShowNativeAds', {ad_format: 'interstitial'});
            } catch (e) {
            }
        }

        this.setPopout(null);
    }

    async showCustomAdvert() {
        const customAdvertData = await new Promise(resolve => this.socket.call('advert.get', {t: currentAdSettings.id}, r => resolve(r.response)));
        const showCustomAdvert = currentAdSettings.condition() && Math.random() < 0.5; // random 50%

        if (showCustomAdvert) {
            this.go(currentAdSettings.panel);
        }
        return showCustomAdvert;
    }

    async getFriendsIds() {
        if (this.state.app_friends) {
            return this.state.app_friends;
        } else {
            try {
                this.setPopout(<ScreenSpinner/>);
                const
                    access_token = (await bridge.send('VKWebAppGetAuthToken', {
                        app_id: parseInt(getUrlParams().vk_app_id),
                        scope: 'friends'
                    })).access_token,
                    friends_ = /*(await bridge.send('VKWebAppCallAPIMethod', {
                        method: 'friends.getAppUsers',
                        params: {access_token, v: '5.131'}
                    })).response*/ (await bridge.send('VKWebAppCallAPIMethod', {
                        method: 'friends.get',
                        params: {access_token, v: '5.131'}
                    })).response.items,
                    friends = await new Promise(res =>
                        this.socket.call('friends.getAppUsers', {ids: friends_}, r => res(r.response))
                    )
                ;

                await getVKUsers(friends);
                await this.setState({app_friends: friends});
                this.setPopout(null);
                return friends;
            } catch (e) {
                this.setPopout(null);
                this.setSnackbar('Без доступа мы не можем получить друзей :(');
                return false;
            }
        }
    }

    async showOnboard(type) {
        this.setPopout(<ScreenSpinner/>);
        const data = {
            welcome: [
                {
                    image: getSrcUrl(require('../../assets/drawing/onboard/welcome/1.webp')),
                    title: 'Привет!',
                    subtitle: 'Сейчас я научу тебя как пользоваться приложением.'
                },
                {
                    image: getSrcUrl(require('../../assets/drawing/onboard/welcome/2.webp')),
                    title: 'Как рисовать?',
                    subtitle: 'Выбери что будешь рисовать. Подбери нужный цвет в палитре и твори чудеса.'
                },
                {
                    image: getSrcUrl(require('../../assets/drawing/onboard/welcome/3.webp')),
                    title: 'Как разблокировать все цвета?',
                    subtitle: 'С каждой игрой вы повышаете свой уровень. С каждым уровнем цветовая шкала увеличивается на 10%.'
                },
                {
                    image: getSrcUrl(require('../../assets/drawing/onboard/welcome/4.webp')),
                    title: 'Как сохранить рисунок?',
                    subtitle: 'Рисунки хранятся не вечно, а всего 3 дня. Но ты можешь навсегда его сохранить в конце игры.'
                },
                {
                    image: getSrcUrl(require('../../assets/drawing/onboard/welcome/5.webp')),
                    title: 'На этом всё',
                    subtitle: 'Основы я тебе рассказала, теперь можно и играть.'
                },
            ],
            tag: [
                {
                    image: getSrcUrl(require('../../assets/drawing/onboard/tags/1.webp')),
                    title: 'Зачем нужны метки?',
                    subtitle: 'Метки это достижения, они отображаются у тебя в профиле.'
                },
                {
                    image: getSrcUrl(require('../../assets/drawing/onboard/tags/2.webp')),
                    title: 'А где еще их видно?',
                    subtitle: 'Их можно также увидеть в профиле другого художника.'
                },
                {
                    image: getSrcUrl(require('../../assets/drawing/onboard/tags/3.webp')),
                    title: 'Как настроить?',
                    subtitle: 'Перейдите в настройки на главном экране – там можете посмотреть все метки, и настроить их отображение.'
                },
            ],
            choice_5words: [
                {
                    image: getSrcUrl(require('../../assets/drawing/onboard/shop/choice_5words.webp')),
                    title: 'Выбор из пяти слов',
                    subtitle: 'В следующей игре у тебя появится выбор из пяти слов.'
                },
            ],
            picture_actions: [
                {
                    image: getSrcUrl(require('../../assets/drawing/onboard/shop/picture_actions.webp')),
                    title: 'Как этим пользоваться?',
                    subtitle: 'Воспользоваться этой функцией можно с помощью кнопки «Действия» во время просмотра рисунка.'
                },
            ],
            picture_gif: [
                {
                    image: getSrcUrl(require('../../assets/drawing/onboard/shop/picture_gif.webp')),
                    title: 'Как посмотреть анимацию?',
                    subtitle: 'Нажмите на рисунок в галерее или в ленте, у вас появится анимация, как создавался рисунок.'
                },
            ],
            reports: [
                {
                    image: getSrcUrl(require('../../assets/drawing/onboard/reports/1.webp')),
                    title: 'Кому доступны репорты?',
                    subtitle: 'Репорты могут рассматривать игроки, которые достигли 10 уровня.'
                },
                {
                    image: getSrcUrl(require('../../assets/drawing/onboard/reports/2.webp')),
                    title: 'Это вознаграждается?',
                    subtitle: 'Да, за каждую рассмотренную жалобу ты получишь 5 монет. За каждый заблокированный рисунок ещё 5 монет.'
                },
                {
                    image: getSrcUrl(require('../../assets/drawing/onboard/reports/3.webp')),
                    title: 'Очень важно',
                    subtitle: 'Некоторые рисунки нарушают правила ВКонтакте. Именно для пресечения нарушений и были созданы Репорты.'
                }
            ]
        }[type];

        const slides = await Promise.all(
            data.map(async ({image, title, subtitle}) => (
                {
                    media: {blob: await toBlob(image || ''), type: 'image'},
                    title, subtitle
                }
            ))
        );
        await bridge.send('VKWebAppShowSlidesSheet', {slides});
        this.setPopout(null);
    }

    render() {
        const
            {
                test_game,

                activePanel, activeModal,
                popout, snackbar,

                isShowOnboard,
                vk_user, user, banned, ban_reason,

                placeholderText, gameErrorText,

                gamesAsWinner, gamesAsDrawer,

                drawerId, winnerId, lobbyId, gameId, word, chooseWords, voteWords,
                like_currentPictureSelected, like_method, like_param, like_user_id,

                isOnlineDrawing,

                friend_lobby,

                watchedShopItems, boughtShopItems,

                suggestions_type, suggestions_list,

                game_canceled_reason,

                color, color_percent, gradients, btnSelectColorPaletteDefault, color_gradient, pickedColor,

                connectStep
            } = this.state,
            btnSelectColorPalette = color_gradient !== undefined ? btnSelectColorPaletteDefault : (color || btnSelectColorPaletteDefault),

            showConnecting = !(vk_user && user && gamesAsWinner && gamesAsDrawer),

            paletteBlocked = (color_gradient !== undefined && this.privilege === false) || (color_gradient === undefined && (activePanel === 'game' ? color_percent > user.lvl * 10 : false)),

            modal = (
                <ModalRoot activeModal={activeModal}>
                    {
                        this._tags().map(value => this._tag_modal(value[0]))
                    }
                    <ModalCard
                        id={MODAL_CARD_NEW_UPDATE}
                        onClose={() => {
                            this.setActiveModal(null);
                            this.onChangeHash();
                        }}
                        icon={<Icon56CakeCircleFillPurple/>}
                        header='Ура! Обновление!'
                        subheader='Мы добавили новый режим игры и ещё кое-что крутое. Подробности ниже, не забудь лайк поставить, мы старались <3'
                        actions={
                            <Button
                                size='l'
                                mode='gradient_violet'
                                onClick={() => {
                                    this.setActiveModal(null);
                                    this.onChangeHash();
                                    openUrl('https://vk.com/wall-208964042_5784');
                                }}
                            >
                                Что нового?
                            </Button>
                        }
                    ></ModalCard>
                    <ModalCard
                        id={MODAL_CARD_GLOBAL_CANVAS_ONBOARD}
                        onClose={() => this.setActiveModal(null)}
                        icon={<Icon56PaletteOutline/>}
                        header='Новый режим'
                        subheader='Давай сначала научимся использовать все инструменты, которые пригодятся в этом режиме.'
                        actions={
                            <Button
                                size='l'
                                mode='gradient_blue'
                                onClick={() => {
                                    bridge.send('VKWebAppStorageSet', {key: 'canvas_new_mode_onboard_2', value: '1'});
                                    this.setState({isShowGlobalCanvasOnboard: false});
                                    this.setActiveModal(null);
                                    this.go('global_canvas_info');
                                }}
                            >
                                Посмотреть обучение
                            </Button>
                        }
                    ></ModalCard>
                    <ModalCard
                        id={MODAL_CARD_CHANGE_URL_PARAMETERS}
                        onClose={() => this.setActiveModal(null)}
                        header='Настройки'
                        actions={[
                            <Button
                                size='l'
                                mode='gradient_blue'
                                onClick={() => {
                                    if (this._urlParams) {
                                        window.location.search = this._urlParams;
                                        this.connect();
                                    }
                                }}
                            >
                                Сохранить
                            </Button>
                        ]}
                    >
                        <FormLayout>
                            <FormItem>
                                <Input
                                    defaultValue={window.location.search}
                                    onChange={value => this._urlParams = value.target.value}/>
                            </FormItem>
                        </FormLayout>
                    </ModalCard>
                    <ModalCard
                        id={MODAL_CARD_OUTDATED_VERSION}
                        onClose={() => this.setActiveModal(null)}
                        icon={<Icon56ErrorTriangleOutline fill='#E63902'/>}
                        header='Предупреждение'
                        subheader={`Вы используете устаревшую версию мини-приложения. Если нажатие кнопки внизу не поможет, очистите кэш через три точки справа вверху.`}
                        actions={
                            <Button
                                size='l'
                                mode='primary'
                                stretched
                                onClick={() => window.location.reload()}
                            >
                                Обновить
                            </Button>
                        }
                    />
                    <ModalPage
                        id={MODAL_PAGE_PALETTE}
                        onClose={() => this.setActiveModal(null)}
                        settlingHeight={100}
                        header={
                            <ModalPageHeader
                                left={<IconButton onClick={async () => {
                                    await this.setState({
                                        pickedColor: 'pipette'
                                    });
                                    this.setActiveModal(null);
                                }}>
                                    <Icon28ScanViewfinderOutline/>
                                </IconButton>}
                                right={!isPlatformDesktop() &&
                                    <PanelHeaderButton onClick={() => this.setActiveModal(null)}>
                                        <Icon24Dismiss/>
                                    </PanelHeaderButton>
                                }
                            >
                                Палитра
                            </ModalPageHeader>
                        }
                    >
                        <div className='PaletteContainer'>
                            <HexColorPicker color={color} onChange={c => {
                                const color_percent = parseInt(document.getElementsByClassName('react-colorful__hue-pointer')[0].style.left.replace('%', ''));
                                this.setState({color: c, color_gradient: undefined, color_percent});
                            }}/>
                            <div className='GradientContainer'>
                                <h2>Градиент</h2>
                                <div>
                                    {
                                        gradients.map((value, index) => {
                                            const gradient = `conic-gradient(from 180deg at 50% 50%, ${[...value.slice(0, value.length - 2), value[0]].join(', ')})`;
                                            return <div key={`gradient-${index}`} style={{
                                                background: gradient
                                            }} onClick={() => {
                                                this.setState({color_gradient: index});
                                            }}>
                                                <div>
                                                    <div
                                                        style={{
                                                            display: color_gradient !== index && 'none',
                                                            background: gradient
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        })
                                    }
                                </div>
                            </div>
                        </div>
                        {
                            paletteBlocked &&
                            <div className='PaletteBlock'>
                                {color_gradient !== undefined ? 'Градиент' : 'Цвет'} не разблокирован
                            </div>
                        }
                        <div className='ButtonsContainer'>
                            <Button
                                size='l'
                                stretched
                                style={{
                                    background: btnSelectColorPalette,
                                    color: isDarkColor(btnSelectColorPalette) ? '#FFFFFF' : '#000000'
                                }}
                                disabled={paletteBlocked}
                                onClick={async () => {
                                    if (!paletteBlocked) {
                                        await this.setState({
                                            pickedColor: color_gradient !== undefined ? gradients[color_gradient] : color
                                        });
                                    }
                                    this.setActiveModal(null);
                                }}
                            >
                                Сохранить
                            </Button>
                            <Button
                                size='l'
                                stretched
                                style={{
                                    background: `rgba(${hexToRgb(btnSelectColorPalette).rgb}, .05)`,
                                    color: 'var(--color_primary)'
                                }}
                                onClick={async () => {
                                    const nstate = {}
                                    if (typeof pickedColor === 'object') {
                                        nstate.color_gradient = gradients.findIndex(value => JSON.stringify(value) === JSON.stringify(pickedColor));
                                    } else {
                                        nstate.color_gradient = -1;
                                        nstate.color = pickedColor;
                                    }
                                    this.setState(nstate);
                                    this.setActiveModal(null);
                                }}
                            >
                                Отмена
                            </Button>
                        </div>
                    </ModalPage>
                </ModalRoot>
            )
        ;

        return (
            <React.Fragment>
                <SplitLayout
                    popout={popout}
                    modal={modal}
                >
                    <SplitCol animate={!isPlatformDesktop()}>
                        <View
                            style={{
                                overflow: this.isNonScrollingElement(activePanel) && 'hidden',
                                ...(this.isPanelWithContainerCards(activePanel) ? {
                                    '--background_content': 'var(--panel_container_background)',
                                    '--header_background': 'var(--panel_container_card_background)'
                                } : {})
                            }}
                            activePanel={test_game ? 'game' : (activePanel !== 'placeholder' && activePanel !== 'banned') ? (showConnecting ? 'connecting' : activePanel) : activePanel}
                            onSwipeBack={this.back}
                            history={this.state.history}
                        >
                            {
                                [
                                    {
                                        id: 'onboard',
                                        component: <Placeholder
                                            icon={<IconOnboard/>}
                                            title='Добро пожаловать'
                                            description='Здесь Вы можете почувствовать себя в роли как художника, так и Шерлока. Рисуйте картины и угадывайте чужие.'
                                            buttonIcon={false && <Icon28ChevronRightOutline width={16} height={16}/>}
                                            buttonText='Продолжить'
                                            buttonMode='primary_2'
                                            buttonOnClick={() => {
                                                bridge.send('VKWebAppStorageSet', {key: 'onboard', value: '1'});
                                                this.setState({isShowOnboard: false});
                                                this.onChangeHash();
                                            }}
                                        />
                                    },
                                    {
                                        id: 'connecting',
                                        component: <Placeholder
                                            icon={<IconOnboard/>}
                                            title='Подключение'
                                            description={connectStep}
                                        />
                                    },
                                    {
                                        id: 'placeholder',
                                        component: <Placeholder
                                            icon={<IconError/>}
                                            title='Соединение потеряно'
                                            description={placeholderText}
                                            buttonText='Переподключиться'
                                            buttonMode='primary_2'
                                            buttonOnClick={async () => {
                                                this.setActivePanel('connecting');
                                                this.setState({trying_reconnect: true});
                                                for (let i = 0; i < 5; i++) {
                                                    this.connect();

                                                    await sleep(1000);
                                                    if (this.state.connected)
                                                        break;
                                                }
                                                await this.setState({trying_reconnect: false});
                                                this.connect();
                                            }}
                                        />
                                    },
                                    {
                                        id: 'main',
                                        component: <React.Fragment>
                                            <Main t={this} time={this.state.time}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'avatar_frames',
                                        component: <React.Fragment>
                                            <UserAvatarFrame t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'lvl_help',
                                        component: <React.Fragment>
                                            <UserLvlHelp t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'week_gifts',
                                        component: <React.Fragment>
                                            <WeekGifts t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'marathon',
                                        component: <React.Fragment>
                                            <Marathon t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'art_battle_placeholder',
                                        component: <React.Fragment>
                                            <ArtBattlePlaceholder t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'art_battle_rate',
                                        component: <React.Fragment>
                                            <ArtBattleRate t={this} lobbyId={lobbyId}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'services',
                                        component: <React.Fragment>
                                            <Services t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'friend_list',
                                        component: <React.Fragment>
                                            <FriendList t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'feed',
                                        component: <React.Fragment>
                                            <Feed t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'bookmarks',
                                        component: <React.Fragment>
                                            <Bookmarks t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'suggestions',
                                        component: <React.Fragment>
                                            <Suggestions t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'reports',
                                        component: <React.Fragment>
                                            <Reports t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'report_view',
                                        component: <React.Fragment>
                                            <ReportView t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'suggestions_idea',
                                        component: <React.Fragment>
                                            <SuggestionsIdea t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'suggestions_word',
                                        component: <React.Fragment>
                                            <SuggestionsWord t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'suggestions_list',
                                        component: <React.Fragment>
                                            <SuggestionsList t={this} type={suggestions_type} list={suggestions_list}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'search',
                                        component: <React.Fragment>
                                            <Search t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'shop',
                                        component: <React.Fragment>
                                            <Shop t={this}
                                                  watchedShopItems={watchedShopItems}
                                                  boughtShopItems={boughtShopItems}
                                            />
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'stats',
                                        component: <React.Fragment>
                                            <Stats t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'settings',
                                        component: <React.Fragment>
                                            <Settings t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'gallery',
                                        component: <React.Fragment>
                                            <Gallery t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'guessed_pictures',
                                        component: <React.Fragment>
                                            <GuessedPictures t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'picture_info',
                                        component: <React.Fragment>
                                            <PictureInfo
                                                t={this}
                                                current={like_currentPictureSelected}
                                                method={like_method} param={like_param} user_id={like_user_id}
                                            />
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'author',
                                        component: <React.Fragment>
                                            <Author t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'search_game',
                                        component: <SearchGame t={this}/>
                                    },
                                    {
                                        id: 'game',
                                        component: <React.Fragment>
                                            <Game
                                                color={pickedColor}
                                                t={this} drawerId={drawerId} lobbyId={lobbyId} online={isOnlineDrawing}
                                                chooseWords={chooseWords} voteWords={voteWords} word={word}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'neural',
                                        component: <React.Fragment>
                                            <Neural
                                                t={this} color={pickedColor}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'export_clip',
                                        component: <ExportClip t={this}/>
                                    },
                                    {
                                        id: 'global_canvas_history',
                                        component: <React.Fragment>
                                            <GlobalCanvasHistory t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'global_canvas',
                                        component: <React.Fragment>
                                            <GlobalCanvas color={pickedColor} t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'global_canvas_info',
                                        component: <React.Fragment>
                                            <GlobalCanvasInfo t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'result',
                                        component: <React.Fragment>
                                            <Result
                                                t={this} drawerId={drawerId} winnerId={winnerId}
                                                word={word}
                                                gameId={gameId}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'tags',
                                        component: <Tags t={this}/>
                                    },
                                    {
                                        id: 'friends',
                                        component: <React.Fragment>
                                            <Friends t={this}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'friend_lobby',
                                        component: <React.Fragment>
                                            <FriendLobby t={this} friend_lobby={friend_lobby}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'friend_lobby_settings',
                                        component: <React.Fragment>
                                            <FriendLobbySettings t={this} friend_lobby={friend_lobby}/>
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'group_vk',
                                        component: <Placeholder
                                            icon={<IconCleanDark/>}
                                            title='С возвращением!'
                                            description='Не хочешь вступить в наше сообщество ВКонтакте? Именно там публикуются все крутые обновления и конкурсы'
                                            buttonText='Вступить'
                                            buttonOnClick={async () => {
                                                bridge.send('VKWebAppStorageSet', {key: 'vk_group3', value: '1'});
                                                this.setState({isShowVkGroup: false});
                                                try {
                                                    await bridge.send('VKWebAppJoinGroup', {group_id: 208964042});
                                                    adAppApi('stats.subscribe', {group_id: 208964042});
                                                } catch (e) {
                                                }
                                                await this.back();
                                                if (!(await this.showCustomAdvert())) {
                                                    this.onChangeHash();
                                                }
                                            }}
                                            buttonMode='gradient_gray'
                                            buttonBack={true}
                                            buttonBackOnClick={() => {
                                                if (this.vkChatIntegration || this.isFromCatalogChat) {
                                                    bridge.send('VKWebAppStorageSet', {key: 'vk_group3', value: '1'});
                                                }
                                                this.back();
                                                this.onChangeHash();
                                            }}
                                            t={this}
                                        />
                                    },
                                    {
                                        id: 'chat_vk',
                                        component: <Placeholder
                                            icon={<IconCleanDark/>}
                                            title='И снова привет!'
                                            description='Приглашаем тебя к нам в беседу, там мы активно общаемся друг с другом :)'
                                            buttonText='Вступить'
                                            buttonOnClick={async () => {
                                                openUrl('https://vk.me/join/DFIbwK_w537NhbqDIWPd8JjoW/qfkWn5tzk=');
                                                this.back();
                                                this.onChangeHash();
                                            }}
                                            buttonMode='gradient_gray'
                                            buttonBack={true}
                                            t={this}
                                        />
                                    },
                                    {
                                        id: 'vk_donut_avocado',
                                        component: <React.Fragment>
                                            <PanelHeader
                                                separator={false}
                                                left={<PanelHeaderBack onClick={() => this.back()}/>}
                                            />
                                            <iframe
                                                src={`https://avocadoteam.github.io/app-sub-modal/?appearance=${this.state.appearance}&app=draw`}
                                                style={{
                                                    height: isPlatformDesktop() ? '93vh' : 'calc(100vh - 120px)',
                                                    border: 0
                                                }}
                                                width="100%"
                                            />
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'vk_donut_blocked',
                                        component: <Placeholder
                                            icon={<IconCleanDark/>}
                                            title='Ограничено'
                                            description='Доступ к функционалу временно заблокирован. Ожидайте новостей в нашей группе ВКонтакте.'
                                            buttonText='Перейти'
                                            buttonOnClick={() => {
                                                openUrl('https://vk.com/draw_app');
                                            }}
                                            buttonMode='gradient_gray'
                                            buttonBack={true}
                                            t={this}
                                        />
                                    },
                                    {
                                        id: 'vk_donut_ios',
                                        component: <Placeholder
                                            icon={<IconDonut/>}
                                            title='VK Donut'
                                            description='На Вашем устройстве данная функция не доступна. Уточнить информацию можете в нашей группе.'
                                            buttonText='Написать'
                                            buttonOnClick={() => {
                                                openUrl('https://vk.com/draw_app');
                                            }}
                                            buttonMode='primary_2'
                                            buttonBack={true}
                                            t={this}
                                        />
                                    },
                                    {
                                        id: 'banned',
                                        component: <Placeholder
                                            icon={<IconCleanDark/>}
                                            title='Вы заблокированы'
                                            description={`Причина: ${ban_reason}. Дата разблокировки: ${new Date(banned).toLocaleDateString('ru', {
                                                day: 'numeric',
                                                month: 'numeric',
                                                year: 'numeric',
                                                hour: 'numeric',
                                                minute: 'numeric'
                                            })}`}
                                            buttonText='Перейти в группу'
                                            buttonOnClick={() => {
                                                openUrl('https://vk.com/club' + 208964042);
                                            }}
                                            buttonMode='gradient_gray'
                                            t={this}
                                        />
                                    },
                                    {
                                        id: 'april1',
                                        component: <React.Fragment>
                                            <Placeholder
                                                icon={<Icon56ErrorTriangleOutline width={96} height={96}/>}
                                                title='Блокировка'
                                                description={'Вас навсегда забанили. Поздравляем 🥳'}
                                                buttonText='Спасибо'
                                                buttonOnClick={() => {
                                                    this.setAlert('Геометрия', 'Чтобы снять блокировку, решите пример: 2+2', [
                                                        {
                                                            title: '4',
                                                            autoclose: true,
                                                            action: () => {
                                                                this.setSnackbar('Неправильно');
                                                            }
                                                        },
                                                        {
                                                            title: '5',
                                                            autoclose: true,
                                                            action: () => {
                                                                this.setActivePanel('main');
                                                                this.setSnackbar('Вас разбанили');
                                                            }
                                                        }
                                                    ])
                                                }}
                                                buttonMode='gradient_gray'
                                                t={this}
                                            />
                                            {snackbar}
                                        </React.Fragment>
                                    },
                                    {
                                        id: 'suggestions_done',
                                        component: <Placeholder
                                            icon={<IconDone/>}
                                            title='Спасибо! Мы учтём.'
                                            buttonBack={true}
                                            buttonBackText='Вернуться'
                                            t={this}
                                        />
                                    },
                                    {
                                        id: 'game_canceled',
                                        component: <Placeholder
                                            icon={<IconCancel/>}
                                            title={game_canceled_reason}
                                            buttonBack={false}
                                            buttonText='На главную'
                                            buttonMode='secondary'
                                            buttonOnClick={() => {
                                                this.setActivePanel('main');
                                                this.actionAfterGame();
                                            }}
                                            t={this}
                                        />
                                    },
                                    {
                                        id: 'game_error',
                                        component: <Placeholder
                                            icon={<IconCancel/>}
                                            title={gameErrorText}
                                            buttonBack={false}
                                            buttonText='На главную'
                                            buttonMode='secondary'
                                            buttonOnClick={() => {
                                                this.setActivePanel('main');
                                                this.actionAfterGame();
                                            }}
                                            t={this}
                                        />
                                    },
                                    {
                                        id: 'ad_alabuga',
                                        component: <Alabuga t={this}/>
                                    },
                                    {
                                        id: 'ad_startgame',
                                        component: <OprosStartGameRSV t={this}/>
                                    },
                                ].map(({id, component}, index) =>
                                    <Panel
                                        id={id}
                                        key={`Panel__${index}`}
                                        data-vkui-swipe-back={(!(id === 'game' || id === 'global_canvas'))}
                                    >
                                        {component}
                                    </Panel>
                                )
                            }
                        </View>
                    </SplitCol>
                </SplitLayout>
                <div className='SVGMaterials'>
                    {Object.keys(UserAvatarFrames).map(value => UserAvatarFrames[value])}
                </div>
            </React.Fragment>
        );
    }
}

export default Drawing;