import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/YearTest.css';
import '../css/IQTest.css';

import {
    AppRoot, Avatar,
    Button, Input, ModalCard, ModalRoot,
    Panel,
    Placeholder, ScreenSpinner, Select, Text, Title,
    View
} from '@vkontakte/vkui';

import {ReactComponent as Landing1} from "../assets/icons_iq_test/landing_1.svg";
import RoundProgress from "../components/BattleStat/RoundProgress";
import {ReactComponent as Searching} from "../assets/icons_year_test/searching.svg";
import {ReactComponent as End} from "../assets/icons_year_test/end.svg";
import {convertTextToLines, get, loadFonts} from "../js/utils";
import {getRandomInt} from "../js/utils";

let questions = [
    {
        text: 'Первый вопрос: Что значит слово “умиротворять”?',
        type: 'button',
        answers: [
            'Устанавливать',
            'Успокаивать',
            'Обтёсывать',
            'Выстраивать'
        ]
    },
    {
        text: 'Назовите лишнее слово',
        type: 'button',
        answers: [
            'Нью-Йорк',
            'Москва',
            'Лондон',
            'Париж'
        ]
    },
    {
        text: 'Какая цифра должна быть на месте машины?',
        type: 'image',
        src: require('../assets/icons_iq_test/question.jpg')
    },
    {
        text: 'Какое колесо машины не крутится при правом развороте ?',
        type: 'button',
        answers: [
            'Правое',
            'Запасное',
            'Левое'
        ]
    },
    {
        text: 'Что из этого меньше всего похоже на остальное?',
        type: 'button',
        answers: [
            'Треугольник',
            'Эллипс',
            'Круг',
            'Куб'
        ]
    },
    {
        text: 'Больному необходимо выпить 4 таблетки, по одной каждые пол часа. Сколько потребуется времени, чтобы выпить все таблетки?',
        type: 'button',
        answers: [
            '1 час',
            '1,5 часа',
            '2 часа',
            '3 часа'
        ]
    },
    {
        text: 'Как называется феномен, когда заложник начинает сопереживать похитителю?',
        type: 'button',
        answers: [
            'Стокгольмский синдром',
            'Копенгагенский синдром',
            'Синдром Осло',
            'Ничего из этого'
        ]
    }
];

const
    axios = require('axios'),
    uploadUrl = 'https://vds2056823.my-ihor.ru:8081/api/photos.upload?uploadUrl=',
    MODAL_CARD_GROUP_JOIN = 'group-join',
    year_test_app_id = 7814150 // APP_ID приложения "Психический возраст"
