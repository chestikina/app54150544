import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/DeathDate2.css';

import {
    AppRoot, Avatar,
    Button, CustomSelect, Input, ModalCard, ModalRoot,
    Panel,
    Placeholder, ScreenSpinner, Select, Text, Title,
    View
} from '@vkontakte/vkui';

import {ReactComponent as IconResult} from "../assets/icons_death_date/2/megaphone (1).svg";
import RoundProgress from "../components/BattleStat/RoundProgress";
import {convertTextToLines, get, getUrlParams, loadFonts, toBlob} from "../js/utils";
import {decOfNum, getRandomInt} from "../js/utils";
import fetch from "node-fetch";
import {createCanvas} from "canvas";

let questions = [
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
        ]
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
        ]
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
        ]
    }
];

const
    apiUrl = 'https://vds2153919.my-ihor.ru:8081/api/',
    getAppUrl = apiUrl + 'apps.get',
    proxyUrl = ['https://murmuring-bastion-20764.herokuapp.com/', 'https://vds2153919.my-ihor.ru:8088/'][getRandomInt(0, 1)],

    vkTimeAppId = 7916609, // Статистика ВК
    needSubApp = false, // Переход на другие прилы

    needPanelInputSexAndYears = true, // нужна ли панель ввода пола и возраста

    categoriesYears = 4, // Кол-во категорий для возрастов (до 23, после 23; до 23, до 29, после 29)
    countGroupsForMessage = 2, // Кол-во групп в одной категории (сообщения)
    countGroupsForSubscribe = 3, // Кол-во групп в одной категории (подписка)

    MODAL_CARD_GROUP_JOIN = 'group-join'
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

            death_date: 0,
            death_reason: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',

            groupsMessageUser: [0],
            groupsJoinUser: [],

            autoSaveAlbum: false,

            app: {
                album_name: 'test',
                album_caption: 'test'
            }
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
            storage_data = (await bridge.send('VKWebAppStorageGet', {keys: ['deathdate']})).keys[0].value,
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
            this.go('result');
            this.randomDate();
            bridge.send('VKWebAppInit');
            await this.setToken();
        }
        bridge.send('VKWebAppEnableSwipeBack');

        loadFonts(['Alice', 'Proxima Nova']);

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

    answer(e) {
        let
            question = questions[this.state.activeQuestion],
            target = e.currentTarget
        ;
        if (!question.answer) {
            question.answer = true;
            target.classList.add('Question_Button--Active');
            setTimeout(async () => {
                if (this.state.activeQuestion === questions.length - 1) {
                    // подписаться на лс
                    if (this.state.groupsMessageUser[0] !== 0) {
                        try {
                            await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                group_id: this.state.groupsMessageUser[0],
                                key: 'dBuBKe1kFcdemzB'
                            });
                        } catch (e) {
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
                [days, ['день', 'дня', 'дней']]/*,
                [hours, ['час', 'часа', 'часов']],
                [minutes, ['минута', 'минуты', 'минут']],
                [seconds, ['секунда', 'секунды', 'секунд']]*/],
            timesText = [];

        for (let i = 0; i < times.length; i++) {
            if (times[i][0] > 0) timesText.push(decOfNum(times[i][0], times[i][1]));
        }

        return timesText.join(', ');
    }

    async getStoryCanvas() {
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d'),
            {date, phrase} = this.state,

            phraseSize = 48,
            phraseFont = phraseSize + 'px Proxima Nova',
            phraseLines = convertTextToLines(phrase, phraseFont, 880),

            dateSize = 76,
            dateFont = dateSize + 'px Alice',
            dateLines = convertTextToLines(this.convertDate(date - Date.now()), dateFont, 869),

            background = await loadImage(require('../assets/icons_death_date/2/Story.png')),
            borderUp = await loadImage(require('../assets/icons_death_date/2/s/Border up.png')),
            borderBottom = await loadImage(require('../assets/icons_death_date/2/s/Border down.png'))
        ;

        ctx.drawImage(background, 0, 0);

        ctx.textAlign = 'center';

        ctx.font = dateFont;
        ctx.fillStyle = '#FFFFFF';
        for (let i in dateLines) {
            ctx.fillText(dateLines[i], 540.5, (796 - 0) + dateSize + (dateSize + 5) * i);
        }

        ctx.font = phraseFont;
        ctx.fillStyle = '#C4C4C4';
        for (let i in phraseLines) {
            ctx.fillText(phraseLines[i], 512, (796 + 146 + dateSize * (dateLines.length - 1) + 30) + phraseSize + (phraseSize + 5) * i);
        }

        let
            top = [321.5, 796 + 146 + dateSize * (dateLines.length - 1)],
            bottom = [321.5, ((796 + 146 + dateSize * dateLines.length - 1) + 80) + phraseSize * (phraseLines.length - 1)]
        ;

        ctx.drawImage(borderUp, top[0], top[1]);
        ctx.drawImage(borderBottom, bottom[0], bottom[1]);

        return canvas;
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
                /*await get(shareStatUrl, {
                    ...getUrlParams(),
                    payload: JSON.stringify({text: this.state.phrase, date: this.state.date})
                })*/
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
            storage_data = (await bridge.send('VKWebAppStorageGet', {keys: ['deathdate']})).keys[0].value,
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
            await bridge.send('VKWebAppStorageSet', {key: 'deathdate', value: JSON.stringify(storage_data_json)});
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
                        this.go('result');
                    }}
                    icon={<Avatar size={72} src={require('../assets/icons_year_test/group_avatar.png')}/>}
                    header='Почти закончили...'
                    subheader='Пока что можешь подписаться на самое крутое сообщество на свете) Будем очень рады, если ты подпишешься ❤'
                    actions={
                        <Button stretched size='l' mode='primary' onClick={async () => {
                            this.modalBack();
                            for (const group_id of this.state.groupsJoinUser) {
                                if (group_id !== 0) {
                                    try {
                                        await bridge.send('VKWebAppJoinGroup', {group_id});
                                    } catch (e) {
                                    }
                                }
                            }
                            this.randomDate();
                            this.go('result');
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
                    <Panel id='onboarding'>
                        <img src={require('../assets/icons_death_date/2/bg.png')} alt='img' className='Background'/>
                        <div className='titles'>
                            <div>Привет!</div>
                            <div>Наше приложение носит развлекательный характер. Все данные вымышлены. (Или...)</div>
                        </div>
                        <Button onClick={async () => {
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
                            //this.go('questions');
                        }}>
                            Ок
                        </Button>
                    </Panel>
                    <Panel id='questions'>
                        <img src={require('../assets/icons_death_date/2/bg.png')} alt='img' className='Background'/>
                        <div className='Question'>
                            <div className='MobileOffsetTop'/>
                            <div className='Right'>
                                <RoundProgress
                                    percent={Math.round((this.state.activeQuestion + 1) / questions.length * 100)}
                                    type={1}
                                    color='#789FF0' color_background='rgba(120, 159, 240, 0.25)'
                                    size={55} stroke_width={8} rotate={-90}/>
                            </div>
                            <div style={{height: 55}}/>
                            <div id='Question_Container' className='Question_Container--Enter'
                                 style={{
                                     opacity: this.state.questionAnimation ? 0 : this.state.analysis && .2
                                 }}>
                                <div className='Question_Number'>
                                    Вопрос {this.state.activeQuestion + 1} из {questions.length}
                                </div>
                                <div className='Question_Text'>
                                    {questions[this.state.activeQuestion].text}
                                </div>
                                {
                                    questions[this.state.activeQuestion].type === 'image' &&
                                    <React.Fragment>
                                        <div style={{height: 22}}/>
                                        <img src={questions[this.state.activeQuestion].src} style={{width: '90vw'}}/>
                                    </React.Fragment>
                                }
                                <div style={{height: 10}}/>
                                {
                                    questions[this.state.activeQuestion].type === 'select' &&
                                    <Select options={questions[this.state.activeQuestion].answers.map((value, i) => {
                                        return {label: value, value: i}
                                    })}/>
                                }
                                {
                                    questions[this.state.activeQuestion].type === 'image' &&
                                    <Input placeholder='Введите ответ'/>
                                }
                                {
                                    questions[this.state.activeQuestion].type === 'select' || questions[this.state.activeQuestion].type === 'image' ?
                                        <div className='Question_Button' style={{textAlign: 'center'}}
                                             onClick={e => this.answer(e)}>
                                            Далее
                                        </div>
                                        :
                                        questions[this.state.activeQuestion].answers.map(value =>
                                            <div className='Question_Button' onClick={e => this.answer(e)}>
                                                {value}
                                            </div>
                                        )
                                }
                            </div>
                        </div>
                    </Panel>
                    <Panel id='result'>
                        <img src={require('../assets/icons_death_date/2/bg.png')} alt='img' className='Background'/>
                        <div className='titles'>
                            <div className='first_title'>
                                Мне осталось жить:
                            </div>
                            <div className='second_title'>{this.state.date_}</div>
                            <div className='result_text'>
                                <img alt='border' src={require('../assets/icons_death_date/2/Border up.png')}/>
                                <div>{this.state.phrase}</div>
                                <img alt='border' src={require('../assets/icons_death_date/2/Border bottom.png')}/>
                            </div>
                            <Button
                                before={<IconResult/>}
                                onClick={async () => {
                                    this.shareStory();
                                }}
                            >
                                Поделиться в истории
                            </Button>
                        </div>
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
                                >
                                    Дальше
                                </Button>
                            </div>
                        </div>
                        <img src={require('../assets/icons_death_date/2/bg.png')} alt='img' className='Background'/>
                    </Panel>
                    <Panel id='save_photo'>
                        <div className='FullScreen__Container'>
                            <div className='FullScreen__Title'>
                                Сохранить результат в фотоальбом на вашей странице?
                            </div>
                            <div style={{
                                display: 'flex', justifyContent: 'center',
                                alignItems: 'center',
                                margin: '24px auto 0',
                                maxWidth: '78vw'
                            }}>
                                <Button
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
                        <img src={require('../assets/icons_death_date/2/bg.png')} alt='img' className='Background'/>
                    </Panel>
                </View>
            </AppRoot>
        );
    }
}

export default IQTest;