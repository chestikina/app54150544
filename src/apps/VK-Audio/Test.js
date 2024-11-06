import React from 'react';
import {
    IconButton, ModalPage, ModalRoot,
    Panel, PanelHeader, Tappable, View,
    ModalPageHeader, PanelHeaderButton,
    Slider, Search, FormLayout, FormItem,
    Input, Button, Alert, ScreenSpinner,
    Avatar, PanelHeaderBack
} from '@vkontakte/vkui';
import {
    Icon24Cancel,
    Icon24Dismiss, Icon24Pause,
    Icon24Play, Icon28DownloadCheckOutline, Icon28MusicOutline, Icon28OnOffOutline, Icon28Pause,
    Icon28Play, Icon28SkipNext,
    Icon28SkipPrevious,
    Icon28SongOutline, Icon56LogoVk
} from '@vkontakte/icons';
import './css/Global.css';
import VK from "./module-vk";
import {getVKUsers} from "../../js/drawerapp/utils";

const
    vk = new VK(),

    MODAL_PAGE_AUDIO_PLAYER = 'audio-player'
;

function timeFormat(sec) {
    const
        total_minutes = Math.floor(sec / 60),
        minutes = total_minutes % 60,
        seconds = Math.floor(sec % 60).toLocaleString('ru', {minimumIntegerDigits: 2})
    ;
    return `${minutes}:${seconds}`;
}

function setUserAgent(window, userAgent) {
    // Works on Firefox, Chrome, Opera and IE9+
    if (navigator.__defineGetter__) {
        navigator.__defineGetter__('userAgent', function () {
            return userAgent;
        });
    } else if (Object.defineProperty) {
        Object.defineProperty(navigator, 'userAgent', {
            get: function () {
                return userAgent;
            }
        });
    }
    // Works on Safari
    if (window.navigator.userAgent !== userAgent) {
        var userAgentProp = {
            get: function () {
                return userAgent;
            }
        };
        try {
            Object.defineProperty(window.navigator, 'userAgent', userAgentProp);
        } catch (e) {
            window.navigator = Object.create(navigator, {
                userAgent: userAgentProp
            });
        }
    }
}

let audios_data = [
    /*{
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        title: 'Song 1-1',
        artist: 'soundhelix',
        duration: 6 * 60 + 12
    },
    {
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        title: 'Song 1-2',
        artist: 'soundhelix',
        duration: 7 * 60 + 5
    },
    {
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        title: 'Song 3',
        artist: 'soundhelix',
        duration: 5 * 60 + 44
    }*/
]

class AudioControl {

    constructor(t) {
        this.t = t;
        this.audio = new Audio();
        this.initializedWidget = false;
        this.currentSongPlayingId = -1;
    }

    setPlaylist = (array = []) => {
        if (this.playlist) {
            if (JSON.stringify(this.playlist.map(value => value.url)) === JSON.stringify(array.map(value => value.url)))
                return;
            else
                this.audio.pause()
        }
        this.playlist = array.map(data => {
            return {
                ...data, playing: false, selected: false
            }
        });
    };

    switchPlay = (playing = !this.isPlay, index) => {
        const currentSong = this.getCurrentSong();
        if (index !== undefined && currentSong.index !== index && (currentSong.item ? (currentSong.item.url !== this.getSong(index).url) : true)) {
            if (currentSong.item) currentSong.item.selected = false;
            this.setSong(index);
        } else {
            const song = currentSong.item;
            if (song) {
                this.isPlay = playing;
                this.t.setState({currentAudioData: this.getSong(currentSong.index)});
                song.playing = playing;
                song.selected = true;
                this.currentSongPlayingId = playing ? song.id : -1;

                if (playing)
                    this.audio.play();
                else
                    this.audio.pause();
            }

        }
    };

    getCurrentSong = () => {
        let index = this.playlist.findIndex(value => value.playing || value.selected);
        return {index, item: this.playlist[index]};
    }

