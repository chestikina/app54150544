import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/DateCelebrity.css';

import {
    Panel,
    View,
    ScreenSpinner, ConfigProvider, ModalRoot, ModalCard, Avatar, Snackbar, DateInput, LocaleProviderContext
} from '@vkontakte/vkui';
import Button from "../components/ClickerBattle/Button";
import {
    animateValue, convertTextToLines, convertTextToLines2,
    decOfNum,
    get,
    getRandomInt,
    getUrlParams,
    isPlatformDesktop,
    loadFonts,
    openUrl,
    shortIntegers, viewportToPixels
} from "../js/utils";
import {Icon16ErrorCircleFill, Icon28AppleOutline} from "@vkontakte/icons";
import {ReactComponent as IconResult} from "../assets/vk_acc_price/icons/coolicon.svg";
import {ReactComponent as IconVkPrice} from "../assets/date_celebrity/icons/vk_acc_price.svg";
import {ReactComponent as PosterIcon} from "../assets/date_celebrity/icons/PosterButtonIcon.svg";
import {ReactComponent as IconShare} from "../assets/date_celebrity/icons/share.svg";
import fetch from 'node-fetch';
import parser from "fast-xml-parser";
import eruda from 'eruda';
import DatePicker from "../components/DateCelebrity/DatePicker";
import {apiUrl, proxyUrl} from "../js/defaults/catalin_tg_bot";

const
    background_src = require('../assets/date_celebrity/bg_catalog.png'),
    //apiUrl = 'https://vds2114385.my-ihor.ru:8085/api/',
    getAppUrl = apiUrl + 'apps.get',

    vkAccPriceAppId = 7912968, // Стоимость страницы
    namesCountryAppId = 7930415, // Твоё имя в разных странах
    catalog = true, // версия для каталога
    version1 = catalog ? true : true, // true - окно с загрузкой фото в альбом, false - автозагрузка фото в альбом
    needSubApp = catalog ? false : false // true - окно с другой прилой + кнопка в меню с прилой
;

