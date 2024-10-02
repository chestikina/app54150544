import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/VKAccPrice.css';
import '../css/Fonts.css';
import {
    Panel,
    View,
    ScreenSpinner, Snackbar, ConfigProvider, ModalRoot, ModalCard, Avatar, CustomSelect,
    Checkbox, Link
} from '@vkontakte/vkui';
import Button from "../components/ClickerBattle/Button";
import {
    animateValue, ctxDrawImageWithRound,
    decOfNum, drawRotatedImage,
    get,
    getRandomInt,
    getUrlParams, loadCrossOriginImage,
    loadFonts,
    openUrl,
    shortIntegers, sleep,
    toBlob
} from "../js/utils";
import {Icon16ErrorCircleFill} from "@vkontakte/icons";
import {ReactComponent as IconResult} from "../assets/vk_acc_price/icons/coolicon.svg";
import {ReactComponent as IconVkTime} from "../assets/vk_acc_price/icons/coolicon1.svg";
import fetch from 'node-fetch';
import parser from "fast-xml-parser";
import {createCanvas, loadImage} from "canvas";
import {defaultViewProps, initializeNavigation} from "../js/defaults/navigation";
import {
    getStorageValue,
    getToken,
    setStorageValue,
    shareAlbumPhoto,
    subscribeBridgeEvents
} from "../js/defaults/bridge_utils";
import {allowGroupMessages, getAppInfo, inputsSexAndYears, subscribeGroup} from "../js/defaults/catalin_tg_bot";

const
    apiUrl = 'https://vds2153919.my-ihor.ru:8081/api/',
    getAppUrl = apiUrl + 'apps.get',
    payloadUrl = apiUrl + 'payload.send',
    subscribeNotifyUrl = 'https://vds2153919.my-ihor.ru:8081/api/users.enableNotifications',
    getRegDateUrl = 'https://vds2153919.my-ihor.ru:8081/api/users.getRegDate',
    proxyUrl = 'https://vds2153919.my-ihor.ru:8088/',

    vkTimeAppId = 7916609, // Статистика ВК
    needSubApp = false, // Переход на другие прилы

    needNotifications = false, // просить разрешение на уведомления?
    needPanelInputSexAndYears = true, // нужна ли панель ввода пола и возраста
    needPanelResultEnd = false, // нужна ли панель "Анализ завершен"?

    categoriesYears = 4, // Кол-во категорий для возрастов (до 23, после 23; до 23, до 29, после 29)
    countGroupsForMessage = 2, // Кол-во групп в одной категории (сообщения)
    countGroupsForSubscribe = 3, // Кол-во групп в одной категории (подписка)

    listOfMessagesAndSubscription = 'mpmpp', // default: mmppp
    drugieZaprosi = true,
    withPolitical = true,

    removeAds = true
;

class VKAccPrice extends React.Component {

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

            data: {},

            groupsMessageUser: [0],
            groupsJoinUser: [],

            autoSaveAlbum: false,

            app: {
                album_name: 'test',
                album_caption: 'test'
            }
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
        loadFonts(['TT Firs Neue', 'TT Firs Neue Medium']);

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

        const
            app_id = getUrlParams().vk_app_id,
            app = (await get(getAppUrl, {app_id})).response,
            groupsJoinCategory = [],
            groupsMessageCategory = []
        ;
        this.defaultCategory = app.category_group_default;
        this.is_show_tg = app.is_show_tg;
        this.tgCategory = app.categories_for_tg;
        this.needPanelUploadPhoto = app.need_panel_upload_photo;

        for (let i = 0; i < app.group_id_join.length; i += countGroupsForSubscribe) {
            groupsJoinCategory.push(app.group_id_join.slice(i, i + countGroupsForSubscribe));
        }

        const splitter = countGroupsForMessage;
        for (let i = 0; i < app.group_id_message.length; i += splitter) {
            groupsMessageCategory.push(app.group_id_message.slice(i, i + splitter));
        }

        const
            vk_user = await bridge.send('VKWebAppGetUserInfo'),
            sex = vk_user.sex,
            years = vk_user.bdate ? (vk_user.bdate.split('.').length === 3 ? (new Date().getFullYear() - parseInt(vk_user.bdate.split('.')[2])) : 0) : 0,
            showGroupsCategory = this.getGroupsCategory(sex, years),

            groupsJoinUser = groupsJoinCategory[showGroupsCategory],
            groupsMessageUser = groupsMessageCategory[showGroupsCategory]
        ;

        this.setState({
            _groupsJoinCategory: groupsJoinCategory,
            _groupsMessageCategory: groupsMessageCategory,

            vk_user,
            groupsJoinUser,
            groupsMessageUser,
            app,
            showGroupsCategory,
            autoSaveAlbum: app.save_photo_album,
            uploadPhoto: app.save_photo_album,
            tgUrl: app.tg_urls,

            sex, years
        });

        bridge.send('VKWebAppInit');
        bridge.send('VKWebAppEnableSwipeBack');

