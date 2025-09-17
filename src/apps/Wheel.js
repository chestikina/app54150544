import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '@vkontakte/vkui/dist/vkui.css';
import '../css/Wheel.css';

import {
    Panel, PanelHeader, Title,
    View, platform, SimpleCell, Alert,
    Avatar, PanelHeaderBack
} from '@vkontakte/vkui';


import {
    Icon28ShareOutline,
    Icon28StoryOutline,
    Icon28Notifications,
} from '@vkontakte/icons';

import {getRandomInt, convertMiliseconds, getUrlParams} from "../js/utils";
import Wheel from "../components/WheelComponent";
import fetch from "node-fetch";

const
    axios = require('axios'),

    anotherGifts = true, // false - стикеры и деньги, true - pop it и прочее

    getAppUrl = 'https://vds2056815.my-ihor.ru:8081/api/apps.get',
    proxyUrl = ['https://murmuring-bastion-20764.herokuapp.com/', 'https://vds2056823.my-ihor.ru:8088/'][getRandomInt(0, 1)],

    apiUrl = anotherGifts ? 'https://vds2109312.my-ihor.ru:8080/api/' : 'https://vds2105652.my-ihor.ru:8080/api/',

    storyPhoto = anotherGifts ? {
        vk: 'photo-201216831_457239036',
        url: window.location.origin + window.location.pathname.replace('/index.html', '') + require('../assets/img_wheel/story/2.jpg').substring(1)
    } : {
        vk: 'photo-201216831_457239035',
        url: window.location.origin + window.location.pathname.replace('/index.html', '') + require('../assets/img_wheel/story/1.png').substring(1)
    }
;

