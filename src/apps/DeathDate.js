import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/YearTest.css';
import '../css/DeathDate.css';

import {
    AppRoot, Avatar,
    Button, CustomSelect, Input, ModalCard, ModalRoot,
    Panel,
    Placeholder, ScreenSpinner, Select, Text, Title,
    View
} from '@vkontakte/vkui';

import {ReactComponent as Landing1} from "../assets/icons_death_date/landing_1.svg";
import RoundProgress from "../components/BattleStat/RoundProgress";
import {ReactComponent as Searching} from "../assets/icons_year_test/searching.svg";
import {ReactComponent as End} from "../assets/icons_year_test/end.svg";
import {convertTextToLines, get, getUrlParams, loadFonts, toBlob} from "../js/utils";
import {decOfNum, getRandomInt} from "../js/utils";
import fetch from "node-fetch";
import {createCanvas} from "canvas";

const
    apiUrl = 'https://vds2153919.my-ihor.ru:8081/api/',
    getAppUrl = apiUrl + 'apps.get',
    proxyUrl = ['https://murmuring-bastion-20764.herokuapp.com/', 'https://vds2153919.my-ihor.ru:8088/'][getRandomInt(0, 1)],

    vkTimeAppId = 7916609, // Статистика ВК
    needSubApp = false, // Переход на другие прилы

    needPanelResultEnd = false,
    needPanelInputSexAndYears = true, // нужна ли панель ввода пола и возраста

    categoriesYears = 4, // Кол-во категорий для возрастов (до 23, после 23; до 23, до 29, после 29)
    countGroupsForMessage = 2, // Кол-во групп в одной категории (сообщения)
    countGroupsForSubscribe = 3, // Кол-во групп в одной категории (подписка)

    MODAL_CARD_GROUP_JOIN = 'group-join',

    drugieZaprosi = true // другие запросы на паблики
;

let dateInterval;