    getSong = index => {
        return this.playlist[index] || {};
    }

    isPlayingSong = id => !this.isPlay ? this.isPlay : id === this.currentSongPlayingId;

    skipSong = (next = true) => {
        const
            currentSong = this.getCurrentSong(),
            nextIndex = currentSong.index + (next ? 1 : -1),
            nextSong = this.playlist[nextIndex]
        ;
        this.isPlay = true;
        if (nextSong) {
            if (currentSong.item) {
                currentSong.item.playing = false;
                currentSong.item.selected = false;
                this.audio.pause();
                /*currentSong.item.audio.pause();
                currentSong.item.audio.currentTime = 0;
                currentSong.item.audio.onended = () => {
                };*/
            }
            nextSong.playing = true;
            nextSong.selected = true;
            this.currentSongPlayingId = nextSong.id;
            this.audio.src = nextSong.url;
            this.initializeWidget();
            this.audio.play();
            this.audio.onended = () => this.skipSong();
            this.t.setState({currentAudioData: this.getSong(nextIndex)});
        } else {
            if (nextIndex > 0)
                this.switchPlay();
            else
                this.audio.currentTime = 0;
        }
    }

    setSong = index => {
        const
            currentSong = this.getCurrentSong(),
            nextSong = this.playlist[index]
        ;
        if (nextSong) {
            if (currentSong.item && currentSong.item.playing) {
                currentSong.item.playing = false;
                currentSong.item.selected = false;
                this.audio.pause();
                /*currentSong.item.audio.pause();
                currentSong.item.audio.currentTime = 0;
                currentSong.item.audio.onended = () => {
                };*/
            }
            this.isPlay = true;
            nextSong.playing = true;
            nextSong.selected = true;
            this.currentSongPlayingId = nextSong.id;
            this.audio.src = nextSong.url;
            this.initializeWidget();
            this.audio.play();
            this.audio.onended = () => this.skipSong();
            this.t.setState({currentAudioData: this.getSong(index)});
        } else {
            this.switchPlay();
        }
    }

    initializeWidget = () => {
        this.audio.onloadedmetadata = () => {
            const currentSong = this.getCurrentSong().item;
            if (!navigator.mediaSession.metadata) {
                navigator.mediaSession.metadata = new window.MediaMetadata({
                    title: currentSong.title, artist: currentSong.artist
                });
            } else {
                navigator.mediaSession.metadata.title = currentSong.title;
                navigator.mediaSession.metadata.artist = currentSong.artist
            }

            navigator.mediaSession.setActionHandler('previoustrack', () => {
                console.log('Widget -> previoustrack');
                this.skipSong(false);
                this.initializeWidget();
            });
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                console.log('Widget -> nexttrack');
                this.skipSong();
                this.initializeWidget();
            });
            navigator.mediaSession.setActionHandler('play', () => {
                console.log('Widget -> play');
                this.switchPlay(true);
                this.t.setState({_time: Date.now()});
                this.initializeWidget();
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                console.log('Widget -> pause');
                this.switchPlay(false);
                this.t.setState({_time: Date.now()});
                this.initializeWidget();
            });
        }
    }

}

