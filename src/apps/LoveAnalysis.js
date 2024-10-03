import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/AskMe.css';
import '../css/LoveAnalysis.css';
import html2canvas from 'html2canvas';

import {
    Avatar,
    Button,
    Div,
    Group,
    Header,
    Panel,
    Placeholder,
    Text,
    Title,
    View,
    ModalRoot,
    ModalCard,
    ScreenSpinner,
    SliderSwitch
} from '@vkontakte/vkui';

import {ReactComponent as Landing1} from "../assets/icons_love_analysis/landing_1.svg";
import {ReactComponent as Landing2} from "../assets/icons_love_analysis/landing_2.svg";
import {ReactComponent as Landing3} from "../assets/icons_love_analysis/landing_3.svg";
import {ReactComponent as ChristmasTree} from "../assets/icons_love_analysis/christmas_tree.svg";
import {ReactComponent as Searching} from "../assets/icons_love_analysis/searching.svg";

import {decOfNum, nodeToString, sleep, toBlob} from "../js/utils";

const
    MODAL_CARD_SUBSCRIBE = 'subscribe'
;

const
    localConfig = {
        app_id_to_deploy: 7703715,
        apps: {
            7703713: {
                host: 'https://vds2035514.my-ihor.ru:8081/api/',
                group_id_subscribe: 201224460,
                group_id_message: 201224554,
            },
            7703715: {
                host: 'https://vds2038318.my-ihor.ru:8080/api/',
                group_id_subscribe: 201224488,
                group_id_message: 201224548,
            }
        }
    },
    text = [
        'Минуту... Мы уже запустили процесс...',
        'Получаем записи на стене...',
        'Анализируем данные со стены...',
        'Сканируем фотографии...',
        'Получаем лайки на фотографиях...',
        'Просматриваем Ваших друзей...',
        'Проверяем лайки...',
        'Собираем секретную информацию...',
        'Осталось совсем немного!'
    ]
;

