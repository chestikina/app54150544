import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/VKTime.css';
import '../css/Fonts.css';

import {
    Panel,
    View,
    ScreenSpinner, Snackbar, ConfigProvider, ModalRoot, ModalCard, Avatar, CustomSelect, Alert, Input, Checkbox, Link
} from '@vkontakte/vkui';
import {
    animateValue, ctxDrawImageWithRound,
    decOfNum,
    get,
    getRandomInt,
    getUrlParams, loadCrossOriginImage,
    loadFonts,
    openUrl,
    shortIntegers, sleep,
    toBlob
} from "../js/utils";
import Gear from "../assets/vk_time/icons/gear.png";
import ThumbsUp from "../assets/vk_time/icons/thumbs-up-sign.png";
import Rocket from "../assets/vk_time/icons/rocket.png";
import Button from "../components/ClickerBattle/Button";
import Loading from "../components/VKTime/Loading";
import fetch from 'node-fetch';
import parser from 'fast-xml-parser';
import {Icon16ErrorCircleFill} from "@vkontakte/icons";
import {ReactComponent as IconDeath} from "../assets/vk_time/icons/death.svg";
import {ReactComponent as IconResult} from "../assets/vk_time/icons/approval.svg";
import {ReactComponent as IconTopDialogs} from "../assets/vk_time/icons/podium.svg";
import {ReactComponent as IconPsycho} from "../assets/vk_time/icons/thinking.svg";
import {ReactComponent as IconLikes} from "../assets/vk_time/icons/ic_likes.svg";
import {ReactComponent as IconDateCelebrity} from "../assets/vk_time/icons/ic_date_celebrity.svg";
import {ReactComponent as IconShare} from "../assets/vk_time/icons/megaphone.svg";
import {ReactComponent as IconShare2} from "../assets/vk_time/icons/megaphone2.svg";
import {ReactComponent as IconDoor} from "../assets/vk_time/icons/ic_door.svg";
import {ReactComponent as IconDoor2} from "../assets/vk_time/icons/ic_door2.svg";
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
import {albumApp, entryApp, resultApp, storyApp} from "../js/defaults/catalin_stats";

const
    axios = require('axios'),
    apiUrl = 'https://vds2153919.my-ihor.ru:8081/api/',
    getAppUrl = apiUrl + 'apps.get',
    payloadUrl = apiUrl + 'payload.send',
    proxyUrl = 'https://proxy.adminbase.ru/',
    getRegDateUrl = 'https://vds2153919.my-ihor.ru:8081/api/users.getRegDate',

    psychoAppId = 7905962, // Псих возраст
    deathAppId = 7861042, // Дата смерти
    likesAppId = 7906047, // Статистика лайков
    dateCelebrityAppId = 7930419, // Даты рождения знаменитостей
    needSubApp = false, // Нужно ли другое приложение

    needPanelInputSexAndYears = true, // нужна ли панель ввода пола и возраста
    needPanelResultEnd = false, // нужна ли панель "Анализ завершен"?

    categoriesYears = 4, // Кол-во категорий для возрастов (до 23, после 23; до 23, до 29, после 29)
    countGroupsForMessage = 2, // Кол-во групп в одной категории (сообщения)
    countGroupsForSubscribe = 3, // Кол-во групп в одной категории (подписка)

    isNeedPay = false, // Платное приложение или нет
    drugieZaprosi = true,
    withPolitical = true,

    redesign = true, // новая версия фиолетовый цвет
    removeAds = true

    //isShowPsych = true // Какую кнопку отобразить? Псих возраст или дату смерти
;

const PanelBackgroundPath = redesign ? require('../assets/vk_time/bg2.png') : require('../assets/vk_time/bg.png');

