import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/NameInCountry.css';

import {
    Panel,
    View,
    ScreenSpinner, ConfigProvider, ModalRoot, ModalCard, Avatar, Snackbar
} from '@vkontakte/vkui';
import Button from "../components/ClickerBattle/Button";
import {animateValue, decOfNum, get, getRandomInt, getUrlParams, loadFonts, openUrl, shortIntegers} from "../js/utils";
import {Icon16ErrorCircleFill} from "@vkontakte/icons";
import {ReactComponent as IconResult} from "../assets/name_in_country/icons/result.svg";
import {ReactComponent as IconVkPrice} from "../assets/date_celebrity/icons/vk_acc_price.svg";
import {ReactComponent as IconDateCelebrity} from "../assets/name_in_country/icons/date_celebrity.svg";
import {ReactComponent as PosterIcon} from "../assets/name_in_country/icons/PosterButtonIcon.svg";
import {ReactComponent as IconShare} from "../assets/name_in_country/icons/share.svg";
import fetch from 'node-fetch';
import parser from "fast-xml-parser";

const
    apiUrl = 'https://vds2153927.my-ihor.ru:8085/api/',
    getAppUrl = 'https://vds2153919.my-ihor.ru:8081/api/apps.get',
    proxyUrl = ['https://murmuring-bastion-20764.herokuapp.com/', 'https://vds2153919.my-ihor.ru:8088/'][getRandomInt(0, 1)],

    dateCelebrityAppId = 7930419, // Знаменитости в дату рождения
    vkAccPriceAppId = 7912968, // Стоимость страницы вк
    version1 = false, // true - старая, false - новая
    needSubApp = false, // true - окно с другой прилой + кнопка в меню с прилой

    countries = {
        ru: 'Русский',
        fr: 'Французский',
        by: 'Белорусский',
        an: 'Антарктида',
        ge: 'Грузия',
        gb: 'Шотландский',
        br: 'Бразилия'
    }
;