;

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

            year_number: 21,
            year_text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',

            currentGroupIdJoin: 0,
            currentGroupIdMessage: 0,

            img_path_1: require('../assets/icons_iq_test/background_end.png'),
            img_path_2: require('../assets/icons_iq_test/background_result.png')
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

        this.vkParams = () => window.location.search.length > 0 && JSON.parse('{"' + decodeURI(window.location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
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
                schemeAttribute.value = 'bright_light';
                document.body.attributes.setNamedItem(schemeAttribute);
                if (bridge.supports('VKWebAppSetViewSettings')) {
                    bridge.send('VKWebAppSetViewSettings', {
                        status_bar_style: 'light',
                        action_bar_color: '#F0ECEB'
                    });
                }
            } else if (type === 'VKWebAppViewRestore') {
                this.setState({popout: null});
            }
        });

        const
            app = (await get('https://vds2056815.my-ihor.ru:8081/api/apps.get', {app_id: this.vkParams().vk_app_id})).response,
            user = await bridge.send('VKWebAppGetUserInfo')
        ;
        this.setState({app, user});

        if (isExistData) {
            this.go('end');
            await this.setToken();
            this.randomPhrase();
        }

        loadFonts(['Montserrat SemiBold', 'SF Pro Display Bold']);

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
                    if (this.state.currentGroupIdMessage !== this.state.app.group_id_message.length)
                        try {
                            await bridge.send('VKWebAppAllowMessagesFromGroup', {group_id: this.state.app.group_id_message[this.state.currentGroupIdMessage]});
                            this.setState({currentGroupIdMessage: this.state.currentGroupIdMessage + 1});
                        } catch (e) {
                        }

                    this.setState({analysis: true});
                    setTimeout(async () => {
                        // подписаться на паблик
                        if (this.state.currentGroupIdJoin !== this.state.app.group_id_join.length)
                            this.setActiveModal(MODAL_CARD_GROUP_JOIN);
                        else
                            setTimeout(() => {
                                // анализ завершён
                                this.randomPhrase();
                                this.setState({activePanel: 'select_story', history: ['end', 'select_story']});
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

            loadImage(require('../assets/icons_iq_test/background_story.png')).then(async background => {
                ctx.drawImage(background, 0, 0);
                loadImage(require('../assets/icons_iq_test/story-text.png')).then(async texts => {
                    loadImage(this.state.img_path_3).then(async person => {
                        ctx.textAlign = 'center';
                        const
                            iq = 'Мой IQ: ' + this.state.iq,
                            phrase = `У ${this.state.phrase} такой же!`
                        ;
                        ctx.font = '132px SF Pro Display Bold';
                        ctx.fillStyle = '#FF2E32';
                        ctx.fillText(iq, 540, 266);

                        ctx.font = '48px Montserrat SemiBold';
                        ctx.fillStyle = '#231D25';
                        ctx.fillText(phrase, 540.5, 391.5);

                        ctx.drawImage(person, 31, 524);
                        ctx.drawImage(texts, 0, -32);

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
            urlWall = uploadUrl + encodeURIComponent(uploadWallUrl),
            bodyFormData = new FormData()
        ;

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
                        caption: 'Узнал какой у меня IQ, пройдя тест в приложении😅\n' +
                            '\n' +
                            'Узнай какой у тебя - запускай по ссылке👇🏻' +
                            `\nhttps://vk.com/app${this.vkParams().vk_app_id}`,
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
    }

    async uploadStoryPhotoToAlbum(blob) {
        const
            album_id = (await bridge.send('VKWebAppCallAPIMethod', {
                method: 'photos.createAlbum',
                params: {
                    title: 'Мой IQ',
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
            urlAlbum = uploadUrl + encodeURIComponent(uploadAlbumUrl),
            bodyFormData = new FormData()
        ;

        bodyFormData.append('photo', blob, 'image.png');

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
                        caption: 'Узнал какой у меня IQ, пройдя тест в приложении😅\n' +
                            '\n' +
                            'Узнай какой у тебя - запускай по ссылке👇🏻' +
                            `\nhttps://vk.com/app${this.vkParams().vk_app_id}`,
                        v: '5.126',
                        access_token: this.state.token
                    }
                });
            }.bind(this))
            .catch(function (response) {
                console.log(response);
            });
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
                90: [
                    'Сергея Зверева'
                ],
                92: [
                    'Линдсей Лохан',
                    'Меган Фокс'
                ],
                93: [
                    'Сильвестра Сталлоне',
                    'Канье Уэст'
                ],
                97: [
                    'Дарьи Сагаловой'
                ],
                98: [
                    'Бритни Спирс'
                ],
                99: [
                    'Скарлетт Йоханссон'
                ],
                100: [
                    'Джейсона Стэтхэма'
                ],
                101: [
                    'Брюса Уиллиса'
                ],
                102: [
                    'Адама Сэндлера'
                ],
                103: [
                    'Аллы Михеевой'
                ],
                104: [
                    'Вин Дизеля'
                ],
                105: [
                    'Аллы Пугачевой'
                ],
                107: [
                    'Милы Кунис'
                ],
                109: [
                    'Александра Петрова',
                    'Джима Керри'
                ],
                110: [
                    'Ксении Собчак'
                ],
                111: [
                    'Марго Робби'
                ],
                113: [
                    'Данила Козловского'
                ],
                114: [
                    'Сергея Светлакова',
                    'Дуэйна Джонсона'
                ],
                117: [
                    'Джона Кеннеди'
                ],
                118: [
                    'Анджелины Джоли'
                ],
                119: [
                    'Брэда Питта'
                ],
                120: [
                    'Михаила Галустян',
                    'Барака Обамы'
                ],
                124: [
                    'Федора Бондарчука'
                ],
                125: [
                    'Джорджа Буша младшего'
                ],
                127: [
                    'Джорджа Клуни',
                    'Дмитрия Нагиева'
                ],
                128: [
                    'Сергея Шнурова'
                ],
                132: [
                    'Николь Кидмана',
                    'Джоди Фостера',
                    'Стива Мартина'
                ],
                134: [
                    'Владимира Путина',
                    'Роберта-дауни младшего'
                ],
                135: [
                    'Ивана Урганта',
                    'Арнольда Шварценеггера'
                ],
                137: [
                    'Билла Клинтона'
                ],
                140: [
                    'Мадонны',
                    'Харрисона Форда',
                    'Хиллари Клинтона',
                    'Шакиры',
                    'Иосифа Кобзона'
                ],
                145: [
                    'Дэвида Духовны',
                    'Мэтта Дэймона',
                    'Риза Уизерспун'
                ],
                150: [
                    'Натали Портман'
                ],
                151: [
                    'Джессики Альбы'
                ],
                154: [
                    'Шэрона Стоун'
                ],
                155: [
                    'Илона Маска'
                ],
                156: [
                    'Азии Каррера'
                ],
                160: [
                    'Квентина Тарантино',
                    'Дольфа Лундгрен',
                    'Стивена Хокинга',
                    'Билла Гейтса'
                ],
                200: [
                    'Альберта Эйнштейна'
                ]
            },
            storage_data = (await bridge.send('VKWebAppStorageGet', {keys: ['data']})).keys[0].value,
            storage_data_json = storage_data.indexOf('{') > -1 ? JSON.parse(storage_data) : {},
            isExistData = !isNew && storage_data !== '',
            phrases_index = getRandomInt(0, Object.keys(config).length - 1),
            iq = isExistData ? storage_data_json.iq : Object.keys(config)[phrases_index],
            phrase_index = isExistData ? storage_data_json.phrase_index : getRandomInt(0, config[iq].length - 1),
            phrase = config[iq][phrase_index]
        ;

        if (!isExistData) {
            storage_data_json.iq = iq;
            storage_data_json.phrase_index = phrase_index;
            await bridge.send('VKWebAppStorageSet', {key: 'data', value: JSON.stringify(storage_data_json)});
        }

        this.setState({
            iq,
            phrase,
            img_path_3: require(`../assets/icons_iq_test/iq/${iq}${phrase_index > 0 ? (`-${phrase_index}`) : ''}.png`)
        });

        const canvas = await this.getStoryCanvas();
        canvas.toBlob(async function (blob) {
            this.uploadStoryPhotoToAlbum(blob);
        }.bind(this));
    }

    async setToken() {
        try {
            const response = await bridge.send('VKWebAppGetAuthToken', {
                app_id: parseInt(this.vkParams().vk_app_id),
                scope: 'friends,wall,photos,video'
            });
            if (response.scope.indexOf('wall') > -1) {
                await this.setState({token: response.access_token});
            }
        } catch (e) {

        }
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
                        setTimeout(() => {
                            // анализ завершён
                            this.randomPhrase();
                            this.setState({activePanel: 'select_story', history: ['end', 'select_story']});
                        }, 3500);
                        this.setActiveModal(null);
                    }}
                    icon={<Avatar size={72} src={require('../assets/icons_year_test/group_avatar.png')}/>}
                    header='Почти закончили...'
                    subheader='Пока что можешь подписаться на самое крутое сообщество на свете) Будем очень рады, если ты подпишешься ❤'
                    actions={
                        <Button stretched size='l' mode='primary' onClick={async () => {
                            this.modalBack();
                            try {
                                await bridge.send('VKWebAppJoinGroup', {group_id: this.state.app.group_id_join[this.state.currentGroupIdJoin]});
                                this.setState({currentGroupIdJoin: this.state.currentGroupIdJoin + 1});
                            } catch (e) {
                            }
                            setTimeout(() => {
                                // анализ завершён
                                this.randomPhrase();
                                this.setState({activePanel: 'select_story', history: ['end', 'select_story']});
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
                            <Title weight='semibold' level={2}>Тест на IQ</Title>
                            <Text style={{
                                marginTop: 15
                            }} weight='regular'>Мы зададим Вам несколько вопросов, которые в дальнейшем приведут к
                                результату — какой у Вас IQ.</Text>
                            <Button
                                stretched
                                onClick={async () => {
                                    await this.setToken();
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
                                    color='var(--color_primary)' color_background='rgba(255, 43, 55, 0.25)'
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
                                Опубликуйте результаты теста в истории, чтобы ваши друзья узнали какой у вас IQ
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
                    <Panel id='end' style={{
                        background: `url(${this.state.img_path_1})`,
                        backgroundSize: 'cover'
                    }}>
                        <div style={{margin: 'auto'}}>
                            <div className='Custom_Button--Big' onClick={() => this.go('result')}>
                                <img src={require('../assets/icons_iq_test/icon_result.png')}/>
                                <span>Посмотреть результат</span>
                            </div>
                            <div style={{height: 12}}/>
                            <div className='Custom_Button--Big Custom_Button--Colored' onClick={() => {
                                this.startAgain();
                                this.randomPhrase(true);
                            }}>
                                <img src={require('../assets/icons_iq_test/icon_restart.png')}/>
                                <span>Пройти тест заново</span>
                            </div>
                            <div style={{height: 12}}/>
                            <div className='Custom_Button--Big Custom_Button--Gradient'
                                 onClick={() => bridge.send('VKWebAppOpenApp', {app_id: year_test_app_id})}>
                                <img src={require('../assets/icons_year_test/icon_brain.png')}/>
                                <span>Пройти тест на психологический возраст</span>
                            </div>
                        </div>
                    </Panel>
                    <Panel id='result' style={{
                        background: `url(${this.state.img_path_2})`,
                        backgroundSize: 'cover'
                    }}>
                        <div style={{margin: 'auto 34px'}}>
                            <div className='Result_Title'>
                                Мой IQ: {this.state.iq}
                            </div>
                            <div className='Result_Subtitle'>
                                У {this.state.phrase} такой же!
                            </div>
                            <div style={{height: '6.5vh'}}/>
                            <img className='img' src={this.state.img_path_3}/>
                            <div style={{height: '5vh'}}/>
                            <div className='Result_Button' onClick={() => {
                                this.shareStory();
                                this.go('end');
                            }}>
                                <img src={require('../assets/icons_iq_test/icon_share.png')}/>
                                <span>Поделиться в истории</span>
                            </div>
                        </div>
                    </Panel>
                </View>
            </AppRoot>
        );
    }
}

export default IQTest;