class AudioList extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            searchText: '',
            audios_count: 0
        }
    }

    async componentDidMount() {
        const {t} = this.props;
        t.setPopout(<ScreenSpinner />);
        const audio = await vk.api('audio.get', {});
        if (!audio.error) {
            this.setState({audios_count: audio.count});
            audios_data = audio.items;
            t.audioControl.setPlaylist(audios_data);

            this.observer = new IntersectionObserver(
                this.handleObserver.bind(this),
                {
                    root: null,
                    rootMargin: '0px',
                    threshold: 1.0
                }
            );
            this.observer.observe(this.loadingRef);
            t.setPopout(null);
        } else {
            t.setPopout(<Alert
                actions={[
                    {
                        title: 'Ок',
                        autoclose: true,
                        mode: 'cancel',
                    }
                ]}
                actionsLayout='vertical'
                onClose={() => t.setPopout(null)}
                header='Произошла ошибка'
                text={typeof audio.error === 'object' ? JSON.stringify(audio.error) : audio.error}
            />);
        }
    }

    get audios() {
        const
            filterText = this.state.searchText.toLowerCase(),
            needFilter = filterText.length > 0
        ;
        return needFilter ? audios_data.filter(
                ({title, artist}) => `${title} ${artist}`.toLowerCase().indexOf(filterText) > -1
            )
            : audios_data;
    }

    async handleObserver(entities, observer) {
        const
            {y} = entities[0].boundingClientRect,
            {t} = this.props,
            {prevY} = this.state
        ;
        if ((prevY === 0 || prevY > y) && audios_data.length < this.state.audios_count) {
            t.setPopout(<ScreenSpinner />);
            const data = await vk.api('audio.get', { offset: audios_data.length });
            audios_data = audios_data.concat(data.items);
            t.setPopout(null);
        }
        this.setState({prevY: y});
    }

    render() {
        const
            {searchText} = this.state,
            {t} = this.props
        ;

        return (<div className='Audios'>
            <Search
                value={searchText}
                onChange={e => this.setState({searchText: e.target.value})}
                after={null}
            />
            <div className='AudioList'>
                {
                    this.audios.map(({id, url, title, artist, duration}, index) =>
                        <Tappable style={{borderRadius: 6}} onClick={() => {
                            t.audioControl.setPlaylist(this.audios);

                            t.switchBottomAudio(true);
                            t.audioControl.switchPlay(!t.audioControl.isPlay, index);
                        }}>
                            <div className='AudioItem'>
                                <div>
                                    {t.audioControl && t.audioControl.isPlayingSong(id) ?
                                        <Icon24Pause fill='#99A2AD'/>
                                        :
                                        <Icon24Play fill='#99A2AD'/>
                                    }
                                </div>
                                <div>
                                    <div>
                                        <p>{title}</p>
                                        <p>{artist}</p>
                                    </div>
                                    <p>{timeFormat(duration)}</p>
                                </div>
                            </div>
                        </Tappable>
                    )
                }
            </div>
            <div ref={ref => this.loadingRef = ref}/>
            <div id='empty'>{t.state._time}</div>
        </div>)
    }

}

class BottomAudio extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const
            {t} = this.props,
            {currentAudioData} = t.state
        ;

        return (
            <div className='AudioPlayer_Bottom'>
                <div className='AudioPlayer_Container'>
                    <IconButton onClick={() => t.audioControl.switchPlay()}>
                        {
                            t.audioControl.isPlay ?
                                <Icon24Pause fill='var(--color_accent)'/>
                                :
                                <Icon24Play fill='var(--color_accent)'/>
                        }
                    </IconButton>
                    <div className='AudioPlayer_Text'>
                        <p className='AudioPlayer_SongName'>
                            {currentAudioData.title}
                        </p>
                        <p className='AudioPlayer_SongAuthor'>
                            {currentAudioData.artist}
                        </p>
                    </div>
                    <IconButton onClick={() => {
                        t.switchBottomAudio(false);
                        t.audioControl.switchPlay(false);
                    }}>
                        <Icon24Cancel fill='#99A2AD'/>
                    </IconButton>
                    <div
                        className='AudioPlayer_BehindTappable'
                        onClick={() => t.setActiveModal(MODAL_PAGE_AUDIO_PLAYER)}
                    >
                        <Tappable/>
                    </div>
                </div>
            </div>
        );
    }

}

