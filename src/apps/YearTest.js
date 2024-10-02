import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/YearTest.css';

import {
    AppRoot, Avatar,
    Button, Input, ModalCard, ModalRoot,
    Panel,
    Placeholder, ScreenSpinner, Select, Text, Title,
    View
} from '@vkontakte/vkui';

import {ReactComponent as Landing1} from "../assets/icons_year_test/landing_1.svg";
import {ReactComponent as Photos} from "../assets/icons_year_test/photos.svg";
import RoundProgress from "../components/BattleStat/RoundProgress";
import {ReactComponent as Searching} from "../assets/icons_year_test/searching.svg";
import {ReactComponent as End} from "../assets/icons_year_test/end.svg";
import {convertTextToLines, get, getUrlParams, loadFonts, openUrl} from "../js/utils";
import {getRandomInt} from "../js/utils";
import fetch from "node-fetch";
import {createCanvas, loadImage} from "canvas";
import {defaultViewProps, initializeNavigation} from "../js/defaults/navigation";
import {subscribeBridgeEvents} from "../js/defaults/bridge_utils";
import {getAppInfo, proxyUrl} from "../js/defaults/catalin_tg_bot";

let questions = [
    {
        text: 'Кто вы?',
        type: 'button',
        answers: [
            'Мужчина',
            'Женщина'
        ]
    },
    {
        text: 'Кто вы по знаку зодиака?',
        type: 'select',
        answers: [
            'Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'
        ]
    },
    {
        text: 'Вам нравится ваше тело?',
        type: 'button',
        answers: [
            'Чаще нет',
            'Да, я смирился (-ась) с недостатками',
            'Честно говоря, у меня достаточно много недостатков'
        ]
    },
    {
        text: 'Какая фраза вам ближе?',
        type: 'button',
        answers: [
            'Все, что ни делается, все к лучшему',
            'Все хорошо, что хорошо кончается',
            'Принять всё, как есть'
        ]
    },
    {
        text: 'У вас есть мечта?',
        type: 'button',
        answers: [
            'Строю планы на жизнь, а не витаю в облаках',
            'Да, я люблю мечтать',
            'Нет, все о чем мечтал, уже исполнил(-ла)'
        ]
    },
    {
        text: 'Вы боитесь своего будущего?',
        type: 'button',
        answers: [
            'Да',
            'Нет',
            'Иногда',
            'У меня его нет'
        ]
    },
    {
        text: 'Как вы относитесь к детям?',
        type: 'button',
        answers: [
            'Дети - цветы жизни',
            'Раздражают своим криком и нытьем',
            'Не перевариваю детей',
            'Свои дети - другое дело'
        ]
    },
    {
        text: 'Доверчивы ли Вы?',
        type: 'button',
        answers: [
            'Я очень доверчивый',
            'Никому не доверяю',
            'Всё зависит от того, с кем я имею дело'
        ]
    }
];

const
    axios = require('axios'),
    apiUrl = 'https://vds2153919.my-ihor.ru:8081/api/',
    getAppUrl = apiUrl + 'apps.get',
    payloadUrl = apiUrl + 'payload.send',
    MODAL_CARD_GROUP_JOIN = 'group-join',
    isButtonActive = false, // Нужна ли кнопка с ссылкой на другую прилу
    dop_app_id = 7906047, // APP_ID приложения "Статистика ВКонтакте"
    // (для смены на IQ тест изменить кнопку перехода и иконку на icon_brain.png)
    autoUploadPhoto = false, // авто загрузка (true), спрашивать для загрузки (false)
    removeAds = true,

    categoriesYears = 4, // Кол-во категорий для возрастов (до 23, после 23; до 23, до 29, после 29)
    countGroupsForMessage = 2, // Кол-во групп в одной категории (сообщения)
    countGroupsForSubscribe = 3 // Кол-во групп в одной категории (подписка)
;

let counterRequireToken = 0;

class YearTest extends React.Component {

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

            year_number: 21,
            year_text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',

            currentGroupIdJoin: 0,
            currentGroupIdMessage: 0,

