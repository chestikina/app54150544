import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/BattleStat/BattleStat.css';

import {
    AppRoot,
    Button, Div, HorizontalScroll, ModalPage, ModalRoot,
    Panel, PanelHeader, PanelHeaderBack, PanelSpinner,
    Placeholder, PromoBanner, ScreenSpinner,
    View
} from '@vkontakte/vkui';

import HorizontalCard from "../components/BattleStat/HorizontalCard";
import {Icon16Play, Icon20StoryOutline} from "@vkontakte/icons";
import {cps, loadFonts, rgbToHex, getRandomInt, shortIntegers} from "../js/utils";
import {ReactComponent as Ghost} from "../assets/icons_battle_stat/mini-game/cps/Ghost.svg";
import {ReactComponent as Boss} from "../assets/icons_battle_stat/mini-game/boss/Noob.svg";
import HorizontalProgress from "../components/BattleStat/HorizontalProgress";
import VerticalSlides from "../components/BattleStat/VerticalSlides";
import RoundProgress from "../components/BattleStat/RoundProgress";

const slideColors = [
    '#2F2F2F',
    '#2A2A2A',
    '#252525',
    '#212121',
    '#1C1C1C',
    '#171717'
];
let advertInterval, gameTimeout, gameInterval;
class BattleStat extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: ['main'],
            activePanel: 'main',

            mini_game: {},
            mini_game_clicks: [],
            mini_game_start: 0,

            slide_index: 0
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.back = this.back.bind(this);
        this.go = this.go.bind(this);

        this.vkParams = () => window.location.search.length > 0 && JSON.parse('{"' + decodeURI(window.location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
    }

    async componentDidMount() {
        if(window.location.hash === '#story'){
            fetch('https://ulyanov.site/clickerbattle/api/bs.click?vk_user_id=' + this.vkParams().vk_user_id, {method: 'GET'});
        }

        window.addEventListener('offline', () => {
            this.setState({activePanel: 'placeholder', history: ['placeholder'], popout: null});
            try {
                clearTimeout(gameTimeout);
            } catch (e) {
            }
            try {
                clearInterval(gameInterval);
            } catch (e) {
            }
        });

        window.addEventListener('online', () => {
            if (this.state.activePanel === 'placeholder') {
                this.setState({activePanel: 'main', history: ['main']});
                document.body.style.setProperty('--pslide_background_content', slideColors[this.state.slide_index]);
            }
        });

        window.addEventListener('popstate', e => {
            e.preventDefault();
            this.back();
        });

        loadFonts(['SF Pro Rounded Semibold', 'SF Pro Rounded Bold', 'SF Pro Rounded', 'SF Pro Text', 'Manrope', 'SF UI Display', 'SF Pro Display Semibold']);

        bridge.subscribe(async ({detail: {type, data}}) => {
            if (type !== undefined) console.log(type, data);
            if (type === 'VKWebAppUpdateConfig') {
                const schemeAttribute = document.createAttribute('scheme');
                schemeAttribute.value = 'space_gray';
                document.body.attributes.setNamedItem(schemeAttribute);
            } else if (type === 'VKWebAppViewRestore') {
                this.setState({popout: null});
            }
        });

        bridge.send('VKWebAppInit');
        advertInterval = bridge.supports('VKWebAppGetAds') && setInterval(async () => this.setState({advert_data: await bridge.send('VKWebAppGetAds', {})}), 10000);
    }

    back = () => {
        let {history, popout, activePanel} = this.state;

        if (popout !== null) {
            if (!activePanel.startsWith('game_')) {
                this.setState({popout: null});
            }
            window.history.pushState({pop: 'popout'}, 'Title');
            return;
        }

        if (history.length === 1) {
            bridge.send('VKWebAppClose', {status: 'success', message: 'Возвращайтесь ещё!'});
        } else if (history.length > 1) {
            if (activePanel.startsWith('game_') && activePanel.indexOf('result') === -1) {
                try {
                    clearTimeout(gameTimeout);
                } catch (e) {
                }
                try {
                    clearInterval(gameInterval);
                } catch (e) {
                }
            }
            history.pop();
            this.setState({activePanel: history[history.length - 1], history});
        }
    };

    go(panel) {
        let {history} = this.state;
        if (history[history.length - 1] !== panel) {
            if (panel.indexOf('result') > -1)
                history.pop();

            history.push(panel);
            window.history.pushState({activePanel: panel}, 'Title');

            this.setState({activePanel: panel, history, activeModal: null});
        }
    }

    async share(blob) {
        try {
            await bridge.send('VKWebAppShowStoryBox', {
                background_type: 'image',
                blob,
                attachment: {
                    text: 'go_to',
                    type: 'url',
                    url: `https://vk.com/app${this.vkParams().vk_app_id}#story`
                }
            });
            console.log('fetch');
            fetch('https://ulyanov.site/clickerbattle/api/bs.share?vk_user_id=' + this.vkParams().vk_user_id, {method: 'GET'});
            return true;
        } catch (e) {
            return false;
        }
    }

    async share7() {
        this.setState({popout: <ScreenSpinner/>});
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d')
        ;

        loadImage(require('../assets/icons_battle_stat/story/share_7.png')).then(async background => {
            ctx.drawImage(background, 0, 0);
            ctx.textAlign = 'left';
            ctx.fillStyle = '#FFFFFF';

            ctx.font = '74.78px SF Pro Rounded';
            ctx.fillText(this.state.mini_game.mid_cps, 101.02, 708.19 + 71);
            ctx.fillText(this.state.mini_game.max_cps, 101.02, 1120.19 + 71);
            ctx.fillText(this.state.mini_game.min_cps, 607.02, 1120.19 + 71);

            this.setState({popout: null});
            this.share(canvas.toDataURL('image/png'));
        });
    }

    async share8() {
        this.setState({popout: <ScreenSpinner/>});
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d')
        ;

        loadImage(require('../assets/icons_battle_stat/story/share_8.png')).then(async background => {
            ctx.drawImage(background, 0, 0);
            ctx.textAlign = 'left';
            ctx.fillStyle = '#FFFFFF';

            ctx.font = '74.78px SF Pro Rounded';
            ctx.fillText(shortIntegers(this.state.mini_game.mid_time) + ' мс', 101.02, 708.19 + 71);
            ctx.fillText(shortIntegers(this.state.mini_game.max_time) + ' мс', 101.02, 1120.19 + 71);
            ctx.fillText(shortIntegers(this.state.mini_game.min_time) + ' мс', 607.02, 1120.19 + 71);

            this.setState({popout: null});
            this.share(canvas.toDataURL('image/png'));
        });
    }

    async share9() {
        this.setState({popout: <ScreenSpinner/>});
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d')
        ;

        loadImage(require('../assets/icons_battle_stat/story/share_9.png')).then(async background => {
            ctx.drawImage(background, 0, 0);
            ctx.textAlign = 'left';
            ctx.fillStyle = '#FFFFFF';

            ctx.font = '74.78px SF Pro Rounded';
            ctx.fillText((this.state.mini_game.time / 1000).toFixed(1).replace('.', ',') + ' сек', 101.02, 708.19 + 71);
            ctx.fillText((this.state.mini_game.inCenter / 1000).toFixed(1).replace('.', ',') + ' сек', 101.02, 1120.19 + 71);
            ctx.fillText((this.state.mini_game.inEdge / 1000).toFixed(1).replace('.', ',') + ' сек', 607.02, 1120.19 + 71);

            this.setState({popout: null});
            this.share(canvas.toDataURL('image/png'));
        });
    }

    async share10() {
        this.setState({popout: <ScreenSpinner/>});
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d')
        ;

        loadImage(require('../assets/icons_battle_stat/story/share_10.png')).then(async background => {
            ctx.drawImage(background, 0, 0);
            ctx.textAlign = 'left';
            ctx.fillStyle = '#FFFFFF';

            ctx.font = '74.78px SF Pro Rounded';
            ctx.fillText((this.state.mini_game.time / 1000).toFixed(1).replace('.', ',') + ' сек', 101.02, 708.19 + 71);
            ctx.fillText(this.state.mini_game.cps_top, 101.02, 1120.19 + 71);
            ctx.fillText(this.state.mini_game.cps_bottom, 607.02, 1120.19 + 71);

            this.setState({popout: null});
            this.share(canvas.toDataURL('image/png'));
        });
    }

    async initMiniGameCounter(text) {
        window.history.pushState({pop: 'popout'}, 'Title');

        if (bridge.supports('VKWebAppSetViewSettings'))
            bridge.send('VKWebAppSetViewSettings', {
                status_bar_style: 'light',
                action_bar_color: '#050505'
            });

        await this.setState({
            mini_game_clicks: [],
            mini_game: {},
            popout: <div className='MiniGame_Popout'>
                <div className='MiniGame_Counter'>5</div>
                <div style={{height: '1.48vh'}}/>
                <div className='MiniGame_Title'>
                    Что нужно делать?
                </div>
                <div style={{height: '1.97vh'}}/>
                <div className='MiniGame_Description'>
                    {text}
                </div>
            </div>
        });

        return await new Promise((res, rej) => {
            const
                interval_ = setInterval(async () => {
                    try {
                        const counter = document.getElementsByClassName('MiniGame_Counter')[0];
                        if (counter.innerText != 1) {
                            counter.innerText = parseInt(counter.innerText) - 1;
                        } else {
                            counter.innerText = 'СТАРТ';
                            document.getElementsByClassName('MiniGame_Popout')[0].classList.add('MiniGame_Popout_Hide');
                            setTimeout(() => {
                                this.setState({popout: null});
                                if (bridge.supports('VKWebAppSetViewSettings'))
                                    bridge.send('VKWebAppSetViewSettings', {
                                        status_bar_style: 'light',
                                        action_bar_color: '#212121'
                                    });
                            }, 400);
                            res(true);
                            clearInterval(interval_);
                        }
                    } catch (e) {
                        console.error(e);
                        res(false);
                        clearInterval(interval_);
                    }
                }, 1000);
        });
    }

    async initGameCps() {
        this.setState({mini_game_counter: 10});
        await this.initMiniGameCounter('У Вас есть 10 секунд на то, чтобы успеть как можно больше раз кликнуть по призраку.');
        if (this.state.activePanel !== 'placeholder') {
            gameInterval = setInterval(() => {
                const mini_game_counter = this.state.mini_game_counter - 1;
                this.setState({mini_game_counter});

                if (mini_game_counter === 0)
                    clearInterval(gameInterval);
            }, 1000);
            gameTimeout = setTimeout(() => {
                const {mid_cps, max_cps, min_cps} = cps(this.state.mini_game_clicks);
                this.setState({
                    mini_game: {mid_cps, max_cps, min_cps}
                });
                this.go('game_cps_result');
            }, 10000);
        }
    }

    async initGameBoss() {
        await this.initMiniGameCounter('Вам необходимо закликать босса до смерти.');
    }

    async initGameReaction() {
        await this.initMiniGameCounter('На экране появится всего 10 зон, на которые нужно очень быстро нажать.');
        await this.setState({mini_game: {zone: 0}});
        let zoneClick;
        zoneClick = async (e) => {
            const
                zones = document.getElementById('zones'),
                zone = document.createElement('img');

            zones.innerHTML = '';

            if (e) {
                const {mini_game_clicks} = this.state;
                mini_game_clicks.push(Date.now());
                await this.setState({mini_game_clicks});
            }

            if (this.state.mini_game.zone === 10) {
                const
                    {mini_game_clicks} = this.state,
                    times_array = []
                ;

                for (let i = 0; i < mini_game_clicks.length; i += 2) {
                    const
                        spawnTime = mini_game_clicks[i],
                        clickTime = mini_game_clicks[i + 1]
                    ;

                    times_array.push(clickTime - spawnTime);
                }

                const
                    max_time = Math.max(...times_array),
                    min_time = Math.min(...times_array),
                    mid_time = Math.ceil((max_time + min_time) / 2)
                ;

                this.setState({
                    mini_game: {mid_time, max_time, min_time}
                });

                this.go('game_reaction_result');
            } else {
                gameTimeout = setTimeout(async () => {
                    await this.setState({mini_game: {zone: this.state.mini_game.zone + 1}});
                    zone.classList.add('zone');
                    zone.style.top = `${getRandomInt(20, 80)}vh`;
                    zone.style.left = `${getRandomInt(20, 80)}vw`;
                    zone.src = require(`../assets/icons_battle_stat/mini-game/reaction/zones/${this.state.mini_game.zone}.png`);
                    zone.onclick = async (e) => await zoneClick(e);
                    zones.appendChild(zone);
                    const {mini_game_clicks} = this.state;
                    mini_game_clicks.push(Date.now());
                    await this.setState({mini_game_clicks});
                }, getRandomInt(1000, 3000));
            }
        };

        zoneClick();
    }

    async initGameFollow() {
        await this.initMiniGameCounter('Удерживайте палец на обезьянке и не отпускайте, пока не устанете.');

        let
            monkey = document.getElementById('monkey'),
            start = false,
            end = false,
            startTime = 0,
            endTime = 0,
            history = [],
            curMouseCords = {x: 0, y: 0}
        ;

        const
            fOut = () => {
                if (end === false && start === true) {
                    end = true;
                    endTime = Date.now();

                    let inCenter = 0, inEdge = 0;

                    for (let i = 0; i < history.length; i++) {
                        let
                            item1 = history[i] ? history[i] : {},
                            item2 = history[i + 1] ? history[i + 1] : {}
                        ;

                        if (item1.inCenter && item2.inCenter) {
                            inCenter += item2.now - item1.now;
                        } else if (item1.inEdge && item2.inEdge) {
                            inEdge += item2.now - item1.now;
                        } else if (i === history.length - 1) {
                            if (item1.inCenter) {
                                inCenter += endTime - item1.now;
                            } else if (item1.inEdge) {
                                inEdge += endTime - item1.now;
                            }
                        }
                    }

                    this.setState({mini_game: {inCenter, inEdge, time: endTime - startTime}});
                    this.go('game_follow_result');
                }
            },
            fMove = (e) => {
                if (end === false && start === true) {
                    monkey = document.getElementById('monkey');
                    const
                        touch = e.targetTouches[0],
                        mouseX = touch.clientX,
                        mouseY = touch.clientY,
                        monkeySize = (document.body.clientHeight * 12 / 100),
                        monkeyX = monkey.offsetLeft - monkeySize / 2,
                        monkeyY = monkey.offsetTop - monkeySize / 2,
                        now = Date.now(),
                        inCenter = Math.abs(mouseX - (monkeyX + monkeySize / 2)) <= 10 && Math.abs(mouseY - (monkeyY + monkeySize / 2)) <= 10,
                        inEdge = Math.abs(mouseX - monkeyX) <= 10 || Math.abs(mouseX - (monkeyX + monkeySize)) <= 10 || Math.abs(mouseY - monkeyY) <= 10 || Math.abs(mouseY - (monkeyY + monkeySize)) <= 10
                    ;

                    curMouseCords.x = mouseX;
                    curMouseCords.y = mouseY;

                    /*
                    const box1 = document.getElementById('box1');
                    box1.style.width = mouseX+'px';
                    box1.style.height = mouseY+'px';

                    const box2 = document.getElementById('box2');
                    box2.style.width = monkeyX+'px';
                    box2.style.height = monkeyY+'px';
                    */

                    if (inCenter || inEdge) {
                        history.push({inCenter, inEdge, now, coords: {mouseX, mouseY, monkeyX, monkeyY, monkeySize}})
                    }
                }
            },
            fIn = (e) => {
                if (end === false && start === false) {
                    curMouseCords = {x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY};
                    start = true;
                    startTime = Date.now();

                    const
                        interval = setInterval(() => {
                            if (end === true) {
                                clearInterval(interval);
                            } else {
                                monkey = document.getElementById('monkey');
                                let
                                    curTop = parseInt(monkey.style.top),
                                    curLeft = parseInt(monkey.style.top),
                                    pTop = curTop >= 80 ? -10 : curTop <= 20 ? 10 : getRandomInt(-10, 10),
                                    pLeft = curLeft >= 80 ? -10 : curLeft <= 20 ? 10 : getRandomInt(-10, 10)
                                ;
                                monkey.style.top = (curTop + '' === 'NaN' ? 50 : curTop) + pTop + 'vh';
                                monkey.style.left = (curLeft + '' === 'NaN' ? 50 : curLeft) + pLeft + 'vw';
                            }
                        }, 1000),
                        interval_ = setInterval(() => {
                            if (end === false && (curMouseCords.x === 0 && curMouseCords.y === 0) === false) {
                                monkey = document.getElementById('monkey');
                                const
                                    monkeySize = (document.body.clientHeight * 12 / 100),
                                    monkeyX = monkey.offsetLeft - monkeySize / 2,
                                    monkeyY = monkey.offsetTop - monkeySize / 2,
                                    {x, y} = curMouseCords
                                ;

                                if (monkeyX - x > 0 || Math.abs(monkeyX - x) > monkeySize || monkeyY - y > 0 || Math.abs(monkeyY - y) > monkeySize) {
                                    fOut();
                                    clearInterval(interval_);
                                }
                            } else if (end === true) {
                                clearInterval(interval_);
                            }
                        }, 100)
                    ;
                }
            }
        ;

        monkey.addEventListener('touchstart', (e) => fIn(e));
        monkey.addEventListener('touchend', () => fOut());
        monkey.addEventListener('touchcancel', () => fOut());
        monkey.addEventListener('touchmove', (e) => fMove(e));
    }

    async initGameFriends() {
        await this.initMiniGameCounter('На экране появятся две области, одна для Вас, вторая для друга. Ваша задача — завоевать другую область.');

        let
            zone1 = document.getElementById('zone_1'),
            zone2 = document.getElementById('zone_2'),
            startTime = Date.now(),
            clicks1 = [],
            clicks2 = []
        ;

        zone1.style.height = '50vh';
        zone2.style.height = '50vh';

        const end = () => {
            const
                endTime = Date.now(),
                cps_top = cps(clicks1).mid_cps,
                cps_bottom = cps(clicks2).mid_cps
            ;

            this.setState({mini_game: {time: endTime - startTime, cps_top, cps_bottom}});
            this.go('game_friends_result');
        };

        zone1.onclick = async (e) => {
            clicks1.push(Date.now());
            zone1 = e.target;
            zone1.style.height = parseInt(zone1.style.height) + 5 + 'vh';
            zone2.style.height = parseInt(zone2.style.height) - 5 + 'vh';
            if (parseInt(zone1.style.height) === 100) {
                end();
            }
        };

        zone2.onclick = async (e) => {
            clicks2.push(Date.now());
            zone2 = e.target;
            zone2.style.height = parseInt(zone2.style.height) + 5 + 'vh';
            zone1.style.height = parseInt(zone1.style.height) - 5 + 'vh';
            if (parseInt(zone2.style.height) === 100) {
                end();
            }
        };
    }

    async showAd() {
        if (bridge.supports('VKWebAppShowNativeAds')) {
            this.setState({popout: <ScreenSpinner/>});
            try {
                await bridge.send('VKWebAppShowNativeAds', {ad_format: 'preloader'});
            } catch (e) {
            }
            this.setState({popout: null});
        }
    }

    render() {
        const
            mini_games = [
                (
                    <Panel className='BackgroundPanel' id='game_cps' style={{
                        background: `url(${require('../assets/icons_battle_stat/mini-game/cps/background.png')}) -40.8vw 0.5vh / 180% no-repeat`
                    }}>
                        <PanelHeader separator={false} left={<PanelHeaderBack onClick={() => this.back()}/>}/>
                        <div className='GameCounter'>
                            <RoundProgress
                                text={this.state.mini_game_counter + ''}
                                percent={this.state.mini_game_counter * 10}
                                type={1}
                                color='rgb(255, 255, 255)' color_background='rgba(255, 255, 255, 0.25)'
                                size={74} stroke_width={12} rotate={-90}/>
                        </div>
                        <div id='Ghost' onClick={async () => {
                            const {mini_game_clicks} = this.state;
                            mini_game_clicks.push(Date.now());
                            await this.setState({mini_game_clicks});
                        }}>
                            <Ghost className='AnimationButton'/>
                        </div>
                    </Panel>
                ),
                (
                    <Panel className='BackgroundPanel' id='game_boss' style={{
                        background: `url(${require('../assets/icons_battle_stat/mini-game/cps/background.png')}) center -4vh / 82vh no-repeat`
                    }}>
                        <PanelHeader separator={false} left={<PanelHeaderBack onClick={() => this.back()}/>}/>
                        <HorizontalProgress height={1.7647} width={52.8} backgroundColor='#3C6B64' valueColor='#B6CF8E'
                                            percent={(100 - this.state.mini_game_clicks.length)}/>
                        <div id='Boss' onClick={async () => {
                            const {mini_game_clicks} = this.state;
                            mini_game_clicks.push(Date.now());
                            await this.setState({mini_game_clicks});

                            if (mini_game_clicks.length >= 100) {
                                const {mid_cps, max_cps, min_cps} = cps(this.state.mini_game_clicks);
                                this.setState({
                                    mini_game: {mid_cps, max_cps, min_cps}
                                });
                                this.go('game_cps_result');
                            }
                        }}>
                            <Boss/>
                        </div>
                    </Panel>
                ),
                (
                    <Panel className='BackgroundPanel' id='game_reaction' style={{
                        background: `url(${require('../assets/icons_battle_stat/mini-game/reaction/background.png')}) center 29.88vh / 100vh no-repeat`
                    }}>
                        <PanelHeader separator={false} left={<PanelHeaderBack onClick={() => this.back()}/>}/>
                        <div id='zones'/>
                    </Panel>
                ),
                (
                    <Panel className='BackgroundPanel' id='game_follow'>
                        <PanelHeader separator={false} left={<PanelHeaderBack onClick={() => this.back()}/>}/>
                        <img id='monkey' src={require('../assets/icons_battle_stat/mini-game/follow/monkey.png')}/>
                    </Panel>
                ),
                (
                    <Panel className='BackgroundPanel' id='game_friends'>
                        <div id='zone_1'/>
                        <div id='zone_2'/>
                    </Panel>
                ),
                (
                    <Panel id='game_cps_result' className='fixed'>
                        <div className='mini_game_result'>
                            <div className='MiniGame_Result_Title'>
                                Отлично!
                            </div>
                            <div style={{height: '2.47vh'}}/>
                            <div className='MiniGame_Result_Description'>
                                Вот ваши результаты:
                            </div>
                            <div style={{height: '4.12vh'}}/>
                            <HorizontalCard
                                icon={<img src={require('../assets/icons_battle_stat/mini-game/cps/icon_stat_mid.png')}
                                           alt='icon'/>}
                                type={1}
                                title={this.state.mini_game.mid_cps}
                                description='среднее количество кликов в секунду'
                                buttonDisabled={true}
                                stretched={true}
                            />
                            <div style={{height: '1.65vh'}}/>
                            <div style={{display: 'flex', width: '87.47vw'}}>
                                <HorizontalCard
                                    icon={<img src={require('../assets/icons_battle_stat/mini-game/cps/icon_stat_max.png')}
                                               alt='icon'/>}
                                    type={1}
                                    title={this.state.mini_game.max_cps}
                                    description='максимальное количество кликов в секунду'
                                    buttonDisabled={true}
                                />
                                <div style={{width: '4.12vh'}}/>
                                <HorizontalCard
                                    icon={<img src={require('../assets/icons_battle_stat/mini-game/cps/icon_stat_min.png')}
                                               alt='icon'/>}
                                    type={1}
                                    title={this.state.mini_game.min_cps}
                                    description='минимальное количество кликов в секунду'
                                    buttonDisabled={true}
                                />
                            </div>
                            <div style={{height: '8vh'}}/>
                            <div className='MiniGame_Button MiniGame_Button_Share AnimationButton' onClick={() => {
                                this.back();
                                this.share7();
                            }}>
                                <Icon20StoryOutline/>
                                <span>Поделиться результатом</span>
                            </div>
                            <div style={{height: '1.76vh'}}/>
                            <div className='MiniGame_Button AnimationButton'
                                 onClick={() => {
                                     this.back();
                                     this.showAd();
                                 }}
                                 style={{color: 'rgba(255, 255, 255, 0.25)'}}>
                                <span>Поделюсь потом</span>
                            </div>
                        </div>
                    </Panel>
                ),
                (
                    <Panel id='game_reaction_result' className='fixed'>
                        <div className='mini_game_result'>
                            <div className='MiniGame_Result_Title'>
                                Отлично!
                            </div>
                            <div style={{height: '2.47vh'}}/>
                            <div className='MiniGame_Result_Description'>
                                Вот ваши результаты:
                            </div>
                            <div style={{height: '4.12vh'}}/>
                            <HorizontalCard
                                icon={<img src={require('../assets/icons_battle_stat/mini-game/cps/icon_stat_mid.png')}
                                           alt='icon'/>}
                                type={1}
                                title={shortIntegers(this.state.mini_game.mid_time) + ' мс'}
                                description='среднее время реакции'
                                buttonDisabled={true}
                                stretched={true}
                            />
                            <div style={{height: '1.65vh'}}/>
                            <div style={{display: 'flex', width: '87.47vw'}}>
                                <HorizontalCard
                                    icon={<img src={require('../assets/icons_battle_stat/mini-game/cps/icon_stat_max.png')}
                                               alt='icon'/>}
                                    type={1}
                                    title={shortIntegers(this.state.mini_game.max_time) + ' мс'}
                                    description='максимальное время реакции'
                                    buttonDisabled={true}
                                />
                                <div style={{width: '4.12vh'}}/>
                                <HorizontalCard
                                    icon={<img src={require('../assets/icons_battle_stat/mini-game/cps/icon_stat_min.png')}
                                               alt='icon'/>}
                                    type={1}
                                    title={shortIntegers(this.state.mini_game.min_time) + ' мс'}
                                    description='минимальное время реакции'
                                    buttonDisabled={true}
                                />
                            </div>
                            <div style={{height: '8vh'}}/>
                            <div className='MiniGame_Button MiniGame_Button_Share AnimationButton' onClick={() => {
                                this.back();
                                this.share8();
                            }}>
                                <Icon20StoryOutline/>
                                <span>Поделиться результатом</span>
                            </div>
                            <div style={{height: '1.76vh'}}/>
                            <div className='MiniGame_Button AnimationButton'
                                 onClick={() => {
                                     this.back();
                                     this.showAd();
                                 }}
                                 style={{color: 'rgba(255, 255, 255, 0.25)'}}>
                                <span>Поделюсь потом</span>
                            </div>
                        </div>
                    </Panel>
                ),
                (
                    <Panel id='game_follow_result' className='fixed'>
                        <div className='mini_game_result'>
                            <div className='MiniGame_Result_Title'>
                                Отлично!
                            </div>
                            <div style={{height: '2.47vh'}}/>
                            <div className='MiniGame_Result_Description'>
                                Вот ваши результаты:
                            </div>
                            <div style={{height: '4.12vh'}}/>
                            <HorizontalCard
                                icon={<img src={require('../assets/icons_battle_stat/mini-game/follow/icon_all_time.png')}
                                           alt='icon'/>}
                                type={1}
                                title={(this.state.mini_game.time / 1000).toFixed(1).replace('.', ',') + ' сек'}
                                description='время удержания'
                                buttonDisabled={true}
                                stretched={true}
                            />
                            <div style={{height: '1.65vh'}}/>
                            <div style={{display: 'flex', width: '87.47vw'}}>
                                <HorizontalCard
                                    icon={<img src={require('../assets/icons_battle_stat/mini-game/follow/icon_target.png')}
                                               alt='icon'/>}
                                    type={1}
                                    title={(this.state.mini_game.inCenter / 1000).toFixed(1).replace('.', ',') + ' сек'}
                                    description='время удержания в центре'
                                    buttonDisabled={true}
                                />
                                <div style={{width: '4.12vh'}}/>
                                <HorizontalCard
                                    icon={<img src={require('../assets/icons_battle_stat/mini-game/follow/icon_fire.png')}
                                               alt='icon'/>}
                                    type={1}
                                    title={(this.state.mini_game.inEdge / 1000).toFixed(1).replace('.', ',') + ' сек'}
                                    description='время удержания на краю'
                                    buttonDisabled={true}
                                />
                            </div>
                            <div style={{height: '8vh'}}/>
                            <div className='MiniGame_Button MiniGame_Button_Share AnimationButton' onClick={() => {
                                this.back();
                                this.share9();
                            }}>
                                <Icon20StoryOutline/>
                                <span>Поделиться результатом</span>
                            </div>
                            <div style={{height: '1.76vh'}}/>
                            <div className='MiniGame_Button AnimationButton'
                                 onClick={() => {
                                     this.back();
                                     this.showAd();
                                 }}
                                 style={{color: 'rgba(255, 255, 255, 0.25)'}}>
                                <span>Поделюсь потом</span>
                            </div>
                        </div>
                    </Panel>
                ),
                (
                    <Panel id='game_friends_result' className='fixed'>
                        <div className='mini_game_result'>
                            <div className='MiniGame_Result_Title'>
                                Отлично!
                            </div>
                            <div style={{height: '2.47vh'}}/>
                            <div className='MiniGame_Result_Description'>
                                Вот ваши результаты:
                            </div>
                            <div style={{height: '4.12vh'}}/>
                            <HorizontalCard
                                icon={<img src={require('../assets/icons_battle_stat/mini-game/follow/icon_all_time.png')}
                                           alt='icon'/>}
                                type={1}
                                title={(this.state.mini_game.time / 1000).toFixed(1).replace('.', ',') + ' сек'}
                                description='время игры'
                                buttonDisabled={true}
                                stretched={true}
                            />
                            <div style={{height: '1.65vh'}}/>
                            <div style={{display: 'flex', width: '87.47vw'}}>
                                <HorizontalCard
                                    icon={<img
                                        src={require('../assets/icons_battle_stat/mini-game/friends/icon_finger_top.png')}
                                        alt='icon'/>}
                                    type={1}
                                    title={this.state.mini_game.cps_top + ''}
                                    description='кликов в секунду в верхней области'
                                    buttonDisabled={true}
                                />
                                <div style={{width: '4.12vh'}}/>
                                <HorizontalCard
                                    icon={<img
                                        src={require('../assets/icons_battle_stat/mini-game/friends/icon_finger_bottom.png')}
                                        alt='icon'/>}
                                    type={1}
                                    title={this.state.mini_game.cps_bottom + ''}
                                    description='кликов в секунду в нижней области'
                                    buttonDisabled={true}
                                />
                            </div>
                            <div style={{height: '8vh'}}/>
                            <div className='MiniGame_Button MiniGame_Button_Share AnimationButton' onClick={() => {
                                this.back();
                                this.share10();
                            }}>
                                <Icon20StoryOutline/>
                                <span>Поделиться результатом</span>
                            </div>
                            <div style={{height: '1.76vh'}}/>
                            <div className='MiniGame_Button AnimationButton'
                                 onClick={() => {
                                     this.back();
                                     this.showAd();
                                 }}
                                 style={{color: 'rgba(255, 255, 255, 0.25)'}}>
                                <span>Поделюсь потом</span>
                            </div>
                        </div>
                    </Panel>
                )
            ],
            mini_games_slides = [
                [slideColors[0], 'cps.png', 'КПС', 'Эта мини-игра раскроет Ваши способности кликать', () => {
                    this.go('game_cps');
                    this.initGameCps();
                }],
                [slideColors[1], 'boss.png', 'Босс', 'В этой мини-игре Вам предстоит победить босса', () => {
                    this.go('game_boss');
                    this.initGameBoss();
                }],
                [slideColors[2], 'reaction.png', 'Реакция', 'Здесь Вы сможете испытать свои навыки в реакции', () => {
                    this.go('game_reaction');
                    this.initGameReaction();
                }],
                [slideColors[3], 'follow.png', 'По следу', 'Вам необходимо будет следить пальцем за целью', () => {
                    this.go('game_follow');
                    this.initGameFollow();
                }],
                [slideColors[4], 'friends.png', '1vs1', 'Вам предстоит сразиться с другом и узнать кто сильнее', () => {
                    this.go('game_friends');
                    this.initGameFriends();
                }],
                [slideColors[5], 'online.png', 'Online', 'Сражайтесь против других игроков в режиме онлайн в «Битве Кликеров»', () => {
                    bridge.send('VKWebAppOpenApp', {app_id: 7232677});
                }],
            ]
        ;

        return (
            <AppRoot>
                <View
                    onSwipeBack={() => this.back()}
                    activePanel={this.state.activePanel}
                    popout={this.state.popout}>
                    <Panel id='placeholder' className='fixed'>
                        <Placeholder
                            stretched
                        >
                            <div className='Onboarding_Title'>
                                Упс
                            </div>
                            <div className='Onboarding_Text'>
                                Кажется, что-то сломалось. Попробуйте перезагрузить страницу.
                            </div>
                            <Button
                                stretched
                                onClick={() => {
                                    if (window.navigator.onLine) {
                                        this.setState({activePanel: 'main', history: ['main']});
                                        document.body.style.setProperty('--pslide_background_content', slideColors[this.state.slide_index]);
                                    }
                                }}
                                mode='secondary'
                                size='l'
                                style={{
                                    marginTop: 65
                                }}>
                                Перезагрузить
                            </Button>
                        </Placeholder>
                    </Panel>
                    <Panel id='main'>
                        <VerticalSlides
                            isShowArrowUp={window.location.hash === '#story'}
                            index={this.state.slide_index}
                            onChange={slide_index => {
                                console.log(slide_index);
                                this.setState({slide_index});
                            }}
                        >
                            {
                                mini_games_slides.map((value, i) =>
                                    <div className='Slide' style={{
                                        background: `url(${require(`../assets/icons_battle_stat/MainBackground.png`)}) -33.33vw -15.06vh / 100vh no-repeat ${value[0]}`
                                    }}>
                                        <div className='SlideHeader' style={{
                                            opacity: this.state.slide_index >= i && 0
                                        }}>
                                            <img className='MiniGameIcon'
                                                 src={require(`../assets/icons_battle_stat/mini-game/icons/${value[1]}`)}/>
                                            <span>{value[2]}</span>
                                        </div>
                                        <img className='MiniGameIcon'
                                             src={require(`../assets/icons_battle_stat/mini-game/icons/${value[1]}`)}/>
                                        <div style={{height: 24}}/>
                                        <div className='Title'>{value[2]}</div>
                                        <div style={{height: 24}}/>
                                        <div className='Description'>{value[3]}</div>
                                        <div className='ButtonContainer'>
                                            <div className='Button' onClick={value[4]}><Icon16Play/><span>Играть</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        </VerticalSlides>
                        {
                            (!this.state.advert_closed && this.state.advert_data) && this.state.slide_index === mini_games_slides.length - 1 &&
                            <React.Fragment>
                                <div style={{height: 13}}/>
                                <PromoBanner bannerData={this.state.advert_data}
                                             onClose={() => this.setState({advert_closed: true})}/>
                            </React.Fragment>
                        }
                    </Panel>
                    {
                        mini_games.map(value => value)
                    }
                </View>
            </AppRoot>
        );
    }
}

export default BattleStat;