class NameInCountry extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: ['p0'],
            activePanel: 'p0',

            counter: 0,
            maxCount: 14,

            names: {}
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
    }

    async componentDidMount() {
        get(apiUrl + 'users.join', getUrlParams());

        loadFonts(['TT Firs Neue DemiBold', 'TT Firs Neue Medium']);

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
                        action_bar_color: '#363B90'
                    });
                }
            } else if (type === 'VKWebAppViewRestore') {
                this.setState({popout: null});
            }
        });

        this.setState({app: (await get(getAppUrl, {app_id: getUrlParams().vk_app_id})).response});

        bridge.send('VKWebAppInit');
        bridge.send('VKWebAppEnableSwipeBack');
    }

    async getToken(scope) {
        try {
            const response = await bridge.send('VKWebAppGetAuthToken', {
                app_id: parseInt(getUrlParams().vk_app_id),
                scope
            });

            if (response.scope.split(', ').length === scope.split(', ').length)
                return response.access_token;
            else
                return false;
        } catch (e) {
            return false;
        }
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

        if (needSubApp) {
            this.go('p8');
        } else {
            this.go('p7');
        }
    }

    async getStoryCanvas() {
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d'),

            background = await loadImage(require('../assets/name_in_country/Story.png')),
            temp_story = await loadImage(require('../assets/name_in_country/story_temp.jpg')),

            {names} = this.state,
            keys = Object.keys(names)
        ;

        if (keys.length === 0) {
            ctx.drawImage(temp_story, 0, 0);
        } else {
            ctx.drawImage(background, 0, 0);
            ctx.textAlign = 'left';
            ctx.fillStyle = '#FFFFFF';

            ctx.font = '144px TT Firs Neue DemiBold';
            ctx.fillText(this.state.nameValue.toUpperCase(), 107, 380 + 137);

            ctx.font = '58px TT Firs Neue Medium';
            for (const i in keys) {
                const
                    key = keys[i],
                    name = names[key] + ' - ',
                    country = countries[key]
                ;

                ctx.fillText(name, 107, 774 + 55 + i * 110);
                const {width} = ctx.measureText(name);
                ctx.fillText(country, 107 + width, 774 + 55 + i * 110);
            }
        }

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
                    title: 'Твое имя в разных странах',
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
                            caption: `Узнал как звучит моё имя в разных странах в приложении - https://vk.com/app${getUrlParams().vk_app_id}`,
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
        bridge.send('VKWebAppShowNativeAds', {ad_format: 'preloader'});

        this.setState({subShow: false});
        let
            interval = setInterval(async () => {
                let
                    {counter, maxCount} = this.state
                ;
                if (!this.state.subShow) {
                    if (counter === maxCount - 2) {
                        bridge.send('VKWebAppShowNativeAds', {ad_format: 'preloader'});
                    }
                    if (counter >= maxCount - 1) {
                        clearInterval(interval);
                        const {names} = this.state;
                        if (names === null) {
                            this.go('p4');
                        } else {
                            this.go('p3');
                        }

                        return;
                    } else {
                        this.setState({counter: counter + 1});
                    }
                    if (counter === 10) {
                        this.setState({subShow: true, activeModal: 'group'});
                    }
                }
            }, 1250);

        this.setState({popout: null, activePanel: 'p2'});
    }

    render() {
        const
            {
                activePanel, activeModal, popout,
                app,
                counter, maxCount,
                nameValue,
                snackbar,
                names
            } = this.state,

            panels = [
                {
                    icon: false,
                    title: 'Напиши своё имя',
                    description: <React.Fragment>
                        <div>Чтобы мы подобрали аналоги из других стран</div>
                        <input
                            type='text'
                            className='InputName'
                            placeholder='Пример: Иван'
                            onInput={value => {
                                this.setState({nameValue: value.target.value});
                            }}
                        />
                    </React.Fragment>,
                    button:
                        <Button
                            onClick={async () => {
                                if (nameValue) {
                                    try {
                                        await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                            group_id: app.group_id_message[0],
                                            key: 'FSDIfulnwje'
                                        });
                                    } catch (e) {
                                    }

                                    const
                                        name_ = this.state.nameValue.slice(0, 1).toUpperCase() + this.state.nameValue.substring(1),
                                        names = (await get(apiUrl + 'names.get', {name: name_})).response
                                    ;
                                    if (names !== null)
                                        delete names.ru;

                                    if (!version1) {
                                        try {
                                            const
                                                canvas = await this.getStoryCanvas(),
                                                blob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob)))
                                            ;
                                            await this.uploadStoryPhotoToAlbum(blob);
                                            get(apiUrl + 'album.savePhoto', getUrlParams());
                                        } catch (e) {
                                        }
                                    } else {
                                        this.setState({activePanel: 'save_photo'});
                                    }

                                    await this.setState({
                                        subShow: false,
                                        nameValue: name_,
                                        names,
                                        activePanel: names === null ? 'p2' : (version1 ? 'save_photo' : 'p2')
                                    });

                                    if (names === null || !version1)
                                        this.loading();
										
                                } else {
                                    if (snackbar) return;
                                    this.setState({
                                        snackbar: <Snackbar
                                            onClose={() => this.setState({snackbar: null})}
                                            before={<Icon16ErrorCircleFill width={20} height={20}/>}
                                        >
                                            Вы не ввели имя!
                                        </Snackbar>
                                    });
                                }
                            }}
                        >
                            Продолжить
                        </Button>
                },
                {
                    icon: require('../assets/name_in_country/icons/loading.svg'),
                    title: 'Собираем данные',
                    description: 'Связываемся с нашими агентами из других стран...'
                },
                {
                    icon: require('../assets/name_in_country/icons/loading_end.svg'),
                    title: 'Данные собраны!',
                    button:
                        <Button
                            onClick={() => {
                                this.shareStory();
                            }}
                        >
                            Опубликовать анализ в истории
                        </Button>
                },
                {
                    title: 'К сожалению вашего имени нет в базе. Мы его скоро добавим!',
                    description: 'Разрешите отправлять вам уведомления и как только все будет готовы, мы вас оповестим.',
                    button:
                        <Button
                            onClick={async () => {
                                await bridge.send('VKWebAppAllowNotifications');
                                get(apiUrl + 'names.add', {name: this.state.nameValue});
                                get(apiUrl + 'notify.enable', getUrlParams());
                                if (needSubApp) {
                                    this.go('p6');
                                } else {
                                    document.location.reload();
                                }
                            }}
                        >
                            Разрешить
                        </Button>
                }
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
                            <img alt='ic' src={require('../assets/name_in_country/icons/main_icon.png')}/>
                            <div className='FullScreen__Title'>
                                Салют!
                            </div>
                            <div className='FullScreen__Description'>
                                Давай узнаем как тебя бы звали в других странах!
                            </div>
                            <div className='FullScreen__SubDescription'>
                                *Представленные имена не являются задокументированными аналогами, все переносы имён в
                                другие языки - всего лишь представление автора
                            </div>
                        </div>
                        <Button
                            onClick={async () => await this.setState({
                                activePanel: 'p1',
                                temp_token: await this.getToken('photos')
                            })}
                        >
                            Ок
                        </Button>
                        <img alt='bg' className='Background' src={require('../assets/name_in_country/bg.png')}/>
                    </Panel>
                    {
                        panels.map((value, index) =>
                            <Panel id={`p${index + 1}`} key={`p${index + 1}`}>
                                <div className='FullScreen__Container'>
                                    {
                                        value.icon !== false &&
                                        <img alt='icon' className='FullScreen__Icon'
                                             src={value.icon ? value.icon : require('../assets/name_in_country/icons/' + (index + 1) + '.png')}/>
                                    }
                                    {
                                        ((index + 1) === 2 || (index + 1) === 3) && <React.Fragment>
                                            <div
                                                className='PercentTitle'
                                            >
                                                {(index + 1) === 3 ? 100 : Math.round(100 / maxCount * counter)}%
                                            </div>
                                        </React.Fragment>
                                    }
                                    <div className='FullScreen__Title'>
                                        {value.title}
                                    </div>
                                    {
                                        value.description && <div className='FullScreen__Description' style={{
                                            fontSize: !value.title && 24
                                        }}>
                                            {value.description}
                                        </div>
                                    }
                                </div>
                                {value.button && React.cloneElement(value.button, {style: {zIndex: 3}})}
                                {snackbar}
                                <img alt='bg' className='Background' src={require('../assets/name_in_country/bg.png')}/>
                            </Panel>
                        )
                    }
                    <Panel id='save_photo'>
                        <div className='FullScreen__Container'>
                            <img alt='icon' className='FullScreen__Icon'
                                 src={require('../assets/name_in_country/icons/camera.png')}/>
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
                                        get(apiUrl + 'album.savePhoto', getUrlParams());
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
                        <img alt='bg' className='Background' src={require('../assets/name_in_country/bg.png')}/>
                    </Panel>
                    <Panel id='p5'>
                        <div className='ResultColoredText'>
                            Ваше имя:
                        </div>
                        <div className='ResultName'>
                            {nameValue}
                        </div>
                        <div style={{marginTop: 23}} className='ResultColoredText'>
                            Варианты из других стран:
                        </div>
                        <div>
                            {
                                names !== null && Object.keys(names).map(
                                    (key, index) =>
                                        <div
                                            style={{
                                                marginTop: index === 0 ? 20 : 14
                                            }}
                                            key={`name-${index}`}
                                            className='ResultNames'
                                        >
                                            {names[key] + ' - '} <span
                                            style={{fontFamily: 'TT Firs Neue DemiBold'}}>{countries[key]}</span>
                                        </div>
                                )
                            }
                        </div>
                        <Button
                            className='FullScreen__Button'
                            before={<IconShare/>}
                            onClick={() => this.shareStory()}
                        >
                            Поделиться в истории
                        </Button>
                        <img alt='bg' className='Background' src={require('../assets/name_in_country/bg.png')}/>
                    </Panel>
                    <Panel id='p6'>
                        <div className='PosterHeader'>
                            Пока ждешь добавления в базу
                        </div>
                        <div className='PosterText' style={{
                            fontWeight: 500,
                            fontSize: '2.96vh',
                            marginTop: 8
                        }}>
                            Узнай сколько стоит твоя страница!
                        </div>
                        <img alt='poster' className='PosterImage'
                             src={require('../assets/name_in_country/poster_vk_acc_price.png')}/>
                        <div className='ButtonsContainer'>
                            <Button
                                before={<PosterIcon/>}
                                onClick={() => openUrl('https://vk.com/app' + vkAccPriceAppId)}
                            >
                                Перейти в приложение
                            </Button>
                            <Button
                                style={{
                                    marginTop: '3.32vh'
                                }}
                                onClick={() => {
                                    document.location.reload();
                                }}
                            >
                                Ввести другое имя
                            </Button>
                        </div>
                        <img alt='bg' className='Background' src={require('../assets/name_in_country/bg.png')}/>
                    </Panel>
                    <Panel id='p7'>
                        <div className='FullScreen__Container'>
                            <div className='ButtonContainer'>
                                {
                                    [
                                        {
                                            icon: <IconResult/>,
                                            text: 'Посмотреть результат',
                                            onClick: () => {
                                                this.go('p5');
                                            }
                                        },
                                        ...needSubApp ? [{
                                            icon: <IconDateCelebrity/>,
                                            text: 'С кем из знаменитостей ты родился в один день',
                                            onClick: () => {
                                                openUrl('https://vk.com/app' + dateCelebrityAppId);
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
                        <img alt='bg' className='Background' src={require('../assets/name_in_country/bg.png')}/>
                    </Panel>
                    <Panel id='p8'>
                        {
                            true ? <React.Fragment>
                                    <div className='PosterHeader'>
                                        Хочешь узнать сколько стоит твоя страница в ВК?
                                    </div>
                                    <div className='PosterText' style={{
                                        fontWeight: 500,
                                        fontSize: '2.96vh',
                                        marginTop: 8
                                    }}>
                                        Тогда переходи в наше новое приложение
                                    </div>
                                    <img alt='poster' className='PosterImage'
                                         src={require('../assets/name_in_country/poster_vk_acc_price.png')}/>
                                    <div className='ButtonsContainer'>
                                        <Button
                                            before={<PosterIcon/>}
                                            onClick={() => openUrl('https://vk.com/app' + vkAccPriceAppId)}
                                        >
                                            Перейти в приложение
                                        </Button>
                                        <Button
                                            style={{
                                                marginTop: '3.32vh'
                                            }}
                                            onClick={() =>
                                                this.setState({activePanel: 'p7', history: ['p7']})
                                            }
                                        >
                                            Вернуться к результату
                                        </Button>
                                    </div>
                                </React.Fragment>
                                :
                                <React.Fragment>
                                    <div className='PosterHeader'>
                                        Хочешь узнать с какими знаменитостями ты родился в один день?
                                    </div>
                                    <div className='PosterText' style={{
                                        fontWeight: 500,
                                        fontSize: '2.96vh',
                                        marginTop: 8
                                    }}>
                                        Тогда переходи в наше новое приложение!
                                    </div>
                                    <img alt='poster' className='PosterImage'
                                         src={require('../assets/name_in_country/poster_date_celebrity.png')}/>
                                    <div className='ButtonsContainer'>
                                        <Button
                                            before={<PosterIcon/>}
                                            onClick={() => openUrl('https://vk.com/app' + dateCelebrityAppId)}
                                        >
                                            Перейти в приложение
                                        </Button>
                                        <Button
                                            style={{
                                                marginTop: '3.32vh'
                                            }}
                                            onClick={() =>
                                                this.setState({activePanel: 'p7', history: ['p7']})
                                            }
                                        >
                                            Вернуться к результату
                                        </Button>
                                    </div>
                                </React.Fragment>
                        }
                        <img alt='bg' className='Background' src={require('../assets/name_in_country/bg.png')}/>
                    </Panel>
                </View>
            </ConfigProvider>
        );
    }
}

export default NameInCountry;