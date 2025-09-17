import React from 'react';
import {
    Panel, View, Button, File, ModalRoot, ModalCard, Tappable, Spinner, ScreenSpinner, PanelHeader, IconButton
} from '@vkontakte/vkui';
import '../css/PhotoToAnimeAI.css';
import bridge from "@vkontakte/vk-bridge";
import {defaultViewProps, initializeNavigation} from "../js/defaults/navigation";
import {getToken, shareAlbumPhoto, shareWallPhoto, subscribeBridgeEvents} from "../js/defaults/bridge_utils";
import {uploadPhoto, getResult} from "../js/qq_ai_anime";
import {
    allowGroupMessages,
    buttonSexAndYears,
    getAppInfo,
    inputSex,
    inputYears,
    proxyUrl,
    subscribeGroup
} from "../js/defaults/catalin_tg_bot";
import {
    Icon20NewsfeedOutline, Icon20StoryOutline,
    Icon24AddCircleOutline,
    Icon28CancelOutline,
    Icon28PictureOutline,
    Icon28UsersOutline
} from "@vkontakte/icons";
import {ReactComponent as IconModalAccess} from '../assets/photo_to_anime_ai/modal_access_icon.svg';
import {ReactComponent as IconModalSubscribe} from '../assets/photo_to_anime_ai/modal_subscribe_icon.svg';
import {ReactComponent as Icon28UserStarOutline} from '../assets/photo_to_anime_ai/user_star_outline_28.svg';
import {ctxDrawImageWithRound, getAnonymosImage, getUrlParams, sleep, toBlob} from "../js/utils";
import {createCanvas, loadImage} from "canvas";

class UploadPhotoCard extends React.PureComponent {

    constructor(props) {
        super(props);
    }

    render() {
        const {onChange} = this.props;
        return (
            <File onChange={onChange}>
                <div className='UploadContent'>
                    <Icon24AddCircleOutline fill='#FFFFFF' width={32} height={32}/>
                    <h2>Загрузить изображение</h2>
                    <p>Например, недавнюю фотографию с друзьями</p>
                </div>
            </File>
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
                icon: require('../assets/photo_to_anime_ai/onboard-1-icon.png'),
                title: 'Преобразуй себя в аниме-персонажа',
                text: 'Наша нейросеть создаст тебе рисунок на основе любой фотографии',
                button: 'Продолжить',
                buttonOnClick: async () => await subscribeGroup.bind(t)()
            },
            {
                title: 'Почти готово',
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
                button: 'Зарегистрироваться',
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

const
    MODAL_CARD_ACCESS = 'access',
    MODAL_CARD_SAVE = 'save',
    MODAL_CARD_SUBSCRIBE = 'subscribe'
;

class Modal extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            radioSelected: 0
        }
    }