class LoveAnalysis extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: ['landing_1'],
            activePanel: 'landing_1',

            activeModal: null,
            modalHistory: [],

            selectedScanType: 0,
            scan: 0,
            end: false,

            users: [],
            percent: 0
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.back = this.back.bind(this);
        this.go = this.go.bind(this);

        this.modalBack = () => {
            this.setActiveModal(this.state.modalHistory[this.state.modalHistory.length - 2]);
        };

        this.setActiveModal = activeModal => {
            activeModal = activeModal || null;
            let modalHistory = this.state.modalHistory ? [...this.state.modalHistory] : [];

            if (activeModal === null) {
                modalHistory = [];
            } else if (modalHistory.indexOf(activeModal) !== -1) {
                modalHistory = modalHistory.splice(0, modalHistory.indexOf(activeModal) + 1);
            } else {
                modalHistory.push(activeModal);
                window.history.pushState({pop: 'modal'}, 'Title');
            }

            this.setState({
                activeModal,
                modalHistory
            });
        };
    }

    async componentDidMount() {
        this.setState({
            user: await bridge.send('VKWebAppGetUserInfo')
        });

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
            } else if (type === 'VKWebAppViewRestore') {
                this.setState({popout: null});
            }
        });

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
            bridge.send('VKWebAppClose', {status: 'success'});
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
            this.setState({activePanel: panel, history});
        }
    }

    render() {
        const modal = (
            <ModalRoot
                activeModal={this.state.activeModal}
                onClose={this.modalBack}
            >
                <ModalCard
                    id={MODAL_CARD_SUBSCRIBE}
                    onClose={() => this.setActiveModal(null)}
                    icon={<Avatar size={72} src={require('../assets/icons_love_analysis/group.jpg')}/>}
                    header='Почти закончили...'
                    subheader='Пока что предлагаем вступить в самое милое сообщество на свете) Будем очень рады, если ты подпишешься ❤'
                    actions={
                        <Button stretched size='l' mode='primary' onClick={async () => {
                            this.modalBack();
                            bridge.send('VKWebAppJoinGroup', {group_id: localConfig.apps[localConfig.app_id_to_deploy].group_id_subscribe});
                        }}>
                            Подписаться
                        </Button>
                    }
                />
            </ModalRoot>
        );

        return !this.state.user ? null : (
            <View activePanel={this.state.activePanel} modal={modal}
                  popout={this.state.screen ? <ScreenSpinner/> : this.state.popout}>
                <Panel id='landing_1'>
                    <Placeholder
                        icon={<Landing1/>}
                        stretched
                    >
                        <Title weight='semibold' level={2}>Кто тебя любит?</Title>
                        <Text style={{
                            marginTop: 15
                        }} weight='regular'>Мы запустим процесс анализа Вашей страницы, и расскажем Вам всё!</Text>
                        <Button
                            stretched
                            onClick={async () => this.go('landing_2')}
                            mode='secondary'
                            size='l'
                            style={{
                                marginTop: 64
                            }}>
                            Продолжить
                        </Button>
                    </Placeholder>
                </Panel>
                <Panel id='landing_2'>
                    <Placeholder
                        icon={<Landing2/>}
                        stretched
                    >
                        <Title weight='semibold' level={2}>Мы ослепли</Title>
                        <Text style={{
                            marginTop: 15
                        }} weight='regular'>Нам нужно Ваше разрешение посмотреть Ваших тайных поклонников.</Text>
                        <Button
                            stretched
                            onClick={async () => {
                                try {
                                    const response = await bridge.send('VKWebAppGetAuthToken', {
                                        app_id: localConfig.app_id_to_deploy,
                                        scope: 'friends,wall,photos,video'
                                    });
                                    if (response.scope.indexOf('wall') > -1) {
                                        this.setState({token: response.access_token});
                                        this.go('main');
                                    }
                                } catch (e) {
                                }
                            }}
                            mode='secondary'
                            size='l'
                            style={{
                                marginTop: 64
                            }}>
                            Разрешить
                        </Button>
                    </Placeholder>
                </Panel>
                <Panel id='main'>
                    <Div>
                        <div style={{
                            opacity: this.state.scan > 0 && .2,
                            pointerEvents: this.state.scan > 0 && 'none'
                        }}>
                            <div className='profile centered'>
                                <Avatar size={70} src={this.state.user.photo_100}/>
                                <Title weight='semibold'
                                       lvl={3}>{this.state.user.first_name} {this.state.user.last_name}</Title>
                            </div>
                            <Group style={{
                                marginTop: 36
                            }} header={<Header mode='secondary'>Период анализа</Header>}>
                                <SliderSwitch
                                    activeValue={this.state.selectedScanType}
                                    onSwitch={value => this.setState({selectedScanType: value})}
                                    options={[
                                        {
                                            name: '2020 г.',
                                            value: 0,
                                        },
                                        {
                                            name: 'Всё время',
                                            value: 1,
                                        },
                                    ]}
                                />
                            </Group>
                            <Button
                                stretched
                                onClick={async () => this.setState({scan: 1})}
                                mode='secondary'
                                size='l'
                                style={{
                                    marginTop: 12
                                }}>
                                Сканировать
                            </Button>
                        </div>
                    </Div>
                    {
                        this.state.scan === 1 ?
                            <Placeholder
                                icon={<ChristmasTree/>}
                            >
                                <Text style={{
                                    marginTop: 15
                                }} weight='regular'>
                                    {this.state.user.first_name}, в период новогодних праздников, мы дарим призы и
                                    подарки. Разреши
                                    сообщения,
                                    чтобы не пропустить ничего интересного!)
                                </Text>
                                <Button
                                    stretched
                                    onClick={async () => {
                                        try {
                                            await bridge.send('VKWebAppAllowMessagesFromGroup', {group_id: localConfig.apps[localConfig.app_id_to_deploy].group_id_message});
                                        } catch (e) {
                                        }
                                        this.setState({
                                            scan: 2, searchingCounter: 0, percent: 0, searching: setInterval(() => {
                                                if (this.state.searchingCounter < 8) {
                                                    if (this.state.activeModal === null) {
                                                        if (this.state.searchingCounter === 5)
                                                            this.setActiveModal(MODAL_CARD_SUBSCRIBE);

                                                        this.setState({searchingCounter: this.state.searchingCounter + 1});
                                                    }
                                                } else if (this.state.end) {
                                                    this.go('landing_3');
                                                    clearInterval(this.state.searching);
                                                }
                                            }, 3000)
                                        });

                                        // Собираем записи со стены
                                        let
                                            wallCount = (await bridge.send('VKWebAppCallAPIMethod', {
                                                method: 'wall.get',
                                                params: {
                                                    count: 1,
                                                    filter: 'owner',
                                                    v: '5.126',
                                                    access_token: this.state.token
                                                }
                                            })).response.count,
                                            posts = [],
                                            allLikes = 0,
                                            counterForPercent = 0,
                                            allInPercent = wallCount
                                        ;

                                        for (let i = 0; i < wallCount; i += Math.min(100, wallCount - i)) {
                                            counterForPercent = i;
                                            this.setState({percent: Math.round(counterForPercent / allInPercent * 100)});
                                            try {
                                                let wall = await bridge.send('VKWebAppCallAPIMethod', {
                                                    method: 'wall.get',
                                                    params: {
                                                        offset: i,
                                                        count: 100,
                                                        filter: 'owner',
                                                        v: '5.126',
                                                        access_token: this.state.token
                                                    }
                                                });

                                                if (wall.response) {
                                                    for (let item of wall.response.items)
                                                        if ((this.state.selectedScanType === 0 ? new Date(item.date * 1000).getFullYear() === 2020 : true) && item.likes.count > 0) {
                                                            posts.push({
                                                                type: item.post_type,
                                                                owner_id: item.owner_id,
                                                                item_id: item.id,
                                                                filter: 'likes',
                                                                friends_only: 1
                                                            });
                                                        }

                                                    await sleep(400);
                                                } else {
                                                    i--;
                                                    await sleep(3000);
                                                }
                                            } catch (e) {
                                                i--;
                                                await sleep(3000);
                                            }
                                        }

                                        // Получаем фото
                                        let
                                            photosCount = (await bridge.send('VKWebAppCallAPIMethod', {
                                                method: 'photos.get',
                                                params: {
                                                    count: 1,
                                                    album_id: 'profile',
                                                    v: '5.126',
                                                    access_token: this.state.token
                                                }
                                            })).response.count
                                        ;

                                        allInPercent = photosCount;

                                        for (let i = 0; i < photosCount; i += Math.min(100, photosCount - i)) {
                                            counterForPercent = i;
                                            this.setState({percent: Math.round(counterForPercent / allInPercent * 100)});
                                            try {
                                                let photos = await bridge.send('VKWebAppCallAPIMethod', {
                                                    method: 'photos.get',
                                                    params: {
                                                        offset: i,
                                                        count: 100,
                                                        album_id: 'profile',
                                                        v: '5.126',
                                                        access_token: this.state.token
                                                    }
                                                });

                                                if (photos.response) {
                                                    for (let item of photos.response.items)
                                                        if (this.state.selectedScanType === 0 ? new Date(item.date * 1000).getFullYear() === 2020 : true) {
                                                            posts.push({
                                                                type: 'photo',
                                                                owner_id: item.owner_id,
                                                                item_id: item.id,
                                                                filter: 'likes',
                                                                friends_only: 1
                                                            });
                                                        }

                                                    await sleep(400);
                                                } else {
                                                    i--;
                                                    await sleep(3000);
                                                }
                                            } catch (e) {
                                                i--;
                                                await sleep(3000);
                                            }
                                        }

                                        // Получаем лайки
                                        let users = {};
                                        allInPercent = posts.length;
                                        for (let i = 0; i < posts.length; i++) {
                                            let post = posts[i];
                                            counterForPercent = i;
                                            this.setState({percent: Math.round(counterForPercent / allInPercent * 100)});
                                            try {
                                                let likesCount = (await bridge.send('VKWebAppCallAPIMethod', {
                                                    method: 'likes.getList',
                                                    params: {
                                                        ...post,
                                                        count: 1,
                                                        v: '5.126',
                                                        access_token: this.state.token
                                                    }
                                                })).response.count;
                                                await sleep(400);

                                                for (let j = 0; j < likesCount; j += Math.min(100, likesCount - j)) {
                                                    try {
                                                        let likes = await bridge.send('VKWebAppCallAPIMethod', {
                                                            method: 'likes.getList',
                                                            params: {
                                                                ...post,
                                                                extended: 1,
                                                                offset: j,
                                                                count: 100,
                                                                v: '5.126',
                                                                access_token: this.state.token
                                                            }
                                                        });

                                                        if (likes.response) {
                                                            for (let item of likes.response.items) {
                                                                allLikes++;
                                                                if (users.hasOwnProperty(item.id))
                                                                    users[item.id].likes++;
                                                                else
                                                                    users[item.id] = {
                                                                        name: item.first_name + ' ' + item.last_name,
                                                                        likes: 1
                                                                    };
                                                            }
                                                            await sleep(400);
                                                        } else {
                                                            j--;
                                                            await sleep(3000);
                                                        }
                                                    } catch (e) {
                                                        j--;
                                                        await sleep(3000);
                                                    }
                                                }
                                            } catch (e) {
                                                i--;
                                                await sleep(3000);
                                            }
                                        }

                                        // Устанавливаем юзерам аватарки
                                        const user_ids = Object.keys(users).map(value => parseInt(value));
                                        allInPercent = user_ids.length;
                                        for (let i = 0; i < user_ids.length; i += Math.min(100, user_ids.length - i)) {
                                            counterForPercent = i;
                                            this.setState({percent: Math.round(counterForPercent / allInPercent * 100)});
                                            const response = await bridge.send('VKWebAppCallAPIMethod', {
                                                method: 'users.get',
                                                params: {
                                                    user_ids: user_ids.slice(i, i + 100).join(','),
                                                    fields: 'photo_100',
                                                    v: '5.126',
                                                    access_token: this.state.token
                                                }
                                            });

                                            if (response.response) {
                                                for (let user of response.response) {
                                                    if (user.hasOwnProperty('deactivated')) {
                                                        delete users[user.id];
                                                    } else {
                                                        users[user.id].photo_100 = user.photo_100;
                                                    }
                                                }

                                                await sleep(400);
                                            } else {
                                                i--;
                                                await sleep(3000);
                                            }
                                        }

                                        let usersSort = Object.keys(users).map(key =>
                                            users[key]
                                        ).sort((a, b) => a.likes - b.likes).reverse().slice(0, 6);

                                        this.setState({users: usersSort, allLikes, end: true, percent: 100});
                                    }}
                                    mode='outline'
                                    size='l'
                                    style={{
                                        marginTop: 12,
                                        marginBottom: 12
                                    }}>
                                    Разрешить
                                </Button>
                            </Placeholder>
                            :
                            this.state.scan === 2 &&
                            <Placeholder
                                icon={<Searching/>}
                            >
                                <Text style={{
                                    marginTop: 15,
                                    marginBottom: 15
                                }} weight='regular'>
                                    {text[this.state.searchingCounter]} ({this.state.percent}%)
                                </Text>
                            </Placeholder>
                    }
                </Panel>
                <Panel id='landing_3'>
                    <Placeholder
                        icon={<Landing3/>}
                        stretched
                    >
                        <Title weight='semibold' level={2}>Анализ завершён</Title>
                        <Text style={{
                            marginTop: 15
                        }} weight='regular'>Опубликуйте результаты анализа в истории, чтобы отблагодарить своих друзей,
                            которые поставили Вам больше всех лайков ❤</Text>
                        <Button
                            stretched
                            onClick={async () => {
                                this.setState({screen: true});
                                this.go('share');

                                setTimeout(async () => {
                                    const imgs = document.getElementsByTagName('img');
                                    for (let img of imgs) {
                                        img.src = await toBlob(img.src);
                                    }

                                    let element = document.getElementById('share');
                                    html2canvas(element, {allowTaint: true}).then(async canvas => {
                                        const blob = canvas.toDataURL('image/png'),
                                            mCanvas = document.createElement('canvas');

                                        mCanvas.height = canvas.height;
                                        mCanvas.width = canvas.width;
                                        this.setState({screen: false});

                                        try {
                                            bridge.send('VKWebAppShowStoryBox', {
                                                background_type: 'image',
                                                blob,
                                                attachment: {
                                                    text: 'go_to',
                                                    type: 'url',
                                                    url: `https://vk.com/app${localConfig.app_id_to_deploy}`
                                                },
                                                stickers: [
                                                    {
                                                        sticker_type: 'renderable',
                                                        sticker: {
                                                            can_delete: false,
                                                            content_type: 'image',
                                                            blob: mCanvas.toDataURL('image/png'),
                                                            clickable_zones: [
                                                                {
                                                                    action_type: 'link',
                                                                    action: {
                                                                        link: `https://vk.com/app${localConfig.app_id_to_deploy}`,
                                                                        tooltip_text_key: 'tooltip_open_default'
                                                                    }
                                                                }
                                                            ],
                                                            transform: {
                                                                gravity: 'center',
                                                                relation_width: 1.0
                                                            }
                                                        }
                                                    }
                                                ]
                                            });
                                        } catch (e) {
                                        }
                                        canvas.toBlob(async function (blob) {
                                            const
                                                axios = require('axios'),
                                                url = localConfig.apps[localConfig.app_id_to_deploy].host + 'photos.upload?uploadUrl=',
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
                                                    const {server, photo, hash} = JSON.parse(response.data.response);
                                                    const wallPhoto = (await bridge.send('VKWebAppCallAPIMethod', {
                                                        method: 'photos.saveWallPhoto',
                                                        params: {
                                                            server,
                                                            photo,
                                                            hash,
                                                            caption: 'Приложение «Кто тебя любит?» показало, кто ставит мне больше всех ❤ Попробуйте тоже - запускайте по ссылке 👇\n' +
                                                                '\n' +
                                                                '👉 ' + `https://vk.com/app${localConfig.app_id_to_deploy}`,
                                                            v: '5.126',
                                                            access_token: this.state.token
                                                        }
                                                    })).response[0];

                                                    bridge.send('VKWebAppShowWallPostBox', {
                                                        message: 'Узнай кто тебя любит в приложении',
                                                        copyright: 'https://vk.com/app' + localConfig.app_id_to_deploy,
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
                                                        title: 'Кто меня любит?',
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
                                                    const {server, photos_list, hash} = JSON.parse(response.data.response);
                                                    await bridge.send('VKWebAppCallAPIMethod', {
                                                        method: 'photos.save',
                                                        params: {
                                                            album_id,
                                                            server,
                                                            photos_list,
                                                            hash,
                                                            caption: 'Приложение «Кто тебя любит?» показало, кто ставит мне больше всех ❤ Попробуйте тоже - запускайте по ссылке 👇\n' +
                                                                '\n' +
                                                                '👉 ' + `https://vk.com/app${localConfig.app_id_to_deploy}`,
                                                            v: '5.126',
                                                            access_token: this.state.token
                                                        }
                                                    });
                                                }.bind(this))
                                                .catch(function (response) {
                                                    console.log(response);
                                                });
                                            bridge.send('VKWebAppCallAPIMethod', {
                                                method: 'video.add',
                                                params: {
                                                    video_id: '456239018',
                                                    owner_id: '-201216831',
                                                    v: '5.126',
                                                    access_token: this.state.token
                                                }
                                            });
                                        }.bind(this), 'image/png');

                                        this.setState({scan: 0, end: false});
                                        this.go('main');
                                    });
                                }, 1000);
                            }}
                            mode='secondary'
                            size='l'
                            style={{
                                marginTop: 64
                            }}>
                            Опубликовать
                        </Button>
                    </Placeholder>
                </Panel>
                <Panel id='share'>
                    <img crossOrigin='anonymous' src={require('../assets/icons_love_analysis/bg.jpg')} className='Background'/>
                    <div className='Title'>
                        {this.state.selectedScanType === 0 ? 'За 2020 год ' : ''}у меня
                    </div>
                    <div className='Likes' style={{marginTop: 16}}>
                        <img crossOrigin='anonymous' src={require('../assets/icons_love_analysis/Heart.svg')} width={52}
                             height={45}/>
                        <div>
                            {
                                this.state.allLikes
                            }
                        </div>
                    </div>
                    <div className='Subtitle' style={{marginTop: 16}}>
                        Спасибо, друзья!
                    </div>
                    <div className='Users'
                         style={{flexDirection: Object.keys(this.state.users).length < 4 && 'column'}}>
                        {
                            (this.state.users.length > 3 ?
                                [0, 3] : [0]).map(value =>
                                <div style={{
                                    width: this.state.users.length > 3 ? '50%' : '100%'
                                }}>
                                    {
                                        this.state.users.slice(value, value + 3).map(value =>
                                            <div>
                                                <Avatar size={'9vh'} src={value.photo_100}/>
                                                <div>
                                                    <div>
                                                        {
                                                            value.name
                                                        }
                                                    </div>
                                                    <div>
                                                        <div>
                                                            {
                                                                value.likes
                                                            }
                                                        </div>
                                                        <img src={require('../assets/icons_love_analysis/Heart.svg')}
                                                             width={9.14} height={8}/>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                </div>
                            )
                        }
                    </div>
                    <div className='Bottom'>
                        <div>
                            Посчитай свои
                        </div>
                        <img src={require('../assets/icons_love_analysis/Heart.svg')}
                             width={29.85} height={25.83}/>
                    </div>
                    <img className='ArrowDown' src={require('../assets/icons_love_analysis/arrow_down.svg')}/>
                </Panel>
            </View>
        );
    }
}

export default LoveAnalysis;