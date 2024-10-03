import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/AskMe.css';
import html2canvas from 'html2canvas';

import {
    Avatar,
    Button,
    Div,
    Group,
    Header,
    MiniInfoCell,
    Panel,
    PanelHeader,
    PanelHeaderBack,
    Placeholder,
    Search,
    Separator,
    Text,
    Title,
    UsersStack,
    View,
    SimpleCell,
    Footer,
    ModalRoot,
    ModalCard,
    Input,
    Checkbox,
    Card,
    Tappable,
    ScreenSpinner,
    FixedLayout,
    IS_PLATFORM_IOS,
    FormItem,
    SliderSwitch,
    Link
} from '@vkontakte/vkui';

import {ReactComponent as Landing1} from "../assets/icons_ask_me/landing_1.svg";
import {ReactComponent as Landing2} from "../assets/icons_ask_me/landing_2.svg";
import {ReactComponent as Landing3} from "../assets/icons_ask_me/landing_3.svg";
import {ReactComponent as Landing4} from "../assets/icons_ask_me/landing_4.svg";
import {ReactComponent as PlaceholderShareStory} from "../assets/icons_ask_me/placeholder_share_story.svg";

import {
    Icon28UserOutgoingOutline,
    Icon28UserIncomingOutline,
    Icon28ShareOutline,
    Icon28WriteOutline, Icon28InboxOutline, Icon56RecentOutline, Icon28Users3Outline
} from '@vkontakte/icons';
import {decOfNum, getRandomInt, nodeToString, toBlob} from "../js/utils";
import {ColorButton} from "../components/ColorButton";

const
    {createCanvas, loadImage} = require('canvas'),
    request = require('request'),
    MODAL_CARD_NEW_QUESTION = 'new-question',
    MODAL_CARD_ANSWER_QUESTION = 'answer-question',
    MODAL_CARD_SHARE_ANSWER = 'share-answer',
    MODAL_CARD_USER_DOESNT_EXIST = 'user-doesnt-exist'
;

let isNewUser, scheme;

const localConfig = {
    app_id_to_deploy: 7703365,
    apps: {
        7703365: {
            group_id: 201216831,
            host: 'https://vds2040122.my-ihor.ru:8080/api/'
        }
    }
};