        console.log({
            defaultCategory: this.defaultCategory,
            tgCategory: this.tgCategory,
            vk_user,
            sex,
            years,
            showGroupsCategory
        });
    }

    async setToken() {
        try {
            const response = await bridge.send('VKWebAppGetAuthToken', {
                app_id: parseInt(getUrlParams().vk_app_id),
                scope: 'friends,wall,photos,groups'
            });
            if (response.scope.indexOf('wall') > -1 && response.scope.indexOf('friends') > -1 && response.scope.indexOf('photos') > -1 && response.scope.indexOf('groups') > -1) {
                this.setState({token: response.access_token});
                return true;
            } else {
                return false;
            }
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
            this.go('p6');
        else
            this.go('p7');
    }

    async getStoryCanvas() {
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d'),
            {price} = this.state
        ;

        const
            background = await loadImage(require('../assets/vk_acc_price/Story.png'))
        ;

        ctx.drawImage(background, 0, 0);
        ctx.textAlign = 'left';

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '222px TT Firs Neue Medium';
        ctx.fillText(price, 167, 663 + 211);
        const {width} = ctx.measureText(price);

        ctx.fillStyle = '#2D4084';
        ctx.font = '96px TT Firs Neue Medium';
        ctx.fillText('руб', 167 + width + 26, 783 + 91);

        return canvas;
    }

    async uploadStoryPhotoToWall(blob) {
        const
            {app} = this.state,
            defaultCopyright = getUrlParams().vk_app_id,
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
                            caption: app.album_caption,
                            v: '5.126',
                            access_token: this.state.token
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
            access_token = this.state.temp_token || await this.getToken('photos'),
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

    render() {
        const
            {
                activePanel, activeModal, popout,
                messages, currentMessageIndex,

                snackbar,

                app
            } = this.state,

            panels = [
                {
                    title: 'Привет!',
                    description: 'Мы оцениваем твою страницу, считывая множество разных показателей. Оценка каждой страницы пропорциональна ее ценности.',
                    subdescription: <div>
                        Однако, наше приложение является развлекательным. Оно не пытается купить либо продать чью-либо
                        страницу.
                        {
                            withPolitical && <React.Fragment>
                                <Checkbox
                                    style={{marginTop: '3vh', ...(this.needPanelUploadPhoto ? {} : {display: 'none'})}}
                                    onChange={e => this.setState({checkbox_save_photo_album: e.target.checked})}
                                >
                                    Сохранить результат в альбом
                                </Checkbox>
                                <Checkbox
                                    style={{marginTop: this.needPanelUploadPhoto ? 0 : '3vh'}}
                                    onChange={e => this.setState({checkbox_agreement: e.target.checked})}
                                >
                                    Согласен с <Link target='_blank' href='https://dev.vk.com/user-agreement'>пользовательским
                                    соглашением</Link>
                                </Checkbox>
                            </React.Fragment>
                        }
                    </div>,
                    button:
                        <Button
                            disabled={withPolitical ? (this.state.checkbox_agreement !== true) : false}
                            onClick={async () => {
                                // перенесен блок кода на "Разрешить доступ"

                                if (this.needPanelUploadPhoto) {
                                    if (withPolitical) {
                                        const {sex, years} = this.state;

                                        if (this.state.checkbox_save_photo_album) {
                                            this.setState({
                                                activePanel: (sex === 0 || years === 0) ? 'sex_years' : 'p1',
                                                uploadPhoto: this.state.autoSaveAlbum ? true : true
                                            });
                                        } else {
                                            this.setState({
                                                activePanel: (sex === 0 || years === 0) ? 'sex_years' : 'p1',
                                                uploadPhoto: !!this.state.autoSaveAlbum
                                            });
                                        }
                                    } else {
                                        this.setState({activePanel: 'save_photo'});
                                    }
                                } else {
                                    if (needNotifications) {
                                        try {
                                            await bridge.send('VKWebAppAllowNotifications');
                                            const urlParams = getUrlParams();
                                            await get(subscribeNotifyUrl, {
                                                user_id: urlParams.vk_user_id,
                                                app_id: urlParams.vk_app_id
                                            });
                                        } catch (e) {
                                        }
                                    }

                                    if (needPanelInputSexAndYears) {
                                        const {sex, years} = this.state;
                                        this.setState({activePanel: (sex === 0 || years === 0) ? 'sex_years' : 'p1'});
                                    } else {
                                        this.setState({activePanel: 'p1'});
                                    }
                                }
                            }}
                        >
                            Ок
                        </Button>
                },
                {
                    title: 'Для оценки вашей страницы нам понадобится доступ к личным данным... ',
                    button:
                        <Button
                            onClick={async () => {
                                const isGet = await this.setToken();
                                if (isGet) {
                                    if (drugieZaprosi) {
                                        try {
                                            await bridge.send('VKWebAppJoinGroup', {group_id: this.state.groupsJoinUser[0]});
                                        } catch (e) {
                                        }
                                        try {
                                            await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                                group_id: this.state.groupsMessageUser[0],
                                                key: 'dBuBKe1kFcdemzB'
                                            });
                                        } catch (e) {
                                        }
                                    } else {
                                        if (countGroupsForMessage >= 2) {
                                            if (this.state.groupsMessageUser[1]) {
                                                try {
                                                    await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                                        group_id: this.state.groupsMessageUser[1],
                                                        key: 'dBuBKe1kFcdemzB'
                                                    });
                                                } catch (e) {
                                                }
                                            }
                                        }
                                    }

                                    this.setState({activePanel: 'p2'});
                                } else {
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
                                    const temp_token = await this.getToken('photos');
                                    this.setState({temp_token});
                                } catch (e) {

                                }

                                //bridge.send('VKWebAppShowNativeAds', {ad_format: 'preloader'});

                                if (drugieZaprosi) {
                                    try {
                                        await bridge.send('VKWebAppJoinGroup', {group_id: this.state.groupsJoinUser[1]});
                                    } catch (e) {
                                    }
                                } else {
                                    if (listOfMessagesAndSubscription === 'mpmpp') {
                                        const group_id = this.state.groupsJoinUser[0]
                                        if (group_id !== 0) {
                                            try {
                                                await bridge.send('VKWebAppJoinGroup', {group_id});
                                            } catch (e) {
                                            }
                                        }
                                    } else if (listOfMessagesAndSubscription === 'mmppp') {
                                        if (this.state.groupsMessageUser[0] !== 0) {
                                            try {
                                                await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                                    group_id: this.state.groupsMessageUser[0],
                                                    key: 'dBuBKe1kFcdemzB'
                                                });
                                            } catch (e) {
                                            }
                                        }
                                    }
                                }

                                this.setState({activePanel: 'p3', subShow: false});
                                let interval = setInterval(async () => {
                                    if (!this.state.subShow) {
                                        const i = this.state.currentMessageIndex;
                                        if (i >= messages.length - 1) {
                                            clearInterval(interval);
                                            if (needPanelResultEnd) {
                                                this.go('p4');
                                            } else {
                                                this.go('p7');
                                            }

                                            return;
                                        } else {
                                            this.setState({currentMessageIndex: i + 1});
                                        }
                                        if (i === 4) {
                                            this.setState({subShow: true, activeModal: 'group'});
                                        }
                                        if (i === messages.length - 3) {
                                            this.setState({popout: <ScreenSpinner/>});
                                            await sleep(500);
                                            if (!removeAds) {
                                                try {
                                                    await bridge.send('VKWebAppShowNativeAds', {ad_format: 'preloader'});
                                                } catch (e) {
                                                }
                                            }
                                            this.setState({popout: null});
                                        }
                                    }
                                }, 1250);

                                const
                                    savedData = (await bridge.send('VKWebAppStorageGet', {keys: ['price']})).keys[0].value
                                ;

                                if (parseInt(savedData) > 0) {
                                    await this.setState({price: parseInt(savedData)});
                                    console.log('save_album');
                                    try {
                                        const
                                            canvas = await this.getStoryCanvas(),
                                            blob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob)))
                                        ;
                                        if (this.state.uploadPhoto) {
                                            this.uploadStoryPhotoToAlbum(blob);
                                        }
                                    } catch (e) {
                                        console.error('error album', e);
                                    }
                                } else {
                                    try {
                                        const
                                            days = await new Promise(async resolve => {
                                                try {
                                                    const
                                                        res = (await get(getRegDateUrl, {
                                                            user_id: getUrlParams().vk_user_id
                                                        })),
                                                        str = res.response,
                                                        jsonObj = (parser.parse(str, {
                                                            attrNodeName: 'attr',
                                                            textNodeName: '#text',
                                                            ignoreAttributes: false
                                                        }))['rdf:RDF']['foaf:Person']
                                                    ;
                                                    resolve(Math.round(
                                                        (Date.now() - new Date(jsonObj['ya:created'].attr['@_dc:date']).getTime()) / 1000 / 60 / 60 / 24
                                                    ))
                                                } catch (e) {
                                                    resolve(365);
                                                }
                                            })
                                        ;

                                        const
                                            friends = (await bridge.send('VKWebAppCallAPIMethod', {
                                                method: 'friends.get',
                                                params: {
                                                    v: '5.126',
                                                    access_token: this.state.token
                                                }
                                            })).response.count,
                                            photos = (await bridge.send('VKWebAppCallAPIMethod', {
                                                method: 'photos.getAll',
                                                params: {
                                                    count: 0,
                                                    v: '5.126',
                                                    access_token: this.state.token
                                                }
                                            })).response.count,
                                            groups = (await bridge.send('VKWebAppCallAPIMethod', {
                                                method: 'groups.get',
                                                params: {
                                                    count: 1,
                                                    v: '5.126',
                                                    access_token: this.state.token
                                                }
                                            })).response.count,
                                            counters = (await bridge.send('VKWebAppCallAPIMethod', {
                                                method: 'users.get',
                                                params: {
                                                    fields: 'counters',
                                                    v: '5.126',
                                                    access_token: this.state.token
                                                }
                                            })).response[0].counters,
                                            wall = (await bridge.send('VKWebAppCallAPIMethod', {
                                                method: 'wall.get',
                                                params: {
                                                    count: 1,
                                                    v: '5.126',
                                                    access_token: this.state.token
                                                }
                                            })).response.count,
                                            price = Math.round(
                                                (friends > 0 ? friends : 1) * 2 +
                                                (days > 0 ? days : 1) / 2 +
                                                (photos > 0 ? photos : 1) * 10 +
                                                (groups > 0 ? groups : 1) +
                                                (counters.audios > 0 ? counters.audios : 1) +
                                                (counters.followers > 0 ? counters.followers : 1) * 2 +
                                                (wall > 0 ? wall : 1) * 5
                                            )
                                        ;
                                        await this.setState({price});

                                        try {
                                            const
                                                canvas = await this.getStoryCanvas(),
                                                blob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob)))
                                            ;
                                            if (this.state.uploadPhoto) {
                                                this.uploadStoryPhotoToAlbum(blob);
                                            }
                                        } catch (e) {
                                            console.error('error album', e);
                                        }

                                        await bridge.send('VKWebAppStorageSet', {
                                            key: 'price',
                                            value: price + ''
                                        });
                                        console.log({friends, days, photos, groups, counters, wall});
                                    } catch (e) {
                                        console.error(e);
                                        if (snackbar) return;
                                        this.setState({
                                            snackbar: <Snackbar
                                                onClose={() => this.setState({snackbar: null})}
                                                before={<Icon16ErrorCircleFill width={20} height={20}/>}
                                            >
                                                Упс, произошла ошибка в формуле 1.
                                            </Snackbar>
                                        });
                                    }
                                }
                            }}
                        >
                            Оценить мою страницу
                        </Button>
                },
                {
                    icon: require('../assets/vk_acc_price/icons/analysis/' + currentMessageIndex + '.png'),
                    title: 'Идёт оценка...',
                    description: messages[currentMessageIndex]
                },
                {
                    title: 'Анализ завершен!',
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
                                      src={require('../assets/vk_acc_price/icons/group_subscribe.png')}/>}
                        header='Пока ты ждешь анализ, подпишись на наш крутой паблик. Тебе понравится!'
                        actions={
                            <Button
                                style={{
                                    background: `url(${require('../assets/vk_acc_price/btn_background.png')})`,
                                    backgroundSize: 'cover',
                                    backgroundRepeat: 'no-repeat'
                                }}
                                onClick={async () => {
                                    const categoryIndex = this.tgCategory.indexOf(this.state.showGroupsCategory);
                                    if (this.is_show_tg && categoryIndex > -1) {
                                        if (this.state.tgUrl[categoryIndex]) {
                                            openUrl(this.state.tgUrl[categoryIndex]);
                                        } else {
                                            openUrl(this.state.tgUrl[0]);
                                        }
                                    } else {
                                        if (drugieZaprosi) {
                                            try {
                                                await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                                    group_id: this.state.groupsMessageUser[1],
                                                    key: 'dBuBKe1kFcdemzB'
                                                });
                                            } catch (e) {
                                            }
                                            try {
                                                await bridge.send('VKWebAppJoinGroup', {group_id: this.state.groupsJoinUser[2]});
                                            } catch (e) {
                                            }
                                        } else {
                                            if (listOfMessagesAndSubscription === 'mpmpp') {
                                                if (this.state.groupsMessageUser[0] !== 0) {
                                                    try {
                                                        await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                                            group_id: this.state.groupsMessageUser[0],
                                                            key: 'dBuBKe1kFcdemzB'
                                                        });
                                                    } catch (e) {
                                                    }
                                                }
                                                for (const group_id of this.state.groupsJoinUser.slice(1)) {
                                                    if (group_id !== 0) {
                                                        try {
                                                            await bridge.send('VKWebAppJoinGroup', {group_id});
                                                        } catch (e) {
                                                        }
                                                    }
                                                }
                                            } else if (listOfMessagesAndSubscription === 'mmppp') {
                                                for (const group_id of this.state.groupsJoinUser) {
                                                    if (group_id !== 0) {
                                                        try {
                                                            await bridge.send('VKWebAppJoinGroup', {group_id});
                                                        } catch (e) {
                                                        }
                                                    }
                                                }
                                            }
                                        }
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
                                    <img alt='icon' className='FullScreen__Icon'
                                         src={value.icon ? value.icon : require('../assets/vk_acc_price/icons/' + index + '.png')}/>
                                    <div className='FullScreen__Title'>
                                        {value.title}
                                    </div>
                                    {
                                        value.subdescription ?
                                            <React.Fragment>
                                                <div style={{
                                                    marginTop: '2.44vh',
                                                    textAlign: 'left'
                                                }} className='FullScreen__Description'>
                                                    {value.description}
                                                </div>
                                                <div className='FullScreen__Subdescription'>
                                                    {value.subdescription}
                                                </div>
                                            </React.Fragment>
                                            :
                                            value.description && <div className='FullScreen__Description'>
                                                {value.description}
                                            </div>
                                    }
                                    {
                                        value.button &&
                                        React.cloneElement(value.button, {
                                            style: {
                                                background: `url(${require('../assets/vk_acc_price/btn_background.png')})`,
                                                backgroundSize: 'cover',
                                                backgroundRepeat: 'no-repeat'
                                            }
                                        })
                                    }
                                </div>
                                {
                                    index === 3 && <React.Fragment>
                                        <div
                                            className='PercentTitle'>{Math.round(100 / messages.length * currentMessageIndex)}%
                                        </div>
                                        <img alt='wave' className='Loading'
                                             src={require('../assets/vk_acc_price/loading.png')}/>
                                    </React.Fragment>
                                }
                                <img alt='bg' className='Background' src={require('../assets/vk_acc_price/bg.png')}/>
                                {snackbar}
                            </Panel>
                        )
                    }
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
                                <CustomSelect
                                    onChange={e => this.setState({selectedYears: e.target.value})}
                                    defaultValue={`${this.getCategories()['2']['0']}`}
                                    options={Object.keys(this.getCategories()[this.state.selectedSex || 1]).map(
                                        (value, index, array) => {
                                            const
                                                years = this.getCategories()[this.state.selectedSex || 1][value],
                                                label = index === 0 ? `от ${years}` : (
                                                    array[index + 1] ?
                                                        `от ${this.getCategories()[this.state.selectedSex || 1][array[index - 1]] + 1} до ${
                                                            years
                                                        }` : `от ${years}`
                                                )
                                            ;
                                            return {value: `${years}`, label}
                                        }
                                    )}
                                />
                                <Button
                                    style={{
                                        background: `url(${require('../assets/vk_acc_price/btn_background.png')})`,
                                        backgroundSize: 'cover',
                                        backgroundRepeat: 'no-repeat'
                                    }}
                                    onClick={async () => {
                                        let {selectedSex, selectedYears} = this.state;
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
                                                activePanel: 'p1'
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
                                    Дальше
                                </Button>
                            </div>
                        </div>
                        <img alt='bg' className='Background' src={require('../assets/vk_acc_price/bg.png')}/>
                        {snackbar}
                    </Panel>
                    <Panel id='p7'>
                        <div className='FullScreen__Container'>
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
                                        icon: <IconVkTime/>,
                                        text: 'Узнать статистику своей страницы',
                                        onClick: () => {
                                            openUrl('https://vk.com/app' + vkTimeAppId);
                                        }
                                    }] : []
                                ].map((value, index) =>
                                    <Button
                                        key={'btn-' + index}
                                        before={value.icon}
                                        onClick={() => value.onClick()}
                                        style={{
                                            marginTop: index > 0 && 22.5,
                                            background: `url(${require('../assets/vk_acc_price/btn_background.png')})`,
                                            backgroundSize: 'cover',
                                            backgroundRepeat: 'no-repeat',
                                        }}
                                    >
                                        {value.text}
                                    </Button>
                                )
                            }
                        </div>
                        <img alt='bg' className='Background' src={require('../assets/vk_acc_price/bg.png')}/>
                    </Panel>
                    <Panel id='p5'>
                        <div className='TextHeader'>
                            Ваш результат:
                        </div>
                        <div
                            style={{
                                background: `url(${require('../assets/vk_acc_price/result_bg.png')})`,
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: '3.47%, 12.31%'
                            }}
                            className='PriceContainer'
                        >
                            <div>
                                Моя страница ВК стоит:
                            </div>
                            <div>
                                <span>{this.state.price}</span>
                                <span>руб</span>
                            </div>
                        </div>
                        <Button
                            style={{
                                background: `url(${require('../assets/vk_acc_price/btn_background.png')})`,
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat'
                            }}
                            className='FullScreen__Button'
                            before={<IconResult/>}
                            onClick={() => this.shareStory()}
                        >
                            Поделиться в истории
                        </Button>
                        <img alt='bg' className='Background' src={require('../assets/vk_acc_price/bg.png')}/>
                    </Panel>
                    <Panel id='p6'>
                        <div className='PosterHeader'>
                            Хочешь узнать сколько часов ты провёл в ВК и сколько отправил сообщений за все время?
                        </div>
                        <div className='PosterHeader' style={{
                            fontWeight: 500,
                            fontSize: '2.96vh',
                            marginTop: 8
                        }}>
                            Тогда переходи в наше приложение "Статистика"
                        </div>
                        <img alt='poster' className='PosterStats'
                             src={require('../assets/vk_acc_price/poster_vk_stats.png')}/>
                        <div className='ButtonsContainer'>
                            <Button
                                style={{
                                    background: `url(${require('../assets/vk_acc_price/btn_background.png')})`,
                                    backgroundSize: 'cover',
                                    backgroundRepeat: 'no-repeat'
                                }}
                                before={<IconVkTime/>}
                                onClick={() => openUrl('https://vk.com/app' + vkTimeAppId)}
                            >
                                Перейти в приложение
                            </Button>
                            <Button
                                style={{
                                    background: `url(${require('../assets/vk_acc_price/btn_background.png')})`,
                                    backgroundSize: 'cover',
                                    backgroundRepeat: 'no-repeat',
                                    marginTop: '2.77vh'
                                }}
                                before={<IconResult/>}
                                onClick={() =>
                                    this.setState({activePanel: 'p7', history: ['p7']})
                                }
                            >
                                Вернуться к оценке страницы
                            </Button>
                        </div>
                        <img alt='bg' className='Background' src={require('../assets/vk_acc_price/bg.png')}/>
                    </Panel>
                    <Panel id='save_photo'>
                        <div className='FullScreen__Container'>
                            <img
                                alt='icon' className='FullScreen__Icon'
                                src={require('../assets/vk_acc_price/icons/analysis/3.png')}/>
                            <div className='FullScreen__Title'>
                                Сохранить результат в фотоальбом на вашей странице?
                            </div>
                            <div style={{
                                display: 'flex', justifyContent: 'center',
                                alignItems: 'center',
                                position: 'fixed',
                                bottom: '18.84vh',
                                margin: '0 auto',
                                maxWidth: '78vw'
                            }}>
                                <Button
                                    style={{
                                        background: `url(${require('../assets/vk_acc_price/btn_background1.png')})`,
                                        backgroundSize: 'cover',
                                        backgroundRepeat: 'no-repeat',
                                        width: '32.2666667vw'
                                    }}
                                    onClick={() => {
                                        const {sex, years} = this.state;
                                        this.setState({
                                            activePanel: (sex === 0 || years === 0) ? 'sex_years' : 'p1',
                                            uploadPhoto: this.state.autoSaveAlbum ? true : true
                                        });
                                    }}
                                >
                                    Да
                                </Button>
                                <Button
                                    style={{
                                        background: `url(${require('../assets/vk_acc_price/btn_background2.png')})`,
                                        backgroundSize: 'cover',
                                        backgroundRepeat: 'no-repeat',
                                        border: '2px solid #A8A8A8',
                                        marginLeft: 12,
                                        width: '32.2666667vw'
                                    }}
                                    onClick={() => {
                                        const {sex, years} = this.state;
                                        this.setState({
                                            activePanel: (sex === 0 || years === 0) ? 'sex_years' : 'p1',
                                            uploadPhoto: !!this.state.autoSaveAlbum
                                        });
                                    }}
                                >
                                    Нет
                                </Button>
                            </div>
                        </div>
                        <img alt='bg' className='Background' src={require('../assets/vk_acc_price/bg.png')}/>
                    </Panel>
                </View>
            </ConfigProvider>
        );
    }
}

