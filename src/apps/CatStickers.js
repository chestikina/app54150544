import React from "react";
import {defaultViewProps, initializeNavigation} from "../js/defaults/navigation";
import {
    View,
    Panel,
    Placeholder,
    Button,
    PanelHeader,
    Headline,
    Subhead,
    Tappable,
    PanelHeaderBack,
    Link
} from "@vkontakte/vkui";
import '../css/CatStickers.css';
import {ReactComponent as IconMain} from '../assets/cat_stickers/icons/main.svg';
import {ReactComponent as IconYears} from '../assets/cat_stickers/icons/years.svg';
import {Icon24HandOutline, Icon28ChevronRightOutline} from "@vkontakte/icons";
import {getToken, subscribeBridgeEvents} from "../js/defaults/bridge_utils";
import {
    getAppInfo,
    inputsSexAndYears,
    buttonSexAndYears,
    subscribeGroup,
    allowGroupMessages, proxyUrl
} from "../js/defaults/catalin_tg_bot";
import bridge from "@vkontakte/vk-bridge";
import {getUrlParams, toBlob, get, openUrl} from "../js/utils";
import {createCanvas} from "canvas";
import fetch from "node-fetch";

let clicks = 0;


const payloadUrl = 'https://vds2153919.my-ihor.ru:8081/api/payload.send';