class AskMe extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: ['landing_1'],
            activePanel: 'landing_1',

            activeModal: null,
            modalHistory: [],

            friends: [],
            searchFriend: '',
            selectedFriend: {},
            question_: {photos: []},

            questions_loading: false,
            questions_all: false,

            is_question: false,
            story_background: require('../assets/icons_ask_me/bg/0.jpg'),

            selectedQuestionsType: '0',
            selectedSortType: 0,

            questions: [],
            answers: [],

            sortedByQuestions: [],
            sortedByAnswers: []
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.back = this.back.bind(this);
        this.go = this.go.bind(this);

        this.renderModal = this.renderModal.bind(this);
        this.shareQuestion = this.shareQuestion.bind(this);

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

        this.vkParams = () => JSON.parse('{"' + decodeURI(window.location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');

        this.isNotifyEnabled = () => this.vkParams().vk_are_notifications_enabled === '1';
    }

    async componentDidMount() {
        isNewUser = (await bridge.send('VKWebAppStorageGet', {keys: ['landing']})).keys[0].value === '';

        await this.updateUser();

        this.setState({
            history: [isNewUser ? 'landing_1' : 'main'],
            activePanel: isNewUser ? 'landing_1' : 'main'
        });

        setInterval(() => {
            try {
                const
                    scrollCallback = async entries => {
                        if (entries[0].isIntersecting && !this.state.questions_loading) {
                            // делаем запрос на сервер с offset, и если пришел массив 0, ставим this.setState({ questions_all: true });

                            await this.setState({questions_loading: true});
                            let {questions, answers} = this.state;
                            const response = (await this.call('questions.get', {
                                type: this.state.selectedQuestionsType,
                                offset: this.state.selectedQuestionsType === '0' ? questions.length : answers.length,
                                count: 10
                            })).response;

                            if (response.length > 0) {
                                if (this.state.selectedQuestionsType === '0')
                                    questions = questions.concat(response);
                                else
                                    answers = answers.concat(response);

                                setTimeout(() => this.setState({questions, answers, questions_loading: false}), 3000);
                            } else {
                                this.setState({questions_all: true});
                            }
                        }
                    },
                    scroll = new IntersectionObserver(scrollCallback, {
                        root: this.questionsRef,
                        rootMargin: '500px'
                    })
                ;
                scroll.observe(this.questionsBottomRef);
            } catch (e) {
            }
        }, 400);

        window.addEventListener('popstate', e => {
            e.preventDefault();
            this.back(e);
        });

        bridge.subscribe(async ({detail: {type, data}}) => {
            if (type !== undefined) console.log(type, data);
            if (type === 'VKWebAppUpdateConfig') {
                const schemeAttribute = document.createAttribute('scheme');
                scheme = data.scheme ? data.scheme === 'client_light' ? 'bright_light' : data.scheme : 'bright_light'
                schemeAttribute.value = scheme;
                document.body.attributes.setNamedItem(schemeAttribute);
                if (bridge.supports('VKWebAppSetViewSettings') && this.state.activePanel !== 'story-editor') {
                    bridge.send('VKWebAppSetViewSettings', {
                        status_bar_style: scheme === 'bright_light' ? 'dark' : 'light',
                        action_bar_color: scheme === 'bright_light' ? '#FFFFFF' : '#202125'
                    });
                }
            } else if (type === 'VKWebAppViewRestore') {
                this.setState({snackbar: null, popout: null});
            }
        });

        bridge.send('VKWebAppInit');

        if (this.state.friends.length === 0 && !isNewUser) await this.updateFriends();
        if (!this.isNotifyEnabled() && !isNewUser) this.go('landing_4');
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
            if (bridge.supports('VKWebAppSetViewSettings')) {
                bridge.send('VKWebAppSetViewSettings', {
                    status_bar_style: scheme === 'bright_light' ? 'dark' : 'light',
                    action_bar_color: scheme === 'bright_light' ? '#FFFFFF' : '#202125'
                });
            }
            if (history[history.length - 1] === 'main')
                this.updateUser();

            this.setState({activePanel: history[history.length - 1], history, snackbar: null});
        }
    };

    go(panel) {
        let {history} = this.state;
        if (history[history.length - 1] !== panel) {
            history.push(panel);
            window.history.pushState({activePanel: panel}, 'Title');

            if (panel === 'story-editor') {
                if (bridge.supports('VKWebAppSetViewSettings')) {
                    bridge.send('VKWebAppSetViewSettings', {
                        status_bar_style: 'light',
                        action_bar_color: '#000000'
                    });
                }
            }

            this.setState({activePanel: panel, history, snackbar: null});
        }
    }

    async call(method, params = {}) {
        console.log(method, params);
        params = Object.assign(params, this.vkParams());
        const
            query = '?' + Object.keys(params).map((value) =>
                encodeURIComponent(value) + '=' + encodeURIComponent(params[value])
            ).join('&'),
            url = `${localConfig.apps[localConfig.app_id_to_deploy].host}${method}${query}`,
            response = await new Promise((res, rej) => {
                fetch(url, {method: 'GET'})
                    .then(res => res.json())
                    .then(answer => res(answer))
                    .catch(err => res({error: {code: -1, text: err.toString()}}));
            });
        console.log(url, response);
        return response;
    }

    async updateUser() {
        let
            user = await Object.assign(await bridge.send('VKWebAppGetUserInfo'), (await this.call('users.get')).response),
            answers = (await this.call('questions.get', {type: 1})).response
        ;

        this.setState({
            user,
            answers
        });
    }

    async updateFriends() {
        try {
            let access_token = await bridge.send('VKWebAppGetAuthToken', {
                app_id: localConfig.app_id_to_deploy,
                scope: 'friends'
            });
            if (access_token.scope === 'friends') {
                this.setState({
                    friends: (await bridge.send('VKWebAppCallAPIMethod', {
                        method: 'friends.get',
                        params: {
                            fields: 'photo_100',
                            v: '5.124',
                            access_token: access_token.access_token
                        }
                    })).response.items
                });
            }
        } catch (e) {
            return this.updateFriends();
        }

        return true;
    }

    renderModal() {
        return <div className='modal'>
            <div className='indicator'/>
            <Div>
                <ColorButton
                    color='rgb(99,171,63)'
                    icon={<Icon28ShareOutline width={48} height={48}/>}
                    onClick={() => this.go('share_story')}
                >
                    Получить вопросы
                </ColorButton>
                <ColorButton
                    color='rgb(255,170,94)'
                    icon={<Icon28WriteOutline width={48} height={48}/>}
                    onClick={() => this.go('new_question')}
                >
                    Задать вопрос
                </ColorButton>
                <ColorButton
                    color='rgb(255,104,102)'
                    icon={<Icon28InboxOutline width={48} height={48}/>}
                    onClick={async () => {
                        await this.setState({popout: <ScreenSpinner/>});
                        const
                            questions = (await this.call('questions.get')).response,
                            answers = (await this.call('questions.get', {type: 1})).response
                        ;
                        await this.setState({questions, answers, popout: null, questions_loading: false});
                        this.go('questions');
                    }}
                >
                    Мои вопросы
                </ColorButton>
                <ColorButton
                    color='rgb(104,194,211)'
                    icon={<Icon28Users3Outline width={48} height={48}/>}
                    onClick={async () => {
                        await this.setState({popout: <ScreenSpinner/>});
                        const
                            sortedByQuestions = (await this.call('users.sortedByQuestions')).response,
                            sortedByAnswers = (await this.call('users.sortedByAnswers')).response
                        ;
                        console.log(sortedByAnswers, sortedByQuestions);
                        await this.setState({sortedByQuestions, sortedByAnswers, popout: null});
                        this.go('top');
                    }}
                >
                    Рейтинг
                </ColorButton>
            </Div>
        </div>
    }

    get searchFriend() {
        const search = this.state.searchFriend.toLowerCase();
        return this.state.friends.filter(({first_name, last_name}) => `${first_name} ${last_name}`.toLowerCase().indexOf(search) > -1);
    }

    shareSticker() {
        const
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d'),
            size = 471;

        this.setState({screen: true});
        loadImage(require('../assets/icons_ask_me/ask_me_background.jpg')).then(async (image) => {
            ctx.drawImage(image, 0, 0);
            loadImage(await toBlob(this.state.user.photo_max_orig)).then(async photo => {
                ctx.save();
                ctx.beginPath();
                ctx.arc(305 + size / 2, 621 + size / 2, size / 2, 0, 2 * Math.PI, true);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(photo, 305, 621, size, size);
                ctx.restore();
                const blob = canvas.toDataURL('image/png');
                try {
                    await bridge.send('VKWebAppShowStoryBox', {
                        background_type: 'image',
                        blob,
                        attachment: {
                            text: 'go_to',
                            type: 'url',
                            url: `https://vk.com/app${localConfig.app_id_to_deploy}`
                        }
                    });

                    await this.call('users.getQuestionStory');
                } catch (e) {
                }
                this.setState({screen: false});
            });
        });
    }

    shareQuestion(question) {
        this.setState({screen: true});
        const
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d');

        let messages = document.createElement('div'),
            msg1 = document.createElement('div'),
            msg2Container = document.createElement('div'),
            msg2 = document.createElement('div');

        messages.classList.add('QuestionShareContainer');

        let text1 = document.createElement('span');
        text1.innerText = question.text;

        let text2 = document.createElement('span');
        text2.innerText = question.answer;

        msg1.appendChild(text1);
        msg2.appendChild(text2);
        msg2Container.appendChild(msg2);

        messages.appendChild(msg1);
        messages.appendChild(msg2Container);
        document.getElementById('root').appendChild(messages);

        loadImage(require('../assets/icons_ask_me/question_story_background.jpg')).then(async (image) => {
            ctx.drawImage(image, 0, 0);
            setTimeout(() => {
                html2canvas(messages, {allowTaint: true}).then(async canv => {
                    ctx.drawImage(canv, 80, 222, messages.clientWidth, messages.clientHeight);
                    const blob = canvas.toDataURL('image/png');
                    messages.remove();
                    try {
                        await bridge.send('VKWebAppShowStoryBox', {
                            background_type: 'image',
                            blob,
                            attachment: {
                                text: 'go_to',
                                type: 'url',
                                url: `https://vk.com/app${localConfig.app_id_to_deploy}`
                            }
                        });

                        await this.call('questions.share');
                    } catch (e) {
                    }
                    this.setState({screen: false});
                });
            }, 2000);
        });
    }

    render() {
        const modal = (
            <ModalRoot
                activeModal={this.state.activeModal}
                onClose={this.modalBack}
            >
                <ModalCard
                    id={MODAL_CARD_NEW_QUESTION}
                    onClose={() => this.setActiveModal(null)}
                    icon={<Avatar size={72} src={this.state.selectedFriend.photo_100}/>}
                    header={`${this.state.selectedFriend.first_name} ${this.state.selectedFriend.last_name}`}
                    actions={
                        <Button stretched size='l' mode='primary' onClick={async () => {
                            const
                                text = this.inputQuestion.value,
                                anonymous = this.isAnon.checked,
                                toId = this.state.selectedFriend.id
                            ;

                            const question = await this.call('questions.create', {text, anonymous, toId});

                            if (question.response) {
                                let {answers} = this.state;
                                answers.push(question);
                                this.setState({answers});
                                if(!question.user_exist){
                                    this.setActiveModal(MODAL_CARD_USER_DOESNT_EXIST)
                                }
                            }

                            this.back();
                        }}>
                            Задать вопрос
                        </Button>
                    }
                >
                    <Input getRef={ref => this.inputQuestion = ref} placeholder='Введите вопрос'/>
                    <Checkbox style={{marginTop: 8}} getRef={ref => this.isAnon = ref}>Анонимно</Checkbox>
                </ModalCard>
                <ModalCard
                    id={MODAL_CARD_USER_DOESNT_EXIST}
                    onClose={() => this.setActiveModal(null)}
                    icon={<Avatar size={72} src={this.state.selectedFriend.photo_100}/>}
                    header={`${this.state.selectedFriend.first_name} ${this.state.selectedFriend.last_name}`}
                    subheader='К сожалению, пользователя еще нет в приложении, разместите историю, чтобы Вы могли задавать анонимные вопросы своим друзьям, а они Вам.'
                    actions={
                        <Button stretched size='l' mode='primary' onClick={async () => {
                            this.shareSticker();
                        }}>
                            Создать историю
                        </Button>
                    }
                />
                <ModalCard
                    id={MODAL_CARD_ANSWER_QUESTION}
                    onClose={() => this.setActiveModal(null)}
                    icon={<Avatar size={72}
                                  src={this.state.question_.anonymous ? `${window.location.origin}/${require('../assets/icons_ask_me/Anon.png')}` : this.state.question_.photos[0]}/>}
                    header={this.state.question_.text}
                    actions={
                        <Button stretched size='l' mode='primary' onClick={async () => {
                            const
                                {id} = this.state.question_,
                                text = this.inputAnswer.value
                            ;

                            await this.setState({popout: <ScreenSpinner/>});
                            const response = (await this.call('questions.answer', {id, text})).response;
                            await this.setState({popout: null});

                            if (response) {
                                let {questions} = this.state;
                                questions[this.state.question_.id_].answer = text;
                                await this.setState({questions, activeModal: null, modalHistory: []});

                                setTimeout(() =>
                                    true ?
                                        document.getElementById('share-' + this.state.question_.id).click() :
                                        this.setActiveModal(MODAL_CARD_SHARE_ANSWER), 400);
                            }
                        }}>
                            Ответить
                        </Button>
                    }
                >
                    <Input getRef={ref => this.inputAnswer = ref} placeholder='Введите ответ'/>
                </ModalCard>
                <ModalCard
                    id={MODAL_CARD_SHARE_ANSWER}
                    onClose={() => this.setActiveModal(null)}
                    icon={<Icon28ShareOutline width={56} height={56}/>}
                    header='Не хотите поделиться ответом?'
                    actions={[
                        <Button size='l' mode='secondary' onClick={() => this.back()}>
                            Не хочу
                        </Button>,
                        <Button size='l' mode='primary' onClick={() => {
                            this.back();
                            document.getElementById('share-' + this.state.question_.id).click();
                        }}>
                            Поделиться
                        </Button>,
                    ]}
                />
            </ModalRoot>
        );

        return !this.state.user ? <div/> : (
            <View activePanel={this.state.activePanel} modal={modal}
                  popout={this.state.screen ? <ScreenSpinner/> : this.state.popout}>
                <Panel id='landing_1'>
                    <Placeholder
                        icon={<Landing1/>}
                        stretched
                    >
                        <Title weight='semibold' level={2}>Добро пожаловать</Title>
                        <Text style={{
                            marginTop: 15
                        }} weight='regular'>Спрашивайте и отвечайте. Здесь Вы можете делать это свободно.</Text>
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
                        <Title weight='semibold' level={2}>Кто твои друзья?</Title>
                        <Text style={{
                            marginTop: 15
                        }} weight='regular'>Нам нужен доступ к списку ваших друзей, чтобы Вы могли задавать им
                            вопросы.</Text>
                        <Button
                            stretched
                            onClick={async () => {
                                await this.updateFriends();

                                this.go('landing_3');
                            }}
                            mode='secondary'
                            size='l'
                            style={{
                                marginTop: 64
                            }}>
                            Хорошо
                        </Button>
                    </Placeholder>
                </Panel>
                <Panel id='landing_3'>
                    <Placeholder
                        icon={<Landing3/>}
                        stretched
                    >
                        <Title weight='semibold' level={2}>Сообщения</Title>
                        <Text style={{
                            marginTop: 15
                        }} weight='regular'>Разрешите нам отправлять вам сообщения, чтобы мы могли уведомлять Вас о
                            новых вопросах.</Text>
                        <Button
                            stretched
                            onClick={async () => {
                                try {
                                    await bridge.send('VKWebAppAllowMessagesFromGroup', {
                                        group_id: localConfig.apps[localConfig.app_id_to_deploy].group_id,
                                        key: 'FSDIfulnwje'
                                    });
                                } catch (e) {
                                }

                                this.go('landing_4');
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
                <Panel id='landing_4'>
                    <Placeholder
                        icon={<Landing4/>}
                        stretched
                    >
                        <Title weight='semibold' level={2}>Уведомления</Title>
                        <Text style={{
                            marginTop: 15
                        }} weight='regular'>Разрешите нам отправлять вам уведомления, чтобы мы могли уведомлять Вас о
                            новых ответах.</Text>
                        <Button
                            stretched
                            onClick={async () => {
                                try {
                                    await bridge.sendPromise('VKWebAppAllowNotifications');
                                } catch (e) {
                                }

                                if (isNewUser)
                                    await bridge.send('VKWebAppStorageSet', {key: 'landing', value: '1'});

                                this.go('main');
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
                    <div className='profile centered'>
                        <Avatar size={70} src={this.state.user.photo_100}/>
                        <Title weight='semibold'
                               lvl={3}>{this.state.user.first_name} {this.state.user.last_name}</Title>
                    </div>
                    <Group style={{
                        marginTop: 36
                    }}>
                        <MiniInfoCell
                            before={<Icon28UserOutgoingOutline width={20} height={20}/>}
                            textWrap='full'
                        >
                            Задал {decOfNum(this.state.user.questions, ['вопрос', 'вопроса', 'вопросов'])}
                        </MiniInfoCell>
                        <MiniInfoCell
                            before={<Icon28UserIncomingOutline width={20} height={20}/>}
                            textWrap='full'
                        >
                            Ответил на {decOfNum(this.state.user.answers, ['вопрос', 'вопроса', 'вопросов'])}
                        </MiniInfoCell>
                    </Group>
                    {
                        this.state.friends.length > 0 &&
                        <Group header={<Header mode='secondary'>Мои друзья</Header>}>
                            <UsersStack
                                photos={this.state.friends.map(value => value.photo_100).slice(0, 3)}
                                size='m'
                                count={3}
                                layout='vertical'
                            >{this.state.friends.map(value => value.first_name).slice(0, 3).join(', ')} {this.state.friends.length > 3 && `и ещё ${decOfNum(this.state.friends.length - 3, ['человек', 'человека', 'человек'])}`}</UsersStack>
                        </Group>
                    }
                    <div className='gradient'/>
                    {this.renderModal()}
                </Panel>
                <Panel id='share_story'>
                    <PanelHeader separator={false} left={<PanelHeaderBack onClick={() => this.back()}/>}/>
                    <Placeholder
                        icon={<PlaceholderShareStory/>}
                        stretched
                    >
                        <Title weight='semibold' level={2}>Нужны вопросы?</Title>
                        <Text style={{
                            marginTop: 15
                        }} weight='regular'>Вы можете попросить своих друзей задать Вам вопросы.</Text>
                        <Button
                            stretched
                            onClick={async () => {
                                let img = document.createElement('img');
                                img.style.width = '100%';
                                img.alt = 'sticker';
                                img.src = await toBlob(`${window.location.origin}/${require('../assets/icons_ask_me/Sticker.png')}`);
                                this.setState({is_question: false});
                                this.shareSticker();
                            }}
                            mode='secondary'
                            size='l'
                            style={{
                                marginTop: 64
                            }}>
                            Создать историю
                        </Button>
                        <Button
                            stretched
                            onClick={async () => {
                                try {
                                    await bridge.send('VKWebAppShowWallPostBox', {
                                        message: 'Ссылка в иcточнике 👇🏻',
                                        copyright: 'https://vk.com/app' + localConfig.app_id_to_deploy,
                                        attachments: 'photo-187579482_457239054'
                                    });
                                    await this.call('users.getQuestionWall');
                                } catch (e) {
                                }
                            }}
                            mode='tertiary'
                            size='l'
                            style={{
                                marginTop: 12
                            }}>
                            Опубликовать запись
                        </Button>
                    </Placeholder>
                </Panel>
                <Panel id='new_question'>
                    <PanelHeader separator={false} left={<PanelHeaderBack onClick={() => this.back()}/>}>
                        Новый вопрос
                    </PanelHeader>
                    <Search value={this.state.searchFriend}
                            onChange={e => this.setState({searchFriend: e.target.value})} after={null}/>
                    <Separator/>
                    <Group header={this.searchFriend.length > 0 && <Header mode='primary'>Выберите друга</Header>}>
                        {
                            this.searchFriend.length > 0 &&
                            this.searchFriend.map(friend =>
                                <SimpleCell
                                    before={<Avatar size={48} src={friend.photo_100}/>}
                                    key={friend.id}
                                    onClick={() => {
                                        this.setState({selectedFriend: friend});
                                        this.setActiveModal(MODAL_CARD_NEW_QUESTION);
                                    }}
                                >
                                    {friend.first_name} {friend.last_name}
                                </SimpleCell>)}
                        {this.searchFriend.length === 0 && <Footer>Ничего не найдено</Footer>}
                    </Group>
                </Panel>
                <Panel id='questions'>
                    <PanelHeader separator={false} left={<PanelHeaderBack onClick={() => this.back()}/>}>
                        Мои вопросы
                    </PanelHeader>
                    <FixedLayout vertical='top' filled={true}>
                        <FormItem>
                            <SliderSwitch
                                activeValue={this.state.selectedQuestionsType}
                                onSwitch={value => this.setState({selectedQuestionsType: value})}
                                options={[
                                    {
                                        name: 'Входящие',
                                        value: '0',
                                    },
                                    {
                                        name: 'Исходящие',
                                        value: '1',
                                    },
                                ]}
                            />
                        </FormItem>
                        <Separator/>
                    </FixedLayout>
                    <Div ref={ref => this.questionsRef = ref} style={{paddingTop: 68}}>
                        {
                            (this.state.selectedQuestionsType === '0' ?
                                    this.state.questions
                                    :
                                    this.state.answers
                            ).length === 0 ?
                                <Placeholder
                                    icon={<Icon56RecentOutline/>}
                                >
                                    <Text style={{
                                        marginTop: 15
                                    }} weight='regular'>Тут пока что пусто</Text>
                                </Placeholder>
                                :
                                (this.state.selectedQuestionsType === '0' ?
                                        this.state.questions
                                        :
                                        this.state.answers
                                ).map((question, i) =>
                                    question.photos && <Card size='l' mode='shadow'
                                                             style={{marginTop: 16}}
                                                             id={'question-' + question.id}>
                                        <div className={'question'}
                                             style={{padding: `12px 16px ${question.answer && !this.state.screen ? '40px' : ''}`}}>
                                            <Link target='_blank'
                                                  href={(this.state.selectedQuestionsType === '0' ? !question.anonymous : true) && ('https://vk.com/id' + (this.state.selectedQuestionsType === '0' ? question.fromId : question.toId))}>
                                                <Avatar crossOrigin='anonymous' size={28}
                                                        src={this.state.selectedQuestionsType === '0' && question.anonymous ? `${window.location.origin}/${require('../assets/icons_ask_me/Anon.png')}` : question.photos[parseInt(this.state.selectedQuestionsType)]}/>
                                                <div className='title'>
                                                    {this.state.selectedQuestionsType === '0' && question.anonymous ? 'Аноним' : question.names[this.state.selectedQuestionsType]}
                                                </div>
                                            </Link>
                                            <div className='flex' style={{position: 'relative'}}>
                                                {
                                                    question.answer &&
                                                    <span className='indicator'/>
                                                }
                                                <div className='qa' style={{
                                                    marginLeft: question.answer && 10,
                                                    fontWeight: question.answer && 500
                                                }}>
                                                    <span>{question.text}</span>
                                                    {question.answer &&
                                                    <div style={{marginTop: 8, fontWeight: 400}}>{question.answer}</div>}
                                                </div>
                                            </div>
                                            {
                                                question.answer ?
                                                    !this.state.screen && this.state.selectedQuestionsType === '0' ?
                                                        <div id={'share-' + question.id} className='share'
                                                             onClick={() => this.shareQuestion(question)}>
                                                            <Icon28ShareOutline/>
                                                        </div>
                                                        : null
                                                    :
                                                    <Button disabled={this.state.selectedQuestionsType === '1'}
                                                            onClick={() => {
                                                                this.setState({question_: {...question, id_: i}});
                                                                this.setActiveModal(MODAL_CARD_ANSWER_QUESTION);
                                                            }}
                                                            style={{marginTop: 8}}>{this.state.selectedQuestionsType === '0' ? 'Ответить' : 'Нет ответа'}</Button>
                                            }
                                        </div>
                                    </Card>)
                        }
                        {
                            (this.state.selectedQuestionsType === '0' ?
                                    this.state.questions
                                    :
                                    this.state.answers
                            ).length > 0 &&
                            <Footer>{this.state.questions_all ? 'Вы добрались до конца.' : 'Загрузка...'}</Footer>
                        }
                        <div ref={ref => this.questionsBottomRef = ref}/>
                    </Div>
                </Panel>
                <Panel id='story-editor'>
                    <PanelHeader separator={false} left={<PanelHeaderBack onClick={() => this.back()}/>}>
                        Редактор
                    </PanelHeader>
                    <div id='story-content'
                         style={{
                             backgroundImage: `url(${this.state.story_background})`,
                             height: `calc(100vh - var(--safe-area-inset-top) - var(--panelheader_height_${IS_PLATFORM_IOS ? 'ios' : 'android'}))`
                         }}>
                        {!this.state.screen && <div className='story-shadow top'/>}
                        {!this.state.screen &&
                        <div className='story-shadow bottom' style={{transform: 'rotate(180deg)'}}/>}
                        <div id='sticker'>
                            <div>
                                <div>
                                    <html dangerouslySetInnerHTML={{__html: this.state.story_sticker}}/>
                                    {
                                        this.state.screen && this.state.is_question &&
                                        <Button stretched size='l'
                                                style={{marginTop: 12}} mode='secondary'>Задать
                                            вопрос</Button>
                                    }
                                </div>
                            </div>
                        </div>
                        {
                            !this.state.screen &&
                            <div className='story-buttons'>
                                <div className='background' onClick={() => {
                                    const i = getRandomInt(0, 11);
                                    this.setState({story_background: require(`../assets/icons_ask_me`)})
                                }}>
                                    <div/>
                                </div>
                                <Button mode='overlay_primary' onClick={async () => {
                                    await this.setState({screen: true});
                                    const imgs = document.getElementsByTagName('img');
                                    for (let img of imgs) {
                                        img.src = await toBlob(img.src);
                                    }

                                    let element = document.getElementById('story-content');
                                    html2canvas(element, {allowTaint: true}).then(async canvas => {
                                        const blob = canvas.toDataURL('image/png');

                                        this.setState({screen: false});
                                        try {
                                            await bridge.send('VKWebAppShowStoryBox', {
                                                background_type: 'image',
                                                blob,
                                                attachment: {
                                                    text: 'go_to',
                                                    type: 'url',
                                                    url: `https://vk.com/app${localConfig.app_id_to_deploy}`
                                                }
                                            });

                                            if (this.state.is_question)
                                                await this.call('questions.share');
                                            else
                                                await this.call('users.getQuestionStory');

                                        } catch (e) {
                                        }
                                    });
                                }}>Поделиться</Button>
                            </div>
                        }
                    </div>
                </Panel>
                <Panel id='top'>
                    <PanelHeader separator={false} left={<PanelHeaderBack onClick={() => this.back()}/>}>
                        Рейтинг
                    </PanelHeader>
                    <FixedLayout vertical='top' filled={true}>
                        <FormItem>
                            <SliderSwitch
                                activeValue={this.state.selectedSortType}
                                onSwitch={value => this.setState({selectedSortType: value})}
                                options={[
                                    {
                                        name: 'Вопросы',
                                        value: 0,
                                    },
                                    {
                                        name: 'Ответы',
                                        value: 1,
                                    },
                                ]}
                            />
                        </FormItem>
                    </FixedLayout>
                    <Div style={{paddingTop: 76}}>
                        {
                            (this.state.selectedSortType === 0 ?
                                    this.state.sortedByQuestions
                                    :
                                    this.state.sortedByAnswers
                            ).length === 0 ?
                                <Placeholder
                                    icon={<Icon56RecentOutline/>}
                                >
                                    <Text style={{
                                        marginTop: 15
                                    }} weight='regular'>Тут пока что пусто</Text>
                                </Placeholder>
                                :
                                (this.state.selectedSortType === 0 ?
                                        this.state.sortedByQuestions
                                        :
                                        this.state.sortedByAnswers
                                ).map((user, i) =>
                                    <Tappable key={'user_' + i}>
                                        <div style={{display: 'flex', fontFamily: 'SF Pro Text'}}>
                                            <span style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                width: '45px',
                                                fontSize: '13px',
                                                lineHeight: '16px',
                                                color: 'var(--text_primary)',
                                                paddingLeft: '2px'
                                            }}>
                                                {i + 1}
                                            </span>
                                            <SimpleCell
                                                href={'https://vk.com/id' + user.user_id}
                                                target='_blank'
                                                style={{width: '100%'}}
                                                before={<Avatar src={user.photo_100}/>}
                                                description={
                                                    <span style={{
                                                        fontSize: '13px',
                                                        lineHeight: '16px',
                                                        color: 'var(--attach_picker_tab_inactive_text)',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}>
                                                        {
                                                            (this.state.selectedSortType === 0 ?
                                                                    user.questions
                                                                    :
                                                                    user.answers
                                                            )
                                                        }
                                                    </span>
                                                }
                                            >
                                            <span style={{
                                                fontSize: '16px',
                                                lineHeight: '20px',
                                                color: 'var(--text_primary)',
                                                display: 'flex'
                                            }}>
                                                {user.name}
                                            </span>
                                            </SimpleCell>
                                        </div>
                                    </Tappable>)
                        }
                    </Div>
                </Panel>
            </View>
        );
    }
}

export default AskMe;