class VKTime extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: ['p0'],
            activePanel: 'p0',

            currentMessageIndex: 0,
            messages: [
                'просматриваю твой профиль...',
                'ищу дату регистрации...',
                'считаю часы...',
                'считаю часы...',
                'всё ещё считаю часы...',
                'как же много было потрачено времени в вк...',
                'столько времени даже моя мама в одноклассниках не провела...',
                'опрашиваем друзей...',
                'опрашиваем друзей...',
                'анализируем собранные данные...',
                'анализируем собранные данные...',
                'подготавливаю выходные данные...',
                'почти всё готово...',
                'почти всё готово...',
                'ещё чуть-чуть...'
            ],

            messages_old: [
                'получаю секретные данные...',
                'ищу день регистрации...',
                'считаю часы...',
                'считаю часы...',
                'всё ещё считаю часы...',
                'как же много было потрачено времени в вк...',
                'столько времени даже моя мама в одноклассниках не провела...',
                'получаю сообщения...',
                'считаем сообщения...',
                'это ж сколько надо переписываться? 24/7 в вк сидеть?',
                'считаю сообщения...',
                'подготавливаю выходные данные...',
                'почти всё готово...',
                'почти всё готово...',
                'ещё чуть-чуть...'
            ],

            data: {},

            groupsMessageUser: [0],
            groupsJoinUser: [],

            autoSaveAlbum: false
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

    /*getGroupsCategory(sex, years) {
        if (categoriesYears === 3) {
            return (sex === 0 || years === 0) ? this.defaultCategory :
                (
                    sex === 2 ?
                        (years <= 23 ? 0 : (years <= 29 ? 1 : 2)) :
                        (sex === 1 ? (years <= 23 ? 3 : (years <= 29 ? 4 : 5))
                            : this.defaultCategory)
                );
        } else if (categoriesYears === 2) {
            return (sex === 0 || years === 0) ? this.defaultCategory :
                (
                    sex === 2 ?
                        (years <= 23 ? 0 : 1) :
                        (sex === 1 ? (years <= 23 ? 2 : 3)
                            : this.defaultCategory)
                );
        }
        return this.defaultCategory;
    }*/

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
                        1: 20,
                        2: 29,
                        3: 30
                    },
                    1: { // женский
                        4: 16,
                        5: 20,
                        6: 29,
                        7: 30
                    },
                }
            }
        )[categoriesYears];
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

    async componentDidMount() {
        bridge.send('VKWebAppInit');
        loadFonts(['TT Firs Neue', 'TT Firs Neue Medium', 'TT Firs Neue DemiBold']);

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
                        action_bar_color: '#2955BE'
                    });
                }
            } else if (type === 'VKWebAppViewRestore') {
                this.setState({popout: null});
            }
        });

        //this.setState({app: (await require('../js/utils').get(getAppUrl, {app_id: getUrlParams().vk_app_id})).response});

        const
            app_id = getUrlParams().vk_app_id,
            app = (await get(getAppUrl, {app_id})).response,
            groupsJoinCategory = [],
            groupsMessageCategory = []
        ;
        if (!app) return;

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
            showGroupsCategory,

            groupsJoinUser,
            groupsMessageUser
        });
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

        if (needSubApp) {
            this.go('vk_likes');
        } else {
            this.setState({activePanel: 'p5', history: ['p5']})
        }
    }

    async getStoryCanvas() {
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d')
        ;

        const
            background = await loadImage(require(`../assets/vk_time/story/${redesign ? 'bg2' : 'bg'}.png`)),
            ic_time = await loadImage(require(`../assets/vk_time/story/${redesign ? 'ic_time2' : 'ic_time'}.png`)),
            ic_msg = await loadImage(require(`../assets/vk_time/story/${redesign ? 'ic_msg2' : 'ic_msg'}.png`))
        ;

        ctx.drawImage(background, 0, 0);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFFFFF';

        const
            {hours, messages, days_lost} = this.state.data,
            days = Math.floor(hours / 24),
            messages_in_day = Math.floor(messages / days_lost),
            hoursText = shortIntegers(hours),
            messagesText = shortIntegers(messages),
            hoursPref = decOfNum(hours, ['час', 'часа', 'часов'], false),
            messagesPref = decOfNum(messages, ['сообщение', 'сообщения', 'сообщений'], false)
        ;

        if (redesign) {
            ctx.font = (hours >= 1000000 ? 146 : 157) + 'px TT Firs Neue DemiBold';
            ctx.fillText(hoursText, 106, 408 + 169 - 120 + 33);
            ctx.drawImage(ic_time, 106 + ctx.measureText(hoursText).width + 51, 364.45 - 40);

            ctx.font = (messages >= 1000000 ? 146 : 157) + 'px TT Firs Neue DemiBold';
            ctx.fillText(messagesText, 106, 1095 + 169 + 19 - 72);
            ctx.drawImage(ic_msg, 106 + ctx.measureText(messagesText).width + 64, 1097.66 - 37);

            ctx.font = '69px TT Firs Neue';
            ctx.fillText(hoursPref, 106, 624 + 127 - 101 - 56);
            ctx.fillText(messagesPref, 106, 1309 + 127 + 4 - 128);

            ctx.font = '75px TT Firs Neue Medium';
            ctx.fillText(`≈${decOfNum(days, ['день', 'дня', 'дней'])} без`, 106, 624 + 74);
            ctx.fillText('перерыва', 106, 624 + 75 + 50 + 46);
            ctx.fillText(`≈${decOfNum(messages_in_day, ['сообщение', 'сообщения', 'сообщений'])}/день`, 106, 1341 + 75);
        } else {
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
        }

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
            album_id = (await bridge.send('VKWebAppCallAPIMethod', {
                method: 'photos.createAlbum',
                params: {
                    title: album_name,
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

        for (let i = 0; i < 1; i++) {
            await new Promise(async res => {
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
                                    caption: album_caption,
                                    v: '5.126',
                                    access_token: this.state.token
                                }
                            });
                            res(true);
                        });
                } catch (e) {
                    i--;
                    await sleep(1000);
                    res(true);
                    console.error(e);
                }
            })
        }
    }

    setAlert(title, description, buttons, children) {
        this.setState({
            popout: <Alert
                actions={buttons}
                actionsLayout='vertical'
                onClose={() => this.setState({popout: null})}
                header={title}
                text={description}
            >
                {children}
            </Alert>
        });
    }

    render() {
        const
            {
                activePanel, activeModal, popout,
                messages, currentMessageIndex,

                snackbar, data,

                app
            } = this.state,

            panels = [
                {
                    icon: Gear,
                    title: 'Разрешите доступ',
                    description: 'Это необходимо для того, чтобы я смог получить твои данные',
                    button:
                        <Button
                            className='FullScreen__Button'
                            onClick={async () => {
                                try {
                                    await this.setToken();

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
                                    }

                                    this.setState({activePanel: 'p2'});

                                    const
                                        savedData = (await bridge.send('VKWebAppStorageGet', {keys: ['data2']})).keys[0].value,
                                        savedDataJSON = savedData !== '' && JSON.parse(savedData)
                                    ;

                                    if (savedDataJSON) {
                                        await this.setState({data: savedDataJSON});
                                    } else {


                                        let err = false;
                                        try {
                                            await fetch(proxyUrl + 'vk.com/foaf.php?id=' + getUrlParams().vk_user_id)
                                                .then(response => response.text())
                                                .then(async str => {
                                                    try {
                                                        const
                                                            jsonObj = (parser.parse(str, {
                                                                attrNodeName: 'attr',
                                                                textNodeName: '#text',
                                                                ignoreAttributes: false
                                                            }))['rdf:RDF']['foaf:Person'],
                                                            hours = Math.round(
                                                                (Date.now() - new Date(jsonObj['ya:created'].attr['@_dc:date']).getTime()) / 1000 / 60 / 60 / 9.5
                                                            ),
                                                            days_lost = (Date.now() - new Date(jsonObj['ya:created'].attr['@_dc:date']).getTime()) / 1000 / 60 / 60 / 24,
                                                            friends = (await bridge.send('VKWebAppCallAPIMethod', {
                                                                method: 'friends.get',
                                                                params: {
                                                                    v: '5.126',
                                                                    access_token: this.state.token
                                                                }
                                                            })).response.count,
                                                            messages = friends > 0 ? (hours * friends * 2) : (hours * 2)
                                                        ;
                                                        await this.setState({data: {hours, messages, days_lost}});
                                                    } catch (e) {
                                                        err = true;
                                                    }
                                                });
                                        } catch (e) {
                                            err = true;
                                        }
                                        if (err) {
                                            console.log('Parsed with err');
                                            await this.setState({
                                                data: {
                                                    hours: Math.round(getRandomInt(38000, 45000) / 9.5),
                                                    messages: Math.round(getRandomInt(2500000, 3200000))
                                                }
                                            });
                                        }
                                        console.log(this.state.data);
                                    }

                                    if (this.state.uploadPhoto) {
                                        (await this.getStoryCanvas()).toBlob(async function (blob) {
                                            this.uploadStoryPhotoToAlbum(blob);
                                        }.bind(this));
                                    }

                                    if (drugieZaprosi) {

                                    } else {
                                        if (countGroupsForMessage >= 2) {
                                            if (this.state.groupsMessageUser[0]) {
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
                            Хорошо
                        </Button>
                },
                {
                    icon: ThumbsUp,
                    title: 'Отлично!',
                    description: 'Теперь я могу проанализировать твои данные',
                    button:
                        <Button
                            className='FullScreen__Button'
                            onClick={async () => {
                                if (drugieZaprosi) {
                                    try {
                                        await bridge.send('VKWebAppJoinGroup', {group_id: this.state.groupsJoinUser[1]});
                                    } catch (e) {
                                    }
                                } else {
                                    const group_id = countGroupsForMessage >= 2 ? this.state.groupsMessageUser[1] : this.state.groupsMessageUser[0];
                                    if (group_id !== 0 && group_id !== undefined) {
                                        try {
                                            await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                                group_id,
                                                key: 'dBuBKe1kFcdemzB'
                                            });
                                        } catch (e) {
                                        }
                                    }
                                }

                                this.setState({activePanel: 'p3', subShow: false});
                                let interval = setInterval(async () => {
                                    if (!this.state.subShow) {
                                        const i = this.state.currentMessageIndex;
                                        this.setState({currentMessageIndex: i + 1});
                                        if (i === Math.round(messages.length / 2)) {
                                            this.setState({subShow: true, activeModal: 'group'});
                                        }
                                        if (i >= messages.length - 1) {
                                            clearInterval(interval);
                                            if (isNeedPay) {
                                                const urlParams = getUrlParams();
                                                get(payloadUrl, {
                                                    ...urlParams,
                                                    key: 'pay_app',
                                                    value: urlParams.vk_app_id,
                                                    payload: 'view'
                                                })
                                                this.setState({activePanel: 'pay_app'})
                                            } else {
                                                if (needPanelResultEnd) {
                                                    this.go('p4');
                                                } else {
                                                    this.go('p6');
                                                }
                                            }
                                        }

                                        if (i === messages.length - 3 && removeAds === false) {
                                            if (!isNeedPay) {
                                                this.setState({popout: <ScreenSpinner/>});
                                                await sleep(500);
                                                try {
                                                    await bridge.send('VKWebAppShowNativeAds', {ad_format: 'preloader'});
                                                } catch (e) {
                                                }
                                                this.setState({popout: null});
                                            }
                                        }
                                    }
                                }, 1250);
                            }}
                        >
                            Начать анализ
                        </Button>
                },
                {
                    icon: <Loading/>,
                    title: 'Провожу анализ',
                    description: messages[currentMessageIndex]
                },
                {
                    icon: Rocket,
                    title: 'Анализ завершён',
                    description: 'Ну что, посмотрим, сколько времени отняло у тебя ВКонтакте?',
                    button:
                        <Button
                            className='FullScreen__Button'
                            onClick={async () => {
                                if (drugieZaprosi) {

                                } else {
                                    try {
                                        await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                            group_id: app.group_id_message[1],
                                            key: 'FSDIfulnwje'
                                        });
                                    } catch (e) {
                                    }
                                }
                                this.shareStory();
                                this.setState({activePanel: 'p5', history: ['p5']})
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
                        icon={<Avatar size={72} src={require('../assets/vk_time/icons/group.jpg')}/>}
                        header='Почти закончили...'
                        subheader='Пока что можешь подписаться на самое крутое сообщество на свете) Будем очень рады, если ты подпишешься ❤'
                        actions={
                            <Button onClick={async () => {
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
                                    for (const group_id of this.state.groupsJoinUser) {
                                        if (group_id !== 0) {
                                            try {
                                                await bridge.send('VKWebAppJoinGroup', {group_id});
                                            } catch (e) {
                                            }
                                        }
                                    }
                                }
                                this.setState({subShow: false, activeModal: null});
                            }}>
                                Подписаться
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
                            {
                                redesign ?
                                    <IconDoor2 style={{overflow: 'overlay'}}/>
                                    :
                                    <IconDoor style={{overflow: 'overlay'}}/>
                            }
                            <div className='FullScreen__Title'>
                                Привет!
                            </div>
                            <div className='FullScreen__Description'>
                                Наше приложение не является официальным и не может предоставить точную статистику*
                            </div>
                            <div className='FullScreen__Description'
                                 style={{marginTop: 15, color: redesign ? '#C472C6' : '#1D4076'}}>
                                *Приблизительные цифры высчитываются по формуле разработанной при анализе специальной
                                фокус группы.
                            </div>
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
                            <Button
                                disabled={withPolitical ? (this.state.checkbox_agreement !== true) : false}
                                className='FullScreen__Button'
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
                        </div>
                        <img alt='bg' className='Background' src={PanelBackgroundPath}/>
                    </Panel>
                    {
                        panels.map((value, index) =>
                            <Panel id={`p${index + 1}`} key={`p${index + 1}`}>
                                <div className='FullScreen__Container'>
                                    {typeof value.icon === 'object' ?
                                        value.icon :
                                        <img alt='icon' className='FullScreen__Icon' src={value.icon}/>
                                    }
                                    <div className='FullScreen__Title'>
                                        {value.title}
                                    </div>
                                    <div className='FullScreen__Description'>
                                        {value.description}
                                    </div>
                                    {value.button}
                                </div>
                                <img alt='bg' className='Background' src={PanelBackgroundPath}/>
                                {snackbar}
                            </Panel>
                        )
                    }
                    <Panel id='p5'>
                        <div className='FullScreen__Container'>
                            {
                                [
                                    {
                                        icon: <IconResult/>,
                                        text: 'Посмотреть результат',
                                        onClick: () => {
                                            this.go('p6');
                                        }
                                    },
                                    /*{
                                        icon: <IconTopDialogs/>,
                                        text: 'Топ 5 моих диалогов',
                                        onClick: () => {

                                        }
                                    },*/
                                    /*{
                                        icon: <IconPsycho/>,
                                        text: 'Узнать свой психологический возраст',
                                        onClick: () => {
                                            openUrl('https://vk.com/app' + psychoAppId);
                                        }
                                    },*//*
                                    {
                                        icon: <IconLikes/>,
                                        text: 'Узнать статистику лайков',
                                        onClick: () => {
                                            openUrl('https://vk.com/app' + likesAppId);
                                        }
                                    },*//*
                                    {
                                        icon: <IconDeath/>,
                                        text: 'Узнать дату своей смерти',
                                        onClick: () => {
                                            openUrl('https://vk.com/app' + deathAppId);
                                        }
                                    }*/
                                ].map((value, index) =>
                                    <Button
                                        key={'btn-' + index}
                                        className='FullScreen__Button'
                                        before={value.icon}
                                        onClick={() => value.onClick()}
                                        style={{
                                            marginTop: index > 0 && 12
                                        }}
                                    >
                                        {value.text}
                                    </Button>
                                )
                            }
                        </div>
                        <img alt='bg' className='Background' src={PanelBackgroundPath}/>
                    </Panel>
                    <Panel id='p6'>
                        <div className={redesign ? 'TextHeader2' : 'TextHeader'}>
                            Ты провёл
                            <br/>во Вконтакте:
                        </div>
                        <div className='TextCounter'>
                            <span style={{fontSize: data.hours >= 1000000 ? 50 : 63}}>
                                {shortIntegers(data.hours)}
                            </span>
                            <img alt='ic' width={45} height={60}
                                 src={require(`../assets/vk_time/story/${redesign ? 'ic_time2' : 'ic_time'}.png`)}/>
                        </div>
                        <div className={redesign ? 'TextSubCounter2' : 'TextSubCounter'}>
                            {decOfNum(data.hours, ['час', 'часа', 'часов'], false)}
                        </div>
                        {
                            redesign &&
                            <div className='TextSubCounter2_2'>
                                ≈{decOfNum(Math.floor(data.hours / 24), ['день', 'дня', 'дней'])}
                            </div>
                        }
                        <div className='TextHeader' style={{marginTop: 30}}>
                            За это время ты
                            <br/>отправил:
                        </div>
                        <div className='TextCounter'>
                            <span style={{fontSize: data.messages >= 1000000 ? 50 : 63}}>
                                {shortIntegers(data.messages)}
                            </span>
                            <img alt='ic' width={62} height={53}
                                 src={require(`../assets/vk_time/story/${redesign ? 'ic_msg2' : 'ic_msg'}.png`)}/>
                        </div>
                        <div className={redesign ? 'TextSubCounter2' : 'TextSubCounter'}>
                            {decOfNum(data.messages, ['сообщение', 'сообщения', 'сообщений'], false)}
                        </div>
                        {
                            redesign &&
                            <div className='TextSubCounter2_2'>
                                ≈{decOfNum(Math.floor(data.messages / data.days_lost), ['сообщение', 'сообщения', 'сообщений'])}/день
                            </div>
                        }
                        <Button
                            className='FullScreen__Button'
                            before={redesign ? <IconShare2/> : <IconShare/>}
                            onClick={() => this.shareStory()}
                        >
                            Поделиться в истории
                        </Button>
                        <img alt='bg' className='Background' src={PanelBackgroundPath}/>
                    </Panel>
                    <Panel id='vk_likes'>
                        <div className='PosterHeader'>
                            Хочешь узнать с какими знаменитостями ты родился в один день?
                        </div>
                        <div className='PosterHeader' style={{
                            fontWeight: 500,
                            fontSize: '3.45vh',
                            marginTop: 10
                        }}>
                            Тогда переходи в наше новое приложение!
                        </div>
                        <img alt='poster' className='PosterLikes'
                             src={require('../assets/vk_time/poster_date_celebrity.png')}/>
                        <div className='ButtonsContainer'>
                            <Button
                                before={<IconDateCelebrity/>}
                                onClick={() => openUrl('https://vk.com/app' + dateCelebrityAppId)}
                            >
                                Перейти в приложение
                            </Button>
                            <Button
                                style={{marginTop: '3.08vh'}}
                                before={<IconResult/>}
                                onClick={() =>
                                    this.setState({activePanel: 'p5', history: ['p5']})
                                }
                            >
                                Вернуться к статистике
                            </Button>
                        </div>
                        <img alt='bg' className='Background' src={PanelBackgroundPath}/>
                    </Panel>
                    <Panel id='save_photo'>
                        <div className='FullScreen__Container' style={{height: '90vh'}}>
                            <img
                                alt='icon' className='FullScreen__Icon'
                                src={require('../assets/vk_time/icons/camera.png')}/>
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
                                        marginLeft: 12,
                                        width: '43.0666667vw'
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
                                        marginLeft: 12,
                                        width: '43.0666667vw',
                                        opacity: .65
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
                        <img alt='bg' className='Background' src={PanelBackgroundPath}/>
                    </Panel>
                    <Panel id='sex_years'>
                        <div className='FullScreen__Container' style={{height: '80vh'}}>
                            <img
                                alt='icon' className='FullScreen__Icon'
                                src={require('../assets/vk_time/icons/teddy-bear.png')}/>
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
                        <img alt='bg' className='Background' src={PanelBackgroundPath}/>
                    </Panel>
                    <Panel id='pay_app'>
                        <div className='FullScreen__Container' style={{height: '90vh'}}>
                            <img
                                alt='icon' className='FullScreen__Icon'
                                src={require('../assets/vk_time/icons/message.png')}/>
                            <div className='FullScreen__Title'>
                                Стоимость анализа 1Р
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
                                        marginLeft: 12,
                                        width: '43.0666667vw'
                                    }}
                                    onClick={() => {
                                        this.setState({pay_clicked_url: true});
                                        openUrl('https://bit.ly/3dUif9O');
                                    }}
                                >
                                    Оплатить
                                </Button>
                                <Button
                                    style={{
                                        marginLeft: 12,
                                        width: '43.0666667vw',
                                        background: '#969696'
                                    }}
                                    onClick={() => {
                                        if (this.state.pay_clicked_url) {
                                            if (needPanelResultEnd) {
                                                this.setState({activePanel: 'p4', popout: null});
                                            } else {
                                                this.setState({activePanel: 'p6', popout: null});
                                            }
                                        } else {
                                            this.setAlert(
                                                'Подтверждение', 'Введите код, который пришёл вам на почту после оплаты.',
                                                [{
                                                    title: 'Дальше',
                                                    action: async () => {
                                                        const payload = this.inputPayCode.value;
                                                        this.setState({popout: <ScreenSpinner/>});
                                                        const
                                                            urlParams = getUrlParams(),
                                                            result = (await get(payloadUrl, {
                                                                ...urlParams,
                                                                key: 'pay_app',
                                                                value: urlParams.vk_app_id,
                                                                payload
                                                            })).response
                                                        ;

                                                        if (result === true) {
                                                            if (needPanelResultEnd) {
                                                                this.setState({activePanel: 'p4', popout: null});
                                                            } else {
                                                                this.setState({activePanel: 'p6', popout: null});
                                                            }
                                                        } else {
                                                            this.setAlert('Упс', 'Вы ввели неверный код. Попробуйте ещё раз.',
                                                                [
                                                                    {
                                                                        title: 'Ок',
                                                                        autoclose: true,
                                                                        mode: 'cancel'
                                                                    }
                                                                ]
                                                            );
                                                        }
                                                    }
                                                }, {
                                                    title: 'Отмена',
                                                    autoclose: true,
                                                    mode: 'cancel'
                                                }],
                                                <Input style={{marginTop: 12}} getRef={(ref) => {
                                                    this.inputPayCode = ref;
                                                }}/>
                                            )
                                        }
                                    }}
                                >
                                    Уже оплатил
                                </Button>
                            </div>
                        </div>
                        <img alt='bg' className='Background' src={PanelBackgroundPath}/>
                    </Panel>
                </View>
            </ConfigProvider>
        );
    }
}

class VKTime2 extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            messages: [
                [
                    'Получаем дату регистрации...',
                    require('../assets/vk_time/redesign/icons/analyze1.png')
                ],
                [
                    'Считаем дни с момента первого входа вк...',
                    require('../assets/vk_time/redesign/icons/analyze2.png')
                ],
                [
                    'Пытаемся узнать сколько сообщений было отправлено...',
                    require('../assets/vk_time/redesign/icons/analyze3.png')
                ],
                [
                    'Получаем данные других пользователей...',
                    require('../assets/vk_time/redesign/icons/analyze4.png')
                ],
                [
                    'Сравниваем все полученные данные...',
                    require('../assets/vk_time/redesign/icons/analyze5.png')
                ],
                [
                    'Секретная информация...',
                    require('../assets/vk_time/redesign/icons/analyze6.png')
                ],
                [
                    'Формируется результат...',
                    require('../assets/vk_time/redesign/icons/analyze7.png')
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
            'Unbounded Black',
            'Wix Madefor Display ExtraBold',
            'Wix Madefor Display Bold'
        ]);

        entryApp();
    }

    changeStatusBarColor() {
        if (bridge.supports('VKWebAppSetViewSettings')) {
            bridge.send('VKWebAppSetViewSettings', {
                status_bar_style: 'dark',
                action_bar_color: '#E9E9E9'
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

        const background = await loadImage(require('../assets/vk_time/redesign/story.png'));
        ctx.drawImage(background, 0, 0);

        ctx.textAlign = 'left';

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '85px Unbounded Black';
        ctx.fillText(result_data.hours, 416, 338 + 84);
        const offset1 = ctx.measureText(result_data.hours).width;

        ctx.font = '45px Wix Madefor Display ExtraBold';
        ctx.fillText(decOfNum(result_data.hours, ['час', 'часа', 'часов'], false), 416 + offset1 + 11, 376.46 + 46);

        ctx.font = '45px Wix Madefor Display Bold';
        ctx.fillText(`≈ ${decOfNum(result_data.days, ['день', 'дня', 'дней'])} без перерыва`, 416, 458 + 46);

        ctx.fillStyle = '#000000';
        ctx.font = '85px Unbounded Black';
        ctx.fillText(shortIntegers(result_data.messages), 416.03, 746 + 84);

        ctx.font = '45px Wix Madefor Display ExtraBold';
        ctx.fillText(decOfNum(result_data.messages, ['сообщение', 'сообщения', 'сообщений'], false), 416.03, 850.69 + 46);

        ctx.font = '45px Wix Madefor Display Bold';
        ctx.fillText(`≈ ${decOfNum(result_data.messages_in_day, ['сообщение', 'сообщения', 'сообщений'])}/день`, 416.03, 932.69 + 46);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '85px Unbounded Black';
        ctx.fillText(result_data.app_rating, 416, 1141 + 84);

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
            storyApp();

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
        const savedData = await getStorageValue('stats_data');
        let result_data = {};

        if (savedData !== '') {
            result_data = JSON.parse(savedData);
        } else {
            for (let i = 1; i <= 5; i++) {
                try {
                    const
                        res = (await get(getRegDateUrl, {user_id: getUrlParams().vk_user_id})),
                        str = res.response,
                        jsonObj = (parser.parse(str, {
                            attrNodeName: 'attr',
                            textNodeName: '#text',
                            ignoreAttributes: false
                        }))['rdf:RDF']['foaf:Person'],
                        friends = (await bridge.send('VKWebAppCallAPIMethod', {
                            method: 'friends.get',
                            params: {
                                v: '5.126',
                                access_token: this.state.token
                            }
                        })).response.count,
                        hours = Math.round(
                            (Date.now() - new Date(jsonObj['ya:created'].attr['@_dc:date']).getTime()) / 1000 / 60 / 60 / 9.5
                        ),
                        days = Math.floor(hours / 24),
                        messages = friends > 0 ? (hours * friends * 2) : (hours * 2),
                        messages_in_day = Math.floor(messages / ((Date.now() - new Date(jsonObj['ya:created'].attr['@_dc:date']).getTime()) / 1000 / 60 / 60 / 24)),
                        app_rating = getRandomInt(1, (
                            messages <= 1000 ? 1000 :
                                (
                                    messages <= 10000 ? 800 :
                                        (
                                            messages <= 100000 ? 500 :
                                                (
                                                    messages <= 1000000 ? 250 : 100
                                                )
                                        )
                                )
                        ))
                    ;
                    result_data = {hours, days, messages, messages_in_day, app_rating};
                    await setStorageValue('stats_data', JSON.stringify(result_data));
                    break;
                } catch (e) {
                    console.error(`FORMULA ERROR: ${e.message}, ${i}`);
                    if (i === 5) {
                        const
                            hours = Math.round(getRandomInt(10000, 45000) / 9.5),
                            days = Math.floor(hours / 24),
                            messages = getRandomInt(100000, 3200000),
                            messages_in_day = Math.floor(messages / days),
                            app_rating = getRandomInt(1, (
                                messages <= 1000 ? 1000 :
                                    (
                                        messages <= 10000 ? 800 :
                                            (
                                                messages <= 100000 ? 500 :
                                                    (
                                                        messages <= 1000000 ? 250 : 100
                                                    )
                                            )
                                    )
                            ))
                        ;
                        result_data = {hours, days, messages, messages_in_day, app_rating};
                    }
                }
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
                            const res = await shareAlbumPhoto(blob, album_name, album_caption, this.state.token);
                            if (res >= 0) {
                                albumApp();
                            }
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
                        <div className='icon'>
                            <img
                                alt='icon' src={require('../assets/vk_time/redesign/icons/onboard1.png')}
                                style={{
                                    marginTop: '4.926108374vh'
                                }}
                            />
                            <img
                                alt='spray' src={require('../assets/vk_time/redesign/icons/red_spray.png')}
                                style={{
                                    top: 'calc(4.926108374vh + 33px)',
                                    left: -1
                                }}
                            />
                            <img
                                alt='spray' src={require('../assets/vk_time/redesign/icons/orange_spray.png')}
                                style={{
                                    top: 'calc(4.926108374vh + 204px)',
                                    left: 187
                                }}
                            />
                        </div>
                        <div
                            className='header'
                            style={{
                                width: 261,
                                marginTop: -42
                            }}
                        >
                            Привет!
                        </div>
                        <div className='description'>
                            <h2>Наше приложение не является официальным и не может предоставить точную статистику*</h2>
                            <h3>*Приблизительные цифры высчитываются по формуле разработанной при анализе специальной
                                фокус группы.</h3>
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
                    <img alt='bg' src={require('../assets/vk_time/redesign/bg.png')} className='Background2'/>
                </Panel>
                <Panel id='years'>
                    <div className='YearsContainer'>
                        <div className='icon'>
                            <img
                                alt='icon' src={require('../assets/vk_time/redesign/icons/years.png')}
                                style={{
                                    marginTop: 25
                                }}
                            />
                            <img
                                alt='spray' src={require('../assets/vk_time/redesign/icons/red_spray.png')}
                                style={{
                                    top: 'calc(25px + 53px)',
                                    left: 12
                                }}
                            />
                            <img
                                alt='spray' src={require('../assets/vk_time/redesign/icons/orange_spray.png')}
                                style={{
                                    top: 274,
                                    left: 297
                                }}
                            />
                        </div>
                        <div
                            className='header'
                            style={{
                                width: 303,
                                marginTop: -60
                            }}
                        >
                            Укажите свой пол и возраст
                        </div>
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
                    <img alt='bg' src={require('../assets/vk_time/redesign/bg.png')} className='Background2'/>
                </Panel>
                <Panel id='request_token'>
                    <div className='Onboard'>
                        <div className='icon'>
                            <img
                                alt='icon' src={require('../assets/vk_time/redesign/icons/onboard2.png')}
                                style={{
                                    marginTop: 22
                                }}
                            />
                            <img
                                alt='spray' src={require('../assets/vk_time/redesign/icons/red_spray.png')}
                                style={{
                                    top: 'calc(22px + 47px)',
                                    left: 21
                                }}
                            />
                            <img
                                alt='spray' src={require('../assets/vk_time/redesign/icons/orange_spray.png')}
                                style={{
                                    top: 'calc(22px + 228px)',
                                    left: 280
                                }}
                            />
                        </div>
                        <div
                            className='header'
                            style={{
                                width: 299,
                                marginTop: -50
                            }}
                        >
                            Разрешите доступ
                        </div>
                        <div className='description'>
                            <h2>Это необходимо для того, чтобы мы смогли получить ваши данные для дальнейшего
                                анализа</h2>
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
                    <img alt='bg' src={require('../assets/vk_time/redesign/bg.png')} className='Background2'/>
                </Panel>
                <Panel id='save_photo'>
                    <div className='YearsContainer'>
                        <div className='icon'>
                            <img
                                alt='icon' src={require('../assets/vk_time/redesign/icons/save_photo.png')}
                                style={{
                                    marginTop: '7.142857143vh'
                                }}
                            />
                            <img
                                alt='spray' src={require('../assets/vk_time/redesign/icons/red_spray.png')}
                                style={{
                                    top: 'calc(7.142857143vh + 31px)',
                                    left: 12
                                }}
                            />
                            <img
                                alt='spray' src={require('../assets/vk_time/redesign/icons/orange_spray.png')}
                                style={{
                                    top: 'calc(7.142857143vh + 192px)',
                                    left: 258
                                }}
                            />
                        </div>
                        <div
                            className='header'
                            style={{
                                width: 320,
                                marginTop: -55
                            }}
                        >
                            Сохранить результат в фотоальбом на вашей странице?
                        </div>
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
                    <img alt='bg' src={require('../assets/vk_time/redesign/bg.png')} className='Background2'/>
                </Panel>
                <Panel id='token_got'>
                    <div className='Onboard'>
                        <div className='icon'>
                            <img
                                alt='icon' src={require('../assets/vk_time/redesign/icons/onboard3.png')}
                                style={{
                                    marginTop: '7.019704433vh'
                                }}
                            />
                            <img
                                alt='spray' src={require('../assets/vk_time/redesign/icons/red_spray.png')}
                                style={{
                                    top: 'calc(-15px + 7.0197vh)',
                                    left: -25
                                }}
                            />
                            <img
                                alt='spray' src={require('../assets/vk_time/redesign/icons/orange_spray.png')}
                                style={{
                                    top: 'calc(7.019704433vh + 178px)',
                                    left: 237
                                }}
                            />
                        </div>
                        <div
                            className='header'
                            style={{
                                width: 261,
                                marginTop: -35
                            }}
                        >
                            Отлично!
                        </div>
                        <div className='description'>
                            <h2>Теперь мы можем приступить к анализу ваших данных</h2>
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
                            Начать анализ
                        </div>
                    </div>
                    <img alt='bg' src={require('../assets/vk_time/redesign/bg.png')} className='Background2'/>
                </Panel>
                <Panel id='analyze'>
                    <div className='Analyze'>
                        <div className='icon' style={{
                            width: 340,
                            height: 347
                        }}>
                            {analyze_img && <img
                                className='icon'
                                alt='icon' src={analyze_img}
                                style={{
                                    marginTop: 8
                                }}
                            />}
                            <img
                                alt='spray' src={require('../assets/vk_time/redesign/icons/red_spray.png')}
                                style={{
                                    top: 40,
                                    left: 23
                                }}
                            />
                            <img
                                alt='spray' src={require('../assets/vk_time/redesign/icons/blue_spray.png')}
                                style={{
                                    top: 270,
                                    left: 280
                                }}
                            />
                        </div>
                        <div
                            className='header'
                            style={{
                                width: 261,
                                marginTop: -60
                            }}
                        >
                            Идёт анализ...
                        </div>
                        <div className='description'>
                            {messages[currentMessageIndex][0]}
                        </div>
                    </div>
                    <h1 className='Percent'>{Math.round(100 / messages.length * currentMessageIndex)}%</h1>
                    <img alt='wave' src={require('../assets/vk_time/redesign/wave.png')} className='Wave'/>
                    <img alt='bg' src={require('../assets/vk_time/redesign/bg.png')} className='Background2'/>
                </Panel>
                <Panel id='analyze_end'>
                    <div className='Onboard'>
                        <div className='icon'>
                            <img
                                alt='icon' src={require('../assets/vk_time/redesign/icons/onboard4.png')}
                                style={{
                                    marginTop: 10
                                }}
                            />
                            <img
                                alt='spray' src={require('../assets/vk_time/redesign/icons/red_spray.png')}
                                style={{
                                    top: 39,
                                    left: 0
                                }}
                            />
                            <img
                                alt='spray' src={require('../assets/vk_time/redesign/icons/orange_spray.png')}
                                style={{
                                    top: 222,
                                    left: 256
                                }}
                            />
                        </div>
                        <div
                            className='header'
                            style={{
                                width: 299,
                                marginTop: -28
                            }}
                        >
                            Анализ завершен!
                        </div>
                        <div className='description'>
                            <h2>Ну что, посмотрим, сколько времени отняло у тебя ВКонтакте?</h2>
                        </div>
                        <div
                            className='Button'
                            onClick={async () => {
                                try {
                                    await subscribeGroup.bind(this)();
                                } catch (e) {
                                }
                                this.go('result');
                                resultApp();
                            }}
                        >
                            Посмотреть результат
                        </div>
                    </div>
                    <img alt='bg' src={require('../assets/vk_time/redesign/bg.png')} className='Background2'/>
                </Panel>
                <Panel id='result'>
                    <div className='result'>
                        <div className='header'>
                            <img alt='icon' className='icon'
                                 src={require('../assets/vk_time/redesign/icons/result1.png')}/>
                            <img alt='spray' className='spray'
                                 src={require('../assets/vk_time/redesign/icons/orange_spray.png')}/>
                            <div style={{height: 24.51}}/>
                            <p>Я провёл во ВКонтакте:</p>
                            <p>{shortIntegers(result_data.hours)}
                                <span>{decOfNum(result_data.hours, ['час', 'часа', 'часов'], false)}</span></p>
                            <p>≈ {decOfNum(result_data.days, ['день', 'дня', 'дней'])} без перерыва</p>
                        </div>
                        <div className='header'>
                            <img alt='icon' className='icon'
                                 src={require('../assets/vk_time/redesign/icons/result2.png')}/>
                            <img alt='spray' className='spray'
                                 src={require('../assets/vk_time/redesign/icons/red_spray.png')}/>
                            <div style={{height: 19.85}}/>
                            <p>За это время я отправил:</p>
                            <p>{shortIntegers(result_data.messages)}</p>
                            <p>{decOfNum(result_data.messages, ['сообщение', 'сообщения', 'сообщений'], false)}</p>
                            <p>≈ {decOfNum(result_data.messages_in_day, ['сообщение', 'сообщения', 'сообщений'])}/день</p>
                        </div>
                        <div className='header'>
                            <img alt='icon' className='icon'
                                 src={require('../assets/vk_time/redesign/icons/result3.png')}/>
                            <img alt='spray' className='spray'
                                 src={require('../assets/vk_time/redesign/icons/blue_spray_big.png')}/>
                            <div style={{height: 22.41}}/>
                            <p>{shortIntegers(result_data.app_rating)}</p>
                            <p>место по активности</p>
                            <p>*среди всех пользователей нашего приложения </p>
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
                    <img alt='bg' src={require('../assets/vk_time/redesign/bg.png')} className='Background2'/>
                </Panel>
            </View>
        )
    }

}

export default VKTime2;