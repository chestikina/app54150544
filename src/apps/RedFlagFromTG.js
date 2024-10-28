import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/RedFlagFromTG.css';

import {
    AppRoot, Avatar,
    Button, CustomSelect, Input, ModalCard, ModalRoot,
    Panel,
    Placeholder, ScreenSpinner, Select, Text, Title,
    View, Spacing, ButtonGroup
} from '@vkontakte/vkui';

import {ReactComponent as IconResult} from "../assets/icons_death_date/2/megaphone (1).svg";
import RoundProgress from "../components/BattleStat/RoundProgress";
import {
    convertTextToLines,
    ctxDrawImageWithRound,
    get,
    getUrlParams,
    loadCrossOriginImage,
    loadFonts, openUrl, shortIntegers, sleep,
    toBlob
} from "../js/utils";
import {decOfNum, getRandomInt} from "../js/utils";
import fetch from "node-fetch";
import {createCanvas, loadImage} from "canvas";
import {
    defaultModalProps,
    defaultModalRootProps,
    defaultViewProps,
    initializeNavigation
} from "../js/defaults/navigation";
import {
    getStorageValue,
    getToken,
    setStorageValue,
    shareAlbumPhoto,
    subscribeBridgeEvents, vkApi
} from "../js/defaults/bridge_utils";
import {
    allowGroupMessages,
    getAppInfo,
    inputsSexAndYears,
    proxyUrl,
    subscribeGroup
} from "../js/defaults/catalin_tg_bot";
import {Icon56ArticleOutline, Icon56LogoVk} from "@vkontakte/icons";

export default class extends React.Component {

    constructor(props) {
        super(props);

        this.state = {}

        initializeNavigation.bind(this)('main');

        this.shareAlbum = this.shareAlbum.bind(this);
    }

    async componentDidMount() {
        subscribeBridgeEvents({}, 'space_gray');
        this.changeStatusBarColor();
        //this.setActiveModal('select-analyze');
        const app = await getAppInfo();
        await this.setState({...app});
        await bridge.send('VKWebAppInit');
    }

    changeStatusBarColor() {
        if (bridge.supports('VKWebAppSetViewSettings')) {
            bridge.send('VKWebAppSetViewSettings', {
                status_bar_style: 'light',
                action_bar_color: '#9950df'
            });
        }
    }