    render() {
        const {t, activeModal} = this.props;
        const {radioSelected} = this.state;
        return (
            <ModalRoot activeModal={activeModal}>
                <ModalCard
                    id={MODAL_CARD_ACCESS}
                    onClose={() => t.setActiveModal(null)}
                    icon={<IconModalAccess/>}
                    header='Разрешите ваши данные'
                    subheader='Это нужно для сохранения результата'
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
                <ModalCard
                    id={MODAL_CARD_SAVE}
                    onClose={async () => {
                        t.setActiveModal(null);

                        await subscribeGroup.bind(t)();
                        await allowGroupMessages.bind(t)();

                        t.setPopout(<ScreenSpinner/>);
                        t.sendPhoto(false);
                    }}
                    icon={<div className='ModalCard_IconContainer'>
                        <Icon28PictureOutline/>
                    </div>}
                    header='Как сохранить результат?'
                    actions={
                        <Button
                            size='l'
                            stretched
                            onClick={async () => {
                                t.setActiveModal(null);

                                await subscribeGroup.bind(t)();
                                await allowGroupMessages.bind(t)();

                                t.setPopout(<ScreenSpinner/>);
                                t.sendPhoto(true);
                            }}
                        >
                            Продолжить
                        </Button>
                    }
                >
                    <div className='CustomRadioGroup'>
                        {
                            [
                                {
                                    body: <React.Fragment>
                                        <div className='RadioCardInner'>
                                            <Icon28UsersOutline/>
                                        </div>
                                        <div className='RadioCardInner' style={{marginTop: 8}}>
                                            <Icon28UserStarOutline/>
                                        </div>
                                    </React.Fragment>,
                                    text: 'До и после'
                                },
                                {
                                    body: <div className='RadioCardInner' style={{height: 113}}>
                                        <Icon28UserStarOutline/>
                                    </div>,
                                    text: 'Только после'
                                },
                                /*{
                                    body: <div className='RadioCardInner' style={{height: 113, background: 'none'}}>
                                        <Icon28CancelOutline/>
                                    </div>,
                                    text: 'Не сохранять'
                                }*/
                            ].map(({body, text}, index) =>
                                <Tappable
                                    key={`Radio_${index}`}
                                    className='RadioContainer'
                                    onClick={() => {
                                        this.setState({radioSelected: index});
                                        t.setState({savePicture: index});
                                    }}
                                >
                                    <div
                                        className='RadioCard'
                                    >
                                        {body}
                                        <div className='RadioCircle'
                                             style={{border: radioSelected === index && '2px solid #FFFFFF'}}>
                                            {
                                                radioSelected === index && <div className='RadioCircleSelected'/>
                                            }
                                        </div>
                                    </div>
                                    <p style={{color: radioSelected === index && '#FFFFFF'}}>{text}</p>
                                </Tappable>
                            )
                        }
                    </div>
                </ModalCard>
                <ModalCard
                    id={MODAL_CARD_SUBSCRIBE}
                    onClose={() => {
							this.props.t.setState({wait: false});
							t.setActiveModal(null)
						}
					}
                    icon={<IconModalSubscribe/>}
                    header='Подпишитесь на нас'
                    subheader='Наше приложение бесплатное, но мы просим вас только подписаться на наше сообщество, чтобы нам тоже была польза от приложения!'
                    actions={
                        <Button
                            size='l'
                            stretched
                            onClick={async () => {
                                t.setActiveModal(null);

                                await subscribeGroup.bind(t)();
                                await allowGroupMessages.bind(t)();
								this.props.t.setState({wait: false});
                            }}
                        >
                            Подписаться
                        </Button>
                    }
                >
                </ModalCard>
            </ModalRoot>
        );
    }

}

let progressInterval;

class Progress extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            messages: [
                "Подготавливаем заклинание Дзё-ган...",
                "Собираем ниндзя команду...",
                "Создаем альтер эго...",
                "Запускаем меха-тигра...",
                "Призываем духов прошлого...",
                "Активируем девятый ваншот...",
                "Преобразовываемся в суперсилу...",
                "Воскрешаем палача...",
                "Собираем всех демонов...",
                "Создаем кольцо волшебства...",
                "Обучаемся у Шиноби...",
                "Собираем драконий баллист...",
                "Разблокируем банкай канон...",
                "Активируем девятый синдром...",
                "Вступаем в ниндзя клан...",
                "Ещё совсем немного..."
            ],
            activeMessage: 0
        }

        this.componentDidMount = this.componentDidMount.bind(this);
        this.componentDidUpdate = this.componentDidUpdate.bind(this);
        this.initializeProgress = this.initializeProgress.bind(this);
    }

    componentDidMount() {
        this.initializeProgress();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.initializeProgress();
    }

    initializeProgress() {
        const {queue, error_msg} = this.props.t.state;
		if (error_msg) {
            clearInterval(progressInterval);
			progressInterval = false;
		}
        if ((queue === 0 || !queue) && !progressInterval && !error_msg) {
            console.debug('Initialize progress');
            const {messages} = this.state;
            const time = 1500;
            [10, 90].forEach(percent =>
                setTimeout(async () => {
						let lastWait = this.props.t.state.wait;
                        await this.props.t.setState({wait: true});
						this.props.t.forceUpdate();
                        try {
                            if (bridge.supports('VKWebAppShowNativeAds')) {
                                await bridge.send('VKWebAppShowNativeAds', {ad_format: 'interstitial'});
                            }
                        } catch (e) {
                        }
                        await this.props.t.setState({wait: lastWait});
						this.props.t.forceUpdate();
                    },
                    time * Math.ceil(messages.length / (100 / percent))
                )
            );
            setTimeout(async () => {
					if (progressInterval) {
						await this.props.t.setState({wait: true});
						this.props.t.forceUpdate();
						this.props.t.setActiveModal(MODAL_CARD_SUBSCRIBE);
					}
				}, time * Math.ceil(messages.length / (100 / 50))
            );
            progressInterval = setInterval(() => {
                const {activeMessage} = this.state;
				const {wait} = this.props.t.state;
				console.debug({wait});
                if (!wait) {
                    if (activeMessage < messages.length - 1) {
                        this.setState({activeMessage: activeMessage + 1});
                    } else {
                        this.props.onEnd();
                        clearInterval(progressInterval);
                        progressInterval = false;
                    }
                }
            }, time);
        }
    }

    render() {
        const {activeMessage, messages} = this.state;
        const {t} = this.props;
        const {queue, error_msg} = t.state;
        return (
            <div className='ProgressContainer'>
                {
                    error_msg ?
                        <React.Fragment>
                            <h1>Произошла ошибка</h1>
                            <p>{error_msg}</p>
                            <Button
                                size='l'
                                onClick={async () => {
                                    await t.back();
                                    clearInterval(progressInterval);
                                    progressInterval = false;
                                    setTimeout(() =>
                                        t.setState({error_msg: false}), 1000);
                                }}
                            >
                                Назад
                            </Button>
                        </React.Fragment>
                        :
                        <React.Fragment>
                            <Spinner size='large'/>
                            <h1>{(queue || queue > 0) ? `Место в очереди: ${queue + 1}` : `${Math.floor(100 / (messages.length - 1) * activeMessage)}%`}</h1>
                            {(queue === 0 || !queue) && <p>{messages[activeMessage]}</p>}
                        </React.Fragment>
                }
            </div>
        );
    }

}

