import React from 'react';
import eruda from 'eruda';
import bridge from '@vkontakte/vk-bridge';
import '../css/RandomCooking.css';
import {getRandomInt, isPlatformDesktop, sleep} from "../js/utils";

import {get, getBase64Image, getSrcUrl, getUrlParams, loadFonts, openUrl} from "../js/utils";
import {
    Avatar,
    Button,
    Panel, PanelHeader, PanelHeaderBack, ScreenSpinner,
    View
} from '@vkontakte/vkui';
import {
    Icon28ChevronRightOutline,
    Icon28ClipCircleFillViolet, Icon28DeleteOutline,
    Icon28FavoriteOutline, Icon28ListLikeOutline,
    Icon28UsersOutline, Icon28ArticleOutline
} from "@vkontakte/icons";
import {registerFont, createCanvas, loadImage} from 'canvas';
import {ReactComponent as IconOnboard} from "../assets/random_cooking/icons/onboard.svg";

import Placeholder from "./Drawing/Placeholder";

const
    apiUrl = 'https://cooking.avocado.special.vk-apps.com/api/',
    isDesktop = isPlatformDesktop()
;

let clicks = 0;

class RandomCooking extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            activePanel: 'main',
            history: ['main'],

            data: [],
            currentSlice: 0,

            curMouseCords: {},
            moveY: 0,
            modalOpened: false,
            showModalContent: false,

            isFavorite: false,
            favorite: [],

            ethernetConnection: true,
            windowHeight: 812
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.updateData = this.updateData.bind(this);
        this.updateFavorite = this.updateFavorite.bind(this);
        this.addToFavorite = this.addToFavorite.bind(this);
        this.removeFromFavorite = this.removeFromFavorite.bind(this);
        this.isFavorite = this.isFavorite.bind(this);
        this.back = async () => {
            const {history, popout} = this.state;

            if (popout !== null && popout !== undefined)
                return;

            if (history.length > 1) {
                history.pop();
                await this.setState({activePanel: history[history.length - 1], history, snackbar: null});
                setTimeout(() => {
                    this.initializeModal();
                }, 400);
            } else {
                bridge.send('VKWebAppClose', {status: 'success'});
            }
        };
        this.go = (panel) => {
            const {history} = this.state;
            if (history[history.length - 1] !== panel) {
                history.push(panel);
                window.history.pushState({activePanel: panel}, 'Title');
                this.setState({activePanel: panel, history, snackbar: null});
            }
        };
        this.setActivePanel = (panel) => {
            this.setState({activePanel: panel, history: [panel], snackbar: null});
        };
        this.setPopout = (popout) => {
            this.setState({popout});
        };


        window.addEventListener('popstate', e => {
            e.preventDefault();
            this.back();
        });

        window.addEventListener('load', event => {
            window.addEventListener('offline', event => {
                this.setState({ethernetConnection: false});
            });

            window.addEventListener('online', async event => {
                await this.updateData();
                await this.updateFavorite();
                await this.setState({ethernetConnection: true});
                setTimeout(() => {
                    this.initializeModal();
                }, 400);
            });
        });

        const resize = () => {
            const
                windowHeight = document.documentElement.clientHeight
            ;
            document.body.style.setProperty('--window-height', windowHeight);
            this.setState({windowHeight, isSmallPhone: windowHeight <= 650, isIphone6: windowHeight <= 700});
        };

        window.onload = () => {
            resize();
        };
        window.onresize = () => {
            resize();
        };
    }

    async componentDidMount() {
        loadFonts();
        //eruda.init();

        bridge.subscribe(async ({detail: {type, data}}) => {
            if (type !== undefined) console.log(type, data);
            if (type === 'VKWebAppUpdateConfig') {
                const schemeAttribute = document.createAttribute('scheme');
                schemeAttribute.value = data.scheme ? data.scheme === 'client_light' ? 'bright_light' : data.scheme : 'bright_light';
                document.body.attributes.setNamedItem(schemeAttribute);
                if (bridge.supports('VKWebAppSetViewSettings')) {
                    const isDarkTheme = schemeAttribute.value === 'space_gray';
                    bridge.send('VKWebAppSetViewSettings', {
                        status_bar_style: isDarkTheme ? 'light' : 'dark',
                        action_bar_color: isDarkTheme ? '#242121' : '#FCFCFC',
                        navigation_bar_color: isDarkTheme ? '#242121' : '#FCFCFC'
                    });
                }
            } else if (type === 'VKWebAppViewRestore') {
                this.setState({popout: null});
            }
        });

        try {
            const
                isShowOnboard = (await bridge.send('VKWebAppStorageGet', {keys: ['onboard']})).keys[0].value === '',
                vk_user = await bridge.send('VKWebAppGetUserInfo')
            ;
            await this.setState({isShowOnboard, vk_user});
            await this.updateData();
            await this.updateFavorite();
            this.initializeModal();
            bridge.send('VKWebAppInit');
        } catch (e) {
            console.error(e);
            bridge.send('VKWebAppInit');
        }
    }

    initializeModal() {
        try {
            const
                {bottomModal, receipt1, receipt2} = this
            ;

            bottomModal.removeEventListener('touchstart', (e) => this.touchStart(e));
            bottomModal.removeEventListener('touchend', () => this.touchEnd());
            bottomModal.removeEventListener('touchcancel', () => this.touchEnd());
            bottomModal.removeEventListener('touchmove', (e) => this.touchMove(e));

            bottomModal.addEventListener('touchstart', (e) => this.touchStart(e));
            bottomModal.addEventListener('touchend', () => this.touchEnd());
            bottomModal.addEventListener('touchcancel', () => this.touchEnd());
            bottomModal.addEventListener('touchmove', (e) => this.touchMove(e));

            receipt2.onanimationend = () => this.endOfSecondAnimation();
        } catch (e) {
            console.error(e);
        }
    }

    async updateData() {
        const
            data = await get(apiUrl + 'receipt.get', {...getUrlParams(), limit: 100})
        ;
        await this.setState({data: data.response, data_count: data.count});
        return true;
    }

    async updateFavorite() {
        try {
            const
                favorite_ = (await bridge.send('VKWebAppStorageGet', {keys: ['favorite']})).keys[0].value,
                favorite__ = favorite_ === '' ? [] : JSON.parse(favorite_),
                favorite = favorite_ === '' ? [] : (await get(apiUrl + 'receipt.getById', {
                    ...getUrlParams(),
                    receipt_ids: favorite__.join(',')
                })).response
            ;
            await this.setState({
                favorite,
                isFavorite: await this.isFavorite(this.state.data[this.state.currentSlice].id)
            });
        } catch (e) {
            console.error(e);
            await this.setState({
                favorite: [],
                isFavorite: false
            });
        }
        return true;
    }

    async addToFavorite(id) {
        const
            favorite = [...this.state.favorite, this.state.data.find(value => value.id === id)]
        ;
        await this.setState({favorite, isFavorite: true});
        await bridge.send('VKWebAppStorageSet', {
            key: 'favorite',
            value: JSON.stringify(favorite.map(value => value.id))
        });
        return true;
    }

    async removeFromFavorite(id) {
        let {favorite} = this.state;
        favorite.splice(favorite.findIndex(value => value.id === id), 1);
        await this.setState({favorite, isFavorite: false});
        await bridge.send('VKWebAppStorageSet', {
            key: 'favorite',
            value: JSON.stringify(favorite.map(value => value.id))
        });
        return true;
    }

    async isFavorite(id) {
        try {
            return this.state.favorite.findIndex(value => value.id === id) > -1;
        } catch (e) {
            return false;
        }
    }

    touchStart(e) {
        console.log('touchStart');
        this.setState({
            touchStarted: true,
            moveY: 0,
            curMouseCords: {x: e.clientX || e.targetTouches[0].clientX, y: e.clientY || e.targetTouches[0].clientY}
        });
    }

    async touchEnd() {
        console.log('touchEnd');
        let
            element = this.bottomModal,
            {moveY, isSmallPhone, isIphone6, data, currentSlice} = this.state
        ;

        element.style.transition = 'all 0.24s cubic-bezier(.1, 0, .25, 1)';

        if (-moveY >= 50) {
            this.setState({modalOpened: true, showModalContent: true});
            element.style.bottom = `0`;
        } else if (moveY >= 50) {
            this.setState({modalOpened: false, showModalContent: false});
            element.style.bottom = isSmallPhone ? `-45vh` : isIphone6 ? `-35vh` : `-30vh`;
        } else {
            if (this.state.modalOpened)
                element.style.bottom = `0`;
            else
                element.style.bottom = isSmallPhone ? `-45vh` : isIphone6 ? `-35vh` : `-30vh`;
        }
        this.setState({touchStarted: false});
    }

    async touchMove(e) {
        console.log('touchMove');
        if (!this.state.touchStarted) return;
        const
            element = this.bottomModal,
            {curMouseCords, modalOpened} = this.state,
            mouseY = e.clientY || e.targetTouches[0].clientY
        ;

        let moveY = mouseY - curMouseCords.y;
        element.style.bottom = `${100 / 812 * Math.min((modalOpened ? 0 : -251) - moveY, 0)}vh`;
        element.style.transition = 'none';
        this.setState({moveY, showModalContent: -moveY >= 50 ? true : modalOpened});
    }

    async nextReceipt() {
        this.setState({receiptAnimation: true});
        const
            timeExit = 800,
            timeEnter = 400,
            {data, currentSlice} = this.state
        ;
        this.receipt1.style.transformOrigin = 'bottom';
        this.receipt1.style.animation = `Receipt1__exit ease-in-out ${timeExit}ms 1`;
        setTimeout(() => {
            this.receipt1.style.animation = `none`;
            this.receipt1.style.opacity = `0`;
        }, timeExit - 5);

        setTimeout(() => {
            this.receipt2.style.animation = `Receipt2__enter ease-in-out ${timeEnter}ms 1`;
            setTimeout(async () => {
                this.receipt2.style.animation = `none`;
                const currentSlice_ = data[currentSlice + 1] ? currentSlice + 1 : 0;
                await this.setState({
                    currentSlice: currentSlice_,
                    isFavorite: await this.isFavorite(data[currentSlice_].id)
                });
                this.receipt1.style.opacity = `1`;
                setTimeout(() => {
                    this.setState({receiptAnimation: false});
                }, 100);
            }, timeEnter - 5);
        }, (timeExit / 2));
    }

    async nextReceiptOptimized() {
        clicks++;

        await this.setState({receiptAnimation: true});
        const
            timeExit = 800
        ;

        this.receipt1.classList.add('Receipt1_exit');

        setTimeout(() => {
            this.receipt2.classList.add('Receipt2_enter');
        }, (timeExit / 2));

        try {
            if (clicks % 3 === 0) {
                this.setPopout(<ScreenSpinner/>);
                const available_ads = (await bridge.send('VKWebAppCheckNativeAds', {ad_format: 'interstitial'})).result;
                if (available_ads) {
                    await sleep(getRandomInt(500, 1000));
                    await bridge.send('VKWebAppShowNativeAds', {ad_format: 'interstitial'});
                }
            }
        } catch (e) {
        }
        this.setPopout(null);
    }

    async endOfSecondAnimation() {
        const
            {data, currentSlice} = this.state,
            currentSlice_ = data[currentSlice + 1] ? currentSlice + 1 : 0
        ;
        await this.setState({
            currentSlice: currentSlice_,
            isFavorite: await this.isFavorite(data[currentSlice_].id)
        });
        this.receipt2.classList.remove('Receipt2_enter');
        this.receipt1.classList.remove('Receipt1_exit');
        setTimeout(() => {
            this.setState({receiptAnimation: false});
        }, 100);
    }

    async shareStory(title, imgUrl) {
        this.setPopout(<ScreenSpinner/>);
        try {
            const
                canvas = createCanvas(1080, 1920),
                ctx = canvas.getContext('2d'),

                canvas_mask = createCanvas(1080, 1920),
                ctx_mask = canvas_mask.getContext('2d'),

                background = await loadImage(getSrcUrl(require('../assets/random_cooking/story/background.png'))),
                mask = await loadImage(require('../assets/random_cooking/story/mask.png')),
                image = await loadImage(await getBase64Image(imgUrl)),
                scale = 810 / image.height
            ;
            image.width = image.width * scale;
            image.height = image.height * scale;

            ctx_mask.drawImage(mask, 135, 599, 810, 810);
            ctx_mask.globalCompositeOperation = 'source-atop';
            ctx_mask.drawImage(image, 540 - image.width / 2, 599, 540 + image.width / 2, 810);

            ctx.drawImage(background, 0, 0);
            ctx.drawImage(await loadImage(canvas_mask.toDataURL()), 0, 0);
            ctx.font = '45px TT Commons Bold';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(title, 539.5, 535 + 9);

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
                console.error(e);
                /*try {
                    await bridge.send('VKWebAppShowStoryBox', {
                        background_type: 'image',
                        url: 'https://i.ibb.co/tqFxLkF/image.png',
                        attachment: {
                            url: 'https://vk.com/app' + getUrlParams().vk_app_id,
                            text: 'go_to',
                            type: 'url'
                        }
                    });
                } catch (e) {
                    console.error(e);
                }*/
            }
        } catch (e) {
            console.error(e);
        }
        this.setPopout(null);
    }

    render() {
        const
            {
                activePanel,
                popout, ethernetConnection,

                isShowOnboard, vk_user,

                receiptAnimation, data, currentSlice,
                modalOpened, showModalContent, isSmallPhone, isIphone6,

                favorite, isFavorite
            } = this.state
        ;

        return vk_user && (data.length > 0 || !ethernetConnection) ? (
            <View
                activePanel={ethernetConnection ? (isShowOnboard ? 'onboard' : activePanel) : 'error'}
                popout={popout}
                style={{
                    overflow: activePanel === 'main' && 'hidden'
                }}
            >
                {
                    [
                        {
                            id: 'onboard',
                            component: <Placeholder
                                icon={<IconOnboard style={{height: '29.5566502vh'}}/>}
                                title='Добро пожаловать'
                                description='Устали от повседневной еды на столе? Пора бы уже попробовать что-то новое. Не беспокойся, мы тебя всему научим.'
                                buttonIcon={<Icon28ChevronRightOutline width={16} height={16}/>}
                                buttonMode='secondary'
                                buttonText='Вперёд'
                                buttonOnClick={async () => {
                                    bridge.send('VKWebAppStorageSet', {key: 'onboard', value: '1'});
                                    await this.setState({isShowOnboard: false});
                                    setTimeout(() => {
                                        try {
                                            this.initializeModal();
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }, 1000);
                                }}
                            />
                        },
                        {
                            id: 'main',
                            component: <div className='Main'>
                                <div
                                    style={{
                                        pointerEvents: !showModalContent && 'none',
                                        background: !showModalContent && 'none',
                                        cursor: showModalContent && 'pointer'
                                    }}
                                    className='Modal_Mask'
                                    onClick={() => {
                                        if (modalOpened) {
                                            const modal = this.bottomModal;
                                            modal.style.bottom = isSmallPhone ? `-45vh` : isIphone6 ? `-35vh` : `-30vh`;
                                            this.setState({modalOpened: false, showModalContent: false});
                                        }
                                    }}
                                />
                                {
                                    <div
                                        className='Receipt Receipt1' ref={(ref) => this.receipt1 = ref}
                                        style={{
                                            transition: 'filter 200ms',
                                            paddingTop: (isSmallPhone || isIphone6) && 'calc(var(--safe-area-inset-top) + var(--panelheader_height_ios))'
                                        }}
                                    >
                                        <h1>{data[currentSlice].title}</h1>
                                        <div className='ingredients'>{data[currentSlice].description}</div>
                                        <div className='img'>
                                            <img alt='img' src={data[currentSlice].img}/>
                                        </div>
                                        <Button
                                            size='m' mode='secondary'
                                            style={{
                                                marginTop: '5.17241379vh',
                                                pointerEvents: receiptAnimation && 'none'
                                            }}
                                            onClick={() => {
                                                this.nextReceiptOptimized();
                                            }}
                                        >
                                            Следующее блюдо
                                        </Button>
                                        <Button
                                            before={<Icon28ClipCircleFillViolet width={16} height={16}/>}
                                            size='m' mode='opacity'
                                            style={{marginTop: 12, pointerEvents: receiptAnimation && 'none'}}
                                            onClick={() => {
                                                openUrl(data[currentSlice].clip_url);
                                            }}
                                        >
                                            Смотреть клип
                                        </Button>
                                    </div>
                                }
                                {
                                    <div
                                        className='Receipt Receipt2' ref={(ref) => this.receipt2 = ref}
                                        style={modalOpened ? {opacity: 0, pointerEvents: 'none'} : {}}
                                    >
                                        <h1 style={{marginTop: (isSmallPhone || isIphone6) && 'calc(var(--safe-area-inset-top) + var(--panelheader_height_ios))'}}>{(data[currentSlice + 1] || data[0]).title}</h1>
                                        <div
                                            className='ingredients'>{(data[currentSlice + 1] || data[0]).description}</div>
                                        <div className='img'>
                                            <img alt='img' src={(data[currentSlice + 1] || data[0]).img}/>
                                        </div>
                                        <Button
                                            size='m' mode='secondary'
                                            style={{
                                                marginTop: '5.17241379vh',
                                                pointerEvents: receiptAnimation && 'none'
                                            }}
                                            onClick={() => {
                                                this.nextReceiptOptimized();
                                            }}
                                        >
                                            Следующее блюдо
                                        </Button>
                                        <Button
                                            before={<Icon28ClipCircleFillViolet width={16} height={16}/>}
                                            size='m' mode='opacity'
                                            style={{marginTop: 12, pointerEvents: receiptAnimation && 'none'}}
                                            onClick={() => {
                                                openUrl((data[currentSlice + 1] || data[0]).clip_url);
                                            }}
                                        >
                                            Смотреть клип
                                        </Button>
                                    </div>
                                }
                                <div
                                    onClick={() => {
                                        if (isDesktop) {
                                            if (!modalOpened) {
                                                this.setState({modalOpened: true, showModalContent: true});
                                                //this.bottomModal.style.bottom = `0vh`;
                                            }
                                        }
                                    }}
                                    style={
                                        receiptAnimation ? {
                                                opacity: receiptAnimation && 0,
                                                bottom: isSmallPhone ? `-45vh` : isIphone6 ? `-35vh` : `-30vh`,
                                                pointerEvents: 'none'
                                            } :
                                            {
                                                bottom: !modalOpened ? (isSmallPhone ? `-45vh` : isIphone6 ? `-35vh` : `-30vh`) : 0,
                                                cursor: !modalOpened && 'pointer'
                                            }
                                    }
                                    ref={ref => this.bottomModal = ref}
                                    className='BottomModal'
                                >
                                    <div className='Dragging'/>
                                    <div style={{
                                        transition: 'all 400ms',
                                        opacity: showModalContent ? 1 : 0
                                    }}>
                                        {
                                            [
                                                {
                                                    icon: <Icon28ArticleOutline/>,
                                                    color_primary: 'rgba(252, 167, 67, 1)',
                                                    color_secondary: 'rgba(252, 167, 67, 0.05)',
                                                    text: 'Посмотреть рецепт',
                                                    onClick: () => this.go('steps'),
                                                    needToClose: true,
                                                    needPopout: true
                                                },
                                                {
                                                    icon: <Icon28UsersOutline/>,
                                                    color_primary: 'rgba(62, 75, 200, 1)',
                                                    color_secondary: 'rgba(62, 75, 200, 0.05)',
                                                    text: 'Бросить вызов друзьям',
                                                    onClick: () => this.shareStory(data[currentSlice].title, data[currentSlice].img),
                                                    needToClose: true
                                                },
                                                (isFavorite === false ? {
                                                            icon: <Icon28FavoriteOutline/>,
                                                            color_primary: 'rgba(15, 199, 121, 1)',
                                                            color_secondary: 'rgba(15, 199, 121, 0.05)',
                                                            text: 'Добавить в избранное',
                                                            separator: true,
                                                            needPopout: true,
                                                            onClick: async () => await this.addToFavorite(data[currentSlice].id)
                                                        } :
                                                        {
                                                            icon: <Icon28DeleteOutline/>,
                                                            color_primary: 'rgba(235, 94, 75, 1)',
                                                            color_secondary: 'rgba(235, 94, 75, 0.05)',
                                                            text: 'Удалить из избранного',
                                                            separator: true,
                                                            needPopout: true,
                                                            onClick: async () => await this.removeFromFavorite(data[currentSlice].id)
                                                        }
                                                ),
                                                {
                                                    icon: <Icon28ListLikeOutline/>,
                                                    color_primary: 'rgba(126, 126, 126, 1)',
                                                    color_secondary: 'rgba(126, 126, 126, 0.05)',
                                                    text: 'Сохранённые рецепты',
                                                    onClick: () => this.go('favorite'),
                                                    needToClose: true,
                                                    needPopout: true
                                                }
                                            ].map(({
                                                       icon,
                                                       color_primary,
                                                       color_secondary,
                                                       text,
                                                       separator,
                                                       onClick,
                                                       needToClose,
                                                       needPopout
                                                   }, index) =>
                                                <React.Fragment
                                                    key={`Modal_Button_${index}`}
                                                >
                                                    <div className='ModalButton'
                                                         style={{
                                                             marginTop: index > 0 && 16,
                                                             pointerEvents: !modalOpened && 'none'
                                                         }}
                                                         onClick={async () => {
                                                             if (needPopout)
                                                                 this.setPopout(<ScreenSpinner/>);

                                                             if (needToClose)
                                                                 if (modalOpened) {
                                                                     const modal = this.bottomModal;
                                                                     modal.style.bottom = isSmallPhone ? `-45vh` : isIphone6 ? `-35vh` : `-30vh`;
                                                                     await this.setState({
                                                                         modalOpened: false,
                                                                         showModalContent: false
                                                                     });
                                                                 }

                                                             setTimeout(() => {
                                                                 if (onClick) {
                                                                     onClick();
                                                                     if (needPopout) {
                                                                         this.setPopout(null);
                                                                     }
                                                                 }
                                                             }, 400);
                                                         }}
                                                    >
                                                        <Avatar
                                                            shadow={false}
                                                            style={{background: color_secondary, color: color_primary}}
                                                        >
                                                            {icon}
                                                        </Avatar>
                                                        <span style={{color: color_primary, marginLeft: 22}}>
                                                        {text}
                                                    </span>
                                                    </div>
                                                    {separator && <div className='ModalSeparator'/>}
                                                </React.Fragment>
                                            )
                                        }
                                    </div>
                                </div>
                            </div>
                        },
                        {
                            id: 'favorite',
                            component: <React.Fragment>
                                <PanelHeader
                                    left={<PanelHeaderBack onClick={() => this.back()}/>}
                                    separator={false}
                                >
                                    Избранное
                                </PanelHeader>
                                {
                                    favorite.length === 0 && <p>Пусто</p>
                                }
                                <div className='Receipts'>
                                    {
                                        favorite.map((value, index) =>
                                            <div key={`Fav__${index}`} onClick={async () => {
                                                let {data, currentSlice} = this.state;
                                                data.splice(data.findIndex(value1 => value1.id === value.id), 1);
                                                data.splice(currentSlice + 1, 0, value);
                                                await this.setState({
                                                    data,
                                                    currentSlice: currentSlice + 1,
                                                    isFavorite: true
                                                });
                                                this.back();
                                            }}>
                                                <div>
                                                    <img alt='img' src={value.img}/>
                                                </div>
                                                <div>{value.title}</div>
                                            </div>
                                        )
                                    }
                                </div>
                            </React.Fragment>
                        },
                        {
                            id: 'steps',
                            component: <React.Fragment>
                                <PanelHeader
                                    left={<PanelHeaderBack onClick={() => this.back()}/>}
                                    separator={false}
                                >
                                    Рецепт
                                </PanelHeader>
                                <div className='Steps'>
                                    <div>
                                        {
                                            data[currentSlice].steps && data[currentSlice].steps.map((value, index) =>
                                                <div key={`Step__${index}`}>
                                                    <div>{index + 1}</div>
                                                    <div>{value}</div>
                                                </div>
                                            )
                                        }
                                    </div>
                                    <div>
                                        <Button
                                            before={<Icon28ClipCircleFillViolet width={16} height={16}/>}
                                            size='m' mode='secondary'
                                            style={{marginTop: 12, pointerEvents: receiptAnimation && 'none'}}
                                            onClick={() => {
                                                openUrl(data[currentSlice].clip_url);
                                            }}
                                        >
                                            Смотреть клип
                                        </Button>
                                    </div>
                                </div>
                            </React.Fragment>
                        },
                        {
                            id: 'error',
                            component: <Placeholder
                                icon={<IconOnboard/>}
                                title='Произошла ошибка'
                                description='Кажется, у Вас отключился интернет. Мы попробуем снова загрузить данные, когда связь восстановится.'
                            />
                        },
                    ].map(({id, component}, index) =>
                        <Panel id={id} key={`Panel__${index}`}>
                            {component}
                        </Panel>
                    )
                }
            </View>
        ) : <div/>;
    }
}

export default RandomCooking;