class WheelApp extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: ['main'],
            activePanel: 'main',

            gift: {
                name: '',
                photo: ''
            },

            user: {
                attempts: 1,
                last_share_story: 0,
                last_share_wall: 0,
                is_allowed_notify: false
            },

            deg: 22.5,
            gifts: anotherGifts ?
                {
                    popit: {
                        name: 'Поп Ит',
                        photo: require('../assets/img_wheel/Popyt.png'),
                        degs: [0]
                    },
                    bear: {
                        name: 'Подвеска Adams',
                        photo: require('../assets/img_wheel/Adams.png'),
                        degs: [2]
                    },
                    taxi: {
                        name: 'Поездка в ЯндексТакси',
                        photo: require('../assets/img_wheel/YandexTaxi.png'),
                        degs: [4]
                    },
                    rub: {
                        name: '500 рублей',
                        photo: require('../assets/img_wheel/Pitsot.png'),
                        degs: [6]
                    },
                    cod: {
                        name: 'Call Of Duty',
                        photo: require('../assets/img_wheel/KoldaBlekOps.png'),
                        degs: [8]
                    },
                    cinema: {
                        name: 'Билет в кино',
                        photo: require('../assets/img_wheel/Bilet.png'),
                        degs: [10]
                    },
                    hamburger: {
                        name: 'БигМак',
                        photo: require('../assets/img_wheel/BigMak.png'),
                        degs: [12]
                    },
                    doshirak: {
                        name: 'Доширак',
                        photo: require('../assets/img_wheel/Doshik.png'),
                        degs: [14]
                    }
                } :
                {
                    money: {
                        name: 'деньги',
                        photo: require('../assets/img_wheel/money.png'),
                        degs: [6]
                    },
                    among_us: {
                        name: 'набор «Among Us»',
                        photo: require('../assets/img_wheel/among_us.png'),
                        degs: [2]
                    },
                    it: {
                        name: 'набор «Оно»',
                        photo: require('../assets/img_wheel/it.png'),
                        degs: [4]
                    },
                    joker: {
                        name: 'набор «Джокер»',
                        photo: require('../assets/img_wheel/joker.png'),
                        degs: [8]
                    },
                    tom_and_jerry: {
                        name: 'набор «Том и Джерри»',
                        photo: require('../assets/img_wheel/tom_and_jerry.png'),
                        degs: [10]
                    },
                    stickers: {
                        name: 'набор стикеров',
                        photo: require('../assets/img_wheel/stickers.png'),
                        degs: [12]
                    },
                    stickers_anim: {
                        name: 'набор анимированных стикеров',
                        photo: require('../assets/img_wheel/stickers_anim.png'),
                        degs: [14]
                    }
                },

            top: []
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.back = this.back.bind(this);
        this.go = this.go.bind(this);
        this.showAlert = this.showAlert.bind(this);
        this.completeTask = this.completeTask.bind(this);
    }

    async componentDidMount() {
        const
            user = (await this.get('users.get')).response,
            app = (await require('../js/utils').get(getAppUrl, {app_id: getUrlParams().vk_app_id})).response
        ;
        this.setState({user, app});

        bridge.send('VKWebAppInit');

        if (bridge.supports('VKWebAppSetViewSettings')) {
            bridge.send('VKWebAppSetViewSettings', {
                status_bar_style: 'light',
                action_bar_color: '#646365'
            });
        }

        window.addEventListener('popstate', e => {
            e.preventDefault();
            this.back(e);
        });

        bridge.subscribe(async ({detail: {type, data}}) => {
            if (type !== undefined) console.log(type, data);
            if (type === 'VKWebAppViewRestore') {
                this.setState({snackbar: null, popout: null});
            }
        });

        this.setToken();
    }

    back = () => {
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

    go(panel) {
        let {history} = this.state;
        if (history[history.length - 1] !== panel) {
            history.push(panel);
            window.history.pushState({activePanel: panel}, 'Title');
            this.setState({activePanel: panel, history, snackbar: null});
        }
    }

    async get(method, params = {}) {
        return await require('../js/utils').get(
            apiUrl + method,
            {...params, ...getUrlParams()}
        );
    }

    showAlert(title, message) {
        this.setState({
            popout:
                <Alert
                    actions={[{
                        title: 'Ок',
                        autoclose: true,
                        mode: 'default',
                    }]}
                    onClose={() => {
                        this.setState({popout: null});
                    }}
                >
                    <h2>{title}</h2>
                    <p>{message}</p>
                </Alert>
        });
    }

    async completeTask(task, func) {
        let {user} = this.state,
            now = new Date(new Date().toLocaleString('en', {timeZone: 'Europe/Moscow'})).getTime();
        if (typeof user[task] === 'number' ? now - this.state.user[task] >= 24 * 60 * 60 * 1000 : !user[task]) {
            try {
                if (func) await func();
                this.showAlert(
                    'Отлично!',
                    'Вы получили дополнительную попытку!'
                );
                user[task] = typeof user[task] === 'number' ? now : true;
                user.attempts++;
                this.setState({user});
                await this.get('complete.task', {task});
            } catch (e) {
            }
        } else {
            this.showAlert(
                'Упс',
                typeof user[task] === 'number' ?
                    'Попробуйте выполнить задание через ' +
                    convertMiliseconds((24 * 60 * 60 * 1000) - (now - user[task]))
                    :
                    'Вы уже выполнили это задание. Попробуйте выполнить другое.'
            );
        }
    }

    async getTop() {
        return (await this.get('get.lastGifts')).response.map(user =>
            user.gifts.map((gift, i) =>
                gift.name !== 'among_us' && {
                    photo: user.photo,
                    name: user.name,
                    gift_name: gift.name
                        .replace('stickers', 'Стикеры')
                        .replace('money', 'Деньги')
                        .replace('popit', 'Поп Ит')
                }
            ).filter(value => value !== false).reverse()).filter(value => value.length > 0)
    }

    async uploadStoryPhotoToAlbum() {
        const
            blob = await new Promise(resolve => {
                const
                    {createCanvas, loadImage} = require('canvas')
                ;

                loadImage(storyPhoto.url).then(async background => {
                    const
                        canvas = createCanvas(background.width, background.height),
                        ctx = canvas.getContext('2d')
                    ;
                    ctx.drawImage(background, 0, 0);
                    canvas.toBlob(async function (blob) {
                        resolve(blob);
                    }.bind(this));
                });
            }),
            album_id = (await bridge.send('VKWebAppCallAPIMethod', {
                method: 'photos.createAlbum',
                params: {
                    title: 'Колесо фортуны',
                    v: '5.126',
                    access_token: this.state.token
                }
            })).response.id,
            uploadAlbumUrl = (await bridge.send('VKWebAppCallAPIMethod', {
                method: 'photos.getUploadServer',
                params: {
                    album_id,
                    v: '5.126',
                    access_token: this.state.token
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
                            caption: anotherGifts ?
                                `😱 Выиграл Поп Ит в приложении "Фортуна", крутани колесо и ты - https://vk.com/app${getUrlParams().vk_app_id}`
                                :
                                `😱 Выиграл набор стикеров в приложении "Фортуна", крутани колесо и ты - https://vk.com/app${getUrlParams().vk_app_id}`,
                            v: '5.126',
                            access_token: this.state.token
                        }
                    });
                });
        } catch (e) {
            console.error(e);
        }
    }

    async setToken() {
        try {
            const response = await bridge.send('VKWebAppGetAuthToken', {
                app_id: parseInt(getUrlParams().vk_app_id),
                scope: 'friends,photos'
            });
            if (response.scope.indexOf('friends') > -1) {
                await this.setState({token: response.access_token});
                if (response.scope.indexOf('photos') > -1) {
                    this.uploadStoryPhotoToAlbum();
                }
            }
        } catch (e) {

        }
    }

    async roll() {
        let {
                gifts, deg, user, app
            } = this.state
        ;

        try {
            if (user.attempts > 0) {
                await bridge.send('VKWebAppAllowMessagesFromGroup', {
                    group_id: app.group_id_message[0],
                    key: 'FSDIfulnwje'
                });
                user.attempts--;
                document.body.style.setProperty('--rotate-wheel-end', `0deg`);
                const
                    gotName = await this.get('get.gift'),
                    got = gifts[gotName.response],
                    degs = -(deg * got.degs[getRandomInt(0, got.degs.length - 1)] + 360 * getRandomInt(7, 10))
                ;

                document.body.style.setProperty('--rotate-wheel', `${degs}deg`);
                this.setState({gift: got, user, rolled: true});
                setTimeout(() => {
                    document.body.style.setProperty('--rotate-wheel-end', `${degs}deg`);
                }, 10000);
                setTimeout(() => {
                    this.setState({
                        rolled: false,
                        popout: <React.Fragment>
                            <div className='GetGiftTitle'>
                                Ваш приз
                            </div>
                            <div className='GetGiftDescription'>
                                {got.name}
                            </div>
                            <img className='GetGift' src={got.photo} alt='gift'/>
                            <a
                                target='_blank'
                                href={'https://vk.com/im?sel=-' + this.state.app.group_id_message[0]}
                                className='GiftButton'
                                onClick={() => this.setState({popout: null})}
                            >
                                Забрать
                            </a>
                        </React.Fragment>
                    });
                }, 12000);
            } else {
                this.setState({
                    popout:
                        <React.Fragment>
                            <div className='AttemptsTitle'>
                                Попыток не осталось
                            </div>
                            <div className='AttemptsDescription'>
                                Выполните задание, чтобы получить больше попыток
                            </div>
                            <div className='AttemptsVariants'>
                                <div
                                    onClick={async () => {
                                        await this.completeTask('last_share_story',
                                            async () => {
                                                await bridge.send('VKWebAppShowStoryBox', {
                                                    background_type: 'image',
                                                    url: storyPhoto.url,
                                                    attachment: {
                                                        url: 'https://vk.com/app' + getUrlParams().vk_app_id,
                                                        text: 'go_to',
                                                        type: 'url'
                                                    }
                                                });

                                                if (this.state.token) {
                                                    bridge.send('VKWebAppShowWallPostBox', {
                                                        message: 'Ссылка в иcточнике 👇🏻',
                                                        copyright: 'https://vk.com/app' + getUrlParams().vk_app_id,
                                                        attachments: storyPhoto.vk
                                                    })
                                                }
                                            });
                                    }}
                                >
                                    <Icon28StoryOutline/>
                                    <span>Опубликовать историю</span>
                                </div>
                                <div
                                    onClick={async () => {
                                        await this.completeTask('last_share_wall',
                                            async () =>
                                                await bridge.send('VKWebAppShowWallPostBox', {
                                                    message: 'Ссылка в иcточнике 👇🏻',
                                                    copyright: 'https://vk.com/app' + getUrlParams().vk_app_id,
                                                    attachments: storyPhoto.vk
                                                })
                                        );
                                    }}
                                >
                                    <Icon28ShareOutline/>
                                    <span>Опубликовать запись</span>
                                </div>
                                <div
                                    onClick={async () => {
                                        await this.completeTask('is_allowed_notify',
                                            async () =>
                                                await bridge.send('VKWebAppAllowNotifications')
                                        );
                                    }}
                                >
                                    <Icon28Notifications/>
                                    <span>Разрешить уведомления</span>
                                </div>
                            </div>
                        </React.Fragment>
                })
            }
        } catch (e) {
        }
    }

    render() {
        const {
                popout, top_users, gifts, deg, user, gift, activePanel,
                rolled, top
            } = this.state
        ;

        return (
            <View activePanel={activePanel}>
                <Panel id='main' style={{overflow: 'hidden'}}>
                    <img src={require('../assets/clickerbattle/Fog.png')} alt='fog' className='FogBG'/>
                    <div
                        style={{
                            opacity: popout ? 1 : 0,
                            pointerEvents: !popout && 'none'
                        }}
                        className='Popout'>
                        {popout}
                    </div>
                    <div className='MainCenter'>
                        <div
                            style={{transform: `translateY(-${rolled ? 50 : 0}vh)`}}
                            className='MainTitle'>Колесо удачи
                        </div>
                        <div style={{height: `${100 / 812 * 75}vh`}}/>
                        <Wheel animation={rolled} anotherGifts={anotherGifts}/>
                        <div style={{height: `${100 / 812 * 60}vh`}}/>
                        <div
                            style={{transform: `translateY(${rolled ? 50 : 0}vh)`}}
                            className='GiftButton'
                            onClick={() => this.roll()}
                        >
                            Получить подарок
                        </div>
                        <div style={{height: `${100 / 812 * 12}vh`}}/>
                        <div
                            style={{
                                transform: `translateY(${rolled ? 50 : 0}vh)`,
                                fontSize: 13, background: 'none', color: 'rgba(255, 255, 255, 0.5)'
                            }}
                            className='GiftButton'
                            onClick={async () => {
                                await this.setState({
                                    top: await this.getTop()
                                });
                                this.go('top');
                            }}
                        >
                            Последние победители
                        </div>
                    </div>
                </Panel>
                <Panel id='top'>
                    <img src={require('../assets/clickerbattle/Fog.png')} alt='fog' className='FogBG'/>
                    <PanelHeader
                        left={<PanelHeaderBack onClick={() => this.back()}/>}
                        separator={false}
                    />
                    {
                        top.map((value, i) =>
                            <SimpleCell
                                key={'user-top-' + i} disabled
                                before={<Avatar size={48} src={value.photo}/>} description={value.gift_name}>
                                {value.name}</SimpleCell>)
                    }
                    {
                        top.length === 0 && <div className='TopIsClear'>
                            Пусто
                        </div>
                    }
                </Panel>
            </View>
        );
    }
}

export default WheelApp;