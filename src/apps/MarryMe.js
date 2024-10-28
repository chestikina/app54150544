import React from 'react';
import {
    Panel,
    View,
    Button,
    ModalRoot,
    ModalCard,
    FormItem,
    FormLayout,
    Input,
    Spacing,
    DateInput,
    List,
    SimpleCell,
    Avatar,
    ScreenSpinner
} from '@vkontakte/vkui';
import '../css/PhotoToAnimeAI.css';
import '../css/MarryMe.css';
import bridge from "@vkontakte/vk-bridge";
import {defaultViewProps, initializeNavigation} from "../js/defaults/navigation";
import {getToken, shareAlbumPhoto, subscribeBridgeEvents} from "../js/defaults/bridge_utils";
import {
    allowGroupMessages,
    buttonSexAndYears,
    getAppInfo,
    inputSex,
    inputYears,
    proxyUrl,
    subscribeGroup, subscribeSkipedGroup
} from "../js/defaults/catalin_tg_bot";
import {ReactComponent as IconModalAccess} from "../assets/photo_to_anime_ai/modal_access_icon.svg";
import {
    Icon28AddOutline, Icon28AddSquareOutline,
    Icon28MessageAddBadgeOutline,
    Icon28PictureOutline,
    Icon28UsersOutline
} from "@vkontakte/icons";
import {
    convertMsToNormalTime,
    ctxDrawImageWithRound,
    decOfNum,
    getUrlParams, isPlatformDesktop, loadCrossOriginImage,
    loadFonts, openUrl,
    shortIntegers,
    sleep, toBlob
} from "../js/utils";
import {createCanvas, loadImage} from "canvas";

const
    MODAL_CARD_ACCESS = 'access'
;

class Modal extends React.PureComponent {

    constructor(props) {
        super(props);
    }

    render() {
        const {t, activeModal} = this.props;
        return (
            <ModalRoot activeModal={activeModal}>
                <ModalCard
                    id={MODAL_CARD_ACCESS}
                    onClose={() => t.setActiveModal(null)}
                    icon={<IconModalAccess/>}
                    header='Разрешите доступ к данным'
                    subheader='Мы не будем ничего делать без вашего разрешения'
                    actions={
                        <Button
                            size='l'
                            stretched
                            onClick={async () => {
                                try {
                                    const access_token = await getToken('photos');
                                    this.props.t.setState({access_token});
                                    this.props.t.forceUpdate();
                                } catch (e) {
                                }
                                t.setActiveModal(null);
                            }}
                        >
                            Разрешить
                        </Button>
                    }
                >
                </ModalCard>
            </ModalRoot>
        );
    }

}

class Onboard extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            activeStep: 0,
            steps: 2
        }
    }

    get onboard_data() {
        const {t} = this.props;
        return [
            {
                icon: 'https://em-content.zobj.net/thumbs/160/apple/354/ring_1f48d.png',
                title: 'Бракосочетание',
                text: 'Мы поможем заключить тебе брак с любимым',
                button: 'Продолжить',
                buttonOnClick: () => this.props.t.setActiveModal(MODAL_CARD_ACCESS)
            },
            {
                title: 'Ещё кое-что',
                text: 'Введите ваш возраст и пол, чтобы продолжить',
                body: <div className='Onboard-Body'>
                    <div>
                        <span>Пол</span>
                        {inputSex.bind(t)()}
                    </div>
                    <div>
                        <span>Возраст</span>
                        {inputYears.bind(t)()}
                    </div>
                </div>,
                button: 'Перейти к анкете',
                buttonOnClick: buttonSexAndYears.bind(t)
            }
        ][this.state.activeStep]
    }

    render() {
        const {activeStep, steps} = this.state;
        const {onEnd, t} = this.props;
        const {icon, title, text, button, buttonOnClick, body} = this.onboard_data;
        return (
            <div className='Onboard'>
                <div className='Onboard-Content'>
                    {icon && <img alt='icon' src={icon} width={44} height={44}/>}
                    <h1>{title}</h1>
                    <p>{text}</p>
                    <div className='Pagination'>
                        {new Array(steps).fill(0).map((value, index) =>
                            <div
                                key={`Pagination_${index}`} className='Pagination-Circle'
                                style={{
                                    opacity: activeStep === index ? 1 : .3
                                }}
                            />
                        )}
                    </div>
                </div>
                {body}
                <div style={{display: 'flex', width: '100%'}}>
                    <Button
                        size='l'
                        stretched
                        style={{
                            transition: 'all 300ms ease-in-out',
                            marginTop: body ? 32 : 53
                        }}
                        onClick={async () => {
                            if (buttonOnClick && typeof buttonOnClick === 'function')
                                await buttonOnClick()

                            const {sex, years} = t.state;
                            if (activeStep < steps - 1 && (sex === 0 || years === 0)) {
                                this.setState({activeStep: activeStep + 1});
                            } else {
                                onEnd();
                            }
                        }}
                    >
                        {button}
                    </Button>
                </div>
            </div>
        )
    }

}