let isAlbumPhotoLoaded;

class Result extends React.PureComponent {

    constructor(props) {
        super(props);

        this.getStoryCanvas = this.getStoryCanvas.bind(this);

        this.createStory = this.createStory.bind(this);
        this.createPost = this.createPost.bind(this);

        this.uploadToAlbum = this.uploadToAlbum.bind(this);
    }

    componentDidMount() {
        this.uploadToAlbum();
    }

    async getStoryCanvas() {
        const {photos, photo_type} = this.props.t.state;
        const background = await loadImage(require(`../assets/photo_to_anime_ai/story_bg_${photo_type}.png`));
        const canvas = createCanvas(background.width, background.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(background, 0, 0);
        const settings = [
            [
                [142.96, 346.04, 795.07, 560.6], // x, y, width, height
                [142.96, 925.69, 795.07, 560.6] // x, y, width, height
            ],
            [
                [69.99, 604.21, 459.02, 687.06], // x, y, width, height
                [550.99, 604.21, 459.02, 687.06] // x, y, width, height
            ]
        ][photo_type];
        for (const i in photos) {
            ctx.drawImage(photos[i], ...settings[i]);
        }
        return canvas;
    }

    async createStory() {
        this.props.t.setPopout(<ScreenSpinner/>);
        const canvas = await this.getStoryCanvas();

        try {
            await bridge.send('VKWebAppShowStoryBox', {
                background_type: 'image',
                blob: canvas.toDataURL('image/png'),
                attachment: {
                    url: `https://vk.com/app${getUrlParams().vk_app_id}`,
                    text: 'go_to',
                    type: 'url'
                }
            });
        } catch (e) {
        }
        this.props.t.setPopout(null);

        await this.createPost(canvas);
    }

    async createPost(canvas) {
        let {app, access_token} = this.props.t.state;
        if (!access_token) {
            await this.props.t.setActiveModal(MODAL_CARD_ACCESS);
            await sleep(500);
            for (let i = 0; i < 1; i++) {
                if (this.props.t.state.activeModal === MODAL_CARD_ACCESS) {
                    i--;
                    await sleep(100);
                }
            }
            this.props.t.setPopout(<ScreenSpinner/>);
            await sleep(1000);
            await this.forceUpdate();
            await this.props.t.forceUpdate();

            if (!this.props.t.state.access_token) {
                this.props.t.setPopout(null);
                return;
            }
        }

        this.props.t.setPopout(<ScreenSpinner/>);
        if (!canvas)
            canvas = await this.getStoryCanvas();

        const blob = await new Promise(res => canvas.toBlob((blob) => res(blob)));
        const
            defaultCopyright = getUrlParams().vk_app_id,
            _searchComponent = 'vk.com/app',
            copyright = app.album_caption.length > 0 ?
                (app.album_caption.indexOf(_searchComponent) > -1 ?
                    (app.album_caption.slice(app.album_caption.indexOf(_searchComponent) + _searchComponent.length, app.album_caption.slice(app.album_caption.indexOf(_searchComponent) + _searchComponent.length).indexOf(' ')))
                    : defaultCopyright)
                : defaultCopyright
        ;
        await shareWallPhoto(blob, app.album_caption, copyright, access_token);
        this.props.t.setPopout(null);

        this.uploadToAlbum();
    }

    async uploadToAlbum() {
        const {app, access_token, album_save, savePhotoAlbum, savePicture, photos_default} = this.props.t.state;
        if (!access_token || isAlbumPhotoLoaded) return;
        if (!(album_save || savePhotoAlbum)) return;

        let canvas;
        const {need_upload_default_album_photo, album_default_photo_url} = app;
        if (need_upload_default_album_photo) {
            const data = await toBlob(album_default_photo_url);
            const image = new Image();
            image.src = data;
            await new Promise(res =>
                image.onload = () => res(true)
            );
            canvas = createCanvas(image.width, image.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
        } else {
            if (savePicture === 1) {
				let blob = [];
                for (const photo of photos_default) {
                    canvas = createCanvas(photo.width, photo.height);
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(photo, 0, 0);

                    blob.push(await new Promise(res => canvas.toBlob(blob => res(blob))));
                }
                const {album_name, album_caption} = this.props.t.state.app;
                await shareAlbumPhoto(blob, album_name, album_caption, access_token);
                isAlbumPhotoLoaded = true;

                return;
            }

            canvas = await this.getStoryCanvas();
        }

        const blob = await new Promise(res => canvas.toBlob(blob => res(blob)));
        const {album_name, album_caption} = this.props.t.state.app;
        await shareAlbumPhoto(blob, album_name, album_caption, access_token);
        isAlbumPhotoLoaded = true;
    }

    render() {
        const {t} = this.props;
        const {photo1, photo2, photo_type} = t.state;
        return <React.Fragment>
            <PanelHeader left={
                <IconButton
                    onClick={t.back}
                >
                    <Icon28CancelOutline fill='#FFFFFF'/>
                </IconButton>} separator={false}
            />
            <h1>Результат готов!</h1>
            <div className='Result_Container'>
                <div
                    className={`Photo_Container ${photo_type === 0 ? 'Photo_Container_Horizontal' : 'Photo_Container_Vertical'}`}
                >
                    <img alt='photo1' src={photo1}/>
                    <img alt='photo2' src={photo2}/>
                </div>
                <div
                    className='Actions_Container'
                >
                    <Button
                        size='l' stretched
                        before={<Icon20NewsfeedOutline/>}
                        onClick={() => this.createPost()}
                    >
                        Опубликовать пост
                    </Button>
                    <Button
                        mode='secondary'
                        size='l' stretched
                        before={<Icon20StoryOutline/>}
                        onClick={this.createStory}
                    >
                        Сделать историю
                    </Button>
                </div>
            </div>
        </React.Fragment>
    }

}

export default class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {};

        initializeNavigation.bind(this)('onboard');
        this.componentDidMount = this.componentDidMount.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
        this.sendPhoto = this.sendPhoto.bind(this);
    }

