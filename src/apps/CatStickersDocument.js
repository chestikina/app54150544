import React from "react";
import {defaultViewProps, initializeNavigation} from "../js/defaults/navigation";
import {
    View,
    Panel, PanelHeader, ModalRoot, ModalCard, SimpleCell,
    Avatar, Placeholder, Button, PopoutWrapper, Spinner, ScreenSpinner, Caption
} from "@vkontakte/vkui";
import {getToken, shareAlbumPhoto, subscribeBridgeEvents} from "../js/defaults/bridge_utils";
import {
    getAppInfo,
    subscribeGroup,
    allowGroupMessages, buttonSexAndYears, inputsSexAndYears, proxyUrl
} from "../js/defaults/catalin_tg_bot";
import bridge from "@vkontakte/vk-bridge";
import fetch from "node-fetch";
import {
    Icon24ChevronLeft,
    Icon24GiftOutline,
    Icon28AddOutline, Icon28DownloadOutline,
    Icon28MessageAddBadgeOutline, Icon28SmileOutline,
    Icon56CakeCircleFillPurple, Icon56CakeOutline
} from "@vkontakte/icons";
import {
    decOfNum,
    get,
    getBase64Image,
    getImage,
    getUrlParams,
    isPlatformDesktop, isPlatformIOS, isPlatformMVK,
    openUrl,
    sleep,
    toBlob
} from "../js/utils";
import {ReactComponent as Icon1} from "../assets/cat_stickers/icons/hello.svg";
import {ReactComponent as Icon2} from "../assets/cat_stickers/icons/label.svg";
import '../css/CatStickersDocument.css';
import '../css/Fonts.css';
import {createCanvas} from "canvas";

const yadiskApi = 'https://cloud-api.yandex.net/v1/disk/public/resources?public_key=';
const folderUrl = 'https://disk.yandex.ru/d/w0avL-45mWMjEw';

const gridStyle = {
    margin: '14px 21px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px 12px',
    paddingBottom: 48
};
const buttonStyle = {
    background: '#E64646',
    color: '#FFFFFF',
    cursor: 'pointer',
    height: 48,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8.5,

    fontFamily: 'SF Pro Text',
    fontWeight: 600,
    fontSize: '17px',
    lineHeight: '22px'
};
const subTextStyle = {
    marginTop: 8,
    paddingBottom: 8,
    color: '#818C99',
    fontFamily: 'SF Pro Text',
    fontWeight: 400,
    fontSize: '15px',
    lineHeight: '18px',
    textAlign: 'center'
}

export default class App extends React.Component {

    constructor(props) {
        super(props);

        this.steps = [
            {
                icon: <Icon1/>,
                title: 'Приветствую!',
                description: 'В нашем приложении ты можешь найти крутые авторские работы бесплатно',
                button_text: 'Продолжить'
            },
            {
                icon: <Icon2/>,
                title: 'Еще кое-что...',
                description: 'Ещё здесь есть возможность сохранять стикеры прямо в альбом ВК, хотите попробовать?',
                subdescription: 'Для сохранения нужен будет доступ к вашей странице, чтобы загрузить стикеры. Это безопасно. Вы не передаете свои данные.',
                requireToken: true,
                button_text: 'Попробовать',
                sub_button_text: 'Нет, спасибо'
            }
        ];

        this.state = {
            stickers_data: false,
            folders: [],
            animation_progress: false,

            activeStep: 0
        };

        initializeNavigation.bind(this)('main', {
            go: (panel) => {
                this.changeStatusBarColor(panel);
            },
            back: (panel) => {
                this.changeStatusBarColor(panel);
            }
        });
        this.checkHash = this.checkHash.bind(this);
        this.fetchDataFromDisk = this.fetchDataFromDisk.bind(this);
        this.fetchDataFromDiskFolder = this.fetchDataFromDiskFolder.bind(this);
        this.switchStickersInfo = this.switchStickersInfo.bind(this);
        this.nextStep = this.nextStep.bind(this);
        this.loadStickersToAlbum = this.loadStickersToAlbum.bind(this);
        this.shareStory = this.shareStory.bind(this);
    }