class Modals extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            audio_slider_value: 0,
            set_listener: false
        };

        this.audioSliderOnChange = this.audioSliderOnChange.bind(this);
    }

    async audioSliderOnChange(value) {
        if (this.lastChangeTimeout) clearTimeout(this.lastChangeTimeout);
        this.lastChangeTimeout = setTimeout(() => this.setState({isChangeSliderValue: false}), 100);

        this.setState({audio_slider_value: value, isChangeSliderValue: true});
        this.props.t.audioControl.audio.currentTime = value;
    }

    render() {
        const
            {props, state} = this,
            {t} = props,
            {audio_slider_value, isChangeSliderValue, set_listener} = state,
            {currentAudioData} = t.state
        ;

        if (t.state.activeModal === MODAL_PAGE_AUDIO_PLAYER && set_listener === false) {
            this.setState({set_listener: true});
            const {audio} = t.audioControl;
            audio.ontimeupdate = (e) => {
                if (!isChangeSliderValue)
                    this.setState({audio_slider_value: t.audioControl.audio.currentTime});
            }
        }

        return (
            <ModalRoot
                activeModal={t.state.activeModal}
            >
                <ModalPage
                    id={MODAL_PAGE_AUDIO_PLAYER}
                    onClose={() => t.setActiveModal(null)}
                >
                    <ModalPageHeader
                        after={
                            <PanelHeaderButton onClick={() => t.setActiveModal(null)}>
                                <Icon24Dismiss/>
                            </PanelHeaderButton>
                        }
                    />
                    <div className='AudioPlayerModal'>
                        <div className='AudioPlayerModal_Image'>
                            <Icon28SongOutline width={56} height={56} fill='#99A2AD'/>
                        </div>
                        <Slider
                            min={0}
                            max={currentAudioData.duration}
                            value={audio_slider_value}
                            onChange={value => this.audioSliderOnChange(value)}
                            step={1}
                        />
                        <div className='AudioPlayerModal_TimeCodes'>
                            <p>{timeFormat(audio_slider_value)}</p>
                            <p>-{timeFormat((currentAudioData.duration) - audio_slider_value)}</p>
                        </div>
                        <div className='AudioPlayerModal_Text'>
                            <p className='AudioPlayerModal_SongName'>
                                {currentAudioData.title}
                            </p>
                            <p className='AudioPlayerModal_SongAuthor'>
                                {currentAudioData.artist}
                            </p>
                        </div>
                        <div className='AudioPlayerModal_Controls'>
                            <IconButton onClick={() => t.audioControl.skipSong(false)}>
                                <Icon28SkipPrevious width={32} height={32}/>
                            </IconButton>
                            <IconButton onClick={() => t.audioControl.switchPlay()}>
                                {
                                    t.audioControl && t.audioControl.isPlay ?
                                        <Icon28Pause width={54} height={54}/>
                                        :
                                        <Icon28Play width={54} height={54}/>
                                }
                            </IconButton>
                            <IconButton onClick={() => t.audioControl.skipSong()}>
                                <Icon28SkipNext width={32} height={32}/>
                            </IconButton>
                        </div>
                    </div>
                </ModalPage>
            </ModalRoot>
        );
    }

}

class InputCodeComponent extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            code: ''
        }
    }

    render() {
        return (
            <React.Fragment>
                <Input style={{marginTop: 8}} value={this.state.code}
                       onChange={e => this.setState({code: e.currentTarget.value})}/>
                <div style={{
                    display: 'flex', gap: 12, marginTop: 8, flexDirection: 'column'
                }}>
                    <Button
                        size='m'
                        stretched
                        onClick={() => this.props.t.completeAuthWithCode(this.state.code)}
                    >
                        Продолжить
                    </Button>
                    <Button
                        mode='neutral'
                        stretched
                        size='m'
                        onClick={() => this.props.t.cancelAuth()}
                    >
                        Отмена
                    </Button>
                </div>
            </React.Fragment>
        );
    }

}

