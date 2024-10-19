import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/VKAnalizator.css';
import '../css/Fonts.css';

import {
    Panel, ScreenSpinner, View
} from '@vkontakte/vkui';

import {
    animateValue,
    convertTextToLines, convertTextToLines2,
    ctxDrawImageWithRound,
    get, getBase64Image, getFilesYaDisk,
    getUrlParams, getYaDiskImage,
    loadCrossOriginImage,
    loadFonts, openUrl, replaceExtensionPath, shortIntegers, sleep,
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
    shareAlbumPhoto, shareWallPhoto,
    subscribeBridgeEvents, vkApi
} from "../js/defaults/bridge_utils";
import {
    allowGroupMessages,
    getAppInfo,
    inputsSexAndYears,
    proxyUrl,
    subscribeGroup
} from "../js/defaults/catalin_tg_bot";
import {albumApp, entryApp, resultApp, storyApp} from "../js/defaults/catalin_stats";
import {ReactComponent as TopRect} from "../assets/vk_analizator/background/top.svg";
import {ReactComponent as BottomRect} from "../assets/vk_analizator/background/bottom.svg";
import {ReactComponent as TopIcon} from "../assets/vk_analizator/result/top-icon.svg";
import parser from "fast-xml-parser";

function Progress(props) {
    const {percent} = props;
    const minValue = 6, maxValue = 319;
    const length = maxValue - minValue;
    const value = minValue + Math.round(length / 100 * percent);

    return <svg width="319" height="27" viewBox="0 0 319 27" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_412_810)">
            <path fillRule="evenodd" clipRule="evenodd"
                  d="M283 27H308.788L318.79 16.998V0H272.509L265.509 7H6.10352e-05V27H252H283Z" fill="#D6D6D6"/>
            <mask id="mask0_412_810" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="319"
                  height="27">
                <path fillRule="evenodd" clipRule="evenodd"
                      d="M283 27H308.788L318.79 16.998V0H272.509L265.509 7H6.10352e-05V27H252H283Z" fill="white"/>
            </mask>
            <g mask="url(#mask0_412_810)">
                <rect height="36" fill="#3B9EE4" style={{
                    transition: 'all 100ms ease-in-out',
                    width: value
                }}/>
                <mask id="path-4-inside-1_412_810" fill="white">
                    <path fillRule="evenodd" clipRule="evenodd"
                          d="M283 27H308.788L319 16.7875V0H272.508L265.508 7H2V27H252H283Z"/>
                </mask>
                <path
                    d="M308.788 27L311.616 29.8284L310.444 31H308.788V27ZM319 16.7875H323V18.4444L321.828 19.6159L319 16.7875ZM319 0V-4H323V0H319ZM272.508 0L269.68 -2.82843L270.852 -4H272.508V0ZM265.508 7L268.337 9.82843L267.165 11H265.508V7ZM2 7H-2V3H2V7ZM2 27V31H-2V27H2ZM308.788 31H283V23H308.788V31ZM321.828 19.6159L311.616 29.8284L305.959 24.1716L316.172 13.9591L321.828 19.6159ZM323 0V16.7875H315V0H323ZM272.508 -4H319V4H272.508V-4ZM262.68 4.17157L269.68 -2.82843L275.337 2.82843L268.337 9.82843L262.68 4.17157ZM265.508 11H2V3H265.508V11ZM6 7V27H-2V7H6ZM2 23H252V31H2V23ZM252 23H283V31H252V23Z"
                    fill="white" mask="url(#path-4-inside-1_412_810)"/>
            </g>
        </g>
        <defs>
            <clipPath id="clip0_412_810">
                <rect width="318.789" height="27" fill="white"/>
            </clipPath>
        </defs>
    </svg>
}

function CircleDiagram(props) {
    const {values} = props;
    const circleLength = 2 * Math.PI * 19.5;
    const firstCircleLength = circleLength * (values[0] / 100);
    const secondCircleLength = circleLength - firstCircleLength;
    return <svg width='69' height='69' viewBox='0 0 69 69' xmlns='http://www.w3.org/2000/svg' id='circle-diagram'>
        <circle cx='34.5' cy='34.5' r='19.5' fill='none' stroke='#3B9EE4' strokeWidth='21'
                strokeDasharray={`${firstCircleLength} ${secondCircleLength}`} strokeLinecap='butt'
                transform='rotate(-180 34.5 34.5)'/>
        <circle cx='34.5' cy='34.5' r='19.5' fill='none' stroke='#FF5186' strokeWidth='21'
                strokeDasharray={`${secondCircleLength} ${firstCircleLength}`} strokeLinecap='butt'
                transform={`rotate(${-180 + 360 / 100 * values[0]} 34.5 34.5)`}/>
    </svg>
}