    async componentDidMount() {
        await this.setState(await getAppInfo());
        console.log(this.state);
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
    }

    async uploadFile(evt) {
        let tgt = evt.target || window.event.srcElement,
            files = tgt.files;

        if (FileReader && files && files.length) {
            for (let file of files) {
                let fr = new FileReader();
                fr.onload = async () => {
                    progressInterval = false;
                    this.setState({qq_data: false, photo_base64: fr.result.split(',')[1]})
                    this.setActiveModal(MODAL_CARD_SAVE);
                };
                await fr.readAsDataURL(file);
            }
        }
        // Not supported
        else {
            // fallback -- perhaps submit the input to an iframe and temporarily store
            // them on the server until the user's session ends.
        }
    }

    async sendPhoto(album_save) {
        this.setState({album_save});
		let attemps = 0;
		for (let j = 0; j < 1; j++) {
			attemps++;
			
			try {
				const {photo_base64} = this.state;
				const data = await uploadPhoto(photo_base64);
				this.setPopout(null);
				if (data !== false) {
					await this.setState({error_msg: false, queue: data});
					this.go('progress');
					for (let i = 0; i < 1; i++) {
						const result = await getResult();
						if (typeof result === 'number') {
							i--;
							this.setState({queue: result});
							this.forceUpdate();
							await sleep(2000);
						} else {
							await this.cropPhoto(result);
							this.setState({qq_data: result});
						}
					}
				} else {
                    clearInterval(progressInterval);
                    progressInterval = false;
					this.setState({error_msg: 'Не получилось загрузить фото. Попробуйте ещё раз.'});
					this.go('progress');
				}
			} catch (e) {
				if (e.message.indexOf('Кажется') > -1 && attemps < 2) {
					j--;
					await sleep(1000);
				} else {
					console.error(e);
                    clearInterval(progressInterval);
                    progressInterval = false;
					await this.setState({error_msg: e.message});
					this.setPopout(null);
					this.go('progress');
				}
			}
		}
        
    }