    async componentDidMount() {
        subscribeBridgeEvents({}, 'bright_light');
        this.changeStatusBarColor('main');
        const app = await getAppInfo()
        await this.setState({...app});
        bridge.send('VKWebAppInit');
        this.fetchDataFromDisk();
    }

    changeStatusBarColor(panel) {
        if (bridge.supports('VKWebAppSetViewSettings')) {
            if (panel === 'stickers') {
                bridge.send('VKWebAppSetViewSettings', {
                    status_bar_style: 'light',
                    action_bar_color: '#0177FF'
                });
            } else if (panel === 'main') {
                bridge.send('VKWebAppSetViewSettings', {
                    status_bar_style: 'light',
                    action_bar_color: '#F0F2F5'
                });
            }
        }
    }

    checkHash() {
        let hash = window.location.hash;
        if (hash.startsWith('#')) {
            const stickers_name = decodeURI(hash.substring(1));
            const data = this.state.folders.find(value => value.name === stickers_name);
            if (data) {
                console.log({data});
                this.setState({stickers_data: data});
                return true;
            }
        }
        this.setState({stickers_data: this.state.folders[0]});
        return false;
    }

    async fetchDataFromDisk() {
        const data = await (await fetch(yadiskApi + folderUrl)).json();
        const {items} = data._embedded;
        const folders = [];
        setTimeout(async () => {
            for (const item of items) {
                if (item.type === 'dir' && item.public_url) {
                    const subdata = await this.fetchDataFromDiskFolder(item.public_url);
                    folders.push({
                        name: item.name,
                        url: item.public_url,
                        ...subdata
                    });
                }
                this.setState({folders});
            }
            this.checkHash();
            console.log({folders});
        }, 1);
    }

    async fetchDataFromDiskFolder(url) {
        const data = await (await fetch(yadiskApi + url)).json();
        const {items} = data._embedded;
        let poster = '', story = '', zip = '', zip_mvk = '';
        const stickers = [];
        for (const item of items) {
            if (item.type === 'file' && item.preview) {
                item.preview = /*proxyUrl + */item.preview.split('&').map(value =>
                    value.includes('size=') ? 'size=XXXL' : value
                ).join('&');

                const bypass_img_url = await fetch(item.preview, {referrer: ''}).then(res => res.blob());
                const urlCreator = window.URL || window.webkitURL;
                item.preview = urlCreator.createObjectURL(bypass_img_url);

                if (item.name.toLowerCase().includes('обложка')) {
                    poster = item.preview;
                } else if (item.name.toLowerCase().includes('история')) {
                    story = item.preview;
                } else {
                    stickers.push(item.preview);
                }
            } else if (item.name.includes('zip')) {
                zip = item.file;
                zip_mvk = url + item.path;
            }
        }

        return {stickers, zip, zip_mvk, poster, story};
    }

    async switchStickersInfo(value, show_info_forced = false) {
        const {animation_progress} = this.state;
        if (animation_progress) return;

        this.setState({animation_progress: true});

        if (this.header.classList.contains('HeaderFull') && show_info_forced === false) {
            // CLOSE STICKERS INFO

            this.header.classList.remove('HeaderFull');

            this.poster.classList.add('StickersPosterHidden');

            //this.list.classList.remove('StickersListHidden');

            this.modal.classList.add('StickersModalHidden');

            this.actions.classList.add('StickersActionsHidden');

            //this.back_btn.classList.add('BackButtonHidden');

            //setTimeout(() => {this.setState({stickers_data: false, animation_progress: false});}, 400);
        } else {
            // SHOW STICKERS INFO

            //await this.setState({stickers_data: value});

            this.header.classList.add('HeaderFull');

            //this.list.classList.add('StickersListHidden');

            this.poster.classList.remove('StickersPosterHidden');

            this.modal.classList.remove('StickersModalHidden');

            this.actions.classList.remove('StickersActionsHidden');

            //this.back_btn.classList.remove('BackButtonHidden');

            setTimeout(() => {
                this.setState({animation_progress: false});
            }, 400);
        }
    }