export default class extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            user_save_photo_album: true,
            analyze: true,

            regDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
            maxViews: 12565,
            friends_data: {
                woman: 29,
                men: 71
            }
        }

        initializeNavigation.bind(this)('main');

        this.getStoryCanvas = this.getStoryCanvas.bind(this);
        this.shareStory = this.shareStory.bind(this);
        this.shareAlbum = this.shareAlbum.bind(this);
    }

    async componentDidMount() {
        subscribeBridgeEvents({}, 'bright_light');
        this.changeStatusBarColor();

        const app = await getAppInfo();
        await this.setState({...app});
        await bridge.send('VKWebAppInit');

        this.setPopout(<ScreenSpinner/>);
        await loadFonts(['PP Neue Machina Ultrabold']);
        this.setPopout(null);

        entryApp();
    }

    changeStatusBarColor() {
        if (bridge.supports('VKWebAppSetViewSettings')) {
            bridge.send('VKWebAppSetViewSettings', {
                status_bar_style: 'light',
                action_bar_color: '#FFFFFF'
            });
        }
    }

    async getStoryCanvas() {
        const
            {regDate, maxViews, friends_data} = this.state,
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d'),
            background = await loadImage(require('../assets/vk_analizator/background/story.webp'))
        ;

        ctx.drawImage(background, 0, 0, 1080, 1920);

        ctx.textAlign = 'left';

        ctx.fillStyle = '#86CDFF';
        ctx.font = '54px PP Neue Machina Ultrabold';
        ctx.fillText(`С ${new Date(regDate).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        })} ПО ${new Date().toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        })}`, 109, 811 + 43);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '75px PP Neue Machina Ultrabold';
        ctx.fillText(shortIntegers(maxViews), 358.8, 998 + 60);

        ctx.fillStyle = '#000A17';
        ctx.font = '75px PP Neue Machina Ultrabold';
        ctx.fillText(`${friends_data.men}%`, 320.12, 1297.92 + 67);
        ctx.fillText(`${friends_data.woman}%`, 575.12, 1297.92 + 67);

        /*
        * Рисуем диаграмму
        * */
        const percent = friends_data.men;
        const circleLength = 2 * Math.PI * 19.5;
        const firstCircleLength = circleLength * (percent / 100);
        const secondCircleLength = circleLength - firstCircleLength;
        const svgDiagram = `<svg width='69' height='69' viewBox='0 0 69 69' xmlns='http://www.w3.org/2000/svg' id='circle-diagram'>
                <circle cx='34.5' cy='34.5' r='19.5' fill='none' stroke='#3B9EE4' stroke-width='21'
                        stroke-dasharray='${firstCircleLength} ${secondCircleLength}' stroke-linecap='butt'
                        transform='rotate(-180 34.5 34.5)'/>
                <circle cx='34.5' cy='34.5' r='19.5' fill='none' stroke='#FF5186' stroke-width='21'
                        stroke-dasharray='${secondCircleLength} ${firstCircleLength}' stroke-linecap='butt'
                        transform='rotate(${-180 + 360 / 100 * percent} 34.5 34.5)'/>
            </svg>`;
        const svgBlob = new Blob([svgDiagram], {type: 'image/svg+xml;charset=utf-8'});
        const blobUrl = URL.createObjectURL(svgBlob);
        const imgDiagram = new Image();
        setTimeout(() => imgDiagram.src = blobUrl, 1);
        await new Promise(res => imgDiagram.onload = res);
        URL.revokeObjectURL(blobUrl);
        ctx.drawImage(imgDiagram, 70, 1265, 200, 200);
        /*========================*/

        return canvas;
    }

    async shareStory() {
        try {
            this.setPopout(<ScreenSpinner/>);
            const canvas = await this.getStoryCanvas();
            this.setPopout(null);
            await bridge.send('VKWebAppShowStoryBox', {
                background_type: 'image',
                blob: canvas.toDataURL('image/png'),
                attachment: {
                    text: 'go_to',
                    type: 'url',
                    url: `https://vk.com/app${getUrlParams().vk_app_id}`
                }
            });
            storyApp();

            if (this.state.token) {
                canvas.toBlob(async function (blob) {
                    const {album_name, album_caption} = this.state.app;
                    await shareWallPhoto(blob, album_caption, `https://vk.com/app${getUrlParams().vk_app_id}`, this.state.token);
                }.bind(this));
            }
        } catch (e) {
            console.error(e);
        }
    }

    async shareAlbum() {
        const
            canvas = await this.getStoryCanvas(),
            blob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob)))
        ;

        const {album_name, album_caption} = this.state.app;
        try {
            const res = await shareAlbumPhoto(blob, album_name, album_caption, this.state.token);
            if (res >= 0) {
                albumApp();
            }
        } catch (e) {
        }
    }

    async analyze() {
        let startTime = Date.now();
        const access_token = this.state.token;
        animateValue.bind(this)(this.percentRef, 0, 10, 2000, '%');
        try {
            const getRegDate = await fetch(`https://groups.adminbase.ru/api/users.getRegDate?user_id=${this.state.vk_user.id}`).then(r => r.json());
            if (getRegDate.response) {
                const
                    dateJSON = (parser.parse(getRegDate.response, {
                        attrNodeName: 'attr',
                        textNodeName: '#text',
                        ignoreAttributes: false
                    }))['rdf:RDF']['foaf:Person'],
                    regDate = dateJSON['ya:created'].attr['@_dc:date']
                ;
                this.setState({regDate});
                animateValue.bind(this)(this.percentRef, 10, 90, 3000, '%');
                const wall = await vkApi('wall.get', {count: 100, access_token});
                const friends = await vkApi('friends.get', {count: 5000, fields: 'sex', access_token});
                if (wall && wall.response) {
                    let maxViews;
                    if (wall.response.items.length > 0) {
                        maxViews = Math.max(...wall.response.items.map(v => v.views.count));
                    } else {
                        if (friends && friends.response && friends.response.count > 0) {
                            maxViews = friends.response.count * 2;
                        } else {
                            maxViews = getRandomInt(0, 1000);
                        }
                    }
                    const accYears = new Date().getFullYear() - new Date(regDate).getFullYear();
                    if (accYears > 1) {
                        maxViews *= Math.floor(accYears / 2);
                    } else if (accYears === 1) {
                        maxViews *= 2;
                    }

                    let friends_data = {woman: 0, men: 0};
                    if (friends && friends.response && friends.response.count > 0) {
                        friends.response.items.forEach(user => {
                            friends_data[user.sex === 1 ? 'woman' : 'men']++;
                        });
                        friends_data.woman = Math.round(100 / friends.response.count * friends_data.woman);
                        friends_data.men = 100 - friends_data.woman;
                    } else {
                        friends_data.woman = getRandomInt(0, 100);
                        friends_data.men = 100 - friends_data.woman;
                    }

                    await this.setState({maxViews, friends_data});
                    console.log({maxViews, friends_data});

                    const analyzeEnd = async () => {
                        animateValue.bind(this)(this.percentRef, 90, 100, 100, '%');
                        this.setState({analyze: false})
                    };

                    if ((Date.now() - startTime) < (2000 + 3000)) {
                        setTimeout(analyzeEnd, (2000 + 3000) - (Date.now() - startTime) + 100);
                    } else {
                        analyzeEnd();
                    }
                } else {
                    throw new Error('Ошибка: не удалось получить записи на стене');
                }
            } else {
                throw new Error('Ошибка: не удалось получить дату регистрации');
            }
        } catch (e) {
            console.error(e);
            this.back();
            this.setSnackbar(e.message.includes('Ошибка:') ? e.message : `Произошла ошибка. Попробуйте позже.`);
        }
    }

    render() {
        const {vk_user, need_panel_upload_photo, analyze, snackbar, regDate, maxViews, friends_data} = this.state;

        return (
            <View
                {...defaultViewProps.bind(this)()}
            >

                <Panel id='main'>
                    <TopRect className='top-rect'/>
                    <BottomRect className='bottom-rect'/>
                    <div
                        className='title'
                        style={{
                            background: `url(${require('../assets/vk_analizator/main/title.svg').default}) no-repeat 100%`
                        }}
                    >
                        <h1>ты попал</h1>
                        <h1>в анализатор</h1>
                    </div>
                    <h1 className='right-rect'>анализатор</h1>
                    <div
                        className='text'
                        style={{
                            background: `url(${require('../assets/vk_analizator/main/text.svg').default}) no-repeat 100%`
                        }}
                    >
                        <p>
                            Мы расскажем тебе сколько приблизительно было гостей на твоей странице за всю её историю
                        </p>
                        <div
                            style={{
                                display: need_panel_upload_photo ? 'flex' : 'none'
                            }}
                        >
                            <input
                                type='checkbox'
                                id='save_album'
                                defaultChecked
                                onChange={e => {
                                    this.setState({user_save_photo_album: e.target.checked})
                                }}
                            />
                            <label htmlFor='save_album'>Сохранить результат в альбом</label>
                        </div>
                    </div>
                    <div className='bottom-container'>
                        <p>
                            Жми разрешить, чтобы я получила <span>данные о твоей странице</span>
                        </p>
                        <div
                            className='button'
                            style={{
                                background: `url(${require('../assets/vk_analizator/main/btn.svg').default}) no-repeat 100%`
                            }}
                            onClick={async () => {
                                await this.setState({token: await getToken('photos,friends', true)});
                                await this.go('analyze');

                                setTimeout(() => this.analyze(), 1000);
                            }}
                        >
                            разрешить
                        </div>
                    </div>
                    <img alt='bg' className='bg' src={require('../assets/vk_analizator/background/main.webp')}/>
                    {snackbar}
                </Panel>

                <Panel id='analyze'>
                    <TopRect className='top-rect'/>
                    <BottomRect className='bottom-rect' style={{
                        bottom: analyze && -86
                    }}/>
                    <div
                        className='title'
                        style={{
                            background: `url(${require('../assets/vk_analizator/analyze/title.svg').default}) no-repeat 100%`
                        }}
                    >
                        <h1>анализ</h1>
                        <h1>{analyze ? 'в процессе...' : 'завершен'}</h1>
                    </div>
                    <h1 className='right-rect'>анализатор</h1>
                    <div className='progress'>
                        <h1 ref={ref => this.percentRef = ref}>0%</h1>
                        <Progress percent={this.percentRef ? parseInt(this.percentRef.innerText) : 0}/>
                    </div>
                    <div
                        className='text'
                        style={{
                            background: `url(${require('../assets/vk_analizator/analyze/text.svg').default}) no-repeat 100%`,
                            opacity: analyze ? 0 : 1
                        }}
                    >
                        <p>
                            Помимо количества твоих посетителей я могу рассказать о том, какие {vk_user && vk_user.sex === 1 ? 'парни' : 'девушки'} тобой
                            интересуются.
                            <br/>Для этого жми «Рассказать»
                        </p>
                    </div>
                    <div
                        className='button'
                        style={{
                            background: `url(${require('../assets/vk_analizator/analyze/btn.svg').default}) no-repeat 100%`,
                            opacity: analyze ? 0 : 1
                        }}
                        onClick={async () => {
                            // Разрешение на лс

                            // Переход на результат
                            this.go('result');
                        }}
                    >
                        рассказать
                    </div>
                    <div
                        className='button2'
                        style={{
                            opacity: analyze ? 0 : 1
                        }}
                        onClick={() => {
                            this.go('result');
                        }}
                    >
                        перейти к результату
                    </div>
                    <img alt='bg' className='bg' src={require(`../assets/vk_analizator/background/analyze${analyze ? '' : '_end'}.webp`)}/>
                </Panel>

                <Panel id='result'>
                    <TopRect className='top-rect'/>
                    <BottomRect className='bottom-rect'/>
                    <div
                        className='title'
                        style={{
                            background: `url(${require('../assets/vk_analizator/result/title.svg').default}) no-repeat 100%`
                        }}
                    >
                        <p>За период:</p>
                        <h3>
                            с {
                            regDate ? new Date(regDate).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'numeric',
                                year: 'numeric'
                            }) : ''} по {
                            new Date().toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'numeric',
                                year: 'numeric'
                            })}
                        </h3>
                        <p>Твою страницу посетили приблизительно:</p>
                    </div>
                    <div
                        className='text'
                        style={{
                            background: `url(${require('../assets/vk_analizator/result/text.svg').default}) no-repeat 100%`
                        }}
                    >
                        {
                            maxViews && <React.Fragment>
                                <p>{shortIntegers(maxViews)}</p>
                                <p>{decOfNum(maxViews, ['человек', 'человека', 'человек'], false)}</p>
                            </React.Fragment>
                        }
                    </div>
                    <div
                        className='text2'
                        style={{
                            background: `url(${require('../assets/vk_analizator/result/text2.svg').default}) no-repeat 100%`
                        }}
                    >
                        <CircleDiagram values={[friends_data.men, friends_data.woman]}/>
                        <p>
                            {friends_data.men}%
                            <p>мужчин</p>
                        </p>
                        <p>
                            {friends_data.woman}%
                            <p>женщин</p>
                        </p>
                    </div>
                    <div className='bottom-container'>
                        <div
                            className='button'
                            style={{
                                background: `url(${require('../assets/vk_analizator/result/btn-top.svg').default}) no-repeat 100%`
                            }}
                            onClick={() => {
                                this.go('top');
                            }}
                        >
                            <TopIcon/>
                            <p>топ</p>
                        </div>
                        <div
                            className='button'
                            style={{
                                background: `url(${require('../assets/vk_analizator/result/btn-story.svg').default}) no-repeat 100%`
                            }}
                            onClick={() => {
                                this.shareStory();
                            }}
                        >
                            <p>поделиться</p>
                            <p>в истории</p>
                        </div>
                    </div>
                    <h1 className='right-rect'>анализатор</h1>
                    <img alt='bg' className='bg' src={require('../assets/vk_analizator/background/result.webp')}/>
                </Panel>

                <Panel id='top'>
                    <TopRect className='top-rect'/>
                    <BottomRect className='bottom-rect'/>
                    <div
                        className='title'
                        style={{
                            background: `url(${require('../assets/vk_analizator/top/title.svg').default}) no-repeat 100%`
                        }}
                    >
                        <h1>топ</h1>
                        <h1>пользователей</h1>
                    </div>
                    <h1 className='right-rect'>анализатор</h1>
                    <div
                        className='user-rate'
                        style={{
                            background: `url(${require('../assets/vk_analizator/top/user-me.svg').default})`
                        }}
                    >
                        <img alt='avatar' src={vk_user && vk_user.photo_100}/>
                        <div>
                            {
                                vk_user &&
                                <React.Fragment>
                                    <p>{vk_user.first_name} {vk_user.last_name}</p>
                                    <p>{shortIntegers(maxViews)} {decOfNum(maxViews, ['гость', 'гостя', 'гостей'], false)}</p>
                                </React.Fragment>
                            }
                        </div>
                        <div>
                            <p>1245</p>
                            <p>место</p>
                        </div>
                    </div>
                    <div className='users-rate'>
                        {
                            new Array(10).fill(0).map((value, index) =>
                                <div
                                    key={`user-${index}`}
                                    style={{
                                        background: `url(${require('../assets/vk_analizator/top/user.svg').default})`
                                    }}
                                >
                                    <img alt='avatar' src={vk_user && vk_user.photo_100}/>
                                    <div>
                                        {
                                            vk_user &&
                                            <React.Fragment>
                                                <p>{vk_user.first_name} {vk_user.last_name}</p>
                                                <p>{shortIntegers(maxViews)} {decOfNum(maxViews, ['гость', 'гостя', 'гостей'], false)}</p>
                                            </React.Fragment>
                                        }
                                    </div>
                                    <p>{index + 1}</p>
                                </div>
                            )
                        }
                    </div>
                    <div className='shadow'/>
                    <div
                        className='button'
                        style={{
                            background: `url(${require('../assets/vk_analizator/top/btn.svg').default}) no-repeat 100%`
                        }}
                        onClick={() => {
                            this.back();
                        }}
                    >
                        вернуться назад
                    </div>
                    <img alt='bg' className='bg' src={require('../assets/vk_analizator/background/top.webp')}/>
                </Panel>

            </View>
        )
    }

}