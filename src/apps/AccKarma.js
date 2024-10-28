import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/AccKarma.css';

import {
    Panel,
    View,
    ScreenSpinner, Snackbar, ConfigProvider, ModalRoot, ModalCard, Avatar
} from '@vkontakte/vkui';
import Button from "../components/ClickerBattle/Button";
import {
    animateValue,
    convertTextToLines,
    decOfNum,
    get,
    getRandomInt,
    getUrlParams,
    loadFonts,
    openUrl,
    shortIntegers
} from "../js/utils";
import {Icon16ErrorCircleFill} from "@vkontakte/icons";
import {ReactComponent as IconResult} from "../assets/acc_karma/icons/return_to_result.svg";
import {ReactComponent as IconPosterApp} from "../assets/acc_karma/icons/go_to_app.svg";
import fetch from 'node-fetch';
import parser from "fast-xml-parser";

const
    getAppUrl = 'https://vds2153919.my-ihor.ru:8081/api/apps.get',
    proxyUrl = ['https://murmuring-bastion-20764.herokuapp.com/', 'https://vds2153919.my-ihor.ru:8088/'][getRandomInt(0, 1)],

    subAppID = 7916609, // Стоимость страницы ВКонтакте
    needSubApp = false, // Нужно ли упоминание второстепенного приложения

    normalCounters = {
        albums: 3,
        audios: 150,
        followers: 500,
        friends: 500,
        groups: 300,
        photos: 100,
        videos: 3
    }
;

