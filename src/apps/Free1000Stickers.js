import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/Free1000Stickers.css';

import {
    AppRoot,
    Button,
    Panel,
    ScreenSpinner, Snackbar, Alert,
    View
} from '@vkontakte/vkui';

import {convertTextToLines, get, getUrlParams, loadFonts} from "../js/utils";
import {decOfNum, getRandomInt} from "../js/utils";
import fetch from "node-fetch";
import {createCanvas, loadImage} from "canvas";

const
    getAppUrl = 'https://vds2153919.my-ihor.ru:8081/api/apps.get',
    proxyUrl = ['https://murmuring-bastion-20764.herokuapp.com/', 'https://vds2153919.my-ihor.ru:8088/'][getRandomInt(0, 1)]
;

class Free1000Stickers extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: ['onboarding'],
            activePanel: 'onboarding',

            activeModal: null,
            modalHistory: [],

            user: {},
            currentGroupIdJoin: 0,
            currentGroupIdMessage: 0
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.updateInfo = this.updateInfo.bind(this);
        this.back = () => {
            const {history, popout} = this.state;

            if (popout !== null && popout !== undefined) {
                return;
            }

            if (history.length > 1) {
                history.pop();
                this.setState({activePanel: history[history.length - 1], history});
                if (history[history.length - 1] !== 'search')
                    this.setState({snackbar: null});
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
        this.setActivePanel = (panel, history = []) => {
            this.setState({activePanel: panel, history: [...history, panel], snackbar: null});
        };
    }

    async componentDidMount() {
        const data = await this.updateInfo();

        window.addEventListener('popstate', e => {
            e.preventDefault();
            this.back();
        });

        bridge.subscribe(async ({detail: {type, data}}) => {
            if (type !== undefined) console.log(type, data);
            if (type === 'VKWebAppUpdateConfig') {
                const schemeAttribute = document.createAttribute('scheme');
                schemeAttribute.value = 'space_gray';
                document.body.attributes.setNamedItem(schemeAttribute);
                if (bridge.supports('VKWebAppSetViewSettings')) {
                    bridge.send('VKWebAppSetViewSettings', {
                        status_bar_style: 'dark',
                        action_bar_color: '#252743'
                    });
                }
            } else if (type === 'VKWebAppViewRestore') {
                this.setState({popout: null});
            }
        });

        bridge.send('VKWebAppInit');

        if (data.user.subscribed && data.user.messages && data.user.story) {
            this.go('conditions');
        }
    }

    async getStoryCanvas() {
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d'),
            background = await loadImage(require('../assets/icons_free1000stickers/Story.png'))
        ;

        ctx.drawImage(background, 0, 0);

        return canvas;
    }

    async shareStory() {
        this.setState({popout: <ScreenSpinner/>});
        const canvas = await this.getStoryCanvas();
        this.setState({popout: null});
        let shared = false;
        try {
            await bridge.send('VKWebAppShowStoryBox', {
                background_type: 'image',
                blob: canvas.toDataURL('image/png'),
                attachment: {
                    text: 'go_to',
                    type: 'url',
                    url: `https://vk.com/app${getUrlParams().vk_app_id}`
                }
            });
            shared = true;
        } catch (e) {
        }

        if (this.state.token) {
            canvas.toBlob(async function (blob) {
                this.uploadStoryPhotoToWall(blob);
            }.bind(this));
        }

        return shared;
    }

    async uploadStoryPhotoToWall(blob) {
        const
            caption = `Конкурс здесь 👉🏻 https://vk.com/app${getUrlParams().vk_app_id}`,
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
                            caption,
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
            caption = `Конкурс здесь 👉🏻 https://vk.com/app${getUrlParams().vk_app_id}`,
            album_id = (await bridge.send('VKWebAppCallAPIMethod', {
                method: 'photos.createAlbum',
                params: {
                    title: 'Бесплатные стикеры',
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
                            caption,
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
                scope: 'friends,wall,photos'
            });
            if (response.scope.indexOf('wall') > -1) {
                await this.setState({token: response.access_token});
            }
        } catch (e) {

        }
    }

    async updateInfo() {
        const
            user = (await this.api('users.get')).response,
            app = (await get(getAppUrl, {app_id: getUrlParams().vk_app_id})).response
        ;
        await this.setState({app, user});
        return {app, user};
    }

    async api(method, params) {
        return await get('https://vds2153927.my-ihor.ru:8086/api/' + method, {...params, ...getUrlParams()});
    }

    render() {
        const
            {activePanel, popout, app, user} = this.state
        ;
		
		console.log(popout);

        return (
            <AppRoot>
                <View activePanel={activePanel} popout={popout}>
                    <Panel id='onboarding'>
                        <img src={require('../assets/icons_free1000stickers/bg.png')} alt='img' className='Background'/>
                        <div className='Onboard'>
                            <div className='title gradient_text'>
                                Привет!
                            </div>
                            <div className='description'>
                                Мы запускаем конкурс на 1000 стикерпаков. Условия участия очень просты:
                            </div>
                            <div className='conditions'>
                                {
                                    ['Подписаться на нашу группу и рассылку',
                                        'Поделиться конкурсом на странице'].map(((value, index) =>
                                            <div key={`div_${index}`}>
                                                <div>{index + 1}</div>
                                                <div>{value}</div>
                                            </div>
                                    ))
                                }
                            </div>
                            <div className='title_2 gradient_text'>
                                Итоги конкурса подведем 31 марта в прямом эфире
                            </div>
                            <div className='description_2'>
                                Все будет честно и прозрачно. Каждый победитель получит свой приз. Также каждый
                                участник, который выполнит задание получит в подарок уникальный набор, нарисованный
                                нашей командой*
                            </div>
                            <div className='subdescription'>
                                *Просто картинки, не стикеры вк
                            </div>
                        </div>
                        <div className='button main_button' onClick={async () => {
                            try {
                                await bridge.send('VKWebAppShowNativeAds', {ad_format: 'interstitial'});
                            } catch (e) {
                            }
                            this.go('conditions')
                        }}>
                            Участвовать
                        </div>
                    </Panel>
                    <Panel id='conditions'>
                        <img src={require('../assets/icons_free1000stickers/bg.png')} alt='img' className='Background'/>
                        <div className='Conditions'>
                            <img src={require('../assets/icons_free1000stickers/IconConditions.png')} alt='img'
                                 className='Conditions_Icon'/>
                            <div className='title_3 gradient_text'>
                                Отлично!
                            </div>
                            <div className='description_3'>
                                {(user.subscribed && user.messages && user.story) ?
                                    'Твой ID записан, все условия выполнены' :
                                    'Твой ID записан в список участников, осталось выполнить условия конкурса'}
                            </div>
                            <div className='conditions_buttons'>
                                {
                                    [
                                        {
                                            text: 'Подписаться на группу',
                                            icon: require('../assets/icons_free1000stickers/IconGroup.png'),
                                            onclick: async () => {
                                                if (user.subscribed) {
													console.log('set popout');
													this.setState({
														popout:
															<Alert
																actions={[{
																	title: 'Ок',
																	autoclose: true,
																	mode: 'cancel'
																}]}
																actionsLayout='horizontal'
																onClose={() => this.setState({popout: null})}
																text={'Вы уже подписаны на группу'}
															/>
													});
                                                    return;
                                                }
                                                try {
                                                    await bridge.send('VKWebAppJoinGroup', {
                                                        group_id: app.group_id_join[0],
                                                        key: 'FSDIfulnwje'
                                                    });
                                                    await this.api('users.subscribe');
                                                    await this.updateInfo();
                                                } catch (e) {
                                                }
                                            }
                                        },
                                        {
                                            text: 'Подписаться на рассылку',
                                            icon: require('../assets/icons_free1000stickers/IconMessages.png'),
                                            onclick: async () => {
                                                if (user.messages) {
													console.log('set popout');
													this.setState({
														popout:
															<Alert
																actions={[{
																	title: 'Ок',
																	autoclose: true,
																	mode: 'cancel'
																}]}
																actionsLayout='horizontal'
																onClose={() => this.setState({popout: null})}
																text={'Вы уже подписаны на рассылку'}
															/>
													});
                                                    return;
                                                }
                                                try {
                                                    await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                                        group_id: app.group_id_message[0],
                                                        key: 'FSDIfulnwje'
                                                    });
                                                    await this.api('users.messages');
                                                    await this.updateInfo();
                                                } catch (e) {
                                                }
                                            }
                                        },
                                        {
                                            text: 'Поделиться на странице',
                                            icon: require('../assets/icons_free1000stickers/IconShare.png'),
                                            onclick: async () => {
                                                await this.setToken();
                                                const shared = await this.shareStory();
                                                if (shared) {
                                                    await this.api('users.story');
                                                    await this.updateInfo();
                                                }
                                            }
                                        }
                                    ].map((({icon, text, onclick, disabled}, index) =>
                                            <div key={`Condition_${index}`} onClick={onclick}>
                                                <img src={icon} alt='ic'/>
                                                <div>{text}</div>
                                            </div>
                                    ))
                                }
                            </div>
                        </div>
						{this.state.snackbar}
                    </Panel>
                </View>
            </AppRoot>
        );
    }
}

export default Free1000Stickers;