    async cropPhoto(url) {
        const
            comparedPhoto = await getAnonymosImage(url),
            type = comparedPhoto.width === 800 ? 0 : 1,
            size = [[758, 504], [471, 705]][type],
            border = [
                [[59.92, 59.92, 17.12, 17.12], [17.12, 17.12, 59.92, 59.92]],
                [[78.97, 22.56, 22.56, 78.97], [22.56, 78.97, 78.97, 22.56]]
            ][type],
            cropSettings = [
                [{x: -20, y: -22}, {x: -20, y: -543}],
                [{x: -21, y: -24}, {x: -508, y: -24}]
            ][type],
            photo1 = createCanvas(...size),
            photo2 = createCanvas(...size),
            photo3 = createCanvas(...size),
            photo4 = createCanvas(...size)
        ;

        ctxDrawImageWithRound(
            photo1.getContext('2d'), comparedPhoto,
            border[0],
            {...cropSettings[0], width: comparedPhoto.width, height: comparedPhoto.height},
            {x: 0, y: 0, width: size[0], height: size[1]});
        ctxDrawImageWithRound(
            photo2.getContext('2d'), comparedPhoto,
            border[1],
            {...cropSettings[1], width: comparedPhoto.width, height: comparedPhoto.height},
            {x: 0, y: 0, width: size[0], height: size[1]});

        ctxDrawImageWithRound(
            photo3.getContext('2d'), comparedPhoto,
            [0, 0, 0, 0],
            {...cropSettings[0], width: comparedPhoto.width, height: comparedPhoto.height},
            {x: 0, y: 0, width: size[0], height: size[1]});
        ctxDrawImageWithRound(
            photo4.getContext('2d'), comparedPhoto,
            [0, 0, 0, 0],
            {...cropSettings[1], width: comparedPhoto.width, height: comparedPhoto.height},
            {x: 0, y: 0, width: size[0], height: size[1]});

        await this.setState({
            photo_type: type,
            photos: [photo1, photo2],
            photos_default: [photo3, photo4],
            photo1: photo1.toDataURL('image/png'),
            photo2: photo2.toDataURL('image/png')
        });
    }

    render() {
        const {uploadFile} = this;
        const {activeModal, qq_data} = this.state;
        return (
            <View
                {...defaultViewProps.bind(this)()}
                modal={<Modal t={this} activeModal={activeModal}/>}
            >
                <Panel id='onboard'>
                    <Onboard onEnd={() => {
                        this.go('main');
                        this.setActiveModal(MODAL_CARD_ACCESS);
                    }} t={this}/>
                    <img alt='bg' className='Background-Onboard'
                         src={require('../assets/photo_to_anime_ai/background_gradient_onboard.png')}/>
                    <img alt='bg' className='Background' src={require('../assets/photo_to_anime_ai/background_2.png')}/>
                </Panel>
                <Panel id='main'>
                    <UploadPhotoCard onChange={uploadFile}/>
                    <img alt='bg' className='Background'
                         src={require('../assets/photo_to_anime_ai/background_main.png')}/>
                </Panel>
                <Panel id='progress'>
                    <Progress
                        t={this}
                        onEnd={async () => {
                            for (let i = 0; i < 1; i++) {
                                if (!qq_data) {
                                    i--;
                                    await sleep(500);
                                }
                            }
                            this.setActivePanel('result', ['main']);
                        }}
                    />
                    <img alt='bg' className='Background'
                         src={require('../assets/photo_to_anime_ai/background_main.png')}/>
                </Panel>
                <Panel id='result'>
                    <Result t={this}/>
                    <img alt='bg' className='Background'
                         src={require('../assets/photo_to_anime_ai/background_main.png')}/>
                </Panel>
            </View>
        );
    }
}