class AuthPanel extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            login: '',
            password: '',
            loading: false
        }

        this.auth = this.auth.bind(this);
    }

    cancelAuth() {
        this.props.t.setState({popout: null});
        this.setState({loading: false});
    }

    async completeAuthWithCode(code) {
        const data = await vk.auth(this.state.login, this.state.password, code);
        const data2 = await vk.isAuth();
        this.props.t.setProfileData(data2.response);

        this.props.t.setState({popout: null});
        this.setState({loading: false});
        this.props.t.setActivePanel('main');
    }

    async auth() {

        this.setState({loading: true});

        const
            {props, state} = this,
            {login, password} = state,
            data = await vk.auth(login, password)
        ;

        if (data.error) {
            props.t.setState({
                popout: <Alert
                    actions={[
                        {
                            title: 'Ок',
                            autoclose: true,
                            mode: 'cancel',
                        }
                    ]}
                    actionsLayout='vertical'
                    onClose={() => props.t.setState({popout: null})}
                    header='Произошла ошибка'
                    text={data.error}
                />
            });
            this.setState({loading: false});
        } else if (data.response.redirect_uri) {
            props.t.setState({
                popout: <Alert
                    onClose={() => {
                        props.t.setState({popout: null});
                        this.setState({loading: false});
                    }}
                    header='Введите код'
                    text='Код приходит в смс, или последние 4 цифры номера телефона, с которого вам позвонили.'
                >
                    <InputCodeComponent t={this}/>
                </Alert>
            });
        } else {
            const data2 = await vk.isAuth();
            this.props.t.setProfileData(data2.response);
            this.setState({loading: false});
            this.props.t.setActivePanel('main');
        }
    }

    render() {
        const
            {props, state} = this,
            {login, password, loading} = state
        ;

        return (
            <div className='AuthPanel'>
                <Icon56LogoVk width={90} height={90}/>
                <FormLayout>
                    <FormItem top='Логин'>
                        <Input value={login} onChange={e => this.setState({login: e.currentTarget.value})}/>
                    </FormItem>
                    <FormItem top='Пароль'>
                        <Input
                            type='password' value={password}
                            onChange={e => this.setState({password: e.currentTarget.value})}/>
                    </FormItem>
                    <Button
                        style={{margin: '12px 12px 0', width: '-webkit-fill-available'}} size='l'
                        mode='neutral'
                        loading={loading}
                        onClick={this.auth}
                    >
                        Войти
                    </Button>
                </FormLayout>
            </div>
        );
    }

}

class MainPanel extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const
            {state, setActivePanel, go, audioControl, setPopout} = this.props.t,
            {profileData} = state;

        return (
            <div className='MainPanel'>
                <div className='UserContainer'>
                    <Avatar size={36} src={profileData.photo_100} shadow={false}/>
                    <p>{profileData.first_name} {profileData.last_name}</p>
                </div>
                <div className='CategoriesContainer'>
                    <Tappable
                        onClick={async () => {
                            go('audio');
                        }}
                    >
                        <div className='CategoryInner'>
                            <Icon28MusicOutline fill='#4986CC'/>
                            <p>Моя музыка</p>
                        </div>
                    </Tappable>
                    <Tappable>
                        <div className='CategoryInner'>
                            <Icon28DownloadCheckOutline fill='#4986CC'/>
                            <p>Скачанная музыка</p>
                        </div>
                    </Tappable>
                </div>
                <Tappable
                    className='CategoryContainer' style={{marginTop: 12}}
                    onClick={() => {
                        vk.logout();
                        setActivePanel('auth');
                    }}
                >
                    <div className='CategoryInner' style={{flexDirection: 'row'}}>
                        <Icon28OnOffOutline width={24} height={24} fill='#E64646'/>
                        <p>Выйти из аккаунта</p>
                    </div>
                </Tappable>
            </div>
        );
    }

}