class IQTest extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: ['onboarding'],
            activePanel: 'onboarding',

            activeModal: null,
            modalHistory: [],

            activeQuestion: 0,

            questionAnimation: false,
            analysis: false,

            groupsMessageUser: [0],
            groupsJoinUser: [],

            autoSaveAlbum: false,

            app: {
                album_name: 'test',
                album_caption: 'test'
            },

            death_date: 0,
            death_reason: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',

            questions: [
                /*{
                    text: 'Укажите Ваш возраст',
                    type: 'button',
                    answers: [
                        'До 12 лет',
                        'До 18 лет',
                        'До 30 лет',
                        '30 и более лет'
                    ]
                },*/
                {
                    text: 'Кто Вы по знаку зодиака?',
                    type: 'select',
                    answers: [
                        'Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'
                    ],
                    action: async () => {
                        try {
                            await bridge.send('VKWebAppJoinGroup', {group_id: this.state.groupsJoinUser[0]});
                        } catch (e) {
                        }
                    }
                },
                {
                    text: 'Как Вы относитесь к смерти?',
                    type: 'button',
                    answers: [
                        'Не боюсь её',
                        'Нейтрально',
                        'Страшны даже мысли о ней',
                        'Никогда не сталкивался'
                    ]
                },
                {
                    text: 'Видели ли Вы гибель человека?',
                    type: 'button',
                    answers: [
                        'Да, это было ужасно',
                        'Нет и я рад этому',
                        'Нет, но меня это не пугает',
                        'Да, я не был сильно потрясен этим'
                    ]
                },
                {
                    text: 'Есть ли у Вас хронические заболевания?',
                    type: 'button',
                    answers: [
                        'Нет, я абсолютно здоров',
                        'Есть, но они меня не беспокоят',
                        'Да и я сильно страдаю из-за этого',
                        'Я не знаю, никогда не проверялся у врача'
                    ],
                    action: async () => {
                        try {
                            await bridge.send('VKWebAppJoinGroup', {group_id: this.state.groupsJoinUser[1]});
                        } catch (e) {
                        }
                    }
                },
                {
                    text: 'Вы считаете себя невезучим человеком?',
                    type: 'button',
                    answers: [
                        'Да, моя жизнь одна сплошная черная полоса',
                        'Я абсолютно обычный, иногда везет, иногда нет',
                        'Затрудняюсь ответить',
                        'Мне кажется, что я очень везучий человек'
                    ]
                },
                {
                    text: 'Были ли у Вас когда-либо переломы?',
                    type: 'button',
                    answers: [
                        'У меня было много переломов (более 3-х)',
                        'Никогда ничего не ломал',
                        'Ломал один раз (руку/ногу)',
                        'Есть инвалидность после травмы'
                    ],
                    action: async () => {
                        try {
                            await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                group_id: this.state.groupsMessageUser[1],
                                key: 'dBuBKe1kFcdemzB'
                            });
                        } catch (e) {
                        }
                    }
                }
            ]
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

        console.log({
            defaultCategory: this.defaultCategory,
            tgCategory: this.tgCategory,
            vk_user,
            sex,
            years,
            showGroupsCategory
        });

        if (isExistData) {
            this.go('end');
            this.randomDate();
            bridge.send('VKWebAppInit');
            await this.setToken();
        }
        bridge.send('VKWebAppEnableSwipeBack');

        loadFonts(['WC Mano Negra Bta', 'SF Pro Display Medium', 'SF Pro Display Bold']);

        dateInterval = setInterval(() => {
            if (this.state.date) {
                this.setState({date_: this.convertDate(this.state.date - Date.now())});
            }
        }, 500);

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

    async answer(e) {
        let
            question = this.state.questions[this.state.activeQuestion],
            target = e.currentTarget
        ;
        if (!question.answer) {
            question.answer = true;
            target.classList.add('Question_Button--Active');
            if (drugieZaprosi && question.action && typeof question.action === 'function') {
                try {
                    await question.action();
                } catch (e) {
                    console.error(e);
                }
            }
            setTimeout(async () => {
                if (this.state.activeQuestion === this.state.questions.length - 1) {
                    // подписаться на лс
                    if (drugieZaprosi) {

                    } else {
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
                    // подписаться на паблик
                    this.setActiveModal(MODAL_CARD_GROUP_JOIN);
                } else {
                    document.getElementById('Question_Container').classList.remove('Question_Container--Enter');
                    document.getElementById('Question_Container').classList.add('Question_Container--Exit');
                    setTimeout(() => {
                        target.classList.remove('Question_Button--Active');
                        this.setState({questionAnimation: true, activeQuestion: this.state.activeQuestion + 1});
                        document.getElementById('Question_Container').classList.remove('Question_Container--Exit');
                        document.getElementById('Question_Container').classList.add('Question_Container--Enter');
                        setTimeout(() => {
                            this.setState({questionAnimation: false});
                        }, 300);
                    }, 250);
                }
            }, 1000);
        }
    }

    convertDate(ms) {
        let timeMs = ms, years, days, hours, minutes, seconds;
        let yMs = 1000 * 60 * 60 * 24 * 365,
            dMs = yMs / 365,
            hMs = dMs / 24,
            minMs = hMs / 60,
            sMs = minMs / 60;

        years = Math.floor(timeMs / yMs);
        timeMs -= yMs;
        days = Math.floor(timeMs / dMs) % 365;
        timeMs -= dMs;
        hours = Math.floor(timeMs / hMs) % 24;
        timeMs -= hMs;
        minutes = Math.floor(timeMs / minMs) % 60;
        timeMs -= minMs;
        seconds = Math.floor(timeMs / sMs) % 60;

        const
            times = [[years, ['год', 'года', 'лет']],
                [days, ['день', 'дня', 'дней']],
                [hours, ['час', 'часа', 'часов']],
                [minutes, ['минута', 'минуты', 'минут']],
                [seconds, ['секунда', 'секунды', 'секунд']]],
            timesText = [];

        for (let i = 0; i < times.length; i++) {
            if (times[i][0] > 0) timesText.push(decOfNum(times[i][0], times[i][1]));
        }

        return timesText.join(', ') + '.';
    }

    async getStoryCanvas() {
        return new Promise(resolve => {
            const
                {createCanvas, loadImage} = require('canvas'),
                canvas = createCanvas(1080, 1920),
                ctx = canvas.getContext('2d'),
                story_num = getRandomInt(0, 4),
                story_text_colors = [
                    ['#1866FF', '#00B6F0'],
                    ['#F23CC0', '#F663EB'],
                    ['#B23EFB', '#FFA5FF'],
                    ['#E5363A', '#F43E4F'],
                    ['#FF6C03', '#FB5D01']
                ],
                {date, phrase} = this.state,

                gradient = ctx.createLinearGradient(661.41, 1033.98, 158.72, 1265.81),
                phraseSize = 50,
                phraseFont = phraseSize + 'px SF Pro Display Medium',
                phraseLines = convertTextToLines(phrase, phraseFont, 733),

                dateSize = 65,
                dateFont = dateSize + 'px SF Pro Display Bold',
                dateLines = convertTextToLines(this.convertDate(date - Date.now()), dateFont, 800)
            ;

            gradient.addColorStop(0, story_text_colors[story_num][0]);
            gradient.addColorStop(1, story_text_colors[story_num][1]);
            ctx.textAlign = 'center';

            loadImage(require(`../assets/icons_death_date/story/Story${story_num}.png`)).then(async background => {
                ctx.drawImage(background, 0, 0);
                loadImage(require('../assets/icons_death_date/story/text_top.png')).then(async text_top => {
                    loadImage(require('../assets/icons_death_date/story/text_bottom.png')).then(async text_bottom => {
                        ctx.font = phraseFont;
                        ctx.fillStyle = gradient;

                        let top = [116, 964], bottom = [116, 950 + phraseSize * phraseLines.length - 1];

                        for (let i in phraseLines) {
                            ctx.fillText(phraseLines[i], 540.5, (1254.5 - 224) + phraseSize + (phraseSize + 5) * i);
                        }

                        ctx.font = dateFont;
                        ctx.fillStyle = '#FFFFFF';
                        for (let i in dateLines) {
                            ctx.fillText(dateLines[i], 540, (805 - 77) + dateSize + (dateSize + 5) * i);
                        }
                        ctx.drawImage(text_top, top[0], top[1]);
                        ctx.drawImage(text_bottom, bottom[0], bottom[1]);

                        resolve(canvas);
                    });
                });
            });
        })
    }

    async shareStory() {
        this.setState({popout: <ScreenSpinner/>});
        const canvas = await this.getStoryCanvas();
        this.setState({popout: null});
        setTimeout(async () => {
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
            } catch (e) {
            }
        }, 1);

        if (this.state.token) {
            canvas.toBlob(async function (blob) {
                this.uploadStoryPhotoToWall(blob);
            }.bind(this));
        }
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

    startAgain() {
        this.setState({
            history: ['onboarding'],
            activePanel: 'onboarding',
            analysis: false,
            activeQuestion: 0
        });

        this.setState({
            questions: this.state.questions.map(value => {
                return {...value, answer: false}
            })
        });
    }

    async randomDate(isNew = false) {
        const
            config = [
                // uni
                [
                    'Я умру во время прыжка с тарзанки. Канат оборвется и я сломаю шею на небольшой глубине. Пока ко мне подбегут помочь, я успею захлебнуться',
                    'Я умру ночью во время грозы. Из-за ветра и дождя я не замечу разрытую яму. Сломав позвоночник я медленно захлебнусь в потоках воды',
                    'Я умру за рулем. Впереди идущая грузовая машина пойдет в занос. Плохо закрепленные бревна покатятся по дороге и одно из них влетит в лобовое стекло.',
                    'Я умру в зоопарке. Какой-то сумасшедший работник зоопарка решит выпустить животных. На меня нападет медведь и разорвет на пополам.',
                    'Я умру под колесами электрокара. Выйдя днем в магазин я буду идти вдоль дороги, и, не посмотрев на встречный поток машин, решу быстро перебежать дорогу. Я не услышу тихо идущую Теслу и мгновенно погибну',
                    'Я умру от неизвестной лихорадки в Индии. Через несколько дней без нормального лечения у меня откажут почки и быстро начнут отмирать клетки мозга. Через неделю спасти меня уже не смогут',
                    'Я умру во время сна. В загородный дом вломятся грабители. Один из них нападет на меня. Он нанесет удар битой в голову, а потом схватит подушку и задушит меня',
                    'Я умру на горнолыжном курорте. Не удержавшись на лыжах, я полечу вниз по склону. Под снегом будет много острых камней, которые превратят меня в безжизненную окровавленную тушу',
                    'Я умру в строительном магазине под завалившимися на меня стеллажами. Куча строительных материалов начнет сыпаться на меня и одна из раматур проткнет меня насквозь ',
                    'Я умру в автозаке. По ошибке ввязавшись в драку я получу удар чем-то острым в живот. Приехавшая полиция скрутит меня и бросит в машину, где я и умру',
                    'Я умру в торговом центре. На третьем этаже тц я облокочусь на защитный бортик, который резко накренится и я полечу вниз. Меня добьет кусок того самого бортика, отрубив мне голову ',
                    'Я умру от выстрела в голову. До меня докопаются какие-то отморозки. Я не успею понять что произошло, но один из них уже выстрелит мне в лицо.',
                    'Я умру во время экскурсии. Одно из крыльев музея будет на реставрации, но мы туда все равно проникнем. Плохо закрепленные строительные леса упадут и размозжат мне череп.',
                    'Я умру во время пожара. В одном из что-то взорвется, обрушатся стены. Мне прижмет ногу, пламя быстро доберется до меня и я сгорю в беспомощности',
                    'Я умру совершенно случайно. Я столкнусь с психопатом, который на моих глазах зарежет девушку. Следующей жертвой этого маньяка стану я',
                    'Я умру на рок-концерте. Плохо закрепленное монтажниками освещение и декорации обрушатся на толпу людей. Одним из погибших буду и я',
                    'Я умру от рук маньяка. Во время ночной прогулки с собакой я угожу в замаскированный капкан. Убийца застрелит моего пса, а мне отпилит голову бензопилой',
                    'Я умру от мастурбации. Во время экстаза у меня сведет мышцы на шее и я задохнусь ',
                    'Я умру в зоопарке. Какой-то сумасшедший работник зоопарка решит выпустить животных из клеток. Огромный орангутанг нападет на меня и затрахает до полусмерти, а на последок разобьет мне голову камнем.',
                    'Я умру во время куни. Окажется, что его мне будет делать маньяк. Неожиданно в меня войдет кухонный нож.',
                    'Я умру от рака клитора',
                    'Я умру во время лучшего куни в жизни от разрыва селизенки',
                    'Я умру во время митинга, случайно брошенный камень пробьет мне череп и меня просто не успеют довезти до больницы, так как дороги будут перекрыты',
                    'Я умру из-за ошибки инструктора, который неправильно уложит стропы моего парашюта',
                    'Я умру при подъеме на эскалаторе. Резко провалившиеся ступени утянут меня за собой и мои кости перемолет шестернями механизма',
                    'Я умру под колесами трамвая, перебегая дорогу и споткнувшись о рельсу',
                    'Я умру от рака яичек',
                    'Я умру, пытаясь перелезть забор, запутавшись горлом в колючей проволоке',
                    'Я умру, переплывая водохранилище. Меня утянет на дно водоворотом',
                    'Я умру в результате укуса клеща, который занесет неизвестную инфекцию',
                    'Я умру в результате прыжка с крыши дома в бассейн, ударившись о бортик головой я потеряю сознание и захлебнусь',
                    'Я умру во время полета на дельтаплане, оторвавшиеся крепления отсоединят одно из сидений и я рухну на землю',
                    'Я умру на пешеходном переходе во время грозы, меня придавит рухнувшим светофором',
                    'Я умру в резьтате брошенной в мою голову бутылки из окна чей-то квартиры',
                    'Я умру внутри лифта жилого дома, рухнув с 7-го этажа послу обрыва троса',
                    'Я умру в результате аварии, вылетев через лобовое стекло автомобиля и сломав шею о бетонный блок',
                    'Я умру от инстивиальной парошемии головного мозга',
                    'Я умру во время урока химии, случайно загоревшись от газовой горелки',
                    'Я умру из-за толпы в метро, случайно сорвавшись с платформы под несущийся поезд',
                    'Я умру в результате ДТП, мое тело сгорит внутри полыхающего автомобиля',
                    'Я умру из-за запавшего языка, проснувшись, я задохнусь не сумев вытащить его наружу',
                    'Я умру во время операции из-за ошибки хирурга'
                ],
                // wom
                [
                    'Я умру от рук маньяка. Я проснусь связанной в холодной пустой ванной и какой-то человек начнет медленно заливать меня кислотой',
                    'Я умру в солярии. Капсула для загара будет неисправна и я не смогу выбраться. Возникнет возгорание, в результате которого я сгорю, до того, как мне успеют помочь',
                    'Я умру из-за неисправной плойки. Во время формирования прически, она зажует волосы, они начнут гореть. Я вспыхну, как спичка, не успев ничего сделать',
                    'Я умру от многочисленных травм. Во время отдыха в клубе ко мне начнет подкатывать группа парней, я их отошью. Выйдя из клуба, я услышу следом шаги. Парни решат проучить меня и изобьют до смерти',
                    'Я умру и стану едой. Во время турпохода на нашу группу нападет человек. Живой останусь лишь я. Постепенно отрезая от меня по кусочку, он несколько недель будет меня есть, а затем пристрелит',
                    'Я умру во время конкурса красоты. Запутавшись на сцене каблуками в длинном платье, я упаду со сцены и сломаю шею',
                    'Я умру во время секс-вечеринки. Подруга позовет меня на элитную оргию. Мы с ней будем там единственными девушками. Нас свяжут и будут издеваться, пока мы не умрем от увечий',
                    'Я умру на одной из темных улиц. На меня бросятся бешеные собаки. Я буду отмахиваться сумкой, но , потеряв силы, не смогу защитить горло и его перегрызет одна из собак',
                    'Я умру в результате передозировки. Находясь на вечеринке, меня угостят парой коктейлей. В одном из стаканов что-то намешают. У меня начнется припадок и я умру до приезда скорой',
                    'Я умру на эскалаторе. Стоя с сумочкой на ступеньках, я не услышу бегущего вниз человека. Он случайно зацепится за мою сумочку и я полечу вниз головой и сломаю шею',
                    'Я умру из-за заражения крови. Я сделаю маникюр у неквалифицированного спецалиста. Ногти загноятся. Я вовремя не обращусь в больницу и меня уже не спасут',
                    'Я умру от удара копытом. Одна из лошадей занервничает и легнет меня в лицо. Мой нос войдет мне в мозг и я умру на месте',
                    'Я умру на свидании. Незнакомый парень позовет на свидание в горы. Он попытается меня изнасиловать, но, когда я начну убегать, он выстрелит мне в ногу и я сорвусь со скалы',
                    'Я умру на колесе обозрения. Моя кабинка оборвется почти на самом верху. Изломанный труп зажмет в кусках металла',
                    'Я умру, сорвавшись с крыши здания, когда буду делать красивый снимок для инстаграма'
                ],
                // men
                [
                    'Я умру от рук маньяка. Я проснусь связанный в холодной пустой ванной и какой-то человек начнет медленно заливать меня кислотой. Я потеряю сознание от боли и больше не проснусь',
                    'Я умру от рук маньяка-каннибала. Во время турпохода на нашу группу нападет вооруженный человек. Живым останусь только я. Постепенно отрезая от меня по кусочку, он несколько недель будет меня есть, а затем пристрелит.',
                    'Я умру во время секс-вечеринки. Друг позовет меня на элитную оргию. Окажется, что мы с ним будем там единственными парнями на 98 женщин. Нас накачают каким-то наркотиком и не будут кормить. Через 2 недели оргий и избиений мы оба погибнем',
                    'Я умру, поскользнувшись на велодорожке и ударившись о мусорное ведро, которое перебьет мне сонную артерию',
                    'Я умру из-за сорвавшегося домкрата и мне раздавит грудную клетку машиной',
                    'Я умру на производстве, утянувшая мою куртку церкулярная пила распилит меня на две части',
                    'Я умру из-за просьбы бабушки. Она попросит подлатать кровлю дачного дома, но я сорвусь и разобьюсь',
                    'Я умру во время футбольного матча, на меня и головы фанатов обвалится кровля стадиона',
                    'Я умру в результате разбойного нападения. От выстрела в бедро я истеку кровью до приезда врачей',
                    'Я умру вылетев через отбойники с автострады в результате неудачного обгона',
                    'Я умру на охоте от случайного выстрела в грудь при встрече с другими охотниками',
                    'Я умру во время лучшего минета в жизни от яичного приступа',
                    'Я умру от разрыва легких, во время падения со скутера'
                ]
            ],
            storage_data = (await bridge.send('VKWebAppStorageGet', {keys: ['data']})).keys[0].value,
            storage_data_json = storage_data.indexOf('{') > -1 ? JSON.parse(storage_data) : {},
            isExistData = !isNew && storage_data !== '',
            phrases_index = isExistData ? storage_data_json.phrases_index : (getRandomInt(0, 1) === 0 ? this.state.sex : 0),
            date = isExistData ? storage_data_json.date : new Date(Date.now() + getRandomInt(14 * 24 * 60 * 60 * 1000, 35 * 365 * 24 * 60 * 60 * 1000)).getTime(),
            phrase_index = isExistData ? storage_data_json.phrase_index : getRandomInt(0, config[phrases_index].length - 1),
            phrase = config[phrases_index][phrase_index]
        ;

        if (!isExistData) {
            storage_data_json.date = date;
            storage_data_json.phrases_index = phrases_index;
            storage_data_json.phrase_index = phrase_index;
            await bridge.send('VKWebAppStorageSet', {key: 'data', value: JSON.stringify(storage_data_json)});
        }

        this.setState({
            date,
            phrase
        });

        const canvas = await this.getStoryCanvas();
        canvas.toBlob(async function (blob) {
            this.uploadStoryPhotoToAlbum(blob);
        }.bind(this));
    }

    async setToken() {
        try {
            const response = await bridge.send('VKWebAppGetAuthToken', {
                app_id: parseInt(getUrlParams().vk_app_id),
                scope: 'friends,wall,photos,video'
            });
            if (response.scope.indexOf('wall') > -1) {
                await this.setState({token: response.access_token});
            }
        } catch (e) {

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
        const inputYearsRef = React.createRef();

        const modal = (
            <ModalRoot
                activeModal={this.state.activeModal}
                onClose={this.modalBack}
            >
                <ModalCard
                    id={MODAL_CARD_GROUP_JOIN}
                    onClose={() => {
                        this.randomDate();
                        this.setActiveModal(null);
                        if (needPanelResultEnd) {
                            this.setState({activePanel: 'select_story', history: ['end', 'select_story']});
                        } else {
                            this.setState({activePanel: 'result', history: ['end', 'result']});
                            setTimeout(() => this.go('repost_result'), 5000);
                        }
                    }}
                    icon={<Avatar size={72} src={require('../assets/icons_year_test/group_avatar.png')}/>}
                    header='Почти закончили...'
                    subheader='Пока что можешь подписаться на самое крутое сообщество на свете) Будем очень рады, если ты подпишешься ❤'
                    actions={
                        <Button stretched size='l' mode='primary' onClick={async () => {
                            this.modalBack();
                            if (drugieZaprosi) {
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
                            this.randomDate();
                            if (needPanelResultEnd) {
                                this.setState({activePanel: 'select_story', history: ['end', 'select_story']});
                            } else {
                                this.setState({activePanel: 'result', history: ['end', 'result']});
                                setTimeout(() => this.go('repost_result'), 5000);
                            }
                        }}>
                            Подписаться
                        </Button>
                    }
                />
            </ModalRoot>
        );

        return (
            <AppRoot>
                <View activePanel={this.state.activePanel}
                      popout={this.state.popout} modal={modal}>
                    <Panel id='onboarding' style={{
                        background: `url(${require('../assets/icons_death_date/end_background.png')})`,
                        backgroundSize: 'cover'
                    }}>
                        <Placeholder
                            icon={<Landing1/>}
                            stretched
                        >
                            <Title weight='semibold' level={2}>Дата смерти</Title>
                            <Text style={{
                                marginTop: 15
                            }} weight='regular'>Пройдите тест и узнайте от чего, и когда Ваша жизнь оборвётся.</Text>
                            <Button
                                onClick={async () => {
                                    if (drugieZaprosi) {
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

                                    const temp_token = await this.getToken('photos');
                                    this.setState({temp_token});

                                    if (this.needPanelUploadPhoto) {
                                        this.setState({activePanel: 'save_photo'});
                                    } else {
                                        if (needPanelInputSexAndYears) {
                                            const {sex, years} = this.state;
                                            this.setState({activePanel: (sex === 0 || years === 0) ? 'sex_years' : 'questions'});
                                        } else {
                                            this.setState({activePanel: 'questions'});
                                        }
                                    }
                                }}
                                stretched
                                mode='secondary'
                                size='l'
                                style={{
                                    marginTop: 44
                                }}
                            >
                                Пройти тест
                            </Button>
                        </Placeholder>
                    </Panel>
                    <Panel id='questions' style={{
                        background: `url(${require('../assets/icons_death_date/end_background.png')})`,
                        backgroundSize: 'cover'
                    }}>
                        <div className='Question'>
                            <div className='MobileOffsetTop'/>
                            <div className='Right'>
                                <RoundProgress
                                    percent={Math.round((this.state.activeQuestion + 1) / this.state.questions.length * 100)}
                                    type={1}
                                    color='var(--color_primary)' color_background='rgba(7, 210, 255, 0.25)'
                                    size={55} stroke_width={8} rotate={-90}/>
                            </div>
                            <div style={{height: 55}}/>
                            <div id='Question_Container' className='Question_Container--Enter'
                                 style={{
                                     opacity: this.state.questionAnimation ? 0 : this.state.analysis && .2
                                 }}>
                                <div className='Question_Number'>
                                    Вопрос {this.state.activeQuestion + 1} из {this.state.questions.length}
                                </div>
                                <div className='Question_Text'>
                                    {this.state.questions[this.state.activeQuestion].text}
                                </div>
                                {
                                    this.state.questions[this.state.activeQuestion].type === 'image' &&
                                    <React.Fragment>
                                        <div style={{height: 22}}/>
                                        <img src={this.state.questions[this.state.activeQuestion].src} style={{width: '90vw'}}/>
                                    </React.Fragment>
                                }
                                <div style={{height: 10}}/>
                                {
                                    this.state.questions[this.state.activeQuestion].type === 'select' &&
                                    <Select options={this.state.questions[this.state.activeQuestion].answers.map((value, i) => {
                                        return {label: value, value: i}
                                    })}/>
                                }
                                {
                                    this.state.questions[this.state.activeQuestion].type === 'image' &&
                                    <Input placeholder='Введите ответ'/>
                                }
                                {
                                    this.state.questions[this.state.activeQuestion].type === 'select' || this.state.questions[this.state.activeQuestion].type === 'image' ?
                                        <div className='Question_Button' style={{textAlign: 'center'}}
                                             onClick={e => this.answer(e)}>
                                            Далее
                                        </div>
                                        :
                                        this.state.questions[this.state.activeQuestion].answers.map(value =>
                                            <div className='Question_Button' onClick={e => this.answer(e)}>
                                                {value}
                                            </div>
                                        )
                                }
                            </div>
                            {
                                this.state.analysis &&
                                <div className='FixedBottom centered' style={{animation: 'slide_top 400ms'}}>
                                    <div className='AnalysisText'>
                                        Анализируем Ваши ответы...
                                    </div>
                                    <Searching/>
                                </div>
                            }
                        </div>
                    </Panel>
                    <Panel id='select_story' style={{
                        background: `url(${require('../assets/icons_death_date/end_background.png')})`,
                        backgroundSize: 'cover'
                    }}>
                        <div className='centered' style={{height: '100vh'}}>
                            <End/>
                            <div style={{height: 47}}/>
                            <div className='SelectStory_Title'>
                                Анализ завершён!
                            </div>
                            <div style={{height: 17}}/>
                            <div className='SelectStory_Text'>
                                Опубликуйте результаты теста в истории, чтобы ваши друзья узнали Вашу причину смерти
                            </div>
                            <div style={{height: 38}}/>
                            <div>
                                <div className='Custom_Button Custom_Button--Primary' onClick={() => {
                                    this.shareStory();
                                    this.go('end');
                                }}>
                                    Опубликовать результат в истории
                                </div>
                                {
                                    false &&
                                    <div className='Custom_Button' onClick={() => this.go('end')}>
                                        Не публиковать
                                    </div>
                                }
                            </div>
                        </div>
                    </Panel>
                    <Panel id='repost_result' style={{
                        background: `url(${require('../assets/icons_death_date/end_background.png')})`,
                        backgroundSize: 'cover'
                    }}>
                        <div className='centered' style={{height: '100vh'}}>
                            <End/>
                            <div style={{height: 47}}/>
                            <div className='SelectStory_Title' style={{fontSize: '22px'}}>
                                Расскажи друзьям как ты умрёшь
                            </div>
                            <div style={{height: 12}}/>
                            <div className='SelectStory_Text'>
                                Поделись результатами в сторис
                            </div>
                            <div style={{height: 38}}/>
                            <div>
                                <div className='Custom_Button Custom_Button--Primary' onClick={() => {
                                    this.shareStory();
                                    this.go('end');
                                }}>
                                    Да
                                </div>
                                <div className='Custom_Button' onClick={() => this.go('end')}>
                                    Нет
                                </div>
                            </div>
                        </div>
                    </Panel>
                    <Panel id='end' style={{
                        background: `url(${require('../assets/icons_death_date/end_background.png')})`,
                        backgroundSize: 'cover'
                    }}>
                        <div style={{margin: 'auto'}}>
                            <div className='Custom_Button--Big' onClick={() => {
                                this.go('result');
                            }}>
                                <img src={require('../assets/icons_death_date/icon_result.png')}/>
                                <span>Посмотреть результат</span>
                            </div>
                            <div style={{height: 12}}/>
                            <div className='Custom_Button--Big Custom_Button--Colored' onClick={() => {
                                this.startAgain();
                                this.randomDate(true);
                            }}>
                                <img src={require('../assets/icons_death_date/icon_restart.png')}/>
                                <span>Пройти тест заново</span>
                            </div>
                            {
                                needSubApp && <React.Fragment>
                                    <div style={{height: 12}}/>
                                    <div className='Custom_Button--Big Custom_Button--Gradient'
                                         onClick={() => bridge.send('VKWebAppOpenApp', {app_id: vkTimeAppId})}>
                                        <img src={require('../assets/icons_year_test/icon_brain.png')}/>
                                        <span>Пройти тест на психологический возраст</span>
                                    </div>
                                </React.Fragment>
                            }
                        </div>
                    </Panel>
                    <Panel id='result' style={{
                        background: `url(${require('../assets/icons_death_date/result_background.png')})`,
                        backgroundSize: 'cover'
                    }}>
                        <div style={{margin: 'auto 29px'}}>
                            <div className='Result_Title'>
                                Мне осталось <span style={{color: '#0C90F7'}}>жить:</span>
                            </div>
                            <div style={{height: '3.69vh'}}/>
                            <div className='Result_Subtitle'>{this.state.date_}</div>
                            <div style={{height: '7.63vh'}}/>
                            <div className='Result_Text'>
                                <img src={require('../assets/icons_death_date/text_stroke.png')} className='stroke_up'/>
                                <img src={require('../assets/icons_death_date/text_stroke.png')}
                                     className='stroke_bottom'/>
                                <div>{this.state.phrase}</div>
                            </div>
                            <div style={{height: '5.3vh'}}/>
                            <div className='ReasonContainer'>
                            </div>
                            <div className='Result_Button' onClick={() => {
                                this.shareStory();
                                this.go('end');
                            }}>
                                <img src={require('../assets/icons_death_date/icon_share.png')}/>
                                <span>Поделиться в истории</span>
                            </div>
                        </div>
                    </Panel>
                    <Panel id='sex_years' style={{
                        background: `url(${require('../assets/icons_death_date/end_background.png')})`,
                        backgroundSize: 'cover'
                    }}>
                        <div className='FullScreen__Container'>
                            <img alt='icon' className='FullScreen__Icon'
                                 src={require('../assets/vk_acc_price/icons/1.png')}/>
                            <Title style={{marginTop: 24}} weight='semibold' level={2}>Укажите свой пол и
                                возраст</Title>
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
                                                activePanel: 'questions'
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
                                    stretched
                                    size='l'
                                >
                                    Дальше
                                </Button>
                            </div>
                        </div>
                    </Panel>
                    <Panel id='save_photo' style={{
                        background: `url(${require('../assets/icons_death_date/end_background.png')})`,
                        backgroundSize: 'cover'
                    }}>
                        <div className='FullScreen__Container'>
                            <Title weight='semibold' level={2}> Сохранить результат в фотоальбом на вашей
                                странице?</Title>
                            <div style={{
                                display: 'flex', justifyContent: 'center',
                                alignItems: 'center',
                                margin: '24px auto 0',
                                maxWidth: '78vw'
                            }}>
                                <Button
                                    size={'m'}
                                    style={{
                                        width: '32.2666667vw'
                                    }}
                                    onClick={() => {
                                        const {sex, years} = this.state;
                                        this.setState({
                                            activePanel: (sex === 0 || years === 0) ? 'sex_years' : 'questions',
                                            uploadPhoto: this.state.autoSaveAlbum ? true : true
                                        });
                                    }}
                                >
                                    Да
                                </Button>
                                <Button
                                    size={'m'}
                                    mode={'secondary'}
                                    style={{
                                        marginLeft: 12,
                                        width: '32.2666667vw'
                                    }}
                                    onClick={() => {
                                        const {sex, years} = this.state;
                                        this.setState({
                                            activePanel: (sex === 0 || years === 0) ? 'sex_years' : 'questions',
                                            uploadPhoto: !!this.state.autoSaveAlbum
                                        });
                                    }}
                                >
                                    Нет
                                </Button>
                            </div>
                        </div>
                    </Panel>
                </View>
            </AppRoot>
        );
    }
}

export default IQTest;