let interval;

export default class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            step_data: []
        };

        initializeNavigation.bind(this)('onboard');
        this.componentDidMount = this.componentDidMount.bind(this);
        this.onChangeInputData = this.onChangeInputData.bind(this);
        this.createDocument = this.createDocument.bind(this);
    }

    async componentDidMount() {
        await this.setState(await getAppInfo(true));
        subscribeBridgeEvents({
            VKWebAppUpdateConfig: () => {
                if (bridge.supports('VKWebAppSetViewSettings')) {
                    bridge.send('VKWebAppSetViewSettings', {
                        status_bar_style: 'dark',
                        action_bar_color: '#272727'
                    });
                }
            }
        }, 'space_gray');
        bridge.send('VKWebAppInit');
        await loadFonts(['SF Pro Text Medium']);
    }

    componentWillUnmount() {
        clearInterval(interval);
    }

    get steps() {
        return [
            [
                'https://em-content.zobj.net/thumbs/160/apple/354/woman-with-veil-light-skin-tone_1f470-1f3fb-200d-2640-fe0f.png',
                'Данные жены',
                'data_wife'
            ],
            [
                'https://em-content.zobj.net/thumbs/160/apple/354/person-in-tuxedo_light-skin-tone_1f935-1f3fb_1f3fb.png',
                'Данные мужа',
                'data_husband'
            ],
            [
                'https://em-content.zobj.net/thumbs/160/apple/354/red-heart_2764-fe0f.png',
                'Общие данные',
                'data_general'
            ],
        ];
    }

    onChangeInputData(value, obj, key) {
        if (!obj || !key) {
            const el = value.currentTarget;
            obj = el.dataset.obj;
            key = el.dataset.key;
            value = el.value;
        }
        const obj_ = this.state[obj] || {};
        obj_[key] = value;
        this.setState({[obj]: obj_});
    }

    async createDocument() {
        /*let time = 2 * 60 * 1000;
        this.setState({time});
        interval = setInterval(() => {
            time -= 1000;
            this.setState({time});
            if (time <= 0) {
                clearInterval(interval);
            }
        }, 1000);
        this.go('subscribe');*/
        //setTimeout(async () => {
        const empty_doc = await loadImage(require('../assets/marry_me/empty_doc.png'));
        const canvas = createCanvas(empty_doc.width, empty_doc.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(empty_doc, 0, 0);

        ctx.font = '17px SF Pro Text Medium';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000000';
        const {state} = this;
        let firstY = 268 + 17;
        const keys1 = ['data_husband', 'data_wife', 'data_general'];
        for (let i = 0; i < keys1.length; i++) {
            const keys2 = i === 2 ?
                ['last_name_husband', 'last_name_wife', 'regplace', 'regdate'] :
                ['last_name', 'first_name', 'middle_name', 'citizenship', 'birthday', 'birthplace']
            ;
            for (let j = 0; j < keys2.length; j++) {
                const key = keys2[j];
                let value = state[keys1[i]][key];
                if (key === 'birthday' || key === 'regdate') value = new Date(value).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });

                if (i + j > 0) {
                    firstY += 22 + 16;
                    if (i === 1 && j === 0) {
                        firstY += 102 - 16;
                    }
                    if (i === 2 && j === 0) {
                        firstY += 216 - 16;
                    }
                    if (i === 2 && j === 2) {
                        firstY += 53 - 16;
                    }
                    if (i === 2 && j === 3) {
                        firstY += 29 - 16;
                    }
                }

                ctx.fillText(value, key === 'birthday' || key.startsWith('reg') ? 500 : 318, firstY);
            }
        }
        const doc = canvas.toDataURL('image/png');
        const doc_blob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob)));
        const doc_img = await loadImage(doc);

        const nbackground = await loadImage(require('../assets/marry_me/story.png'));
        const ncanvas = createCanvas(nbackground.width, nbackground.height);
        const nctx = ncanvas.getContext('2d');
        nctx.drawImage(nbackground, 0, 0);
        ctxDrawImageWithRound(nctx, doc_img, 69, null, {
            x: 142.96,
            y: 366.04,
            width: 795.07,
            height: 1140.24
        });
        const story = ncanvas.toDataURL('image/png');
        await this.setState({doc, doc_blob, story});

        setTimeout(async () => {
            if (this.state.access_token) {
                const {savePhotoAlbum, need_upload_default_album_photo, album_default_photo_url} = this.state;
                const {album_name, album_caption} = this.state.app;
                if (savePhotoAlbum) {
                    let blob = await new Promise(resolve => ncanvas.toBlob(blob => resolve(blob)));
                    if (need_upload_default_album_photo) {
                        const image = await loadCrossOriginImage(album_default_photo_url);
                        const
                            {createCanvas} = require('canvas'),
                            canvas = createCanvas(image.width, image.height),
                            ctx = canvas.getContext('2d')
                        ;
                        ctx.drawImage(image, 0, 0);
                        blob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob)));
                    }
                    shareAlbumPhoto(blob, album_name, album_caption, this.state.access_token);
                }
            }
        });
        //});
    }

    render() {
        const {activeModal, step_data, time, doc, doc_blob, story, snackbar} = this.state;
        const input_data = this.state[step_data[2]];
        const timeNormal = convertMsToNormalTime(time).str;
        return (
            <View
                {...defaultViewProps.bind(this)()}
                modal={<Modal t={this} activeModal={activeModal}/>}
            >
                <Panel id='onboard'>
                    <Onboard onEnd={() => {
                        this.go('main1');
                    }} t={this}/>
                    <img alt='bg' className='Background' src={require('../assets/marry_me/bg.png')}/>
                </Panel>
                <Panel id='main1'>
                    <div className='Steps'>
                        {this.steps.map((value, index) =>
                            <div key={`div-${index}`}>
                                <h1>Шаг {index + 1}</h1>
                                <div>
                                    <div>
                                        <img alt='img' src={value[0]} width={28} height={28}/>
                                        <div>
                                            <h3>{value[1]}</h3>
                                            <span>{this.state[value[2]] ? 'Заполнено' : 'Не заполнено'}</span>
                                        </div>
                                    </div>
                                    <Button onClick={async () => {
                                        if (!this.state[value[2]]) {
                                            await subscribeGroup.bind(this)();
                                        }
                                        this.setState({step_data: value});
                                        this.go('input_data');
                                    }}>
                                        {this.state[value[2]] ? 'Изменить' : 'Заполнить'}
                                    </Button>
                                </div>
                            </div>
                        )}
                        <div>
                            <h1>Шаг {this.steps.length + 1}</h1>
                            <Button
                                size='l'
                                disabled={this.steps.filter(value => this.state[value[2]]).length < this.steps.length}
                                onClick={async () => {
                                    this.setPopout(<ScreenSpinner/>);
                                    await this.createDocument();
                                    this.setPopout(null);
                                    await subscribeSkipedGroup.bind(this)();
                                    this.go('result1');
                                }}
                            >
                                Создать анкету
                            </Button>
                        </div>
                    </div>
                    <img alt='bg' className='Background' src={require('../assets/marry_me/bg.png')}/>
                </Panel>
                <Panel id='input_data'>
                    <FormLayout>
                        <div className='EmojiTitle'>
                            <img
                                alt='img'
                                src={step_data[0]}
                            />
                            <h1>{step_data[1]}</h1>
                        </div>
                        <Spacing size={24}/>
                        {
                            step_data[2] !== 'data_general' ?
                                <React.Fragment>
                                    <FormItem top='Фамилия'>
                                        <Input
                                            value={input_data && input_data.last_name}
                                            data-obj={step_data[2]}
                                            data-key='last_name'
                                            onChange={this.onChangeInputData}
                                        />
                                    </FormItem>
                                    <FormItem top='Имя'>
                                        <Input
                                            value={input_data && input_data.first_name}
                                            data-obj={step_data[2]}
                                            data-key='first_name'
                                            onChange={this.onChangeInputData}
                                        />
                                    </FormItem>
                                    <FormItem top='Отчество'>
                                        <Input
                                            value={input_data && input_data.middle_name}
                                            data-obj={step_data[2]}
                                            data-key='middle_name'
                                            onChange={this.onChangeInputData}
                                        />
                                    </FormItem>
                                    <FormItem top='Гражданство'>
                                        <Input
                                            value={input_data && input_data.citizenship}
                                            data-obj={step_data[2]}
                                            data-key='citizenship'
                                            onChange={this.onChangeInputData}
                                        />
                                    </FormItem>
                                    <FormItem top='Дата рождения'>
                                        <DateInput
                                            value={input_data && input_data.birthday}
                                            onChange={value => this.onChangeInputData(value, step_data[2], 'birthday')}
                                        />
                                    </FormItem>
                                    <FormItem top='Место рождения'>
                                        <Input
                                            value={input_data && input_data.birthplace}
                                            data-obj={step_data[2]}
                                            data-key='birthplace'
                                            onChange={this.onChangeInputData}
                                        />
                                    </FormItem>
                                </React.Fragment>
                                :
                                <React.Fragment>
                                    <FormItem top='Новая фамилия мужа'>
                                        <Input
                                            value={input_data && input_data.last_name_husband}
                                            data-obj={step_data[2]}
                                            data-key='last_name_husband'
                                            onChange={this.onChangeInputData}
                                        />
                                    </FormItem>
                                    <FormItem top='Новая фамилия жены'>
                                        <Input
                                            value={input_data && input_data.last_name_wife}
                                            data-obj={step_data[2]}
                                            data-key='last_name_wife'
                                            onChange={this.onChangeInputData}
                                        />
                                    </FormItem>
                                    <FormItem top='Место регистрации брака'>
                                        <Input
                                            value={input_data && input_data.regplace}
                                            data-obj={step_data[2]}
                                            data-key='regplace'
                                            onChange={this.onChangeInputData}
                                        />
                                    </FormItem>
                                    <FormItem top='Дата регистрации брака'>
                                        <DateInput
                                            value={input_data && input_data.regdate}
                                            onChange={value => this.onChangeInputData(value, step_data[2], 'regdate')}
                                        />
                                    </FormItem>
                                </React.Fragment>
                        }
                        <FormItem>
                            <Button size='l' stretched onClick={async () => {
                                if (!this.state[step_data[2]]) {
                                    await allowGroupMessages.bind(this)();
                                }
                                this.back();
                            }}>
                                Сохранить
                            </Button>
                        </FormItem>
                    </FormLayout>
                    <img alt='bg' className='Background' src={require('../assets/marry_me/bg.png')}/>
                </Panel>
                <Panel id='subscribe'>
                    <div className='EmojiTitle'>
                        <img
                            alt='img'
                            src={'https://em-content.zobj.net/thumbs/160/apple/354/love-letter_1f48c.png'}
                        />
                        <h1>Документ почти готов</h1>
                    </div>
                    <p>
                        <br/>
                        Время создания документа: <span
                        style={{color: '#FFFFFF'}}>{timeNormal.minutes}:{timeNormal.seconds}</span>
                        <br/> <br/>
                        Чтобы пропустить очередь и получить результат сразу, подпишитесь на сообщества
                    </p>
                    <List>
                        {
                            [
                                ['groupsJoinUser', <Icon28AddSquareOutline fill='#FFFFFF'/>, 'VKWebAppJoinGroup'],
                                ['groupsMessageUser',
                                    <Icon28MessageAddBadgeOutline fill='#FFFFFF'/>, 'VKWebAppAllowMessagesFromGroup']
                            ].map((v, i) =>
                                    this.state[v[0]] && this.state[v[0]].map((value, index) =>
                                        <SimpleCell
                                            key={`Cell-${i}-${index}`}
                                            before={<Avatar size={48} src={value.photo_50}/>}
                                            after={v[1]}
                                            onClick={async () => {
                                                try {
                                                    await bridge.send(v[2], {group_id: value.id});
                                                    let subscribed = this.state.subscribed || 0;
                                                    subscribed++;
                                                    let {time} = this.state;
                                                    if (subscribed >= (this.state.groupsJoinUser.length + this.state.groupsMessageUser.length)) {
                                                        time = 0;
                                                        clearInterval(interval);
                                                    }
                                                    this.setState({subscribed, time});
                                                } catch (e) {
                                                }
                                            }}
                                            subtitle={`${shortIntegers(value.members_count)} ${decOfNum(value.members_count, ['участник', 'участника', 'участников'], false)}`}
                                        >
                                            {value.name}
                                        </SimpleCell>
                                    )
                            )
                        }
                    </List>
                    <Button
                        size='l'
                        disabled={time > 0}
                        onClick={() => this.go('result1')}
                    >
                        Далее
                    </Button>
                </Panel>
                <Panel id='result1'>
                    <div className='EmojiTitle'>
                        <img
                            alt='img'
                            src={'https://em-content.zobj.net/thumbs/160/apple/354/ring_1f48d.png'}
                        />
                        <h1>Свидетельство</h1>
                    </div>
                    <img alt='doc' src={doc}/>
                    <div className='Buttons'>
                        <Button
                            size='l'
                            onClick={() => {
                                bridge.send('VKWebAppShowStoryBox', {
                                    background_type: 'image',
                                    blob: story,
                                    attachment: {
                                        url: `https://vk.com/app${getUrlParams().vk_app_id}`,
                                        text: 'go_to',
                                        type: 'url'
                                    }
                                });
                            }}
                        >
                            Поделиться в истории
                        </Button>
                        <Button
                            size='l'
                            onClick={async () => {
                                this.setPopout(<ScreenSpinner/>);
                                const {album_name, album_caption} = this.state.app;
                                const result = await shareAlbumPhoto(doc_blob, album_name, album_caption);
                                this.setPopout(null);
                                if (result >= 0) {
                                    openUrl(`https://vk.com/album${getUrlParams().vk_user_id}_${result}`)
                                }
                                this.setSnackbar(
                                    result === -1 ? 'Для сохранения документа необходим доступ' :
                                        (
                                            result < 0 ? 'Произошла ошибка при сохранении :('
                                                :
                                                'Документ сохранён в альбом ВКонтакте'
                                        )
                                );
                            }}
                        >
                            Сохранить свидетельство
                        </Button>
                        <Button
                            size='l'
                            mode='tertiary'
                            onClick={() => {
                                this.setActivePanel('main1');
                            }}
                        >
                            Создать другое свидетельство
                        </Button>
                    </div>
                    {snackbar}
                </Panel>
            </View>
        );
    }
}