export default class Test extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: ['auth'],
            activePanel: 'auth',
            activeModal: null,
            bottom_audio_enabled: false,
            currentAudioData: {},
            profileData: {}
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.back = this.back.bind(this);
        this.go = this.go.bind(this);
        this.setActiveModal = this.setActiveModal.bind(this);
        this.switchBottomAudio = this.switchBottomAudio.bind(this);
        this.setPopout = this.setPopout.bind(this);
        this.setActivePanel = this.setActivePanel.bind(this);
        this.setProfileData = this.setProfileData.bind(this);

        setUserAgent(window, 'KateMobileAndroid/56 lite-460 (Android 4.4.2; SDK 19; x86; unknown Android SDK built for x86; en)');
    }

    async componentDidMount() {
        window.addEventListener('popstate', e => {
            e.preventDefault();
            this.back(e);
        });

        this.audioControl = new AudioControl(this);

        this.setPopout(<ScreenSpinner/>);
        const data = await vk.isAuth();
        console.log(data);
        if (data.error) {
            this.setActivePanel('auth');
            this.setPopout(<Alert
                actions={[
                    {
                        title: 'Ок',
                        autoclose: true,
                        mode: 'cancel',
                    }
                ]}
                actionsLayout='vertical'
                onClose={() => this.setPopout(null)}
                header='Произошла ошибка'
                text='Вы вышли из аккаунта'
            />);
        } else if (data.response) {
            this.setProfileData(data.response);
            this.setActivePanel('main');
            this.setPopout(null);
        } else if (data.error === undefined) {
            this.setPopout(<Alert
                actions={[
                    {
                        title: 'Ок',
                        autoclose: true,
                        mode: 'cancel',
                    }
                ]}
                actionsLayout='vertical'
                onClose={() => this.setPopout(null)}
                header='Произошла ошибка'
                text='Не удалось выполнить запрос'
            />);
        }
    }

    back() {
        if (this.state.popout !== null) {
            this.setState({popout: null});
            window.history.pushState({pop: 'popout'}, 'Title');
            return;
        }

        if (this.state.activeModal !== null) {
            this.setState({activeModal: null});
            window.history.pushState({modal: 'modal'}, 'Title');
            return;
        }

        let {history} = this.state;
        if (history.length > 1) {
            history.pop();
            this.setState({activePanel: history[history.length - 1], history, snackbar: null});
        }
    };

    go(panel) {
        let {history} = this.state;
        if (history[history.length - 1] !== panel) {
            history.push(panel);
            window.history.pushState({activePanel: panel}, 'Title');
            this.setState({activePanel: panel, history, snackbar: null, activeModal: null});
        }
    }

    setPopout(popout) {
        this.setState({popout});
    }

    setActivePanel(activePanel) {
        this.setState({activePanel, history: [activePanel]});
    }

    setProfileData(profileData) {
        this.setState({profileData});
    }

    setActiveModal(activeModal) {
        this.setState({activeModal})
    }

    switchBottomAudio(enabled = !this.state.bottom_audio_enabled) {
        this.setState({bottom_audio_enabled: enabled});
    }

    render() {
        const
            {state, go, back} = this,
            {activePanel, history, popout, bottom_audio_enabled} = state
        ;

        return (
            <View
                popout={popout}
                activePanel={activePanel}
                onSwipeBack={back}
                history={history}
                modal={<Modals t={this}/>}
            >
                <Panel id='auth'>
                    <AuthPanel t={this}/>
                </Panel>
                <Panel id='main'>
                    <MainPanel t={this}/>
                    {bottom_audio_enabled && <BottomAudio t={this}/>}
                </Panel>
                <Panel id='audio'>
                    <PanelHeader
                        separator={false}
                        left={<PanelHeaderBack onClick={this.back}/>}
                    >
                        Моя музыка
                    </PanelHeader>
                    <AudioList t={this}/>
                    {bottom_audio_enabled && <BottomAudio t={this}/>}
                </Panel>
            </View>
        );
    }
}