    async shareAlbum() {
        try {
            const {savePhotoAlbum, need_upload_default_album_photo, album_default_photo_url} = this.state;
            const {album_name, album_caption} = this.state.app;
            const {access_token} = this.state;
            if (access_token && savePhotoAlbum && need_upload_default_album_photo) {
                const
                    image = await loadCrossOriginImage(album_default_photo_url),
                    {createCanvas} = require('canvas'),
                    canvas = createCanvas(image.width, image.height),
                    ctx = canvas.getContext('2d')
                ;
                ctx.drawImage(image, 0, 0);
                const blob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob)));
                shareAlbumPhoto(blob, album_name, album_caption, access_token);
            }
        } catch (e) {
            console.error(e);
        }
    }

    render() {
        const profile = this.state.profile || {counters: {}};

        return (
            <View
                {...defaultViewProps.bind(this)()}
                modal={<ModalRoot
                    {...defaultModalRootProps.bind(this)()}
                >
                    <ModalCard
                        id='request-token'
                        {...defaultModalProps.bind(this)()}
                        icon={<Icon56LogoVk/>}
                        header="Необходимо предоставить доступ"
                        subheader="К сожалению, без доступа мы не можем проанализировать страницу. ВКонтакте не предоставляет информацию без доступа..."
                        actions={
                            <React.Fragment>
                                <Spacing size={16}/>
                                <Button
                                    size="l"
                                    mode="primary"
                                    stretched
                                    getRef={ref => this.analyzeBtn = ref}
                                    onClick={async () => {
                                        const access_token = await getToken('photos', true);
                                        await this.setState({access_token});
                                        await this.setActiveModal(null);
                                        await this.setPopout(<ScreenSpinner/>);
                                        const profile = await vkApi('users.get', {
                                            user_ids: this.input.value
                                                .replace(/https:\/\//g, '')
                                                .replace(/http:\/\//g, '')
                                                .replace(/m.vk.com\/id/g, '')
                                                .replace(/vk.com\/id/g, '')
                                                .replace(/m.vk.com\//g, '')
                                                .replace(/vk.com\//g, '')
                                                .replace(/@id/g, '')
                                                .replace(/@/g, ''),
                                            fields: ['first_name', 'last_name', 'photo_100', 'counters'].join(','),
                                            access_token
                                        });
                                        this.setPopout(null);
                                        this.shareAlbum();
                                        if (profile.response) {
                                            this.setState({profile: profile.response[0]})
                                            await this.go('profile');
                                        } else {
                                            this.setSnackbar('Произошла ошибка. Попробуйте ещё раз.');
                                        }
                                    }}
                                >
                                    Понятно
                                </Button>
                            </React.Fragment>
                        }
                    />
                    <ModalCard
                        id='select-analyze'
                        {...defaultModalProps.bind(this)()}
                        icon={<Icon56ArticleOutline/>}
                        header="Кого проверяем?"
                        subheader="Выбери, кого будем анализировать"
                        actions={
                            <ButtonGroup
                                gap='s'
                                mode='vertical'
                                stretched={true}
                            >
                                <Button
                                    size="l"
                                    mode="primary"
                                    stretched
                                    onClick={async () => {
                                        this.setActiveModal(null);
                                    }}
                                >
                                    Проверить по ссылке
                                </Button>
                                <ButtonGroup
                                    gap='s'
                                    mode='horizontal'
                                    stretched={true}
                                >
                                    <Button
                                        size="l"
                                        mode="secondary"
                                        stretched
                                        onClick={async () => {
                                            this.setActiveModal(null);
                                        }}
                                    >
                                        Выбрать друга
                                    </Button>
                                    <Button
                                        size="l"
                                        mode="outline"
                                        stretched
                                        onClick={async () => {
                                            this.setActiveModal(null);
                                        }}
                                    >
                                        Свой профиль
                                    </Button>
                                </ButtonGroup>
                            </ButtonGroup>
                        }
                    />
                </ModalRoot>}
            >
                <Panel id='main'>
                    <div className='centered'>
                        <h1>
                            Запустим проверку?
                        </h1>
                        <p>
                            Введите в поле ниже ссылку на страницу ВК
                        </p>
                        <Input
                            placeholder='https://vk.com/'
                            getRef={ref => this.input = ref}
                        />
                        <Button
                            size='m'
                            onClick={async () => {
                                if (this.input.value.length < 1) {
                                    this.setSnackbar('Вы не ввели ссылку :(');
                                } else {
                                    this.setActiveModal('request-token');
                                }
                            }}
                        >
                            Начать
                        </Button>
                    </div>
                    <div className='self-a'>
                        <Button
                            size='l'
                            mode='secondary'
                            onClick={async () => {
                                try {
                                    const friend = await bridge.send('VKWebAppGetFriends');
                                    const user_id = friend.users[0].id;
                                    this.input.value = `${user_id}`;
                                    this.setActiveModal('request-token');
                                } catch (e) {
                                }
                            }}
                        >
                            Анализ друга
                        </Button>
                        <p>или</p>
                        <Button
                            size='l'
                            mode='secondary'
                            onClick={() => {
                                this.input.value = `${this.state.vk_user.id}`;
                                this.setActiveModal('request-token');
                            }}
                        >
                            Анализ своего профиля
                        </Button>
                    </div>
                    {this.state.snackbar}
                </Panel>

                <Panel id='profile'>
                    <div className='profile-about'>
                        <img alt='img' src={profile.photo_100}/>
                        <div className='text-container'>
                            <h1>{profile.first_name} {profile.last_name}</h1>
                            <div className='counters'>
                                {
                                    [
                                        [
                                            'Посты',
                                            getRandomInt(1, 100)
                                        ],
                                        [
                                            'Подписчики',
                                            profile.counters.followers || getRandomInt(1, 100)
                                        ],
                                        [
                                            'Друзья',
                                            profile.counters.friends || getRandomInt(1, 500)
                                        ]
                                    ].map((value, index) =>
                                        <div key={`counter-${index}`}>
                                            <p>{value[0]}</p>
                                            <p>{value[1]}</p>
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                    {
                        [
                            [
                                [
                                    'Лайки',
                                    getRandomInt(0, 1000)
                                ],
                                [
                                    'Комментарии',
                                    getRandomInt(0, 1000)
                                ]
                            ],
                            [
                                [
                                    'Просмотры',
                                    getRandomInt(100, 100000)
                                ],
                                [
                                    'Репосты',
                                    getRandomInt(0, 100)
                                ]
                            ],
                            [
                                [
                                    'Подарки',
                                    getRandomInt(0, 500)
                                ],
                                [
                                    'ЧС',
                                    getRandomInt(0, 100)
                                ]
                            ]
                        ].map((v, i) =>
                            <div key={`cont-${i}`} className='info-container'>
                                {
                                    v.map((value, index) =>
                                        <div key={`cont-${i}-${index}`}>
                                            <p>{value[0]}</p>
                                            <p>{value[1]}</p>
                                        </div>
                                    )
                                }
                            </div>
                        )
                    }
                    {
                        [
                            'Утекшие переписки',
                            'Анализ активности',
                            'Скрытые друзья',
                            'Полученные лайки',
                            'Отправленные лайки',
                            'Полученные подарки',
                            'Отправленные подарки',
                            'Полученные комментарии',
                            'Отправленные комментарии',
                            'Подозрительные группы',
                            'Люди в ЧС'
                        ].map((value, index) =>
                            <div className='info-container-2' key={`cont-${index}`}>
                                <h1>{value}</h1>
                                <div>
                                    {
                                        new Array(getRandomInt(5, 14)).fill(0).map((value, index) =>
                                            <div key={`ls-${index}`}>
                                                {getRandomInt(1000, 1000000000000)}
                                            </div>
                                        )
                                    }
                                </div>
                                <span>
                                    Мы не можем раскрыть эти данные в ВК. Полные данные по ссылке в ТГ
                                    <Button
                                        onClick={() => {
                                            openUrl('https://t.me/red_flag_robot/redflag?startapp=ref_kt_appl1');
                                        }}
                                    >
                                        Перейти
                                    </Button>
                                </span>
                            </div>
                        )
                    }
                </Panel>
            </View>
        )
    }

}