export default class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            sticker_info: {}
        };

        initializeNavigation.bind(this)();

        this.skipMain = this.skipMain.bind(this);
        this.skipUploadAlbum = this.skipUploadAlbum.bind(this);
        this.uploadAlbum = this.uploadAlbum.bind(this);
        this.goWithClick = this.goWithClick.bind(this);
        this.checkHash = this.checkHash.bind(this);
    }

    async goWithClick(e) {
        clicks++;

        if (clicks === 1) {
            await subscribeGroup.bind(this)();
            await allowGroupMessages.bind(this)();
        } else if (clicks === 2) {
            await subscribeGroup.bind(this)();
        }

        return this.go(e);
    }

    async componentDidMount() {
        subscribeBridgeEvents({}, 'bright_light');
        this.setState(await getAppInfo());
        bridge.send('VKWebAppInit');
    }

    checkHash() {
        let hash = window.location.hash;
        console.log(hash);
        if (hash.startsWith('#')) {
            hash = hash.substring(1);
            const findStr = 'stickers/';
            const sticker = this.hashStickers.find(value => value.url.substring(value.url.indexOf(findStr) + findStr.length) === hash);
            console.log(sticker);
            if (sticker) {
                this.setState({sticker_info: {...sticker, singleMode: true}, openFromHash: true});
                this.setActivePanel('sticker');
                setTimeout(async () => {
                    await subscribeGroup.bind(this)();
                    await allowGroupMessages.bind(this)();
                });
                return true;
            }
        }
        return false;
    }

    get stickers() {
        return [
            {
                title: 'Марк',
                author: 'Юлия Каменская',
                first_sticker: 77699,
                url: 'https://vk.com/stickers/catmark',
                stickers: 4 * 5
            },
            {
                title: 'Маффин',
                author: 'Анастасия Пятерникова',
                first_sticker: 71941,
                url: 'https://vk.com/stickers/muffin',
                stickers: 4 * 12
            },
            {
                title: 'Эмили',
                author: 'Кира Бауэр',
                first_sticker: 72135,
                url: 'https://vk.com/stickers/emily',
                stickers: 4 * 12
            },
            {
                title: 'Минто',
                author: 'Лана Моргана',
                first_sticker: 72789,
                url: 'https://vk.com/stickers/minty',
                stickers: 4 * 12
            },
        ]
    }

    get hashStickers() {
        return [
            {
                title: 'Линн',
                author: 'Ника Котова',
                first_sticker: 76981,
                url: 'https://vk.com/stickers/linn',
                stickers: 4 * 12
            },
            {
                title: 'Новогодний Чебурашка',
                author: 'Yellow, Black and White',
                first_sticker: 82095,
                url: 'https://vk.com/stickers/nycheburashka',
                stickers: 5
            },
            {
                title: 'Лиза и Матвей',
                author: 'Лана Моргана',
                first_sticker: 77651,
                url: 'https://vk.com/stickers/lizaandmatvei',
                stickers: 4 * 12
            },
            {
                title: 'Айс и Крим',
                author: 'Маша Колядина',
                first_sticker: 75290,
                url: 'https://vk.com/stickers/iceandcream',
                stickers: 4 * 12
            },
            {
                title: 'Эри',
                author: 'Эльвина Сейдалиева',
                first_sticker: 73539,
                url: 'https://vk.com/stickers/eri',
                stickers: 4 * 12
            },
            {
                title: 'Булькс',
                author: 'Эделия Исламова',
                first_sticker: 73055,
                url: 'https://vk.com/stickers/bloop',
                stickers: 4 * 12
            },
            {
                title: 'Тоши',
                author: 'Эльвина Сейдалиева',
                first_sticker: 72411,
                url: 'https://vk.com/stickers/toshi',
                stickers: 4 * 12
            },
            {
                title: 'Минто',
                author: 'Лана Моргана',
                first_sticker: 72789,
                url: 'https://vk.com/stickers/minty',
                stickers: 4 * 12
            },
            {
                title: 'Марк',
                author: 'Юлия Каменская',
                first_sticker: 77699,
                url: 'https://vk.com/stickers/catmark',
                stickers: 4 * 5
            },
            {
                title: 'Салли',
                author: 'Эльвина Сейдалиева',
                first_sticker: 83358,
                url: 'https://vk.com/stickers/sally',
                stickers: 4 * 12
            },
            {
                title: 'Марк',
                author: 'Эльвина Сейдалиева',
                first_sticker: 83310,
                url: 'https://vk.com/stickers/mark',
                stickers: 4 * 12
            },
            {
                title: 'Малиновый Джем',
                author: 'Азалия Сабирзянова',
                first_sticker: 84656,
                url: 'https://vk.com/stickers/raspberryjam',
                stickers: 4 * 12
            },
            {
                title: 'Тонг',
                author: 'Тимофей Китсунов',
                first_sticker: 84588,
                url: 'https://vk.com/stickers/tong',
                stickers: 4 * 12
            },
            {
                title: 'Мари и Хидэ',
                author: 'Лана Моргана',
                first_sticker: 84202,
                url: 'https://vk.com/stickers/maryandhide',
                stickers: 4 * 12
            },
        ]
    }

    async uploadAlbum() {
        const {need_upload_default_album_photo, album_default_photo_url} = this.state;
        const access_token = await getToken('photos');
        if (access_token && need_upload_default_album_photo) {
            const
                imageData = await toBlob(album_default_photo_url),
                image = new Image()
            ;
            image.src = imageData;
            await new Promise(res =>
                image.onload = () => res(true)
            );
            const
                {createCanvas} = require('canvas'),
                canvas = createCanvas(image.width, image.height),
                ctx = canvas.getContext('2d')
            ;
            ctx.drawImage(image, 0, 0);
            const
                blob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob))),
                {album_name, album_caption} = this.state.app,
                album_id = (await bridge.send('VKWebAppCallAPIMethod', {
                    method: 'photos.createAlbum',
                    params: {title: album_name, v: '5.126', access_token}
                })).response.id,
                uploadAlbumUrl = (await bridge.send('VKWebAppCallAPIMethod', {
                    method: 'photos.getUploadServer',
                    params: {album_id, v: '5.126', access_token}
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
                        console.debug('Photo saved: ', response);
                        await bridge.send('VKWebAppCallAPIMethod', {
                            method: 'photos.save',
                            params: {
                                album_id, server, photos_list, hash, caption: album_caption,
                                v: '5.126', access_token
                            }
                        });
                    });
            } catch (e) {
                console.error(e);
            }
        }

    }

    async skipMain(e) {
        await subscribeGroup.bind(this)();
        await allowGroupMessages.bind(this)();

        const {need_panel_upload_photo, savePhotoAlbum, need_panel_sex_years} = this.state;
        if (!need_panel_upload_photo) {
            if (need_panel_sex_years) {
                this.go('years');
            } else {
                if (!this.checkHash()) {
                    this.go(e);
                }
            }
            if (savePhotoAlbum) {
                this.uploadAlbum();
            }
        } else {
            this.go('upload_album');
        }
    }

    async skipUploadAlbum(e) {
        let act = e.currentTarget.dataset.act;
        const {savePhotoAlbum} = this.state;
        if (act === 'allow' || savePhotoAlbum) {
            this.uploadAlbum(await getToken('photos'));
        }
        get(payloadUrl, {
            ...getUrlParams(),
            key: 'save_photo',
            value: 'action',
            payload: act === 'allow' ? 'y' : 'n'
        });
        const {need_panel_sex_years} = this.state;
        if (need_panel_sex_years) {
            this.go('years');
        } else {
            if (!this.checkHash()) {
                this.go('stickers');
            }
        }
    }

    render() {
        const {sticker_info, openFromHash} = this.state;
        return (
            <View
                {...defaultViewProps.bind(this)()}
            >
                <Panel id='main'>
                    <Placeholder
                        icon={<IconMain/>}
                        header='Добро пожаловать'
                        action={<Button size='m' onClick={() => this.skipMain('stickers')}>
                            Продолжить
                        </Button>}
                        stretched
                    >
                        Здесь собраны все материалы, для бесплатного получения стикеров
                    </Placeholder>
                </Panel>
                <Panel id='years'>
                    <Placeholder
                        icon={<IconYears/>}
                        header='Укажите пол и возраст'
                        action={<Button size='m' onClick={() => {
                            const hash = this.checkHash();
                            buttonSexAndYears.bind(this)(!hash && 'stickers');
                        }}>
                            Дальше
                        </Button>}
                        stretched
                    >
                        <div className='Years_Inputs'>
                            {inputsSexAndYears.bind(this)()}
                        </div>
                    </Placeholder>
                </Panel>
                <Panel id='upload_album'>
                    <Placeholder
                        icon={<Icon24HandOutline width={96} height={96}/>}
                        header='Разрешите нам сохранить в вашем альбоме фотографию нашего приложения'
                        action={<div style={{display: 'flex', gap: 12}}>
                            <Button
                                stretched
                                size='m' onClick={this.skipUploadAlbum} data-act='allow'
                            >
                                Разрешить
                            </Button>
                            <Button
                                stretched
                                mode='secondary'
                                size='m' onClick={this.skipUploadAlbum} data-act='deny'
                            >
                                Не разрешать
                            </Button>
                        </div>}
                        stretched
                    >
                        Это нужно для того, чтобы рассказать большему количеству людей о том как получить бесплатные
                        стикеры
                    </Placeholder>
                </Panel>
                <Panel id='stickers'>
                    <PanelHeader separator={false}>
                        Стикеры
                    </PanelHeader>
                    <div className='StickersBanners'>
                        {
                            this.stickers.map((value, index) =>
                                <Tappable
                                    key={`sticker_banner_${index}`}
                                    onClick={() => {
                                        this.setState({sticker_info: value})
                                        this.goWithClick('sticker');
                                    }}
                                >
                                    <div className='Sticker_Info'>
                                        <img alt='sticker' src={`https://vk.com/sticker/1-${value.first_sticker}-256`}/>
                                        <div className='Sticker_Titles'>
                                            <Headline weight={2} level={1}>{value.title}</Headline>
                                            <Subhead>{value.author}</Subhead>
                                        </div>
                                    </div>
                                    <Icon28ChevronRightOutline/>
                                </Tappable>
                            )
                        }
                    </div>
                </Panel>
                <Panel id='sticker'>
                    <PanelHeader
                        separator={false}
                        left={!sticker_info.singleMode && <PanelHeaderBack onClick={this.back}/>}
                    >
                        Просмотр
                    </PanelHeader>
                    <div className='Sticker_Info'>
                        <div className='Sticker_Avatar'>
                            <img alt='sticker' src={`https://vk.com/sticker/1-${sticker_info.first_sticker}-256`}/>
                        </div>
                        <div className='Sticker_Titles'>
                            <Headline weight={2} level={1}>{sticker_info.title}</Headline>
                            <Subhead>{sticker_info.author}</Subhead>
                        </div>
                    </div>
                    <Subhead style={{margin: '18px 21px 0 21px'}}>
                        Для получения стикеров перейдите по ссылке <span
                        class='vkuiLink'
                        onClick={async () => {
                            get(payloadUrl, {
                                ...getUrlParams(),
                                key: 'stickers_click',
                                payload: 'view',
                                value: `${getUrlParams().vk_app_id}=${sticker_info.url.replace('https://', '')}`
                            });
                            if (openFromHash) {
                                await subscribeGroup.bind(this)();
                            }
                            openUrl(sticker_info.url);
                        }}>{sticker_info.url && sticker_info.url.replace('https://', '')}</span> и
                        нажмите кнопку «добавить»
                    </Subhead>
                    <div className='Stickers'>
                        {
                            new Array(sticker_info.stickers).fill(0).map((value, index) =>
                                <img
                                    key={`sticker_${index}`} alt='sticker'
                                    src={`https://vk.com/sticker/1-${sticker_info.first_sticker + index}-128`}
                                />
                            )
                        }
                    </div>
                </Panel>
            </View>
        );
    }

}