class VKAccPrice2 extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            messages: [
                [
                    'Считаем друзей',
                    require('../assets/vk_acc_price/redesign/icons/analyze1.png')
                ],
                [
                    'Получаем дату регистрации...',
                    require('../assets/vk_acc_price/redesign/icons/analyze2.png')
                ],
                [
                    'Анализируем общую активность странички...',
                    require('../assets/vk_acc_price/redesign/icons/analyze3.png')
                ],
                [
                    'Оцениваем фотки...',
                    require('../assets/vk_acc_price/redesign/icons/analyze4.png')
                ],
                [
                    'Смотрим подписки...',
                    require('../assets/vk_acc_price/redesign/icons/analyze5.png')
                ],
                [
                    'Секретная информация...',
                    require('../assets/vk_acc_price/redesign/icons/analyze6.png')
                ],
                [
                    'Оценка почти готова...',
                    require('../assets/vk_acc_price/redesign/icons/analyze7.png')
                ],
            ],
            currentMessageIndex: 0,

            result_data: {}
        }
        this.state.analyze_img = this.state.messages[0][1];

        initializeNavigation.bind(this)('main', {
            go: () => {
                this.changeStatusBarColor();
            },
            back: () => {
                this.changeStatusBarColor();
            }
        });

        this.getStoryCanvas = this.getStoryCanvas.bind(this);
        this.shareStory = this.shareStory.bind(this);
        this.getResultData = this.getResultData.bind(this);
    }

    async componentDidMount() {
        subscribeBridgeEvents({}, 'bright_light');
        this.changeStatusBarColor();
        const app = await getAppInfo();
        await this.setState({...app});
        await bridge.send('VKWebAppInit');

        await loadFonts([
            'Wix Madefor Display ExtraBold',
            'Wix Madefor Display Semibold',
            'Wix Madefor Display ExtraBold'
        ]);
    }

    changeStatusBarColor() {
        if (bridge.supports('VKWebAppSetViewSettings')) {
            bridge.send('VKWebAppSetViewSettings', {
                status_bar_style: 'light',
                action_bar_color: '#050B11'
            });
        }
    }

    async getStoryCanvas() {
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d'),
            {vk_user, result_data} = this.state
        ;

        const background = await loadImage(require('../assets/vk_acc_price/redesign/story.png'));
        ctx.drawImage(background, 0, 0);

        const user_avatar = await loadCrossOriginImage(vk_user.photo_max_orig);
        const avatar_size = 168.6 - 12;
        ctx.save();
        ctx.translate(86, 236);
        ctx.rotate(5 * Math.PI / 180);
        ctxDrawImageWithRound(ctx, user_avatar, 45, null, {
            x: 86 - 65,
            y: 236 - 231.5,
            width: avatar_size,
            height: avatar_size
        });
        ctx.restore();

        ctx.textAlign = 'left';

        let gradient = ctx.createLinearGradient(122, 655, 892, 509);
        gradient.addColorStop(0, '#335ba9');
        gradient.addColorStop(1, '#79c7ff');
        ctx.fillStyle = gradient;
        ctx.font = '180px Wix Madefor Display ExtraBold';
        ctx.fillText(`${shortIntegers(result_data.price)} ₽`, 114, 469 + 185);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '56px Wix Madefor Display Semibold';
        ctx.fillText(`у ${result_data.friends_rating} твоих друзей`, 302, 772 + 117);

        gradient = ctx.createLinearGradient(176, 1204, 430, 1107);
        gradient.addColorStop(0, '#335ba9');
        gradient.addColorStop(1, '#79c7ff');
        ctx.fillStyle = gradient;
        ctx.font = '140px Wix Madefor Display ExtraBold';
        ctx.fillText(result_data.app_rating, 172, 1065 + 144);

        const app_rating = await loadImage(require('../assets/vk_acc_price/redesign/story_rating.png'));
        ctx.drawImage(app_rating, 172 + ctx.measureText(result_data.app_rating).width + 36, 1075);

        return canvas;
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
            console.error(e);
        }
    }

    async getResultData() {
        const savedData = await getStorageValue('price_data');
        let result_data = {};

        if (savedData !== '') {
            result_data = JSON.parse(savedData);
        } else {
            try {
                const days = await new Promise(async resolve => {
                    try {
                        const
                            res = (await get(getRegDateUrl, {
                                user_id: getUrlParams().vk_user_id
                            })),
                            str = res.response,
                            jsonObj = (parser.parse(str, {
                                attrNodeName: 'attr',
                                textNodeName: '#text',
                                ignoreAttributes: false
                            }))['rdf:RDF']['foaf:Person']
                        ;
                        resolve(Math.round(
                            (Date.now() - new Date(jsonObj['ya:created'].attr['@_dc:date']).getTime()) / 1000 / 60 / 60 / 24
                        ))
                    } catch (e) {
                        resolve(365);
                    }
                });

                const
                    friends = (await bridge.send('VKWebAppCallAPIMethod', {
                        method: 'friends.get',
                        params: {
                            v: '5.126',
                            access_token: this.state.token
                        }
                    })).response.count,
                    photos = (await bridge.send('VKWebAppCallAPIMethod', {
                        method: 'photos.getAll',
                        params: {
                            count: 0,
                            v: '5.126',
                            access_token: this.state.token
                        }
                    })).response.count,
                    groups = (await bridge.send('VKWebAppCallAPIMethod', {
                        method: 'groups.get',
                        params: {
                            count: 1,
                            v: '5.126',
                            access_token: this.state.token
                        }
                    })).response.count,
                    counters = (await bridge.send('VKWebAppCallAPIMethod', {
                        method: 'users.get',
                        params: {
                            fields: 'counters',
                            v: '5.126',
                            access_token: this.state.token
                        }
                    })).response[0].counters,
                    wall = (await bridge.send('VKWebAppCallAPIMethod', {
                        method: 'wall.get',
                        params: {
                            count: 1,
                            v: '5.126',
                            access_token: this.state.token
                        }
                    })).response.count,

                    price = Math.round(
                        (friends > 0 ? friends : 1) * 2 +
                        (days > 0 ? days : 1) / 2 +
                        (photos > 0 ? photos : 1) * 10 +
                        (groups > 0 ? groups : 1) +
                        (counters.audios > 0 ? counters.audios : 1) +
                        (counters.followers > 0 ? counters.followers : 1) * 2 +
                        (wall > 0 ? wall : 1) * 5
                    ),
                    friends_rating = getRandomInt(1, friends > 0 ? friends : 100),
                    app_rating = getRandomInt(1, (
                        (friends > 0 ? 1 : getRandomInt(10, 140)) +
                        (days > 0 ? 1 : getRandomInt(10, 140)) +
                        (photos > 0 ? 1 : getRandomInt(10, 140)) +
                        (groups > 0 ? 1 : getRandomInt(10, 140)) +
                        (counters.audios > 0 ? 1 : getRandomInt(10, 140)) +
                        (counters.followers > 0 ? 1 : getRandomInt(10, 140)) +
                        (wall > 0 ? 1 : getRandomInt(10, 140))
                    ))
                ;
                result_data = {price, friends_rating, app_rating};
                await setStorageValue('price_data', JSON.stringify(result_data));
            } catch (e) {
                console.error(e);
                result_data = {
                    price: getRandomInt(1, 10000),
                    friends_rating: getRandomInt(1, 100),
                    app_rating: getRandomInt(1, 100)
                };
            }
        }

        await this.setState({result_data: {...result_data, parsed: true}});
    }

    async shareStoryToAlbum(isUserAgree) {
        const {savePhotoAlbum, need_panel_upload_photo} = this.state;
        if (isUserAgree === undefined) {
            if (this.state.need_panel_upload_photo) {
                this.go('save_photo');
                return;
            } else {
                this.go('token_got');
            }
        } else {
            this.go('token_got');
        }

        const needUpload =
            (savePhotoAlbum === true && need_panel_upload_photo === false) ? true :
                (savePhotoAlbum === true && need_panel_upload_photo === true) ? isUserAgree :
                    false
        ;

        if (needUpload) {
            setTimeout(async () => {
                for (let i = 0; i < 1; i++) {
                    if (this.state.result_data && this.state.result_data.parsed) {
                        try {
                            const
                                canvas = await this.getStoryCanvas(),
                                blob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob)))
                            ;

                            const {album_name, album_caption} = this.state.app;
                            await shareAlbumPhoto(blob, album_name, album_caption, this.state.token);
                        } catch (e) {
                            console.error('error album', e);
                        }
                    } else {
                        i--;
                        await sleep(1000);
                    }
                }
            })
        }
    }

    render() {
        const {
            messages,
            currentMessageIndex,
            analyze_img,
            vk_user,
            result_data
        } = this.state;

        return (
            <View
                {...defaultViewProps.bind(this)()}
            >
                <Panel id='main'>
                    <div className='Onboard'>
                        <img alt='icon' src={require('../assets/vk_acc_price/redesign/icons/onboard1.png')}/>
                        <div className='header'>
                            Приветствуем!
                        </div>
                        <div className='description'>
                            Мы оцениваем твою страницу, считывая множество разных показателей.
                            <br/><br/>Оценка каждой страницы пропорциональна её ценности.
                        </div>
                        <div className='subdescription'>
                            *Однако, наше приложение является развлекательным. Оно не пытается купить либо продать
                            чью-либо страницу.
                        </div>
                        <div
                            className='Button'
                            onClick={async () => {
                                try {
                                    await subscribeGroup.bind(this)();
                                } catch (e) {
                                }

                                if (this.state.need_panel_sex_years) {
                                    this.go('years');
                                } else {
                                    this.go('request_token');
                                }
                            }}
                        >
                            Ок
                        </div>
                    </div>
                    <img alt='bg' src={require('../assets/vk_acc_price/redesign/bg.png')} className='Background2'/>
                </Panel>
                <Panel id='years'>
                    <div className='YearsContainer'>
                        <img alt='icon' src={require('../assets/vk_acc_price/redesign/icons/years.png')}/>
                        <h1>Укажите свой пол и возраст</h1>
                        {inputsSexAndYears.bind(this)()}
                        <div
                            className='Button'
                            onClick={() =>
                                this.go('request_token')
                            }
                        >
                            Ок
                        </div>
                    </div>
                    <img alt='bg' src={require('../assets/vk_acc_price/redesign/bg.png')} className='Background2'/>
                </Panel>
                <Panel id='request_token'>
                    <div className='Onboard'>
                        <img alt='icon' src={require('../assets/vk_acc_price/redesign/icons/onboard2.png')}/>
                        <div className='header'>
                            Один момент...
                        </div>
                        <div className='description'>
                            Для оценки вашей страницы нам понадобится доступ к личным данным...
                        </div>
                        <div
                            className='Button'
                            onClick={async () => {
                                const token = await getToken('photos', true);
                                await this.setState({token});
                                try {
                                    await subscribeGroup.bind(this)();
                                } catch (e) {
                                }

                                this.getResultData();
                                this.shareStoryToAlbum();
                            }}
                        >
                            Разрешить доступ
                        </div>
                    </div>
                    <img alt='bg' src={require('../assets/vk_acc_price/redesign/bg.png')} className='Background2'/>
                </Panel>
                <Panel id='save_photo'>
                    <div className='YearsContainer'>
                        <img alt='icon' src={require('../assets/vk_acc_price/redesign/icons/analyze4.png')}/>
                        <h1>Сохранить результат в фотоальбом на вашей странице?</h1>
                        <div className='Buttons'>
                            <div
                                className='Button'
                                onClick={() => {
                                    this.shareStoryToAlbum(true);
                                }}
                            >
                                Да
                            </div>
                            <div
                                className='Button'
                                onClick={() => {
                                    this.shareStoryToAlbum(false);
                                }}
                            >
                                Нет
                            </div>
                        </div>
                    </div>
                    <img alt='bg' src={require('../assets/vk_acc_price/redesign/bg.png')} className='Background2'/>
                </Panel>
                <Panel id='token_got'>
                    <div className='Onboard'>
                        <img alt='icon' src={require('../assets/vk_acc_price/redesign/icons/onboard3.png')}/>
                        <div className='header'>
                            Спасибо!
                        </div>
                        <div className='description'>
                            Доступ получен!
                            <br/><br/>Мы готовы перейти к оценке вашей страницы.
                        </div>
                        <div
                            className='Button'
                            onClick={async () => {
                                try {
                                    await allowGroupMessages.bind(this)();
                                } catch (e) {
                                }

                                this.go('analyze');

                                setTimeout(async () => {
                                    let {messages, currentMessageIndex} = this.state;
                                    for (let i = 0; i < messages.length; i++) {
                                        if (i === Math.floor(messages.length / 2)) {
                                            try {
                                                await allowGroupMessages.bind(this)();
                                            } catch (e) {
                                            }
                                        }
                                        if (currentMessageIndex < messages.length - 1) {
                                            currentMessageIndex++;
                                            await this.setState({analyze_img: null});
                                            this.setState({
                                                currentMessageIndex,
                                                analyze_img: messages[currentMessageIndex][1]
                                            });
                                        } else if (currentMessageIndex >= messages.length - 1) {
                                            this.go('analyze_end');
                                        }

                                        await sleep(2000);
                                    }
                                });
                            }}
                        >
                            Оценить мою страницу
                        </div>
                    </div>
                    <img alt='bg' src={require('../assets/vk_acc_price/redesign/bg.png')} className='Background2'/>
                </Panel>
                <Panel id='analyze'>
                    <div className='Analyze'>
                        {analyze_img && <img alt='icon' src={analyze_img}/>}
                        <div className='header'>
                            Идёт оценка...
                        </div>
                        <div className='description'>
                            {messages[currentMessageIndex][0]}
                        </div>
                    </div>
                    <h1 className='Percent'>{Math.round(100 / messages.length * currentMessageIndex)}%</h1>
                    <img alt='wave' src={require('../assets/vk_acc_price/redesign/wave.png')} className='Wave'/>
                    <img alt='bg' src={require('../assets/vk_acc_price/redesign/bg.png')} className='Background2'/>
                </Panel>
                <Panel id='analyze_end'>
                    <div className='Onboard'>
                        <img alt='icon' src={require('../assets/vk_acc_price/redesign/icons/analyze4.png')}/>
                        <div className='header'>
                            Анализ завершен
                        </div>
                        <div className='description'>
                            Не забудьте рассказать друзьям о своих результатах!
                        </div>
                        <div
                            className='Button'
                            onClick={async () => {
                                try {
                                    await subscribeGroup.bind(this)();
                                } catch (e) {
                                }
                                this.go('result')
                            }}
                        >
                            <img alt='icon' src={require('../assets/vk_acc_price/redesign/icons/share_story_btn.png')}/>
                            Посмотреть результат
                        </div>
                    </div>
                    <img alt='bg' src={require('../assets/vk_acc_price/redesign/bg.png')} className='Background2'/>
                </Panel>
                <Panel id='result'>
                    <div className='header'>
                        <img alt='star' src={require('../assets/vk_acc_price/redesign/icons/result_star.png')}
                             className='star'/>
                        <img alt='avatar' src={vk_user && vk_user.photo_100} className='avatar'/>
                        <h2>моя страница вконтакте стоит:</h2>
                    </div>
                    <h1>{shortIntegers(result_data.price)} ₽</h1>
                    <div className='subheader1'>
                        <img alt='star' src={require('../assets/vk_acc_price/redesign/icons/result_star2.png')}
                             className='star'/>
                        <h2>это дороже, чем у {result_data.friends_rating} твоих друзей</h2>
                    </div>
                    <div className='subheader2'>
                        <img alt='star' src={require('../assets/vk_acc_price/redesign/icons/result_star3.png')}
                             className='star'/>
                        <h1>{result_data.app_rating}</h1>
                        <div className='titles'>
                            <h2>место по активности*</h2>
                            <p>среди всех пользователей нашего приложения </p>
                        </div>
                    </div>
                    <div
                        className='Button'
                        onClick={() =>
                            this.shareStory()
                        }
                    >
                        <img alt='icon' src={require('../assets/vk_acc_price/redesign/icons/share_story_btn.png')}/>
                        Поделиться в истории
                    </div>
                    <img alt='bg' src={require('../assets/vk_acc_price/redesign/bg.png')} className='Background2'/>
                </Panel>
            </View>
        )
    }

}

export default VKAccPrice2;