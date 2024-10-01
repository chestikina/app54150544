import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/LikesStat.css';

import {
    Panel,
    View,
    Snackbar, ConfigProvider
} from '@vkontakte/vkui';
import {decOfNum, get, getRandomInt, getUrlParams, loadFonts, openUrl, shortIntegers} from "../js/utils";
import Button from "../components/ClickerBattle/Button";
import {Icon16Done, Icon16ErrorCircleFill} from "@vkontakte/icons";
import {ReactComponent as MainIcon} from "../assets/likes_stat/icons/MainIcon.svg";
import {ReactComponent as AccessIcon} from "../assets/likes_stat/icons/AccessIcon.svg";

const
    axios = require('axios'),
    getAppUrl = 'https://vds2056815.my-ihor.ru:8081/api/apps.get',
    proxyUrl = ['https://murmuring-bastion-20764.herokuapp.com/', 'https://vds2056823.my-ihor.ru:8088/'][getRandomInt(0, 1)],

    apiUrl = 'https://vds2114385.my-ihor.ru:8081/api/'
;

class LikesStat extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: ['p1'],
            activePanel: 'p1'
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
        loadFonts(['TT Firs Neue Medium', 'TT Firs Neue DemiBold', 'Gilroy']);

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
                        action_bar_color: '#953149'
                    });
                }
            } else if (type === 'VKWebAppViewRestore') {
                this.setState({popout: null});
            }
        });

        //this.setState({app: (await get(getAppUrl, {app_id: getUrlParams().vk_app_id})).response});

        bridge.send('VKWebAppInit');
        bridge.send('VKWebAppEnableSwipeBack');
    }

    async setToken() {
        const response = await bridge.send('VKWebAppGetAuthToken', {
            app_id: parseInt(getUrlParams().vk_app_id),
            scope: 'friends,wall,photos'
        });
        if (response.scope.indexOf('wall') > -1) {
            this.setState({token: response.access_token});
        }
    }

    /*
    async shareStory() {
        try {
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

            if (this.state.token) {
                canvas.toBlob(async function (blob) {
                    this.uploadStoryPhotoToWall(blob);
                }.bind(this));
            }
        } catch (e) {

        }

        this.go('vk_likes');
    }

    async getStoryCanvas() {
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d')
        ;

        const
            background = await loadImage(require('../assets/vk_time/story/bg.png')),
            ic_time = await loadImage(require('../assets/vk_time/story/ic_time.png')),
            ic_msg = await loadImage(require('../assets/vk_time/story/ic_msg.png'))
        ;

        ctx.drawImage(background, 0, 0);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFFFFF';

        const
            {hours, messages} = this.state.data,
            hoursText = shortIntegers(hours),
            messagesText = shortIntegers(messages),
            hoursPref = decOfNum(hours, ['час', 'часа', 'часов'], false),
            messagesPref = decOfNum(messages, ['сообщение', 'сообщения', 'сообщений'], false)
        ;

        ctx.font = (hours >= 1000000 ? 120 : 178) + 'px TT Firs Neue DemiBold';
        ctx.fillText(hoursText, 106, 408 + 169);
        ctx.drawImage(ic_time, 106 + ctx.measureText(hoursText).width + 51, 439.22);

        ctx.font = (messages >= 1000000 ? 120 : 178) + 'px TT Firs Neue DemiBold';
        ctx.fillText(messagesText, 106, 1095 + 169);
        ctx.drawImage(ic_msg, 106 + ctx.measureText(messagesText).width + 64, 1136.38);

        ctx.font = '133px TT Firs Neue Medium';
        ctx.fillText(hoursPref, 106, 624 + 127);
        ctx.font = '133px TT Firs Neue Medium';
        ctx.fillText(messagesPref, 106, 1309 + 127);

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
                            caption: 'Узнал свою статистику с момента регистрации ВК. Офигеть))\n' +
                                '\n' +
                                `Узнай свою - https://vk.com/app${getUrlParams().vk_app_id}`,
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
            album_id = (await bridge.send('VKWebAppCallAPIMethod', {
                method: 'photos.createAlbum',
                params: {
                    title: 'Сколько времени я провёл в ВК',
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
                            caption: 'Узнал свою статистику с момента регистрации ВК. Офигеть))\n' +
                                '\n' +
                                `Узнай свою - https://vk.com/app${getUrlParams().vk_app_id}`,
                            v: '5.126',
                            access_token: this.state.token
                        }
                    });
                });
        } catch (e) {
            console.error(e);
        }
    }
    */
    render() {
        const
            {
                activePanel, activeModal, popout,
                messages, currentMessageIndex,

                snackbar,

                app
            } = this.state
        ;

        return (
            <ConfigProvider isWebView={true}>
                <View
                    activePanel={activePanel}
                    popout={popout}
                    onSwipeBack={this.back}
                >
                    <Panel id='p1'>
                        <div className='FullScreen__Container'>
                            <AccessIcon/>
                            <div className='FullScreen__Title'>
                                Разрешите доступ
                            </div>
                            <div className='FullScreen__Description'>
                                Приложение разрабатывается, разреши мне отправлять тебе уведомление и я оповещу тебя,
                                когда приложение запуститься!
                            </div>
                        </div>
                        <Button
                            onClick={async () => {
                                try {
                                    await bridge.send('VKWebAppAllowNotifications');

                                    await get(apiUrl + 'users.enableNotify', getUrlParams());

                                    if (snackbar) return;
                                    this.setState({
                                        snackbar: <Snackbar
                                            onClose={() => this.setState({snackbar: null})}
                                            before={<Icon16Done width={20} height={20}/>}
                                        >
                                            Отлично! Мы пришлём тебе уведомление, как только приложение будет готово :)
                                        </Snackbar>
                                    });
                                } catch (e) {
                                }
                            }}
                        >
                            Разрешить
                        </Button>
                        <img alt='bg' className='Background' src={require('../assets/likes_stat/bg.png')}/>
                        {snackbar}
                    </Panel>
                </View>
            </ConfigProvider>
        );
    }
}

export default LikesStat;