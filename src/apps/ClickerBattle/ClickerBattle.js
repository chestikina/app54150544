import React from 'react';
import eruda from 'eruda';
import bridge from '@vkontakte/vk-bridge';
import '../../css/ClickerBattle/Global.css';

import {
    Panel,
    View,
    getClassName,
    usePlatform,
    Avatar, AppRoot, ModalRoot, ModalCard, Alert, PromoBanner, ScreenSpinner, Snackbar
} from '@vkontakte/vkui';
import {
    Icon16ErrorCircleFill,
    Icon24LogoVk, Icon24PaymentCardOutline
} from "@vkontakte/icons";

import {
    getUrlParams,
    isPlatformIOS,
    isPlatformAndroid,
    isPlatformDesktop,
    platforms,
    loadFonts,
    convertMiliseconds,
    convertMsToNormalTime,
    openUrl, getSrcUrl, decOfNum, shortIntegers
} from '../../js/utils';
import {
    getVKUsers, vk_local_users
} from '../../js/drawerapp/utils';

import Socket from '../../js/clickerbattle/socket_helper';

import Background from "../../components/ClickerBattle/Background";

import Header from "../../components/ClickerBattle/Header";

import {ReactComponent as IconHome} from "../../assets/clickerbattle/Home.svg";
import {ReactComponent as Icon36Send} from "../../assets/clickerbattle/send-36.svg";
import SlideBar from "../../components/ClickerBattle/SlideBar";
import Home from "./slides/Home";
import Person from "../../assets/clickerbattle/persons/Person";
import Shop from "./slides/Shop";
import Rating from "./slides/Rating";
import Transfers from "./slides/Transfers";
import More from "./slides/More";
import Developers from "./panels/Developers";
import Energy from "./panels/Energy";
import Game from "./panels/Game";
import BattlePass from "./slides/BattlePass";
import Customization from "./panels/Cutomization";
import SearchPlayer from "./panels/SearchPlayer";
import GameHistory from "./panels/GameHistory";
import Achievements from "./panels/Achievements";
import Referals from "./panels/Referals";
import Cases from "./panels/Cases";
import Friends from "./slides/Friends";
import PCPlaceholder from "./panels/PCPlaceholder";
import Persons from "./slides/Persons";
import Placeholder from "./panels/Placeholder";
import SimplePlaceholder from "../../components/ClickerBattle/SimplePlaceholder";
import Button from "../../components/ClickerBattle/Button";
import GameResult from "./panels/GameResult";
import Level from "./panels/Level";
import Onboard from "./panels/Onboard";
import MiniGame from "./MiniGame";

export const
    MODAL_CARD_PAYMENT = 'modal-payment'
;

let
    workInterval = null
;