    async loadStickersToAlbum() {
        const blob = [];
        const {stickers_data} = this.state;

        for (let i = 0; i < 1; i++) {
            const data = await toBlob(stickers_data.stickers[i]), image = new Image();
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
            const blob_ = await new Promise(resolve => canvas.toBlob(blob => resolve(blob)));
            blob.push(blob_);
        }

        const {album_name, album_caption} = this.state.app;

        await shareAlbumPhoto(blob, album_name, album_caption, this.state.token);
    }

    async shareStory() {
        const {stickers_data} = this.state;
        const data = await toBlob(stickers_data.story), image = new Image();
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
    }

    async nextStep(isSkipBtn = false) {
        const {animation_progress, activeStep} = this.state;

        if (animation_progress) return;

        if (activeStep === 0) {
            if (this.state.need_panel_sex_years) {
                this.setActiveModal('years');
                return;
            }

            try {
                await subscribeGroup.bind(this)();
            } catch (e) {
            }
            try {
                await subscribeGroup.bind(this)();
            } catch (e) {
            }
        }

        if (this.steps[activeStep].requireToken) {
            const {savePhotoAlbum, need_panel_upload_photo} = this.state;
            console.log({savePhotoAlbum, need_panel_upload_photo});
            if (savePhotoAlbum === true && need_panel_upload_photo === false) {
                // обязательно загрузить
                try {
                    await this.setState({token: await getToken('photos')});
                    this.loadStickersToAlbum();
                    // загрузка 4 стикеров в альбом
                } catch (e) {
                    return;
                }
            } else if (savePhotoAlbum === true && need_panel_upload_photo === true) {
                // решает юзер
                if (!isSkipBtn) {
                    try {
                        await this.setState({token: await getToken('photos')});
                        this.loadStickersToAlbum();
                        // загрузка 4 стикеров в альбом
                    } catch (e) {
                    }
                }
            } else {
                // просто запрос токена
                try {
                    await this.setState({token: await getToken('photos')});
                } catch (e) {
                }
            }
        }

        this.setState({animation_progress: true});

        const animationTime = 300;
        const transition = `all ${animationTime}ms ease-in-out`;

        if (this.steps.length - 1 === activeStep) {
            this.stepContainer.style.transition = transition;
            this.stepContainer.style.transform = 'translateX(-100vw)';
            this.stepContainer.style.opacity = 0;
            await sleep(animationTime);
            this.stepContainer.style.display = 'none';
            this.setState({animation_progress: false});
            this.switchStickersInfo(null, true);
            this.changeStatusBarColor('stickers');
            return;
        }

        this.stepContainer.style.transition = transition;
        this.stepContainer.style.transform = 'translateX(-100vw)';
        this.stepContainer.style.opacity = 0;

        await sleep(animationTime);

        this.stepContainer.style.transition = 'none';
        this.stepContainer.style.transform = 'translateX(100vw)';

        this.setState({activeStep: activeStep + 1});

        await sleep(25);
        this.stepContainer.style.transition = transition;
        this.stepContainer.style.transform = 'translateX(0)';
        this.stepContainer.style.opacity = 1;

        await sleep(animationTime);
        this.setState({animation_progress: false});
    }