class AccKarma extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: ['p0'],
            activePanel: 'p0',

            currentMessageIndex: 0,
            messages: [
                'Считаем друзей...',
                'Получаем дату регистрации...',
                'Анализируем общую активность странички...',
                'Оцениваем фотки...',
                'Смотрим подписки...',
                'Секретная информация...',
                'Оценка почти готова...'
            ],

            karma: 0
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
        loadFonts(['ProximaNova Bold', 'ProximaNova']);

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
                        action_bar_color: '#050602'
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

        if (needSubApp)
            this.go('sub_app');
        else
            this.setState({activePanel: 'p7', history: ['p7']})
    }

    async getStoryCanvas() {
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d'),
            {karma, result_text} = this.state,

            background = await loadImage(require(`../assets/acc_karma/story_bg/Story_${karma <= 333 ? 'red' : (karma <= 667 ? 'yellow' : 'green')}.png`)),

            textSize = 72,
            textFont = textSize + 'px ProximaNova',
            textLines = convertTextToLines(result_text, textFont, 698)
        ;

        ctx.drawImage(background, 0, 0);

        ctx.textAlign = 'center';

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '190px ProximaNova Bold';
        ctx.fillText(`${karma}/1000`, 539.5, 817.2 - 33);

        ctx.fillStyle = '#2DB226';
        ctx.font = textFont;

        for (const i in textLines) {
            ctx.fillText(textLines[i], 540, 1080.2 - 201 + textSize + (textSize + 5) * i);
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
                            caption: `🙀 Узнай карму своего аккаунта в приложении - https://vk.com/app${getUrlParams().vk_app_id}`,
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
                    title: 'Сколько стоит моя страница',
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
                            caption: `🙀 Узнай карму своего аккаунта в приложении - https://vk.com/app${getUrlParams().vk_app_id}`,
                            v: '5.126',
                            access_token: this.state.token
                        }
                    });
                });
        } catch (e) {
            console.error(e);
        }
    }

    get loadingComponent() {
        const
            {messages, currentMessageIndex} = this.state,
            percent = Math.round(100 / messages.length * (currentMessageIndex + 1))
        ;

        return <div className='Progress'>
            <span>{percent}<span style={{color: '#3AD431'}}>%</span></span>
            <img style={{animationPlayState: percent === 100 && 'paused'}} alt='progress'
                 src={require('../assets/acc_karma/icons/progress.png')}/>
        </div>
    }

    render() {
        const
            {
                activePanel, activeModal, popout,
                messages, currentMessageIndex, karma, result_text,

                snackbar,

                app
            } = this.state,

            panels = [
                {
                    title: 'Привет!',
                    description: 'Мы оцениваем твою страницу, считывая множество разных показателей. Оценка каждой страницы пропорциональна ее ценности.',
                    button:
                        <Button onClick={() => this.setState({activePanel: 'p1'})}>
                            Ок
                        </Button>
                },
                {
                    title: 'Чтобы узнать карму вашего аккаунта нам потребуется доступ к вашим личным данным',
                    button:
                        <Button
                            onClick={async () => {
                                try {
                                    this.setState({activePanel: 'p2', token: await this.getToken('photos,wall')})
                                } catch (e) {
                                    if (snackbar) return;
                                    this.setState({
                                        snackbar: <Snackbar
                                            onClose={() => this.setState({snackbar: null})}
                                            before={<Icon16ErrorCircleFill width={20} height={20}/>}
                                        >
                                            Без доступа я не смогу проанализировать твою страницу :(
                                        </Snackbar>
                                    });
                                }
                            }}
                        >
                            Разрешить доступ
                        </Button>
                },
                {
                    title: 'Спасибо, доступ получен!',
                    button:
                        <Button
                            onClick={async () => {
                                try {
                                    await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                        group_id: app.group_id_message[0],
                                        key: 'FSDIfulnwje'
                                    });
                                } catch (e) {
                                }

                                this.setState({activePanel: 'p3', subShow: false, popout: <ScreenSpinner/>});

                                try {
                                    await bridge.send('VKWebAppShowNativeAds', {ad_format: 'preloader'});
                                } catch (e) {
                                }

                                this.setState({popout: null});

                                let interval = setInterval(async () => {
                                    if (!this.state.subShow) {
                                        const i = this.state.currentMessageIndex;
                                        if (i >= messages.length - 1) {
                                            clearInterval(interval);
                                            this.go('p4');

                                            bridge.send('VKWebAppShowNativeAds', {ad_format: 'preloader'});
                                            return;
                                        } else {
                                            this.setState({currentMessageIndex: i + 1});
                                        }
                                        if (i === 4) {
                                            this.setState({subShow: true, activeModal: 'group'});
                                        }
                                    }
                                }, 1250 * 2);

                                try {

                                    const
                                        savedData = JSON.parse((await bridge.send('VKWebAppStorageGet', {keys: ['karm1']})).keys[0].value)
                                    ;
                                    await this.setState(savedData);
                                } catch (e) {
                                    const
                                        counters = (await bridge.send('VKWebAppCallAPIMethod', {
                                            method: 'users.get',
                                            params: {
                                                fields: 'counters',
                                                v: '5.126',
                                                access_token: this.state.token
                                            }
                                        })).response[0].counters,
                                        karma = true ? getRandomInt(0, 1000) : Math.round(1000 * Math.min(1, Object.keys(counters).map(key =>
                                            (counters[key] === 0 ? 1 : counters[key]) / (normalCounters[key] || 1)
                                        ).reduce((a, b) => a + b) / Object.keys(counters).length)),
                                        result_text = karma <= 333 ? 'Ты очень плохо себя ведёшь в соц сети' : (karma <= 666 ? 'Ты ведёшь себя неплохо, но и не очень хорошо в соц сети' : 'Ты очень хорошо себя ведёшь в соц сети')
                                    ;
                                    await this.setState({karma, result_text});
                                    await bridge.send('VKWebAppStorageSet', {
                                        key: 'karm1',
                                        value: JSON.stringify({karma, result_text})
                                    });
                                }

                                try {
                                    const
                                        canvas = await this.getStoryCanvas(),
                                        blob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob)))
                                    ;
                                    await this.uploadStoryPhotoToAlbum(blob);
                                } catch (e) {
                                }
                            }}
                        >
                            Узнать карму аккаунта
                        </Button>
                },
                {
                    icon: this.loadingComponent,
                    title: 'Идёт оценка...',
                    description: messages[currentMessageIndex]
                },
                {
                    icon: this.loadingComponent,
                    title: 'Анализ завершен!',
                    button:
                        <Button
                            onClick={() => {
                                this.shareStory();
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
                                      src={require('../assets/vk_acc_price/icons/group_subscribe.png')}/>}
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
                    {
                        panels.map((value, index) =>
                            <Panel id={`p${index}`} key={`p${index}`}>
                                <div className='FullScreen__Container'>
                                    {
                                        value.icon
                                        ||
                                        <img alt='icon' src={require('../assets/acc_karma/icons/' + index + '.png')}/>
                                    }
                                    <div className='FullScreen__Title'>
                                        {value.title}
                                    </div>
                                    {
                                        value.description && <div className='FullScreen__Description'>
                                            {value.description}
                                        </div>
                                    }
                                    {
                                        value.button
                                    }
                                </div>
                                <img alt='bg' className='Background'
                                     src={require('../assets/acc_karma/app_bg/green.png')}/>
                                {snackbar}
                            </Panel>
                        )
                    }
                    <Panel id='p7'>
                        <div className='FullScreen__Container'>
                            <div className='ButtonsContainer'>
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
                                            icon: <IconPosterApp/>,
                                            text: 'Узнать сколько стоит твоя страница ВК',
                                            onClick: () => {
                                                openUrl('https://vk.com/app' + subAppID);
                                            }
                                        }] : []
                                    ].map((value, index) =>
                                        <Button
                                            key={'btn-' + index}
                                            before={value.icon}
                                            onClick={() => value.onClick()}
                                            style={{
                                                marginTop: index > 0 && 16
                                            }}
                                        >
                                            {value.text}
                                        </Button>
                                    )
                                }
                            </div>
                        </div>
                        <img alt='bg' className='Background' src={require('../assets/acc_karma/app_bg/green.png')}/>
                    </Panel>
                    <Panel id='p5'>
                        <div className='FullScreen__Container'>
                            <div className='TextHeader'>
                                Карма твоего аккаунта:
                            </div>
                            <div className='Karma'>
                                {karma}/1000
                            </div>
                            <div className='ResultText'>
                                {result_text}
                            </div>
                            <Button
                                className='FullScreen__Button'
                                onClick={() => this.shareStory()}
                            >
                                Поделиться в истории
                            </Button>
                            <img alt='bg' className='Background'
                                 src={require(`../assets/acc_karma/app_bg/${karma <= 333 ? 'red' : (karma <= 667 ? 'yellow' : 'green')}.png`)}/>
                        </div>
                    </Panel>
                    <Panel id='sub_app'>
                        <div className='PosterHeader'>
                            Хочешь узнать сколько стоит твоя страница в ВК?
                        </div>
                        <div className='PosterSubheader'>
                            Тогда переходи в наше <br/><span style={{color: '#3AD431'}}>новое приложение</span>
                        </div>
                        <img alt='poster' className='PosterImage'
                             src={require('../assets/acc_karma/vk_acc_price.png')}/>
                        <div className='ButtonsContainer'>
                            <Button
                                before={<IconPosterApp/>}
                                onClick={() => openUrl('https://vk.com/app' + subAppID)}
                            >
                                Перейти в приложение
                            </Button>
                            <Button
                                style={{marginTop: '2.77vh'}}
                                before={<IconResult/>}
                                onClick={() =>
                                    this.setState({activePanel: 'p7', history: ['p7']})
                                }
                            >
                                Вернуться к результату
                            </Button>
                        </div>
                        <img alt='bg' className='Background' src={require('../assets/acc_karma/app_bg/green.png')}/>
                    </Panel>
                </View>
            </ConfigProvider>
        );
    }
}

export default AccKarma;