class DateCelebrity extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: ['p0'],
            activePanel: 'p0',

            counter: 0,
            maxCount: 14,

            celebrities: [],
            user: {},

            app: {}
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.back = () => {
            if (this.state.popout !== null) {
                this.setState({popout: null});
                window.history.pushState({pop: 'popout'}, 'Title');
                return;
            }
            let {history} = this.state;
            if (history.length === 1) {
                bridge.send('VKWebAppClose', {status: 'success'});
            } else if (history.length > 1) {
                history.pop();
                this.setState({activePanel: history[history.length - 1], history, snackbar: null});
            }
        };
        this.go = (panel) => {
            let {history} = this.state;
            if (history[history.length - 1] !== panel) {
                history.push(panel);
                window.history.pushState({activePanel: panel}, 'Title');
                this.setState({activePanel: panel, history, snackbar: null});
            }
        }
        //eruda.init({tool: ['console', 'elements']});
    }

    async componentDidMount() {
        /*['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].forEach(month => {
            const data = require(`../assets/date_celebrity/data/${month}.json`);
            for(const value of data) {
                try{
                    require(`../assets/date_celebrity/data/${month}/${value[1].split('.')[0]}/${value[0]}.png`);
                } catch (e) {
                    console.log(value);
                    console.error(e);
                }
            }
            console.log('done');
        });*/

        //get(apiUrl + 'users.join', getUrlParams());

        window.addEventListener('offline', async event => {
            const intervals = setInterval(() => {
            }, 1000);
            for (let i = 0; i <= intervals; i++) {
                clearInterval(i);
            }
            await this.setState({history: [], activeModal: null, modalHistory: [], popout: null});
            await this.setState({activePanel: 'error'});
        });

        window.addEventListener('online', async event => {
            document.location.reload();
        });

        loadFonts(['Gilroy Semibold']);

        window.addEventListener('popstate', e => {
            e.preventDefault();
            this.back();
        });

        bridge.subscribe(async ({detail: {type, data}}) => {
            if (type !== undefined) console.log(type, data);
            if (type === 'VKWebAppUpdateConfig') {
                const schemeAttribute = document.createAttribute('scheme');
                schemeAttribute.value = 'bright_light';
                document.body.attributes.setNamedItem(schemeAttribute);
                if (bridge.supports('VKWebAppSetViewSettings')) {
                    bridge.send('VKWebAppSetViewSettings', {
                        status_bar_style: 'light',
                        action_bar_color: '#091725'
                    });
                }
            } else if (type === 'VKWebAppViewHide') {
                if (this.state.activePanel === 'p4') {
                    this.isHide = true;
                }
            } else if (type === 'VKWebAppViewRestore') {
                if (this.isHide) {
                    document.location.reload();
                }
            }
        });

        bridge.send('VKWebAppInit');
        bridge.send('VKWebAppEnableSwipeBack');

        const
            user = await bridge.send('VKWebAppGetUserInfo'),
            bdate = user.bdate && user.bdate.split('.'),
            bdate_json = bdate && {
                day: parseInt(bdate[0]),
                month: parseInt(bdate[1])
            }
        ;
        this.setState({defaultDate: bdate_json, dateValue: bdate ? bdate_json : {day: 1, month: 1}, user});
        this.setState({app: (await get(getAppUrl, {app_id: getUrlParams().vk_app_id})).response});
    }

    async getToken(scope) {
        const response = await bridge.send('VKWebAppGetAuthToken', {
            app_id: parseInt(getUrlParams().vk_app_id),
            scope
        });

        if (response.scope.split(', ').length === scope.split(', ').length)
            return response.access_token;
        else
            return false;
    }

    async shareStory() {
        try {
            this.setState({popout: <ScreenSpinner/>});
            const canvas = await this.getStoryCanvas();
            await bridge.send('VKWebAppShowStoryBox', {
                background_type: 'image',
                blob: canvas.toDataURL('image/png'),
                attachment: {
                    text: 'go_to',
                    type: 'url',
                    url: `https://vk.com/app${getUrlParams().vk_app_id}`
                }
            });
            this.setState({popout: null});

            if (this.state.token) {
                canvas.toBlob(async function (blob) {
                    this.uploadStoryPhotoToWall(blob);
                }.bind(this));
            }
        } catch (e) {
            this.setState({popout: null});
        }

        if (catalog) {
            return;
        }

        if (needSubApp)
            this.go('p5');
        else
            this.go('p6');
    }

    async getStoryCanvas() {
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d'),

            background = await loadImage(require(`../assets/date_celebrity/Story${this.state.user.sex === 1 ? '_1' : ''}.png`)),

            {celebrities} = this.state
        ;

        ctx.drawImage(background, 0, 0);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFFFFF';

        const
            textSize = 65,
            textFont = textSize + 'px Gilroy Semibold'
        ;

        ctx.font = textFont;

        for (const i in celebrities) {
            const
                image = await loadImage(celebrities[i][2]),
                size = 227,
                isMinHeight = Math.min(image.height, image.width) === image.height,
                k = (isMinHeight ? image.height : image.width) / size,
                sizes = [isMinHeight ? image.width / k : size, isMinHeight ? size : image.height / k]
            ;

            if (celebrities[i].length < 4) {
                celebrities[i].push([isMinHeight ? image.width / ((isMinHeight ? image.height : image.width) / 80) : 80, isMinHeight ? 80 : image.height / ((isMinHeight ? image.height : image.width) / 80)]);
            }

            ctx.save();
            ctx.beginPath();
            ctx.arc(150 + 227 / 2, 516 + 297 * i + 227 / 2, size / 2, 0, 2 * Math.PI, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(image, 150, 516 + 297 * i, sizes[0], sizes[1]);
            ctx.restore();

            const
                text = celebrities[i][0],
                textLines = convertTextToLines2(text, textFont, 400),
                offsetCenter = textLines.length === 1 ? 30 : (textSize * textLines.length + (25 * textLines.length / 2))
            ;

            for (let j in textLines) {
                ctx.fillText(textLines[j], 419, false ? (590 + 40 + 297 * i) : ((590 + 297 * i + textSize * (textLines.length - 1) + 30) + textSize + (textSize + 5) * j - offsetCenter));
            }

            //ctx.fillText(text, 419, 590 + 61 + 297 * i);
        }

        this.setState({celebrities});

        return canvas;
    }

    async uploadStoryPhotoToWall(blob) {
        const
            uploadWallUrl = (await bridge.send('VKWebAppCallAPIMethod', {
                method: 'photos.getWallUploadServer',
                params: {
                    v: '5.126',
                    access_token: this.state.token
                }
            })).response.upload_url,
            bodyFormData = new FormData()
        ;

        bodyFormData.append('photo', blob, 'image.png');

        try {
            fetch(proxyUrl + uploadWallUrl, {
                method: 'POST',
                body: bodyFormData
            })
                .then(res_ => {
                    return res_.json();
                })
                .then(async response => {
                    const {server, photo, hash} = response;
                    const wallPhoto = (await bridge.send('VKWebAppCallAPIMethod', {
                        method: 'photos.saveWallPhoto',
                        params: {
                            server,
                            photo,
                            hash,
                            caption: `💰 Узнай сколько стоит твоя страница в приложении - https://vk.com/app${getUrlParams().vk_app_id}`,
                            v: '5.126',
                            access_token: this.state.token
                        }
                    })).response[0];

                    bridge.send('VKWebAppShowWallPostBox', {
                        message: '',
                        copyright: 'https://vk.com/app' + getUrlParams().vk_app_id,
                        attachments: `photo${wallPhoto.owner_id}_${wallPhoto.id}`
                    });
                });
        } catch (e) {
            console.error(e);
        }
    }

    async uploadStoryPhotoToAlbum(blob) {
        const
            access_token = this.state.temp_token || await this.getToken('photos'),
            album_id = (await bridge.send('VKWebAppCallAPIMethod', {
                method: 'photos.createAlbum',
                params: {
                    title: 'Знаменитости',
                    v: '5.126',
                    access_token
                }
            })).response.id,
            uploadAlbumUrl = (await bridge.send('VKWebAppCallAPIMethod', {
                method: 'photos.getUploadServer',
                params: {
                    album_id,
                    v: '5.126',
                    access_token
                }
            })).response.upload_url,
            bodyFormData = new FormData()
        ;

        bodyFormData.append('photo', blob, 'image.png');

        try {
            fetch(proxyUrl + uploadAlbumUrl, {
                method: 'POST',
                body: bodyFormData
            })
                .then(res_ => {
                    return res_.json();
                })
                .then(async response => {
                    const {server, photos_list, hash} = response;
                    await bridge.send('VKWebAppCallAPIMethod', {
                        method: 'photos.save',
                        params: {
                            album_id,
                            server,
                            photos_list,
                            hash,
                            caption: `Узнал с какими знаменитостями родился в один день в приложении - https://vk.com/app${getUrlParams().vk_app_id}`,
                            v: '5.126',
                            access_token
                        }
                    });
                });
        } catch (e) {
            console.error(e);
        }
        return true;
    }

    async loading() {
        console.log({loadDataFor: this.state.dateValue});
        try {
            this.setState({popout: <ScreenSpinner/>, snackbar: null});
            if (!catalog) {
                await bridge.send('VKWebAppShowNativeAds', {ad_format: 'interstitial'});
            }
        } catch (e) {
        }
        await this.setState({popout: null});

        let
            interval = setInterval(async () => {
                let
                    {counter, maxCount} = this.state
                ;
                if (!this.state.subShow) {
                    if (counter >= maxCount - 1) {
                        clearInterval(interval);

                        if (catalog) {
                            await this.getStoryCanvas();
                            this.setState({popout: null, activePanel: 'p6', history: ['p6']})
                        } else {
                            this.go('p3');
                        }

                        if (!catalog) {
                            try {
                                await bridge.send('VKWebAppShowNativeAds', {ad_format: 'interstitial'});
                            } catch (e) {
                            }
                        }
                        return;
                    } else {
                        this.setState({counter: counter + 1});
                    }
                    if (counter === 10) {
                        if (catalog) {
                            try {
                                await bridge.send('VKWebAppShowNativeAds', {ad_format: 'interstitial'});
                            } catch (e) {
                            }
                        }
                        if (!catalog) {
                            this.setState({subShow: true, activeModal: 'group'});
                        }
                    }
                }
            }, 1250);
        this.setState({popout: null, activePanel: 'p2'});
    }

    render() {
        const
            currentDate = new Date(),
            {
                activePanel, activeModal, popout,
                app,
                counter, maxCount,
                dateValue,
                snackbar,
                celebrities,
                defaultDate,
                user
            } = this.state,

            panels = [
                {
                    description: <React.Fragment>
                        <div>Выбери день и месяц рождения:</div>
                        {
                            catalog ?
                                <LocaleProviderContext.Provider value='ru'>
                                    {
                                        true ?
                                            <DatePicker
                                                className='InputDatePicker'
                                                defaultValue={defaultDate}
                                                onChange={(value) => {
                                                    console.log({onChange: value});
                                                    this.setState({dateValue: value});
                                                }}
                                            />
                                            :
                                            <DateInput
                                                className='InputDatePicker'
                                                value={this.state.dateValue}
                                                onChange={value => this.setState({dateValue: value})}
                                                enableTime={false}
                                                disablePast={false}
                                                disableFuture={true}
                                                closeOnChange={true}
                                                disablePickers={false}
                                                showNeighboringMonth={false}
                                                size='s'
                                            />
                                    }
                                </LocaleProviderContext.Provider>
                                :
                                <React.Fragment>
                                    <input
                                        type='date'
                                        className='InputDateHidden'
                                        ref={ref => this.dateRef = ref}
                                        onInput={value => {
                                            this.setState({dateValue: this.dateRef.value});
                                        }}
                                        max={new Date().toLocaleString('ru', {
                                            month: 'numeric',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    />
                                    <div
                                        className='InputDate'
                                        onClick={() => {
                                            this.dateRef.focus();
                                            this.dateRef.click();
                                        }}
                                    >
                                        {
                                            (this.dateRef && this.dateRef.value && new Date(this.dateRef.value).toLocaleString('ru', {
                                                month: 'numeric',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })) || 'Пример: 21.01.2001'
                                        }
                                    </div>
                                </React.Fragment>
                        }
                    </React.Fragment>,
                    button:
                        <Button
                            onClick={async () => {
                                if (dateValue && dateValue.day > 0 && dateValue.month > 0) {
                                    if (!catalog) {
                                        try {
                                            await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                                group_id: app.group_id_message[0],
                                                key: 'FSDIfulnwje'
                                            });
                                        } catch (e) {
                                        }
                                    }

                                    const
                                        {day, month} = this.state.dateValue,
                                        celebrities = (require(`../assets/date_celebrity/data/${(month).toString().padStart(2, '0')}.json`))
                                            .filter(value => value[1].startsWith(`${(day).toString().padStart(2, '0')}.${(month).toString().padStart(2, '0')}`))
                                            .map(value => {
                                                return [...value, require(`../assets/date_celebrity/data/${(month).toString().padStart(2, '0')}/${(day).toString().padStart(2, '0')}/${value[0]}.png`)]
                                            })
                                    ;

                                    await this.setState({subShow: false, celebrities});

                                    console.log({celebrities: celebrities.length});
                                    if (celebrities.length < 1) {
                                        this.setState({
                                            snackbar: <Snackbar
                                                onClose={() => this.setState({snackbar: null})}
                                                before={<Icon16ErrorCircleFill width={20} height={20}/>}
                                            >
                                                Некорректная дата
                                            </Snackbar>
                                        });
                                        return;
                                    }

                                    if (catalog) {
                                        this.loading();
                                        return;
                                    }
                                    if (!version1) {
                                        try {
                                            const
                                                canvas = await this.getStoryCanvas(),
                                                blob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob)))
                                            ;
                                            await this.uploadStoryPhotoToAlbum(blob);
                                            //get(apiUrl + 'album.savePhoto', getUrlParams());
                                        } catch (e) {
                                        }
                                        this.loading();
                                    } else {
                                        this.setState({activePanel: 'save_photo'});
                                    }
                                } else {
                                    if (snackbar) return;
                                    this.setState({
                                        snackbar: <Snackbar
                                            onClose={() => this.setState({snackbar: null})}
                                            before={<Icon16ErrorCircleFill width={20} height={20}/>}
                                        >
                                            Вы не ввели дату!
                                        </Snackbar>
                                    });
                                }
                            }}
                        >
                            Продолжить
                        </Button>
                },
                {
                    title: 'Идёт анализ',
                    description: 'Ищем подходящих знаменитостей...'
                },
                {
                    title: 'Анализ завершен',
                    button:
                        <Button
                            onClick={() => {
                                this.shareStory();
                                //this.setState({activePanel: 'p5', history: ['p5']})
                            }}
                        >
                            Опубликовать анализ в истории
                        </Button>
                },
            ],

            modal = (
                <ModalRoot
                    activeModal={activeModal}
                    onClose={() => this.setState({activeModal: null})}
                >
                    <ModalCard
                        id='group'
                        onClose={() => {
                            this.setState({subShow: false, activeModal: null});
                        }}
                        icon={<Avatar size={72} shadow={false}
                                      src={require('../assets/date_celebrity/icons/ic_group.png')}/>}
                        header='Пока ты ждешь анализ, подпишись на наш крутой паблик. Тебе понравится!'
                        actions={
                            <Button
                                onClick={async () => {
                                    try {
                                        await bridge.send('VKWebAppJoinGroup', {
                                            group_id: app.group_id_join[0],
                                            key: 'FSDIfulnwje'
                                        });
                                    } catch (e) {
                                        console.error(e);
                                    }
                                    this.setState({subShow: false, activeModal: null});
                                }}>
                                Присоединиться
                            </Button>
                        }
                    />
                </ModalRoot>
            )
        ;

        return (
            <ConfigProvider isWebView={true}>
                <View
                    activePanel={activePanel}
                    popout={popout}
                    onSwipeBack={this.back}
                    modal={modal}
                >
                    <Panel id='p0'>
                        <div className='FullScreen__Container'>
                            <div className='FullScreen__Title'>
                                Салют!
                            </div>
                            <div className='FullScreen__Description'>
                                Давай узнаем, с кем из знаменитостей ты {user.sex === 1 ? 'родилась' : 'родился'} в один
                                день!
                            </div>
                        </div>
                        <Button
                            onClick={async () => await this.setState({
                                activePanel: 'p1',
                                temp_token: catalog ? false : await this.getToken('photos')
                            })}
                        >
                            Ок
                        </Button>
                        <img alt='bg' className='Background' src={background_src}/>
                    </Panel>
                    {
                        panels.map((value, index) =>
                            <Panel id={`p${index + 1}`} key={`p${index + 1}`}>
                                <div className='FullScreen__Container'>
                                    <img alt='icon' className='FullScreen__Icon'
                                         src={value.icon ? value.icon : require('../assets/date_celebrity/icons/' + (index + 1) + '.png')}/>
                                    <div className='FullScreen__Title'>
                                        {value.title}
                                    </div>
                                    {
                                        value.description && <div className='FullScreen__Description' style={{
                                            fontSize: !value.title && '2.95566502vh'
                                        }}>
                                            {value.description}
                                        </div>
                                    }
                                </div>
                                {value.button && React.cloneElement(value.button, {style: {zIndex: 3}})}
                                {
                                    ((index + 1) === 2 || (index + 1) === 3) && <React.Fragment>
                                        <div
                                            className='PercentTitle'
                                        >
                                            {(index + 1) === 3 ? 100 : Math.round(100 / maxCount * counter)}%
                                        </div>
                                        <img alt='wave' className={isPlatformDesktop() ? 'Loading_PC' : 'Loading'}
                                             src={require('../assets/date_celebrity/loading.png')}/>
                                    </React.Fragment>
                                }
                                {snackbar}
                                <img alt='bg' className='Background'
                                     src={background_src}/>
                            </Panel>
                        )
                    }

                    <Panel id='save_photo'>
                        <div className='FullScreen__Container'>
                            <img alt='icon' className='FullScreen__Icon'
                                 src={require('../assets/date_celebrity/icons/camera.png')}/>
                            <div className='FullScreen__Title'>
                                Сохранить результат сразу к тебе в альбом?
                            </div>
                        </div>
                        <div className='HorizontalButtons'>
                            <Button
                                onClick={async () => {
                                    try {
                                        this.setState({popout: <ScreenSpinner/>});

                                        const
                                            canvas = await this.getStoryCanvas(),
                                            blob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob)))
                                        ;
                                        await this.uploadStoryPhotoToAlbum(blob);
                                        //get(apiUrl + 'album.savePhoto', getUrlParams());
                                    } catch (e) {
                                        console.error(e);
                                        this.setState({popout: null});
                                    }
                                    this.loading();
                                }}
                            >
                                Да
                            </Button>
                            <Button
                                onClick={async () => {
                                    this.loading();
                                }}
                            >
                                Нет
                            </Button>
                        </div>
                        {snackbar}
                        <img alt='bg' className='Background' src={background_src}/>
                    </Panel>
                    <Panel id='p6'>
                        <div className='FullScreen__Container'>
                            <div className='ButtonContainer'>
                                {
                                    [
                                        {
                                            icon: <IconResult/>,
                                            text: 'Посмотреть результат',
                                            onClick: () => {
                                                this.go('p4');
                                            }
                                        },
                                        ...catalog && app.group_id_join && app.group_id_join[0] ? [{
                                            icon: <Icon28AppleOutline/>,
                                            text: 'Подписаться на паблик приложения',
                                            onClick: async () => {
                                                try {
                                                    await bridge.send('VKWebAppJoinGroup', {
                                                        group_id: app.group_id_join[0],
                                                        key: 'kjdoaISDjn'
                                                    });
                                                } catch (e) {
                                                    console.error(e);
                                                }
                                            }
                                        }] : [],
                                        ...needSubApp ? [{
                                            icon: <IconVkPrice/>,
                                            text: 'Узнать сколько стоит твоя страница',
                                            onClick: () => {
                                                openUrl('https://vk.com/app' + vkAccPriceAppId);
                                            }
                                        }] : []
                                    ].map((value, index) =>
                                        <Button
                                            key={'btn-' + index}
                                            before={value.icon}
                                            onClick={() => value.onClick()}
                                            style={{
                                                marginTop: index > 0 && 27
                                            }}
                                        >
                                            {value.text}
                                        </Button>
                                    )
                                }
                            </div>
                        </div>
                        <img alt='bg' className='Background' src={background_src}/>
                    </Panel>
                    <Panel id='p4'>
                        <div className='ResultTitle'>
                            Я {user.sex === 1 ? 'родилась' : 'родился'} в один день<br/>
                            <span className='PosterColoredText'>с этими знаменитостями:</span>
                        </div>
                        <div style={{height: '4.8vh'}}/>
                        {
                            celebrities.map((value, index) =>
                                <div className='Celebrity' key={`celebrity_${index}`}
                                     style={{marginTop: index > 0 && '3.45vh'}}>
                                    <div style={{
                                        borderRadius: '50%',
                                        overflow: 'hidden'
                                    }}>
                                        {value[3] &&
                                            <img alt='img' src={value[2]} width={value[3][0]} height={value[3][1]}/>}
                                    </div>
                                    <span>{value[0]}</span>
                                </div>
                            )
                        }
                        <Button
                            className='FullScreen__Button'
                            before={<IconShare/>}
                            onClick={() => this.shareStory()}
                            style={{bottom: viewportToPixels('10.84vh')}}
                        >
                            Поделиться в истории
                        </Button>
                        <img alt='bg' className='Background' src={background_src}/>
                    </Panel>
                    <Panel id='p5'>
                        <div className='PosterHeader'>
                            Хочешь узнать как звучит твоё имя в разных странах?
                        </div>
                        <div className='PosterText' style={{
                            fontWeight: 500,
                            fontSize: '2.96vh',
                            marginTop: 8
                        }}>
                            Тогда переходи в наше<br/>
                            <span className='PosterColoredText'>новое приложение</span>
                        </div>
                        <img alt='poster' className='PosterImage'
                             src={require('../assets/date_celebrity/poster_names_country.png')}/>
                        <div className='ButtonsContainer'>
                            <Button
                                before={<PosterIcon/>}
                                onClick={() => openUrl('https://vk.com/app' + namesCountryAppId)}
                            >
                                Перейти в приложение
                            </Button>
                            <Button
                                style={{
                                    marginTop: '3.32vh'
                                }}
                                onClick={() =>
                                    this.setState({activePanel: 'p6', history: ['p6']})
                                }
                            >
                                Вернуться к результату
                            </Button>
                        </div>
                        <img alt='bg' className='Background' src={background_src}/>
                    </Panel>
                    <Panel id='error'>
                        <div className='FullScreen__Container'>
                            <div className='FullScreen__Title'>
                                Упс
                            </div>
                            <div className='FullScreen__Description'>
                                Мы потеряли связь с сервером...
                            </div>
                        </div>
                        <img alt='bg' className='Background' src={background_src}/>
                    </Panel>
                </View>
            </ConfigProvider>
        );
    }
}

export default DateCelebrity;