class ClickerBattle extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: ['main'],
            activePanel: 'main',
            activeModal: null,

            user: {},
            persons: [],

            slideBarAnimationEnd: true,
            slideBarPrev: 0,
            slideBarIndex: 0,
            specificPanelOpened: null,

            friendsAccessToken: '',

            modalPaymentData: {},

            loadedData: 0,
            tryingToReconnect: false,

            isShowOnboard: false
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.slideBarOnChange = this.slideBarOnChange.bind(this);
        this.isScrollSlide = this.isScrollSlide.bind(this);
        this.miniGameShareStory = this.miniGameShareStory.bind(this);

        this.initializeNavigation();

        const resize = () => {
            const
                windowHeight = document.documentElement.clientHeight,
                scale = 100 / 812 * windowHeight / 100
            ;
            document.body.style.setProperty('--scale-value', scale);
            document.body.style.setProperty('--client-width', document.documentElement.clientWidth);
        };

        window.onload = () => {
            resize();
        };
        window.onresize = () => {
            resize();
        };
    }

    initializeNavigation() {
        this.go = (panel) => {
            const {history} = this.state;
            if (history[history.length - 1] !== panel) {
                history.push(panel);
                window.history.pushState({activePanel: panel}, 'Title');
                this.setState({activePanel: panel, history});
            }
        };

        this.back = () => {
            if (this.state.popout !== null) {
                this.setState({popout: null});
                window.history.pushState({pop: 'popout'}, 'Title');
                return;
            }
            let {history, activeModal} = this.state;
            if (activeModal !== null) {
                this.setState({activeModal: null});
                window.history.pushState({pop: 'popout'}, 'Title');
                return;
            }
            if (history.length === 1) {
                bridge.send('VKWebAppClose', {status: 'success'});
            } else if (history.length > 1) {
                history.pop();
                this.setState({activePanel: history[history.length - 1], history});
            }
        };
    }

    async componentDidMount() {
        loadFonts();
        bridge.send('VKWebAppInit');

        setInterval(() => {
            bridge.send('VKWebAppGetAds', {}).then(data => {
                if (this.state.promoBannerData !== false)
                    this.setState({promoBannerData: data});
            });
        }, 3000);

        if (isPlatformDesktop())
            return;

        await this.startSocketConnection();

        window.addEventListener('popstate', e => {
            e.preventDefault();
            this.back(e);
        });

        bridge.subscribe(async ({detail: {type, data}}) => {
            if (type !== undefined) console.log(type, data);
            if (type === 'VKWebAppUpdateConfig') {
                const schemeAttribute = document.createAttribute('scheme');
                schemeAttribute.value = data.scheme ? data.scheme === 'client_light' ? 'bright_light' : data.scheme : 'bright_light';
                document.body.attributes.setNamedItem(schemeAttribute);
                if (bridge.supports('VKWebAppSetViewSettings')) {
                    bridge.send('VKWebAppSetViewSettings', {
                        status_bar_style: 'dark',
                        action_bar_color: '#D6C7B6'
                    });
                }
            } else if (type === 'VKWebAppViewHide') {
                if (this.state.currentGameId > 0) {
                    this.client.emit('games.exit', {game_id: this.state.currentGameId});
                }
            }
        });

        const
            vk_user = await bridge.send('VKWebAppGetUserInfo'),
            isShowOnboard = (await bridge.send('VKWebAppStorageGet', {keys: ['onboard_season4']})).keys[0].value === ''
        ;

        this.setState({vk_user, isShowOnboard});
    }

    componentWillUnmount() {
        clearInterval(workInterval);
    }

    async startSocketConnection() {
        setTimeout(() => {
            if (this.state.loadedData < 5 && this.state.tryingToReconnect === false) {
                this.setState({tryingToReconnect: true});
                this.startSocketConnection();
            }
        }, 3000);
        try {
            this.setState({loadedData: 0});
            this.socket.onConnect(() => {
            });
            this.client.disconnect(true);
        } catch (e) {
        }
        const
            socket = new Socket(getUrlParams()),
            client = socket.getSocket()
        ;
        this.socket = socket;
        this.client = client;
        socket.onConnect(async () => {
            console.log('socket connected');

            await this.updateUserData();
            await this.updateCustomizationData();
            await new Promise(resolve =>
                client.emit('persons.get', {}, async persons => {
                    await this.setState({persons: persons.response, loadedData: this.state.loadedData + 1});
                    resolve(true);
                })
            );
            if (this.state.loadedData >= 5) {
                if (window.location.hash.startsWith('#ref')) {
                    const referal_id = parseInt(window.location.hash.substring('#ref'.length));
                    await getVKUsers([referal_id]);
                    await this.setState({referal: referal_id, activePanel: 'ref'});
                } else if (window.location.hash.startsWith('#tr')) {
                    const to_id = parseInt(window.location.hash.substring('#tr'.length));
                    setTimeout(() => {
                            this.setState({transfer_to_id: to_id});
                            //this.slideBarOnChange(0, 6, false, false);
                            this.SlideButton6.click();
                        },
                        400);
                } else if (window.location.hash.startsWith('#bill')) {
                    const bill_id = parseInt(window.location.hash.substring('#bill'.length));
                    client.emit('bill.getById', {bill_id}, response => {
                        this.setState({
                            bill_info: response.response || undefined,
                            activePanel: response.response ? 'bill' : 'main'
                        });
                    });
                } else {
                    await this.setState({activePanel: 'main'});
                }
            }
        });
        socket.onConnectionError(async obj => {
            console.error(obj);
            await this.setState({
                activePanel: 'placeholder',
                placeholder:
                    <Placeholder
                        title='Ошибка подключения'
                        actions={[
                            <Button className='PlaceholderButton'
                                    onClick={() => document.location.reload()}>Переподключиться</Button>
                        ]}
                    />
            });
            this.setState({loadedData: 5});
        });
        socket.onDisconnect(async () => {
            if (this.state.loadedData >= 5) {
                console.log('socket disconnected');
                if (this.state.activePanel !== 'placeholder') {
                    await this.setState({
                        activePanel: 'placeholder',
                        placeholder:
                            <Placeholder
                                title='Вы были отключены от сервера'
                                actions={
                                    [
                                        <Button className='PlaceholderButton'
                                                onClick={() => document.location.reload()}>Переподключиться</Button>
                                    ]
                                }
                            />
                    });
                }
            }
        });

        client.on('exit', async data => {
            if (data.end > 0) {
                workInterval = setInterval(() => {
                    const
                        timeObj = convertMsToNormalTime(data.end - Date.now()),
                        {hours, minutes, seconds} = timeObj,
                        subtitle = `${hours.toString().length === 2 ? hours : `0${hours}`}:${minutes.toString().length === 2 ? minutes : `0${minutes}`}:${seconds.toString().length === 2 ? seconds : `0${seconds}`}`
                    ;

                    if (hours + minutes + seconds <= 0) {
                        this.setState({
                            placeholder:
                                <Placeholder
                                    title={data.title}
                                    subtitle={'Приложение скоро включится...'}
                                    actions={
                                        [
                                            <Button className='PlaceholderButton'
                                                    onClick={() => document.location.reload()}>Переподключиться</Button>,
                                        ]
                                    }
                                />
                        });
                        clearInterval(workInterval);
                    } else {
                        this.setState({
                            placeholder:
                                <Placeholder
                                    title={data.title}
                                    subtitle={subtitle}
                                    actions={
                                        [
                                            <Button className='PlaceholderButton'
                                                    onClick={() => document.location.reload()}>Переподключиться</Button>,
                                        ]
                                    }
                                />
                        });
                    }
                }, 400);
            }
            await this.setState({
                activePanel: 'placeholder',
                placeholder:
                    <Placeholder
                        title={data.title}
                        actions={
                            [
                                <Button className='PlaceholderButton'
                                        onClick={() => document.location.reload()}>Переподключиться</Button>,
                                data.banned &&
                                <Button
                                    className='PlaceholderButton'
                                    style={{background: 'none'}}
                                    onClick={() => openUrl('https://vk.me/clickerbattle')}
                                >
                                    Разбан
                                </Button>
                            ]
                        }
                    />
            });
            this.setState({loadedData: 5});
        });
        client.on('updateUserData', async user => {
            await this.setState({user});
            this.forceUpdate();
        });
        client.on('alert', message => {
            if (this.state.activePanel === 'main') {
                this.setState({
                    popout:
                        <Alert
                            actions={[{
                                title: 'Хорошо',
                                autoclose: true,
                                mode: 'cancel'
                            }]}
                            actionsLayout='horizontal'
                            onClose={() => this.setState({popout: null})}
                            text={message}
                        />
                });
            }
        });
    }

    async updateUserData() {
        return await new Promise(resolve => {
            this.client.emit('users.get', {}, async user => {
                await this.setState({user: user.response, loadedData: this.state.loadedData + 1});
                resolve(true);
            });
        });
    }

    async updateCustomizationData() {
        return await new Promise(resolve => {
            this.client.emit('cursor.getList', {}, async response => {
                await this.setState({cursors: response.response, loadedData: this.state.loadedData + 1});
                this.client.emit('banner.getList', {}, async response => {
                    await this.setState({banners: response.response, loadedData: this.state.loadedData + 1});
                    this.client.emit('bannerstat.getList', {}, async response => {
                        await this.setState({bannersStat: response.response, loadedData: this.state.loadedData + 1});
                        resolve(true);
                    });
                });
            });
        });
    }

    async slideBarOnChange(prev, active, isContext, double) {
        const {slideBarAnimationEnd, specificPanelOpened} = this.state;

        if (!isContext && double || !slideBarAnimationEnd) return false;

        await this.setState({slideBarAnimationEnd: false});

        const
            slideBarContextOpened = isContext && !double,
            className = (isContext && !double) ? 'SlideEnterTop' : (isContext && double ? 'SlideExitBottom' : (active > prev ? 'SlideEnterRight' : 'SlideEnterLeft')),
            notContext = !(isContext && !double) && !(isContext && double)
        ;

        if (notContext) {
            const
                subClassName = active > prev ? 'SlideExitRight' : 'SlideExitLeft',
                slide = specificPanelOpened !== null ? document.getElementById('SpecificPanel') :
                    document.getElementById('Slide' + prev)
            ;

            if (specificPanelOpened !== null) {
                slide.className = subClassName;
            } else {
                slide.classList.add(subClassName);
            }

            await new Promise(resolve => setTimeout(() => {
                slide.classList.remove(subClassName);
                resolve(true);
            }, 180));

            await this.setState({
                specificPanelOpened: null
            });
        }

        if (isContext && double) {
            const
                slide = (specificPanelOpened !== null && !notContext) ? document.getElementById('SpecificPanel') :
                    document.getElementById('Slide' + prev)
            ;
            slide.className = className;
            setTimeout(async () => {
                await this.setState({
                    slideBarPrev: prev,
                    slideBarIndex: active,
                    slideBarContextOpened,
                    slideBarAnimationEnd: true,
                    specificPanelOpened: null
                });
                slide.className = '';
            }, 180);
        } else {
            await this.setState({
                slideBarPrev: prev,
                slideBarIndex: active,
                slideBarContextOpened
            });
            const slide = (specificPanelOpened !== null && !notContext) ? document.getElementById('SpecificPanel') :
                document.getElementById('Slide' + active);

            slide.className = className;
            setTimeout(() => {
                slide.className = '';
                this.setState({
                    slideBarAnimationEnd: true,
                    specificPanelOpened: null
                });
            }, 200);
        }
    }

    isScrollSlide(slideBarIndex = this.state.slideBarIndex) {
        return slideBarIndex >= 3 && slideBarIndex <= 7;
    }

    miniGameShareStory() {
        this.setState({popout: <ScreenSpinner/>});
        const
            {createCanvas, loadImage} = require('canvas')
        ;

        loadImage(getSrcUrl(require('../../assets/clickerbattle/stories/MiniGame.png'))).then(async background => {
            const
                canvas = createCanvas(background.width, background.height),
                ctx = canvas.getContext('2d'),
                {user, persons} = this.state,
                name = persons.length > 0 && persons[persons.findIndex(value => value.id === user.activePerson)].file_name,
                skin = persons[persons.findIndex(value => value.id === user.activePerson)].skins[user.activeSkins[user.activePerson]],
                person = await loadImage(getSrcUrl(require(`../../assets/clickerbattle/persons/png/${name}=${skin || 'standart'}.png`)))
            ;
            ctx.drawImage(background, 0, 0);

            ctx.drawImage(person, 286, 541, 495.63, 576);

            try {
                await bridge.send('VKWebAppShowStoryBox', {
                    background_type: 'image',
                    blob: canvas.toDataURL('image/png'),
                    attachment: {
                        url: 'https://vk.com/app' + getUrlParams().vk_app_id,
                        text: 'go_to',
                        type: 'url'
                    }
                });
            } catch (e) {
            }
            this.setState({popout: null, activePanel: 'main', slideBarIndex: 0});
        });
    }

    render() {
        if (isPlatformDesktop())
            return (<Panel id='pc_placeholder'>
                <PCPlaceholder/>
            </Panel>);

        const
            {state} = this,
            {
                loadedData,

                activePanel, activeModal, popout,
                vk_user, user,
                slideBarPrev, slideBarIndex, slideBarContextOpened,
                specificPanelOpened,
                placeholder,
                modalPaymentData,

                isShowOnboard,
                promoBannerData,

                market_data,

                bill_info
            } = state,

            slides = [
                (
                    <Home t={this}/>
                ),
                (
                    <Shop t={this}/>
                ),
                (
                    <Persons t={this}/>
                ),
                (
                    <Rating t={this}/>
                ),
                (
                    <BattlePass t={this}/>
                ),
                (
                    <Friends t={this}/>
                ),
                (
                    <Transfers t={this}/>
                ),
                (
                    <More t={this}/>
                ),
            ].map((slide, i) =>
                <div key={`slide_div_${i}`} id={`Slide${i}`} className='Slide'>{slide}</div>
            ),

            specificPanels = [
                (
                    <Energy t={this}/>
                ),
                (
                    <Developers t={this}/>
                ),
                (
                    <Referals t={this}/>
                ),
                (
                    <Customization t={this}/>
                ),
                (
                    <GameHistory t={this}/>
                ),
                (
                    <Cases t={this}/>
                ),
                (
                    <Achievements t={this}/>
                ),
                (
                    <Level t={this}/>
                )
            ].map((panel, i) =>
                <div key={`panel_div_${i}`} id={`Panel${i}`} className='SPanel'>{panel}</div>),

            modal = (
                <ModalRoot
                    activeModal={activeModal}
                    onClose={() => this.setState({activeModal: null})}
                >
                    <ModalCard
                        id={MODAL_CARD_PAYMENT}
                        onClose={() => this.setState({activeModal: null})}
                        icon={<Icon36Send/>}
                        header='Выберите способ оплаты'
                        subheader='Платёж безопасен — мы не узнаем Ваши данные. '
                        actions={[
                            <Button
                                style={{
                                    background: 'rgba(87, 64, 57, 0.1)',
                                    borderRadius: 14,
                                    color: '#574039',
                                    height: 50
                                }}
                                before={<Icon24LogoVk width={16} height={16}/>}
                                onClick={() => {
                                    bridge.send('VKWebAppOpenPayForm', {
                                        app_id: parseInt(getUrlParams().vk_app_id),
                                        action: 'pay-to-group',
                                        params: {
                                            amount: modalPaymentData.price,
                                            description: modalPaymentData.comment,
                                            group_id: 173263813
                                        }
                                    });
                                }}
                            >
                                Pay
                            </Button>,
                            <Button
                                style={{
                                    background: '#574039',
                                    borderRadius: 14,
                                    color: '#FFFFFF',
                                    height: 50,
                                    marginLeft: 11
                                }}
                                before={<Icon24PaymentCardOutline width={20} height={20}/>}
                                onClick={() => {
                                    openUrl(modalPaymentData.payUrl);
                                }}
                            >
                                Карта
                            </Button>
                        ]}
                    />
                </ModalRoot>
            )
        ;

        return loadedData >= 5 ? (
                <View
                    activePanel={isShowOnboard ? 'onboard' : activePanel}
                    modal={modal}
                    popout={popout}
                >
                    <Panel id='main' className='HiddenScrollBar' style={this.isScrollSlide() ? {
                        overflowY: 'scroll',
                        overflowX: 'hidden'
                    } : {}}>
                        <Header t={this}>
                            <SlideBar
                                t={this}
                                tabs={[
                                    {
                                        icon: <IconHome/>,
                                        text: 'Домашний экран'
                                    },
                                    {
                                        text: 'Магазин'
                                    },
                                    {
                                        text: 'Персонажи'
                                    },
                                    {
                                        text: 'Рейтинг'
                                    },
                                    {
                                        text: 'Боевой пропуск'
                                    },
                                    {
                                        text: 'Друзья'
                                    },
                                    {
                                        text: 'Переводы'
                                    },
                                    {
                                        text: 'Ещё',
                                        isContext: true
                                    },
                                ]}
                                onChange={this.slideBarOnChange}/>
                        </Header>
                        <div style={{height: '100%'}}>
                            {
                                specificPanelOpened !== null ?
                                    React.cloneElement(specificPanels[specificPanelOpened], {id: 'SpecificPanel'})
                                    :
                                    (
                                        [
                                            slideBarContextOpened &&
                                            React.cloneElement(slides[slideBarIndex], {
                                                style: {
                                                    position: 'absolute'
                                                }
                                            }),
                                            React.cloneElement(slideBarContextOpened ? slides[slideBarPrev] : slides[slideBarIndex], {
                                                style: {
                                                    pointerEvents: slideBarContextOpened && 'none',
                                                    opacity: slideBarContextOpened && .1,
                                                    position: !this.isScrollSlide(slideBarContextOpened ? slideBarPrev : slideBarIndex) && slideBarIndex !== 1 && 'absolute',
                                                    height: '100%',
                                                    width: '100vw'
                                                }
                                            })
                                        ]
                                    )
                            }
                        </div>
                        <PromoBanner
                            style={{
                                opacity: (slideBarIndex !== 0 || typeof (promoBannerData) !== 'object') && 0,
                                pointerEvents: (slideBarIndex !== 0 || typeof (promoBannerData) !== 'object') && 'none'
                            }}
                            bannerData={promoBannerData}
                            onClose={() => this.setState({promoBannerData: false})}
                        />
                        <Background arenaOpacity={.06} fogOpacity={.35}/>
                    </Panel>
                    <Panel id='bill'>
                        {
                            bill_info &&
                            <SimplePlaceholder
                                t={this}
                                icon={require('../../assets/clickerbattle/placeholder_icons/bill_49.png')}
                                title='Вам выписали счёт'
                                description={`Перевод ${shortIntegers(bill_info.amount)} ${decOfNum(bill_info.amount, ['клик', 'клика', 'кликов'], false)} другому пользователю`}
                                buttonText='Оплатить'
                                onClick={() => {
                                    this.client.emit('transfers.send', {
                                        toId: bill_info.fromId,
                                        amount: bill_info.amount,
                                        bill_id: bill_info.id
                                    }, response => {
                                        if (response.error) {
                                            this.setState({
                                                activePanel: 'main',
                                                popout:
                                                    <Alert
                                                        actions={[{
                                                            title: 'Ок',
                                                            autoclose: true,
                                                            mode: 'cancel'
                                                        }]}
                                                        actionsLayout='horizontal'
                                                        onClose={() => this.setState({popout: null})}
                                                        text={response.error.message}
                                                    />
                                            });
                                        } else {
                                            this.setState({
                                                activePanel: 'main',
                                                user: {
                                                    ...this.state.user,
                                                    clicks: this.state.user.clicks - bill_info.amount
                                                }
                                            });
                                        }
                                    });
                                }}
                                subButtonText='Отмена'
                                subOnClick={() => {
                                    this.setState({activePanel: 'main'});
                                }}
                            />
                        }
                    </Panel>
                    <Panel id='ref'>
                        {
                            vk_local_users[state.referal] ?
                                <SimplePlaceholder
                                    t={this}
                                    icon={vk_local_users[state.referal].photo_100}
                                    title={`${vk_local_users[state.referal].first_name} пригласил тебя в Битву Кликеров`}
                                    description='Прими приглашение, чтобы получить свой первый кейс и начать играть'
                                    buttonText='Присоединиться'
                                    onClick={async () => {
                                        this.client.emit('referal.set', {owner: state.referal}, () => {
                                            this.updateUserData();
                                            this.setState({activePanel: 'main'});
                                        });
                                    }}
                                />
                                : <div/>
                        }
                    </Panel>
                    <Panel id='game'>
                        <Game t={this}/>
                    </Panel>
                    <Panel id='game_result'>
                        <GameResult t={this}/>
                    </Panel>
                    <Panel id='placeholder'>
                        {placeholder}
                    </Panel>
                    <Panel id='onboard'>
                        <Onboard t={this}/>
                    </Panel>
                    <Panel id='market_placeholder'>
                        <SimplePlaceholder
                            t={this}
                            icon={require('../../assets/clickerbattle/market_icons/pensive-face_1f614.png')}
                            title='Что-то не так...'
                            description='Оплата на iOS устройствах невозможна.'
                            onClick={false && (async () => {
                                try {
                                    await bridge.send('VKWebAppAllowMessagesFromGroup', {group_id: 173263813});
                                    await bridge.send('VKWebAppSendPayload', {
                                        group_id: 173263813,
                                        payload: market_data
                                    });
                                } catch (e) {
                                }
                                openUrl('https://vk.me/clickerbattle');
                            })}
                        />
                    </Panel>
                    <Panel id='skins_placeholder'>
                        <SimplePlaceholder
                            t={this}
                            icon={require('../../assets/clickerbattle/placeholder_icons/skins_28.png')}
                            title='Кастомизация'
                            description='Для каждого персонажа есть свой набор одежды — скины. Их можно получить, открывая кейсы.'
                        />
                    </Panel>
                    <Panel id='bp_placeholder'>
                        <SimplePlaceholder
                            t={this}
                            icon={require('../../assets/clickerbattle/placeholder_icons/vk_donut_49.png')}
                            title='Боевой Пропуск'
                            description='Чтобы получить боевой пропуск, нужно оформить подписку VK Donut'
                            buttonText='Вперёд'
                            onClick={() => {
                                openUrl('https://vk.com/donut/clickerbattle');
                                this.setState({slideBarIndex: 0, activePanel: 'main'});
                            }}
                        />
                    </Panel>
                    <Panel id='minigame_placeholder'>
                        <SimplePlaceholder
                            t={this}
                            icon={require('../../assets/clickerbattle/placeholder_icons/mini_game.png')}
                            title='Не хочешь поделиться результатом игры?'
                            description='Благодаря этому, в игре станет больше твоих противников, и будет с кем поиграть'
                            buttonText='Поделиться в истории'
                            onClick={this.miniGameShareStory}
                            subButtonText='Назад'
                            subOnClick={() => {
                                this.setState({activePanel: 'main', slideBarIndex: 0});
                            }}
                        />
                    </Panel>
                    <Panel id='mini_game'>
                        <MiniGame t={this}/>
                    </Panel>
                </View>
            ) :
            <Panel id='load_placeholder'>
                <Placeholder
                    title='Подключение к серверу'
                    subtitle={Math.floor(100 / 6 * loadedData) + '%'}
                    actions={this.state.tryingToReconnect && [
                        <Button className='PlaceholderButton'
                                onClick={() => this.startSocketConnection()}>Переподключиться</Button>,
                    ]}
                />
            </Panel>;
    }
}

export default ClickerBattle;