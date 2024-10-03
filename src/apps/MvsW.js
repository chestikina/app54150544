import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/MvsW.css';

import {
    AppRoot,
    Panel,
    View,
    ScreenSpinner
} from '@vkontakte/vkui';
import {animateValue, get} from "../js/utils";
import {ReactComponent as Man} from "../assets/icons_mvsw/Man.svg";
import {ReactComponent as Woman} from "../assets/icons_mvsw/Woman.svg";
import {ReactComponent as ForMan} from "../assets/icons_mvsw/ForMan.svg";
import {ReactComponent as ForWoman} from "../assets/icons_mvsw/ForWoman.svg";
import {ReactComponent as Start} from "../assets/icons_mvsw/Start.svg";
import {ReactComponent as Brain} from "../assets/icons_mvsw/Brain.svg";

const
    year_test_app_id = 7770951, // APP_ID приложения "Психологический возраст"
    api_url = 'https://vds2066574.my-ihor.ru:8081/api'
;

class MvsW extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: ['main'],
            activePanel: 'main',

            data: [0, 0]
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.back = this.back.bind(this);
        this.go = this.go.bind(this);

        this.vkParams = () => window.location.search.length > 0 && JSON.parse('{"' + decodeURI(window.location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
    }

    async componentDidMount() {
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
                        status_bar_style: 'dark',
                        action_bar_color: '#FFFFFF'
                    });
                }
            } else if (type === 'VKWebAppViewRestore') {
                this.setState({popout: null});
            }
        });

        await this.updateData();

        const {user} = this.state;
        if (user.vote !== 0 && user.vote !== 1) {
            this.setState({
                history: ['start'],
                activePanel: 'start'
            });
        }

        bridge.send('VKWebAppInit');
    }

    back = () => {
        let {modalHistory, history, popout} = this.state;

        if (popout !== null) {
            this.setState({popout: null});
            window.history.pushState({pop: 'popout'}, 'Title');
            return;
        }

        if (modalHistory.length > 0) {
            this.modalBack();
            return;
        }

        if (history.length === 1) {
            bridge.send('VKWebAppClose', {status: 'success', message: 'Возвращайтесь ещё!'});
        } else if (history.length > 1) {
            history.pop();
            this.setState({activePanel: history[history.length - 1], history});
        }
    };

    go(panel) {
        let {history} = this.state;
        if (history[history.length - 1] !== panel) {
            history.push(panel);
            window.history.pushState({activePanel: panel}, 'Title');

            this.setState({activePanel: panel, history, snackbar: null, activeModal: null, modalHistory: []});
        }
    }

    async updateData() {
        const
            app = (await get('https://vds2056815.my-ihor.ru:8081/api/apps.get', {app_id: this.vkParams().vk_app_id})).response,
            user = {...await bridge.send('VKWebAppGetUserInfo'), ...(await get(api_url + '/getUser', {...this.vkParams()})).response},
            data = (await get(api_url + '/getData', {...this.vkParams()})).response
        ;

        await this.setState({app, user, data});

        const
            count0 = document.getElementById('count0'),
            count1 = document.getElementById('count1'),
            maxTime = 1500,
            maxCountData = Math.max(...data),
            minCountData = Math.min(...data),
            isMaxCount0 = maxCountData === data[0],
            anotherTime = minCountData / maxCountData * maxTime
        ;

        return new Promise(resolve => setTimeout(async () => {
                animateValue(count0, parseInt(count0.innerText), data[0], isMaxCount0 ? maxTime : anotherTime);
                animateValue(count1, parseInt(count1.innerText), data[1], !isMaxCount0 ? maxTime : anotherTime);
                resolve(true);
            }, 500)
        )
    }

    async shareStory(url, type) {
        this.setState({popout: <ScreenSpinner/>});

        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d')
        ;

        loadImage(url).then(async background => {
            ctx.drawImage(background, 0, 0);
            this.setState({popout: null});
            bridge.send('VKWebAppShowStoryBox', {
                background_type: 'image',
                blob: canvas.toDataURL('image/png'),
                attachment: {
                    text: 'go_to',
                    type: 'url',
                    url: `https://vk.com/app${this.vkParams().vk_app_id}`
                }
            });

            if (this.state.token) {
                canvas.toBlob(async function (blob) {
                    this.uploadStoryPhoto(blob, type);
                }.bind(this));
            }
        });
    }

    async uploadStoryPhoto(blob, type) {
        const
            axios = require('axios'),
            url = 'https://vds2056823.my-ihor.ru:8081/api/photos.upload?uploadUrl=',
            uploadWallUrl = (await bridge.send('VKWebAppCallAPIMethod', {
                method: 'photos.getWallUploadServer',
                params: {
                    v: '5.126',
                    access_token: this.state.token
                }
            })).response.upload_url,
            urlWall = url + encodeURIComponent(uploadWallUrl),
            bodyFormData = new FormData();

        bodyFormData.append('photo', blob, 'image.png');
        axios({
            method: 'post',
            url: urlWall,
            data: bodyFormData,
            headers: {'Content-Type': 'multipart/form-data'}
        })
            .then(async function (response) {
                const {server, photo, hash} = response.data.response;
                const wallPhoto = (await bridge.send('VKWebAppCallAPIMethod', {
                    method: 'photos.saveWallPhoto',
                    params: {
                        server,
                        photo,
                        hash,
                        caption: `Голосуй за ${type === 0 ? 'пацанов' : 'девочек'} в приложении 👇` +
                            '\n' + `https://vk.com/app${this.vkParams().vk_app_id}`,
                        v: '5.126',
                        access_token: this.state.token
                    }
                })).response[0];

                bridge.send('VKWebAppShowWallPostBox', {
                    message: '',
                    copyright: 'https://vk.com/app' + this.vkParams().vk_app_id,
                    attachments: `photo${wallPhoto.owner_id}_${wallPhoto.id}`
                });
            }.bind(this))
            .catch(function (response) {
                console.log(response);
            });

        const
            album_id = (await bridge.send('VKWebAppCallAPIMethod', {
                method: 'photos.createAlbum',
                params: {
                    title: 'Мальчики против девочек',
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
            urlAlbum = url + encodeURIComponent(uploadAlbumUrl)
        ;

        axios({
            method: 'post',
            url: urlAlbum,
            data: bodyFormData,
            headers: {'Content-Type': 'multipart/form-data'}
        })
            .then(async function (response) {
                const {server, photos_list, hash} = response.data.response;
                await bridge.send('VKWebAppCallAPIMethod', {
                    method: 'photos.save',
                    params: {
                        album_id,
                        server,
                        photos_list,
                        hash,
                        caption: `Голосуй за ${type === 0 ? 'пацанов' : 'девочек'} в приложении 👇` +
                            '\n' + `https://vk.com/app${this.vkParams().vk_app_id}`,
                        v: '5.126',
                        access_token: this.state.token
                    }
                });
            }.bind(this))
            .catch(function (response) {
                console.log(response);
            });
    }

    async setToken() {
        try {
            const response = await bridge.send('VKWebAppGetAuthToken', {
                app_id: parseInt(this.vkParams().vk_app_id),
                scope: 'friends,wall,photos,video'
            });
            if (response.scope.indexOf('wall') > -1) {
                this.setState({token: response.access_token});
            }
        } catch (e) {

        }
    }

    render() {
        return this.state.user ? (
            <AppRoot>
                <View activePanel={this.state.activePanel}
                      popout={this.state.popout}>
                    <Panel id='start' style={{
                        background: `url(${require('../assets/icons_mvsw/background2.png')}) -22.13vw 5.66vh / 145% no-repeat`
                    }}>
                        <div className='MobileOffsetTop'/>
                        <Start/>
                        <div className='Button' icon="false" onClick={async () => {
                            await this.setToken();
                            this.go('main');
                            await this.updateData();
                        }}>
                            Продолжить
                        </div>
                    </Panel>
                    <Panel id='main' style={{
                        background: `url(${require('../assets/icons_mvsw/background.png')}) -27.53vw 6.4vh / 145% no-repeat`
                    }}>
                        <div className='MobileOffsetTop'/>
                        <div className='Title'>
                            Парни VS Девушки
                        </div>
                        <div className='Subtitle'>
                            Выкладывай историю, помоги своему полу выиграть!
                        </div>
                        <div className='Genders'>
                            <div>
                                <Man/>
                                <div id='count0'>0</div>
                            </div>
                            <div>
                                <Woman/>
                                <div id='count1'>0</div>
                            </div>
                        </div>
                        <div className='Subtitles'>
                            <div>за парней</div>
                            <div>за девушек</div>
                        </div>
                        <div className='Buttons'>
                            <div style={{
                                opacity: this.state.user.vote === 1 && .25,
                                transform: this.state.user.vote === 1 && 'scale(0.9)'
                            }} onClick={async () => {
                                if (this.state.user.vote === 0 || this.state.user.vote === -1) {
                                    try {
                                        await bridge.send('VKWebAppAllowMessagesFromGroup', {group_id: this.state.app.group_id_message[0]});
                                    } catch (e) {
                                    }
                                    this.shareStory(require('../assets/icons_mvsw/story_man.png'), 0);
                                    await get(api_url + '/vote', {vote: 0, ...this.vkParams()});
                                    await this.updateData();
                                }
                            }}>
                                <ForMan/>
                                <div>Я за парней</div>
                            </div>
                            <div style={{
                                opacity: this.state.user.vote === 0 && .25,
                                transform: this.state.user.vote === 0 && 'scale(0.9)'
                            }} onClick={async () => {
                                if (this.state.user.vote === 1 || this.state.user.vote === -1) {
                                    try {
                                        await bridge.send('VKWebAppAllowMessagesFromGroup', {group_id: this.state.app.group_id_message[0]});
                                    } catch (e) {
                                    }
                                    this.shareStory(require('../assets/icons_mvsw/story_woman.png'), 1);
                                    await get(api_url + '/vote', {vote: 1, ...this.vkParams()});
                                    await this.updateData();
                                }
                            }}>
                                <ForWoman/>
                                <div>Я за девушек</div>
                            </div>
                        </div>
                        <div className='Button' icon="true" style={{
                            color: '#000000',
                            fontWeight: 600,
                            fontSize: '1.72vh',
                            background: '#FFFFFF',
                            marginTop: '2.09vh',
                            border: '1px solid #E6E6E6'
                        }}
                             onClick={async () => bridge.send('VKWebAppOpenApp', {app_id: year_test_app_id})}>
                            <Brain/>
                            <div>Пройти тест на психологический возраст</div>
                        </div>
                    </Panel>
                </View>
            </AppRoot>
        ) : <div/>;
    }
}

export default MvsW;