    render() {
        const {
            activeModal,
            folders,
            stickers_data,
            activeStep
        } = this.state;
        const step_data = this.steps[activeStep];

        return (
            <View
                {...defaultViewProps.bind(this)()}
                modal={
                    <ModalRoot activeModal={activeModal}>
                        <ModalCard
                            id='years'
                            onClose={() => {
                                this.setActiveModal(null);
                            }}
                            header='Кое-что ещё'
                            subheader='Уточните некоторые данные о себе: пол и возраст'
                            actions={
                                <Button
                                    stretched
                                    size='l'
                                    onClick={async () => {
                                        await this.setState({need_panel_sex_years: false});
                                        await this.setActiveModal(null);
                                        await sleep(500);
                                        this.nextStep(false);
                                    }}
                                >
                                    Продолжить
                                </Button>
                            }
                        >
                            <div className='YearsContainer'>
                                {inputsSexAndYears.bind(this)()}
                            </div>
                        </ModalCard>
                    </ModalRoot>
                }
            >
                <Panel id='main'>
                    <div className='StepsContainer' style={{
                        opacity: folders.length === 0 && 0
                    }}>
                        <div className='StepInfo' ref={ref => this.stepContainer = ref}>
                            <div className='StepsTitle'>
                                {step_data.icon}
                                <h1>{step_data.title}</h1>
                            </div>
                            <h3 className='StepsDescription'>
                                {step_data.description}
                            </h3>
                            <h4 className='StepsSubDescription'>
                                {step_data.subdescription}
                            </h4>
                            <div className='StepActions'>
                                <Button
                                    stretched
                                    size='l'
                                    onClick={() => this.nextStep(false)}
                                >
                                    {step_data.button_text}
                                </Button>
                                {
                                    step_data.sub_button_text &&
                                    <Button
                                        mode='secondary2'
                                        stretched
                                        size='l'
                                        onClick={() => this.nextStep(true)}
                                    >
                                        {step_data.sub_button_text}
                                    </Button>
                                }
                            </div>
                        </div>
                    </div>
                    {
                        false &&
                        <div
                            className='BackButton BackButtonHidden'
                            ref={ref => this.back_btn = ref}
                            onClick={this.switchStickersInfo}
                        >
                            <Icon24ChevronLeft/>
                        </div>
                    }
                    <div className='HeaderTitle' ref={ref => this.header = ref}>
                        <Icon28SmileOutline width={12} height={12}/>
                        <span>Набор{stickers_data ? '' : 'ы'}</span>
                    </div>
                    {
                        folders.length === 0 && <div style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)'
                        }}>
                            <Spinner size='large'/>
                            <Caption level={1} style={{marginTop: 16, textAlign: 'center'}}>
                                Загружаем стикеры, пожалуйста подождите несколько секунд...
                            </Caption>
                        </div>
                    }
                    {
                        false &&
                        <div className='StickersList' ref={ref => this.list = ref}>
                            {
                                folders.map((value, index) =>
                                    <div key={`stickers_${index}`} onClick={async () => {
                                        await this.switchStickersInfo(value);
                                    }}>
                                        <img src={value.poster} alt='img'/>
                                        <div>
                                            <h1>{value.name}</h1>
                                            <h3>{decOfNum(value.stickers.length, ['стикер', 'стикера', 'стикеров'])}</h3>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    }
                    <div className='StickersPoster StickersPosterHidden' ref={ref => this.poster = ref}>
                        <img src={stickers_data.poster} alt='img'/>
                        <h1>{stickers_data.name}</h1>
                    </div>
                    <div className='StickersModal StickersModalHidden' ref={ref => this.modal = ref}>
                        <div className='StickersGrid'>
                            {
                                stickers_data && stickers_data.stickers.map((value, index) =>
                                    <img
                                        key={`sticker_${index}`} alt='sticker'
                                        src={value}
                                        onClick={() => {
                                            this.setPopout(<PopoutWrapper
                                                onClick={() => this.setPopout(null)}
                                                onClose={() => this.setPopout(null)}
                                            >
                                                <img
                                                    src={value} width='70%'
                                                    onClick={() => this.setPopout(null)}
                                                    alt='sticker'
                                                />
                                            </PopoutWrapper>)
                                        }}
                                    />
                                )
                            }
                        </div>
                        <div className='StickersActions StickersActionsHidden' ref={ref => this.actions = ref}>
                            <Button
                                style={{
                                    background: '#0177FF',
                                    color: '#FFFFFF'
                                }}
                                stretched
                                size='l'
                                before={<Icon28DownloadOutline width={17} height={17}/>}
                                onClick={async () => {
                                    try {
                                        await allowGroupMessages.bind(this)();
                                    } catch (e) {
                                    }
                                    try {
                                        if (bridge.supports('VKWebAppDownloadFile')) {
                                            bridge.send('VKWebAppDownloadFile', {
                                                filename: `${stickers_data.name}.zip`,
                                                url: stickers_data.zip
                                            })
                                        } else {
                                            if (isPlatformMVK()) {
                                                openUrl(stickers_data.zip_mvk);
                                            } else {
                                                openUrl(stickers_data.zip);
                                            }
                                        }
                                    } catch (e) {
                                        console.error('some err with bridge', e);
                                        if (isPlatformIOS()) {
                                            openUrl(stickers_data.zip_mvk);
                                        } else {
                                            openUrl(stickers_data.zip);
                                        }
                                    }
                                }}
                            >
                                Скачать
                            </Button>
                            <Button
                                style={{
                                    background: '#F0F2F5',
                                    color: '#000000'
                                }}
                                stretched
                                size='l'
                                onClick={async () => {
                                    this.setPopout(<ScreenSpinner/>);
                                    await this.shareStory();
                                    this.setPopout(null);
                                }}
                            >
                                Поделиться
                            </Button>
                        </div>
                    </div>
                </Panel>
            </View>
        );
    }

    renderOld() {
        const {
            activeModal,
            stickers_name,
            stickers_img,
            stickers_zip,
            folder,
            groupsJoinUser,
            groupsMessageUser
        } = this.state;
        return (
            <View
                {...defaultViewProps.bind(this)()}
                modal={<ModalRoot activeModal={activeModal}>
                    <ModalCard
                        id='get'
                        onClose={() => {
                            this.setActiveModal(null);
                        }}
                    >
                        <div style={subTextStyle}>
                            Поддержите наших авторов и <span style={{color: 'var(--text_primary)'}}>подпишитесь на группы</span>,
                            пожалуйста
                        </div>
                        {
                            groupsJoinUser && groupsJoinUser.map((value, index) =>
                                <SimpleCell
                                    key={`Cell-${index}`}
                                    before={<Avatar size={48} src={value.photo_50}/>}
                                    after={<Icon28AddOutline/>}
                                    onClick={() => bridge.send('VKWebAppJoinGroup', {group_id: value.id})}
                                >
                                    {value.name}
                                </SimpleCell>
                            )
                        }
                        {
                            groupsMessageUser && groupsMessageUser.map((value, index) =>
                                <SimpleCell
                                    key={`Cell-${index}`}
                                    before={<Avatar size={48} src={value.photo_50}/>}
                                    after={<Icon28MessageAddBadgeOutline/>}
                                    onClick={() => bridge.send('VKWebAppAllowMessagesFromGroup', {group_id: value.id})}
                                >
                                    {value.name}
                                </SimpleCell>
                            )
                        }
                        <div style={{
                            ...buttonStyle,
                            marginTop: 20
                        }} onClick={async () => {
                            if (isPlatformDesktop()) {
                                openUrl(stickers_zip);
                            } else {
                                try {
                                    await bridge.send('VKWebAppDownloadFile', {
                                        url: stickers_zip,
                                        filename: `${folder}.zip`
                                    });
                                } catch (e) {
                                    console.error(e);
                                    openUrl(stickers_zip);
                                }
                            }
                        }}>
                            <Icon24GiftOutline/> Продолжить
                        </div>
                    </ModalCard>
                </ModalRoot>}
            >
                <Panel id='main'>
                    <PanelHeader>
                        {stickers_name}
                    </PanelHeader>
                    <div style={gridStyle}>
                        {
                            stickers_img && stickers_img.map((src, index) =>
                                <img
                                    alt='sticker'
                                    key={`img-${index}`}
                                    src={src}
                                    style={{
                                        justifySelf: 'center'
                                    }}
                                />
                            )
                        }
                    </div>
                    <div style={{
                        ...buttonStyle,
                        position: 'fixed',
                        bottom: 'calc(var(--safe-area-inset-bottom) + 8px)',
                        left: 16,
                        right: 16
                    }} onClick={async () => {
                        this.setActiveModal('get')
                    }}>
                        <Icon24GiftOutline/> Получить набор
                    </div>
                </Panel>
                <Panel id='years'>
                    <Placeholder
                        icon={<Icon56CakeOutline/>}
                        header='Укажите пол и возраст'
                        action={<Button size='m' onClick={() => {
                            buttonSexAndYears.bind(this)('main');
                        }}>
                            Дальше
                        </Button>}
                        stretched
                    >
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12
                        }}>
                            {inputsSexAndYears.bind(this)()}
                        </div>
                    </Placeholder>
                </Panel>
            </View>
        );
    }

}