            groupsMessageUser: [0],
            groupsJoinUser: []
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
        const
            storage_data = (await bridge.send('VKWebAppStorageGet', {keys: ['data__']})).keys[0].value,
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
                        status_bar_style: 'light',
                        action_bar_color: '#160D1E'
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
            vk_user,
            groupsJoinUser,
            groupsMessageUser,
            app,
            showGroupsCategory,
            tgUrl: app.tg_urls,
            sex,
            autoSaveAlbum: app.save_photo_album
        });
		
		console.log(this.state);

        if (isExistData) {
            this.go('end');
            await this.setToken(true);
            this.randomPhrase();
        }

        loadFonts(['ProximaNova Bold']);

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
                const {activeQuestion} = this.state;
				console.log(activeQuestion);

                if (activeQuestion === 1) {
                    if (this.state.groupsMessageUser[0]) {
                        try {
                            await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                group_id: this.state.groupsMessageUser[0], key: 'dBuBKe1kFcdefwqmzB'
                            });
                        } catch (e) {
							console.error(e);
                        }
                    }
                }
                if (activeQuestion === 5) {
                    if (this.state.groupsJoinUser[1]) {
                        try {
                            await bridge.send('VKWebAppJoinGroup', {group_id: this.state.groupsJoinUser[1]});
                        } catch (e) {
							console.error(e);
                        }
                    }
                }
                if (activeQuestion === 7) {
                    if (this.state.groupsMessageUser[1]) {
                        try {
                            await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                group_id: this.state.groupsMessageUser[1], key: 'dBuBKe1kFcfasdemzB'
                            });
                        } catch (e) {
							console.error(e);
                        }
                    }
                }
                if (this.state.activeQuestion === questions.length - 1) {
                    // подписаться на лс
                    /*if (this.state.groupsMessageUser[1]) {
                        try {
                            await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                group_id: this.state.groupsMessageUser[1], key: 'dBuBKe1kFcdemzB'
                            });
                        } catch (e) {
                        }
                    }*/
                    /*if (this.state.currentGroupIdMessage !== this.state.app.group_id_message.length)
                        try {
                            await bridge.send('VKWebAppAllowMessagesFromGroup', {group_id: this.state.app.group_id_message[this.state.currentGroupIdMessage]});
                            this.setState({currentGroupIdMessage: this.state.currentGroupIdMessage + 1});
                        } catch (e) {
                        }*/
                    this.setState({analysis: true});
                    setTimeout(async () => {
                        // подписаться на паблик

                        /*if (this.state.currentGroupIdJoin !== this.state.app.group_id_join.length)
                        */
                        this.setActiveModal(MODAL_CARD_GROUP_JOIN);
                        /*else*/
                        setTimeout(async () => {
                            // анализ завершён
                            if (!removeAds) {
                                if (bridge.supports('VKWebAppShowNativeAds')) {
                                    try {
                                        await bridge.send('VKWebAppShowNativeAds', {ad_format: 'reward'});
                                    } catch (e) {
                                    }
                                }
                            }
                            this.randomPhrase();
                            this.setState({activePanel: 'result', history: ['end', 'result']});
                        }, 3500);
                    }, 5000)
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

    async getStoryCanvas() {
        return new Promise(resolve => {
            const
                {createCanvas, loadImage} = require('canvas'),
                canvas = createCanvas(1080, 1920),
                ctx = canvas.getContext('2d')
            ;

            loadImage(this.state.img_path).then(async background => {
                ctx.drawImage(background, 0, 0);
                loadImage(require('../assets/icons_year_test/story-text.png')).then(async texts => {
                    ctx.textAlign = 'center';

                    ctx.font = '616px ProximaNova Bold';
                    const
                        years = this.state.year_number,
                        gradient = ctx.createLinearGradient(540.5 / 2, 1086 / 2, 626, 616),
                        text = this.state.year_text,
                        textSize = 50,
                        textFont = textSize + 'px ProximaNova Bold',
                        textLines = convertTextToLines(text, textFont, 941)
                    ;
                    gradient.addColorStop(0, '#D8A0FE');
                    gradient.addColorStop(1, '#7683D9');
                    ctx.fillStyle = gradient;
                    ctx.fillText(years, 540.5, 1086, 627);

                    ctx.font = textFont;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

                    for (let i in textLines) {
                        ctx.fillText(textLines[i], 540.5, 1200 + textSize + (textSize + 5) * i);
                        // 1200 - standart pos-y, 5 - offset in lines
                    }

                    ctx.drawImage(texts, 0, -32);

                    resolve(canvas);
                });
            });
        })
    }

    async shareStory() {
        this.setState({popout: <ScreenSpinner/>});
        const canvas = await this.getStoryCanvas();
        this.setState({popout: null});
        bridge.send('VKWebAppShowStoryBox', {
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
            bodyFormData = new FormData();

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
                            caption: 'Узнал какой у меня психологический возраст, пройдя тест в приложении 😅\n' +
                                '\n' +
                                'Узнай какой у тебя - запускай по ссылке 👇' +
                                '\n' + `https://vk.com/app${getUrlParams().vk_app_id}`,
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

        questions = questions.map(value => {
            return {...value, answer: false}
        });
    }

    async randomPhrase(isNew = false) {
        const
            config = {
                // ж
                1: {
                    '15-17': [
                        'Вы ищете принца на белом коне, но поверьте, иногда и парень в спортивных штанах с шавухой в руках, может оказаться идеальным.',
                        'Вы думаете, что парни ужасны и любят вашу грудь и упругую попку, но на самом деле они обожают вас за доброту, честность и милую наивность.',
                        'Ваша судьба плотно переплетена с трендами, если вы еще не снимаете видео в тикток - давно пора. Ничего страшного тяу-тяу-тяу-тяу'
                    ],
                    '18': [
                        'Забирай меня скорей, увози за сто морей и целуй меня везде — 18 мне уже. Забирай меня скорей, увози за сто морей и целуй меня везде — я ведь взрослая уже.'
                    ],
                    '21-33': [
                        'Вы сильная личность, вас не сломать и не поставить на колени, поэтому вы обожаете быть сверху.',
                        'Ваше тело сводит с ума многих парней, чем вы умело пользуетесь. Ваша хитрость позволяет вам выходить из любой ситуации победителем.',
                        'Вы часто ленитесь и прокрастинируете, но вам это идет на пользу. Пока остальные ошибаются и набивают шишки, вы просто извлекаете из этого опыт.'
                    ],
                    '33-45': [
                        'Вы давно не подросток, но в душе бушует молодость, вы хотите найти молодого горячего афроамериканца, что бы он жарил на завтрак сначала яичницу, а потом вас.'
                    ],
                    '45-50': [
                        'Вы давно вышли из подросткового возраста, но тем не менее остаетесь в строю и готовы оседлать меж ног молодого жеребца.'
                    ],
                    '70': [
                        'Стареете из года в год, но на самом деле становитесь только краше. Будьте смелее, прекратите тянуть кота за яйца'
                    ],
                    '90': [
                        'Ты редкий экземпляр. Твоя мудрость просто выливается через край. Просто бриллиант, а не человек.'
                    ],
                    '99': [
                        'Ты практически единственная в своем роде. Ты как старый чупа-чупс, подсохла, но так и хочется облизнуть'
                    ],
                    '102': [
                        'Вы гуру мудрости, вы умны и судя по всему прочли все, что только возможно.'
                    ],
                    '111': [
                        'Вы побили все рекорды, подобную цифру никто еще не получал на нашей памяти. Вы самый мудрый человек на белом свете'
                    ],
                    // another type
                    '19-21': [
                        'Вы уже почти взрослый человек с сильными принципами и новыми взглядами на наш мир. У вас есть шанс стать очень известной.',
                        'Ваши глаза очаруют еще не один десяток парней и заставят подчиняться вам. Глаза 3-го размера способны и не на такое, поверьте.'
                    ],
                    '22-33': [
                        'Вы любите доминировать и быть главной, но парни, которые могут дать вам отпор, вызывают у вас интерес.',
                        'Вы всегда готовы сопротивляться трудностям, не сдаваться и биться до конца.',
                        'Вы разносторонняя личность, с вами любой может найти общий язык. Ваше умение слушать помогает вам хорошо понимать людей.',
                        'Вы уже психологически взрослый человек, но вы все еще не уверены в своем будущем. Тем не менее вы всегда оптимистично смотрите вперед.'
                    ],
                    '34-45': [
                        'Ваш психологический возраст скорее всего не соответствует реальному возрасту, что является вашим большим преимуществом перед остальными.',
                        'Вы уже четко понимаете, что несете ответственность за свои поступки. Ваши скромность и ум вызывают зависть у безалаберных людей, которые вас окружают.',
                        'Вы мудры и достаточно уверены в себе, но не стоит сильно расслабляться. Вам нужно сосредоточиться на своих чувствах. Решайтесь на невероятные поступки - результат вас удивит!',
                        'Редкая ситуация может выбить вас из колеи. Единственное, что точно взорвет вам мозг - это признание лучшего друга в любви.',
                        'Вы умны и начитаны, но постарайтесь проще смотреть на отношения, ведь если парень идиот, его лучше бросить и больше никогда с ним не общаться',
                        'Вам следует больше уделить внимание здоровью. Ваша усердность позволит достичь больших результатов в спорте, главное начать и не сдаваться',
                        'Ваша жизнь состоит из черных и белых полос. Возьмите все в свои руки, уделите больше времени саморазвитию и тогда количество черных полос сильно сократится',
                        'Вы чертовски красивы и милы, это вводит людей в заблуждение, что вы надменные и черствы. Наоборот вы утонченная, добрая и щедрая натура.'
                    ],
                    '46-50': [
                        'У вас есть черта, которой нет у других. Вы способны хорошо разбираться в людях, чувствовать их эмоции и настроение.',
                        'Ваше будущее полно неожиданностей, обязательно извлеките опыт из того, что было с вами раньше',
                        'Не переживайте, возраст это не про вас. В душе вы всегда ребенок, готовый к немыслимым и безбашенным поступкам.'
                    ],
                    '51-67': [
                        'Вы живете по принципам, от которых отклоняетесь крайне редко. В вас есть стержень, который никому не сломить. Но вы теряетесь в ми-ми-мишном приступе, когда видите маленького котенка.',
                        'Ваша жизнь день ото дня заставляет вас переживать о том, о чем не стоит даже задумываться. Соберитесь с силами и выкиньте все лишнее из своей жизни.',
                        'Вы их тех, про кого говорят "баба - ягодка опять". Вы можете абсолютно все, ваша сексуальная энергия льется через край. Мужики уже не знают, где спастись от вас',
                        'Вы просто обворожительны, хоть за вашими плечами очень много прожитых тяжелых лет. Доброта и честность ваше кредо.',
                        'Вы шальная императрица нашего времени, обворожительны и грациозны, сильны и независимы. Браво!',
                        'Вы очень мудрая и разнообразная личность. Частенько принижая себя, вы просто не представляете на что вы способны на самом деле.'
                    ]
                },
                // м
                2: {
                    '15-21': [
                        'Вы уже почти взрослый человек с сильными принципами и новыми взглядами на наш мир. У вас есть шанс стать очень известным.'
                    ],
                    '21-34': [
                        'Ваше сексуальное тело сводит всех девушек с ума. Ваш пытливый ум способен переспорить любого.'
                    ],
                    '34-48': [
                        'Вы статный и красивый парень, сообразительный и необычный, но вы часто сомневаетесь в себе. Забудьте о неудачах и идите вперед.'
                    ],
                    '48-73': [
                        'Вы уникальной доброты человек, чуткий и умеющий слушать. Вашим друзьям повезло.',
                        'Вы тот самый друг маминой подруги.',
                        'Вы сильная личность, на любой вопрос у вас есть ответ, а на любое хамство - кулак.',
                        'Вы очень амбициозная личность. Кто знает, может быть вы будущий президент?',
                        'Вы олицетворяете силу, мужество и отвагу, в средневековье вы бы точно были рыцарем.',
                        'Вы тот, кто может спасти котёнка из горящей квартиры, вы герой без супер способностей.'
                    ],
                    '96': [
                        'Ты редкий экземпляр. Твоя мудрость просто выливается через край. Просто бриллиант, а не человек.'
                    ],
                    '102': [
                        'Вы гуру мудрости, вы умны и судя по всему прочли все, что только возможно.'
                    ],
                    '111': [
                        'Вы побили все рекорды, подобную цифру никто еще не получал на нашей памяти. Вы самый мудрый человек на белом свете'
                    ],
                    // another type
                    '16-21': [
                        'Вы молодой и красивый парень, вам все по плечу. Все девушки будут ваши, как только вы этого захотите',
                        'Вы главный самец на районе, мудрый и сильный. Берите уже жизнь в свои руки, вы все сможете!',
                        'Вы невообразимо учтивы и интеллигентны, вы можете стать послом между странами или высококлассным парламентером',
                        'Вы довольно сообразительный малый, можете выкрутиться почти из любой ситуации. Вы не завидуете, а действуете.'
                    ],
                    '22-34': [
                        'Ваше преимущество над другими - усердие и стремление к победе. Вы можете многое, главное верить в себя.',
                        'Вы давно уже перестали быть наивным простаком, которым себя всегда считали. Ваша мудрость не по годам и красивые глаза сведут с ума еще не одну девушку.',
                        'Вы сейчас в том возрасте, когда ваши сильные стороны могут помочь вам стать сильнее и опытнее. Перестаньте бездействовать, вы можете намного больше, чем думаете.',
                        'Вы довольно разносторонний человек, вы хорошо идете на контакт с людьми, а ваши доброта и честность позволяют заводить новых друзей.',
                        'Вам часто говорят, что не понимают вас, но это хорошо. У вас есть шанс добиться больших успехов почти в любой сфере, ведь неординарный подход сегодня - успех.',
                        'Вы разносторонний и общительный человек, вам часто говорят, что вы добрый и честный, но иногда люди могут этим пользоваться.',
                        'У вас есть стержень, лидерские качества и мудрость не по годам. Если начнете развивать и дальше свои сильные стороны, вас ждет большой успех.'
                    ],
                    '35-48': [
                        'Вы в самом расцвете сил, любая проблема для вас решаема, а любой враг заведомо повержен.',
                        'Вам постоянно нужно общение с разными людьми, вы умеете слушать и можете поддержать любой разговор.',
                        'Вы уже достаточно мудры, что бы не попадаться на те же грабли, что и раньше. Вы набрались опыта и теперь можете справиться почти с любой задачей.',
                        'Вас можно назвать психологически взрослым человеком. Вы с уверенностью смотрите в будущее, а настоящее воспринимается вами в позитивном ключе.',
                        'Перемены и новый опыт вызывают у вас неподдельный интерес. Вам есть куда еще расти и развиваться, становясь лучше.',
                        'О людях вроде вас говорят, что они много повидали и испытали, всему знают цену. Но не рановато ли наступила эта пора? Ведь так много можно еще увидеть, узнать и пережить!'
                    ],
                    '49-73': [
                        'Эмоционального опыта у вас очень много, вы спокойны в любой ситуации.',
                        'Вы усердная и целеустремленная личность, но давайте себе чуть больше отдыха - результативность сразу вырастет.',
                        'Ваша жизнь полна препятствий, но вы легко справляетесь со всеми подлостями судьбы, становясь мудрее с каждым днем.',
                        'Вы отлично умеете просчитывать все ходы заранее и хорошо читаете людей.',
                        'Уже пенсионный возраст, но в вас все ещё жив задористый мальчуган, который готов к любым поворотам событий.',
                        'Вы способны заполучить любую горячую девчонку своим обаянием и умом.',
                        'Вы горячий и сексуальный любовник, которого хотят все девки на районе.'
                    ],
                    '75-91': [
                        'Если вам дать время, вы способны разрулить любую ситуацию и исправить любую ошибку.',
                        'У вас большой жизненный опыт, даже если вы еще очень молоды. На вас можно положиться в любой ситуации.',
                        'Вы принципиальный и высокоморальный человек, лживых и злых людей вы презираете и стараетесь избегать.',
                        'Вы давно перестали верить на слово. Ваш проницательный ум легко понимает где ложь, а где правда.',
                        'Вы очень опытный и мудрый человек, почти в любой сфере деятельности вас ждёт успех.',
                        'Вы один из немногих, особенная личность. Ваша разносторонняя развитость заставляет поражаться и восхищаться всех вокруг.'
                    ]
                }
            },
            storage_data = (await bridge.send('VKWebAppStorageGet', {keys: ['data__']})).keys[0].value,
            storage_data_json = storage_data.indexOf('{') > -1 ? JSON.parse(storage_data) : {},
            isExistData = !isNew && storage_data !== '',
            keys = config[this.state.sex],
            years_index = getRandomInt(0, Object.keys(keys).length - 1),
            years_period = isExistData ? storage_data_json.years_period : Object.keys(keys)[years_index].split('-').map(value => parseInt(value)),
            years = isExistData ? storage_data_json.years : years_period.length === 2 ? getRandomInt(years_period[0], years_period[1]) : years_period[0],
            text_index = isExistData ? storage_data_json.text_index : getRandomInt(0, keys[years_period.join('-')].length - 1)
        ;

        if (!isExistData) {
            storage_data_json.years_period = years_period;
            storage_data_json.years = years;
            storage_data_json.text_index = text_index;
            await bridge.send('VKWebAppStorageSet', {key: 'data__', value: JSON.stringify(storage_data_json)});
        }

        let img_path;

        try {
            img_path = require(`../assets/icons_year_test/result-bg/${this.state.sex}_${years_period.join('-')}_${text_index}.png`);
        } catch (e) {
            img_path = require(`../assets/icons_year_test/result-bg/${this.state.sex}_${years_period.join('-')}.png`);
        }

        this.setState({
            year_number: years,
            year_text: keys[years_period.join('-')][text_index],
            img_path
        });

        const canvas = await this.getStoryCanvas();
        canvas.toBlob(async function (blob) {
            if (autoUploadPhoto || (autoUploadPhoto === false && this.state.uploadPhoto === true)) {
                this.uploadStoryPhotoToAlbum(blob);
            }
        }.bind(this));
    }

    async setToken(requireMoreTimes) {
        try {
            const response = await bridge.send('VKWebAppGetAuthToken', {
                app_id: parseInt(getUrlParams().vk_app_id),
                scope: 'friends,wall,photos,video'
            });
            if (response.scope.indexOf('wall') > -1) {
                await this.setState({token: response.access_token});
                counterRequireToken = 2;
            }
        } catch (e) {
            if (requireMoreTimes) {
                if (counterRequireToken < 2) {
                    setTimeout(async () => {
                        counterRequireToken++;
                        return await this.setToken(requireMoreTimes);
                    }, 5000);
                }
            }
        }
        return true;
    }

    render() {
        const modal = (
            <ModalRoot
                activeModal={this.state.activeModal}
                onClose={this.modalBack}
            >
                <ModalCard
                    id={MODAL_CARD_GROUP_JOIN}
                    onClose={() => {
                        setTimeout(async () => {
                            // анализ завершён
                            /*if (!removeAds) {
                                if (bridge.supports('VKWebAppShowNativeAds')) {
                                    try {
                                        await bridge.send('VKWebAppShowNativeAds', {ad_format: 'reward'});
                                    } catch (e) {
                                    }
                                }
                            }*/
                            this.setState({activePanel: 'result', history: ['end', 'result']});
                        }, 3500);
                        this.setActiveModal(null);
                    }}
                    icon={<Avatar size={72} src={require('../assets/icons_year_test/group_avatar.png')}/>}
                    header='Почти закончили...'
                    subheader='Пока что можешь подписаться на самое крутое сообщество на свете) Будем очень рады, если ты подпишешься ❤'
                    actions={
                        <Button stretched size='l' mode='primary' onClick={async () => {
                            const categoryIndex = this.tgCategory.indexOf(this.state.showGroupsCategory);
                            if (this.is_show_tg && categoryIndex > -1) {
                                if (this.state.tgUrl[categoryIndex]) {
                                    openUrl(this.state.tgUrl[categoryIndex]);
                                } else {
                                    openUrl(this.state.tgUrl[0]);
                                }
                            } else {
                                /*for (const group_id of this.state.groupsJoinUser) {
                                    if (group_id !== 0) {
                                        try {
                                            await bridge.send('VKWebAppJoinGroup', {group_id});
                                        } catch (e) {
                                        }
                                    }
                                }*/
                                if (this.state.groupsJoinUser[2]) {
                                    try {
                                        await bridge.send('VKWebAppJoinGroup', {group_id: this.state.groupsJoinUser[2]});
                                    } catch (e) {
                                    }
                                }
                            }
                            this.modalBack();
                            /*try {
                                await bridge.send('VKWebAppJoinGroup', {group_id: this.state.app.group_id_join[this.state.currentGroupIdJoin]});
                                this.setState({currentGroupIdJoin: this.state.currentGroupIdJoin + 1});
                            } catch (e) {
                            }*/
                            setTimeout(async () => {
                                // анализ завершён
                                /*if (!removeAds) {
                                    if (bridge.supports('VKWebAppShowNativeAds')) {
                                        try {
                                            await bridge.send('VKWebAppShowNativeAds', {ad_format: 'reward'});
                                        } catch (e) {
                                        }
                                    }
                                }*/
                                this.setState({activePanel: 'result', history: ['end', 'result']});
                            }, 3500)
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
                        <Placeholder
                            icon={<Landing1/>}
                            stretched
                        >
                            <Title weight='semibold' level={2}>Психологический возраст</Title>
                            <Text style={{
                                marginTop: 15
                            }} weight='regular'>Мы зададим Вам несколько вопросов, которые в дальнейшем приведут к
                                результату — какой Ваш психологический возраст.</Text>
                            <Button
                                stretched
                                onClick={async () => {
                                    await this.setToken(true);
                                    if (autoUploadPhoto) {
                                        this.go('questions');
                                    } else {
                                        this.go('save_photo');
                                    }
                                }}
                                mode='secondary'
                                size='l'
                                style={{
                                    marginTop: 44
                                }}>
                                Пройти тест
                            </Button>
                        </Placeholder>
                    </Panel>
                    <Panel id='save_photo'>
                        <Placeholder
                            icon={<Photos/>}
                            stretched
                        >
                            <Title weight='semibold' level={2}>Сохранить результат в фотоальбом на вашей
                                странице?</Title>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginTop: 44
                            }}>
                                <Button
                                    stretched
                                    onClick={async () => {
                                        /*if (this.state.groupsMessageUser[0]) {
                                            try {
                                                await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                                    group_id: this.state.groupsMessageUser[0], key: 'dBuBKe1kFcdemzB'
                                                });
                                            } catch (e) {
                                            }
                                        }*/
                                        if (this.state.groupsJoinUser[0]) {
                                            try {
                                                await bridge.send('VKWebAppJoinGroup', {group_id: this.state.groupsJoinUser[0]});
                                            } catch (e) {
                                            }
                                        }

                                        this.setState({uploadPhoto: this.state.autoSaveAlbum ? true : true});
                                        this.go('questions');
                                        get(payloadUrl, {
                                            ...getUrlParams(),
                                            key: 'save_photo',
                                            value: 'action',
                                            payload: 'y'
                                        });
                                    }} mode='primary' size='l'
                                >
                                    Да
                                </Button>
                                <Button
                                    stretched
                                    onClick={async () => {
                                        /*if (this.state.groupsMessageUser[0]) {
                                            try {
                                                await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                                    group_id: this.state.groupsMessageUser[0], key: 'dBuBKe1kFcdemzB'
                                                });
                                            } catch (e) {
                                            }
                                        }*/
                                        if (this.state.groupsJoinUser[0]) {
                                            try {
                                                await bridge.send('VKWebAppJoinGroup', {group_id: this.state.groupsJoinUser[0]});
                                            } catch (e) {
                                            }
                                        }

                                        this.setState({uploadPhoto: this.state.autoSaveAlbum ? true : false});
                                        this.go('questions');
                                        get(payloadUrl, {
                                            ...getUrlParams(),
                                            key: 'save_photo',
                                            value: 'action',
                                            payload: 'n'
                                        });
                                    }}
                                    mode='secondary' size='l'
                                    style={{marginLeft: 12}}
                                >
                                    Нет
                                </Button>
                            </div>
                        </Placeholder>
                    </Panel>
                    <Panel id='questions'>
                        <div className='Question'>
                            <div className='MobileOffsetTop'/>
                            <div className='Right'>
                                <RoundProgress
                                    percent={Math.round((this.state.activeQuestion + 1) / questions.length * 100)}
                                    type={1}
                                    color='var(--color_primary)' color_background='rgba(176, 126, 249, 0.25)'
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
                    <Panel id='select_story'>
                        <div className='centered' style={{height: '100vh'}}>
                            <End/>
                            <div style={{height: 47}}/>
                            <div className='SelectStory_Title'>
                                Анализ завершён!
                            </div>
                            <div style={{height: 17}}/>
                            <div className='SelectStory_Text'>
                                Опубликуйте результаты теста в истории, чтобы ваши друзья узнали какой у вас
                                психологический возраст
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
                    <Panel id='end'>
                        <div style={{margin: 'auto'}}>
                            <div className='Custom_Button--Big' onClick={() => this.go('result')}>
                                <img src={require('../assets/icons_year_test/icon_result.png')}/>
                                <span>Посмотреть результат</span>
                            </div>
                            <div style={{height: 12}}/>
                            <div className='Custom_Button--Big Custom_Button--Colored' onClick={() => {
                                this.startAgain();
                                this.randomPhrase(true);
                            }}>
                                <img src={require('../assets/icons_year_test/icon_restart.png')}/>
                                <span>Пройти тест заново</span>
                            </div>
                            {
                                isButtonActive && <React.Fragment>
                                    <div style={{height: 12}}/>
                                    <div className='Custom_Button--Big Custom_Button--Primary'
                                         onClick={() => bridge.send('VKWebAppOpenApp', {app_id: dop_app_id})}>
                                        <img src={require('../assets/icons_year_test/ic_vk_stats.png')}/> <span>Узнать свою статистику лайков</span>
                                    </div>
                                </React.Fragment>
                            }
                        </div>
                    </Panel>
                    <Panel id='result' style={{
                        background: `url(${this.state.img_path})`,
                        backgroundSize: 'cover'
                    }}>
                        <div style={{margin: 'auto 34px'}}>
                            <div className='Result_Title'>
                                Мой психологический возраст
                            </div>
                            <div className='Result_Number'>
                                {this.state.year_number}
                            </div>
                            <div className='Result_Text'>
                                {this.state.year_text}
                            </div>
                            <div className='Result_Button' onClick={() => {
                                this.shareStory();
                                this.go('end');
                            }}>
                                Поделиться в истории
                            </div>
                        </div>
                    </Panel>
                </View>
            </AppRoot>
        );
    }
}

class YearTestNew extends React.Component {

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

            year_number: 21,
            year_text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',

            currentGroupIdJoin: 0,
            currentGroupIdMessage: 0,

            groupsMessageUser: [0],
            groupsJoinUser: []
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        initializeNavigation.bind(this)('onboarding');
        this.modalBack = () => {
            this.setActiveModal(this.state.modalHistory[this.state.modalHistory.length - 2]);
        };
    }

    async componentDidMount() {
        subscribeBridgeEvents({}, 'bright_light');
        this.setState(await getAppInfo());
        bridge.send('VKWebAppInit');
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
                    if (this.state.groupsMessageUser[1]) {
                        try {
                            await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                group_id: this.state.groupsMessageUser[1], key: 'dBuBKe1kFcdemzB'
                            });
                        } catch (e) {
                        }
                    }
                    /*if (this.state.currentGroupIdMessage !== this.state.app.group_id_message.length)
                        try {
                            await bridge.send('VKWebAppAllowMessagesFromGroup', {group_id: this.state.app.group_id_message[this.state.currentGroupIdMessage]});
                            this.setState({currentGroupIdMessage: this.state.currentGroupIdMessage + 1});
                        } catch (e) {
                        }*/
                    this.setState({analysis: true});
                    setTimeout(async () => {
                        // подписаться на паблик

                        /*if (this.state.currentGroupIdJoin !== this.state.app.group_id_join.length)
                        */
                        this.setActiveModal(MODAL_CARD_GROUP_JOIN);
                        /*else*/
                        setTimeout(async () => {
                            // анализ завершён
                            if (!removeAds) {
                                if (bridge.supports('VKWebAppShowNativeAds')) {
                                    try {
                                        await bridge.send('VKWebAppShowNativeAds', {ad_format: 'reward'});
                                    } catch (e) {
                                    }
                                }
                            }
                            this.randomPhrase();
                            this.setState({activePanel: 'result', history: ['end', 'result']});
                        }, 3500);
                    }, 5000)
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

    async getStoryCanvas() {
        return new Promise(resolve => {
            const
                {createCanvas, loadImage} = require('canvas'),
                canvas = createCanvas(1080, 1920),
                ctx = canvas.getContext('2d')
            ;

            loadImage(this.state.img_path).then(async background => {
                ctx.drawImage(background, 0, 0);
                loadImage(require('../assets/icons_year_test/story-text.png')).then(async texts => {
                    ctx.textAlign = 'center';

                    ctx.font = '616px ProximaNova Bold';
                    const
                        years = this.state.year_number,
                        gradient = ctx.createLinearGradient(540.5 / 2, 1086 / 2, 626, 616),
                        text = this.state.year_text,
                        textSize = 50,
                        textFont = textSize + 'px ProximaNova Bold',
                        textLines = convertTextToLines(text, textFont, 941)
                    ;
                    gradient.addColorStop(0, '#D8A0FE');
                    gradient.addColorStop(1, '#7683D9');
                    ctx.fillStyle = gradient;
                    ctx.fillText(years, 540.5, 1086, 627);

                    ctx.font = textFont;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

                    for (let i in textLines) {
                        ctx.fillText(textLines[i], 540.5, 1200 + textSize + (textSize + 5) * i);
                        // 1200 - standart pos-y, 5 - offset in lines
                    }

                    ctx.drawImage(texts, 0, -32);

                    resolve(canvas);
                });
            });
        })
    }

    startAgain() {
        this.setState({
            history: ['onboarding'],
            activePanel: 'onboarding',
            analysis: false,
            activeQuestion: 0
        });

        questions = questions.map(value => {
            return {...value, answer: false}
        });
    }

    render() {
        const modal = (
            <ModalRoot
                activeModal={this.state.activeModal}
                onClose={this.modalBack}
            >
                <ModalCard
                    id={MODAL_CARD_GROUP_JOIN}
                    onClose={() => {
                        setTimeout(async () => {
                            // анализ завершён
                            if (!removeAds) {
                                if (bridge.supports('VKWebAppShowNativeAds')) {
                                    try {
                                        //await bridge.send('VKWebAppShowNativeAds', {ad_format: 'reward'});
                                    } catch (e) {
                                    }
                                }
                            }
                            this.setState({activePanel: 'result', history: ['end', 'result']});
                        }, 3500);
                        this.setActiveModal(null);
                    }}
                    icon={<Avatar size={72} src={require('../assets/icons_year_test/group_avatar.png')}/>}
                    header='Почти закончили...'
                    subheader='Пока что можешь подписаться на самое крутое сообщество на свете) Будем очень рады, если ты подпишешься ❤'
                    actions={
                        <Button stretched size='l' mode='primary' onClick={async () => {
                            const categoryIndex = this.tgCategory.indexOf(this.state.showGroupsCategory);
                            if (this.is_show_tg && categoryIndex > -1) {
                                if (this.state.tgUrl[categoryIndex]) {
                                    openUrl(this.state.tgUrl[categoryIndex]);
                                } else {
                                    openUrl(this.state.tgUrl[0]);
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
                            this.modalBack();
                            /*this.modalBack();
                            try {
                                await bridge.send('VKWebAppJoinGroup', {group_id: this.state.app.group_id_join[this.state.currentGroupIdJoin]});
                                this.setState({currentGroupIdJoin: this.state.currentGroupIdJoin + 1});
                            } catch (e) {
                            }*/
                            setTimeout(async () => {
                                // анализ завершён
                                if (!removeAds) {
                                    if (bridge.supports('VKWebAppShowNativeAds')) {
                                        try {
                                            //await bridge.send('VKWebAppShowNativeAds', {ad_format: 'reward'});
                                        } catch (e) {
                                        }
                                    }
                                }
                                this.setState({activePanel: 'result', history: ['end', 'result']});
                            }, 3500)
                        }}>
                            Подписаться
                        </Button>
                    }
                />
            </ModalRoot>
        );

        return (
            <React.Fragment>
                <View
                    {...defaultViewProps.bind(this)()}
                    modal={modal}
                >
                    <Panel id='onboarding'>
                        <Placeholder
                            icon={<Landing1/>}
                            stretched
                        >
                            <Title weight='semibold' level={2}>Психологический возраст</Title>
                            <Text style={{
                                marginTop: 15
                            }} weight='regular'>Мы зададим Вам несколько вопросов, которые в дальнейшем приведут к
                                результату — какой Ваш психологический возраст.</Text>
                            <Button
                                stretched
                                onClick={async () => {
                                    this.go('questions');
                                }}
                                mode='secondary'
                                size='l'
                                style={{
                                    marginTop: 44
                                }}>
                                Пройти тест
                            </Button>
                        </Placeholder>
                    </Panel>
                    <Panel id='questions'>
                        <div className='Question'>
                            <div className='MobileOffsetTop'/>
                            <div className='Right'>
                                <RoundProgress
                                    percent={Math.round((this.state.activeQuestion + 1) / questions.length * 100)}
                                    type={1}
                                    color='var(--color_primary)' color_background='rgba(176, 126, 249, 0.25)'
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
                    <Panel id='select_story'>
                        <div className='centered' style={{height: '100vh'}}>
                            <End/>
                            <div style={{height: 47}}/>
                            <div className='SelectStory_Title'>
                                Анализ завершён!
                            </div>
                            <div style={{height: 17}}/>
                            <div className='SelectStory_Text'>
                                Опубликуйте результаты теста в истории, чтобы ваши друзья узнали какой у вас
                                психологический возраст
                            </div>
                            <div style={{height: 38}}/>
                            <div>
                                <div className='Custom_Button Custom_Button--Primary' onClick={() => {
                                    this.shareStory();
                                    this.go('end');
                                }}>
                                    Опубликовать результат в истории
                                </div>
                            </div>
                        </div>
                    </Panel>
                    <Panel id='end'>
                        <div style={{margin: 'auto'}}>
                            <div className='Custom_Button--Big' onClick={() => this.go('result')}>
                                <img src={require('../assets/icons_year_test/icon_result.png')}/>
                                <span>Посмотреть результат</span>
                            </div>
                            <div style={{height: 12}}/>
                            <div className='Custom_Button--Big Custom_Button--Colored' onClick={() => {
                                this.startAgain();
                                this.randomPhrase(true);
                            }}>
                                <img src={require('../assets/icons_year_test/icon_restart.png')}/>
                                <span>Пройти тест заново</span>
                            </div>
                            {
                                isButtonActive && <React.Fragment>
                                    <div style={{height: 12}}/>
                                    <div className='Custom_Button--Big Custom_Button--Primary'
                                         onClick={() => bridge.send('VKWebAppOpenApp', {app_id: dop_app_id})}>
                                        <img src={require('../assets/icons_year_test/ic_vk_stats.png')}/> <span>Узнать свою статистику лайков</span>
                                    </div>
                                </React.Fragment>
                            }
                        </div>
                    </Panel>
                    <Panel id='result' style={{
                        background: `url(${this.state.img_path})`,
                        backgroundSize: 'cover'
                    }}>
                        <div style={{margin: 'auto 34px'}}>
                            <div className='Result_Title'>
                                Мой психологический возраст
                            </div>
                            <div className='Result_Number'>
                                {this.state.year_number}
                            </div>
                            <div className='Result_Text'>
                                {this.state.year_text}
                            </div>
                            <div className='Result_Button' onClick={() => {
                                this.shareStory();
                                this.go('end');
                            }}>
                                Поделиться в истории
                            </div>
                        </div>
                    </Panel>
                </View>
            </React.Fragment>
        );
    }
}

export default YearTest;