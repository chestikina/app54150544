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

import {BattlePassCard} from "../components/BattleStat/BattlePassCard";
import HorizontalCard from "../components/BattleStat/HorizontalCard";
import {decOfNum, getRandomInt, shortIntegers} from "../js/utils";
import ProgressInfo from "../components/BattleStat/ProgressInfo";
import VerticalCard from "../components/BattleStat/VerticalCard";
import GraphicCard from "../components/BattleStat/GraphicCard";
import GamesHistory from "../components/BattleStat/GamesHistory";
import GameCard from "../components/BattleStat/GameCard";
import GameInfo from "../components/BattleStat/GameInfo";
import Replay from "../components/BattleStat/Replay";
import {Icon16Chevron, Icon16Dropdown, Icon16Ghost, Icon16Play, Icon20StoryOutline} from "@vkontakte/icons";
import {convertTextToLines, cps, loadFonts} from "../js/utils";
import RankCard from "../components/BattleStat/RankCard";
import html2canvas from "html2canvas";
import {TransparentButton} from "../components/BattleStat/TransparentButton";
import {ReactComponent as Ghost} from "../assets/icons_battle_stat/mini-game/cps/Ghost.svg";
import {ReactComponent as Boss} from "../assets/icons_battle_stat/mini-game/boss/Noob.svg";
import HorizontalProgress from "../components/BattleStat/HorizontalProgress";
import MiniGamesCard from "../components/BattleStat/MiniGamesCard";

const
    {API} = require('../js/clickerbattle_api'),
    MODAL_PAGE_PLAY_PROGRESS = 'page-progress',
    MODAL_PAGE_GAME_INFO = 'page-game-info'
;

let isNewUser, clicker, advertInterval;

const
    ranks = [
        'Олд',
        'Задрот',
        'Новичок',
        'Миллионер',
        'Донатер',
        'Обезьянка',
        'Кликерман',
        'Медленный',
        'Админ',
        'Лягушка'
    ],
    standartUser = {
        activeSkins: {},
        banners: [],
        bannersStat: [],
        bp: false,
        bpLvl: 1,
        bpXp: 0,
        clicks: 0,
        createdAt: new Date().toString(),
        cursors: [],
        day: {time: 0, wins: 0, games: 0, loses: 0, clicks: 0},
        loses: 0,
        lvl: 1,
        persons: [],
        trHistory: [],
        wins: 0,
        xp: 0
    }
;

class BattleStat extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: ['onboarding'],
            activePanel: 'onboarding',

            activeModal: null,
            modalHistory: [],

            game_info: {name1: '', name2: ''},
            game_progress: {descriptions: []},

            loading: true,

            all_games: [],
            offset_all_games: 0,

            mini_game: {},
            mini_game_clicks: [],

            gamesIndex: 0
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
        loadFonts(['SF Pro Rounded Semibold', 'SF Pro Rounded Bold']);

        isNewUser = (await bridge.send('VKWebAppStorageGet', {keys: ['onboard']})).keys[0].value === '';

        const user_rank = (await bridge.send('VKWebAppStorageGet', {keys: ['rank']})).keys[0].value;
        this.setState({
            history: [isNewUser ? 'onboarding' : 'main'],
            activePanel: isNewUser ? 'onboarding' : 'main',
            user_rank: user_rank === '' ? getRandomInt(0, ranks.length - 1) : parseInt(user_rank)
        });

        window.addEventListener('popstate', e => {
            e.preventDefault();
            this.back();
        });

        bridge.subscribe(async ({detail: {type, data}}) => {
            if (type !== undefined) console.log(type, data);
            if (type === 'VKWebAppUpdateConfig') {
                const schemeAttribute = document.createAttribute('scheme');
                schemeAttribute.value = 'space_gray';
                document.body.attributes.setNamedItem(schemeAttribute);
                if (bridge.supports('VKWebAppSetViewSettings')) {
                    bridge.send('VKWebAppSetViewSettings', {
                        status_bar_style: 'light',
                        action_bar_color: '#212121'
                    });
                }
            } else if (type === 'VKWebAppViewRestore') {
                this.setState({popout: null});
            }
        });

        clicker = new API('test');
        const response = await clicker.call('token.get', this.vkParams());
        if (response !== false) {
            clicker = new API(response);

            await this.updateUser();

            this.setState({token: true});
        } else {
            const vkUser = await bridge.send('VKWebAppGetUserInfo');
            this.setState({
                user: {...vkUser, ...standartUser, name: `${vkUser.first_name} ${vkUser.last_name}`},
                token: false
            });
        }
        this.updateData();
        if (!isNewUser) this.go('main');
        bridge.send('VKWebAppInit');
        advertInterval = bridge.supports('VKWebAppGetAds') && setInterval(async () => this.setState({advert_data: await bridge.send('VKWebAppGetAds', {})}), 10000);
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
            const {activePanel} = this.state;

            if (activePanel.startsWith('game_') && activePanel.indexOf('result') === -1) {
                window.history.pushState({panel: 'game'}, 'Title');
            } else {
                history.pop();
                this.setState({activePanel: history[history.length - 1], history});
            }
        }
    };

    go(panel) {
        let {history} = this.state;
        if (history[history.length - 1] !== panel) {
            history.push(panel);
            window.history.pushState({activePanel: panel}, 'Title');

            if (panel.startsWith('game_') && panel.indexOf('result') === -1) {
                history.pop();
            }

            this.setState({activePanel: panel, history, snackbar: null, activeModal: null, modalHistory: []});
        }
    }

    async updateUser() {
        await this.setState({user: await clicker.users.get()});
    }

    async updateData() {
        await this.setState({loading: true});

        const
            {user} = this.state,
            descriptions = [
                'Персонажи',
                'Курсоры',
                'Баннеры',
                'Статистика баннера'
            ],
            collect = [
                user.persons.length,
                user.cursors.length,
                user.banners.length,
                user.bannersStat.length
            ],
            all = [6, 8, 7, 5],
            percent = Math.round(collect.reduce((value1, value2) => value1 + value2) / all.reduce((value1, value2) => value1 + value2) * 100),
            nextCase = {
                name: user.lvl === 100 ? 'mystic' : 'standart',
                left: Math.ceil(((100 - user.xp) + (100 - user.xp) / 10) / 2)
            }
        ;

        let
            all_games = [],
            win_streak = 0, last_game_win = false,
            todayPlayClicks = 0,
            allPlayClicks = 0,
            todayTrClicks = 0,
            allTrClicks = 0,
            historyClicks = []
        ;

        for (let i = 0; i < user.wins + user.loses; i += 100) {
            all_games = all_games.concat(await clicker.games.get(100, i));
        }

        for (const game of all_games) {
            if (game.winner === user.id) {
                if (last_game_win)
                    win_streak++;
                else
                    win_streak = 1;

                last_game_win = true;
            } else
                last_game_win = false;

            const
                clicks = game.player1 === user.id ? game.clicks1 : game.clicks2,
                diffTime = Date.now() - game.startTime
            ;
            if (diffTime <= 24 * 60 * 60 * 1000) {
                todayPlayClicks += clicks;
            }
            allPlayClicks += clicks;

            if (diffTime <= 10 * 24 * 60 * 60 * 1000) {
                const
                    array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => diffTime <= value * 24 * 60 * 60 * 1000),
                    index = Math.abs(10 - array.indexOf(true))
                ;
                historyClicks[index] = historyClicks[index] ? historyClicks[index] + clicks : clicks;
            }
        }

        for (const tr of user.trHistory) {
            const diffTime = Date.now() - tr.date;

            if (tr.date && diffTime <= 24 * 60 * 60 * 1000) {
                todayTrClicks += tr.amount;
            }
            allTrClicks += tr.amount;

            if (diffTime <= 10 * 24 * 60 * 60 * 1000) {
                const
                    array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => diffTime <= value * 24 * 60 * 60 * 1000),
                    index = Math.abs(10 - array.indexOf(true))
                ;
                historyClicks[index] = historyClicks[index] ? historyClicks[index] + tr.amount : tr.amount;
            }
        }

        if (historyClicks.length !== 11) {
            const lastClicks = historyClicks[historyClicks.length - 1], needClicks = 11 - historyClicks.length;
            for (let i = 0; i < needClicks; i++) {
                historyClicks.push(lastClicks);
            }
        }
        for (let i = 0; i < historyClicks.length; i++) {
            if (!historyClicks[i] > 0)
                historyClicks[i] = 0;
        }

        await this.setState({
            all_games,
            win_streak,
            game_progress: {
                descriptions, collect, all, percent
            },
            nextCase,
            todayPlayClicks, allPlayClicks,
            todayTrClicks, allTrClicks,
            todayClicks: todayPlayClicks + todayTrClicks,
            historyClicks,

            loading: false
        });
    }

    async share(blob) {
        return await bridge.send('VKWebAppShowStoryBox', {
            background_type: 'image',
            blob,
            attachment: {
                text: 'go_to',
                type: 'url',
                url: `https://vk.com/app${this.vkParams().vk_app_id}`
            }
        });
    }

    async share1() {
        this.setState({popout: <ScreenSpinner/>});
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d')
        ;

        loadImage(require('../assets/icons_battle_stat/story/share_1.png')).then(async background => {
            ctx.drawImage(background, 0, 0);
            loadImage(require('../assets/icons_battle_stat/story/share_1_0.png')).then(async emoji => {
                ctx.textAlign = 'center';

                ctx.font = '165px SF Pro Rounded Semibold';
                ctx.fillStyle = '#FFFFFF';
                const text = shortIntegers(this.state.todayPlayClicks);
                ctx.fillText(text, 632, 765);
                ctx.drawImage(emoji, 632 - ctx.measureText(text).width / 2 - 160, 652);

                this.setState({popout: null});
                this.share(canvas.toDataURL('image/png'));
            });
        });
    }

    async share2() {
        this.setState({popout: <ScreenSpinner/>});
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d')
        ;

        loadImage(require('../assets/icons_battle_stat/story/share_2.png')).then(async background => {
            ctx.drawImage(background, 0, 0);
            ctx.textAlign = 'center';

            ctx.font = '165px SF Pro Rounded Semibold';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(shortIntegers(this.state.user.wins + this.state.user.loses), 541.5, 960);

            this.setState({popout: null});
            this.share(canvas.toDataURL('image/png'));
        });
    }

    async share3() {
        this.setState({popout: <ScreenSpinner/>});
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d')
        ;

        loadImage(require('../assets/icons_battle_stat/story/share_3.png')).then(async background => {
            ctx.drawImage(background, 0, 0);
            ctx.textAlign = 'center';

            ctx.font = '150px SF Pro Rounded Semibold';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(decOfNum(Math.ceil(Math.abs(Date.now() - new Date(this.state.user.createdAt).getTime()) / (1000 * 3600 * 24)), ['день', 'дня', 'дней']), 540.5, 859 + 110);

            this.setState({popout: null});
            this.share(canvas.toDataURL('image/png'));
        });
    }

    async share4() {
        this.setState({popout: <ScreenSpinner/>});
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d')
        ;

        loadImage(require('../assets/icons_battle_stat/story/share_4.png')).then(async background => {
            ctx.drawImage(background, 0, 0);
            ctx.textAlign = 'center';

            ctx.font = '150px SF Pro Rounded Semibold';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(shortIntegers(this.state.allPlayClicks), 540, 900 + 90);

            this.setState({popout: null});
            this.share(canvas.toDataURL('image/png'));
        });
    }

    async share5() {
        this.setState({popout: <ScreenSpinner/>});
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d')
        ;

        loadImage(require('../assets/icons_battle_stat/story/share_5.png')).then(async background => {
            ctx.drawImage(background, 0, 0);
            ctx.textAlign = 'center';

            ctx.font = '150px SF Pro Rounded Semibold';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(shortIntegers(this.state.user.clicks), 540, 510 + 70);

            this.setState({popout: null});
            this.share(canvas.toDataURL('image/png'));
        });
    }

    async share6() {
        this.setState({popout: <ScreenSpinner/>});
        const
            {createCanvas, loadImage} = require('canvas'),
            canvas = createCanvas(1080, 1920),
            ctx = canvas.getContext('2d')
        ;

        loadImage(require('../assets/icons_battle_stat/story/share_6.png')).then(async background => {
            ctx.drawImage(background, 0, 0);
            loadImage(require(`../assets/icons_battle_stat`)).then(async rank => {
                ctx.drawImage(rank, 0, 346);

                ctx.beginPath();
                ctx.strokeStyle = '#9CEC95';
                ctx.lineWidth = '11.77';
                const r = 294.25 / 2;
                ctx.arc(159 + r, 593 + r, r, 0, 2 * (this.state.game_progress.percent / 100) * Math.PI);
                ctx.stroke();

                ctx.textAlign = 'center';
                ctx.font = '70.62px SF Pro Rounded Bold';
                ctx.fillStyle = '#9CEC95';
                ctx.fillText(this.state.game_progress.percent + '%', 306.13, 701.87 + 68);

                ctx.textAlign = 'left';
                ctx.font = '58.85px SF Pro Rounded';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(decOfNum(Math.ceil(Math.abs(Date.now() - new Date(this.state.user.createdAt).getTime()) / (1000 * 3600 * 24)), ['день', 'дня', 'дней']), 609, 703 + 44.5);

                ctx.fillText(Math.round(this.state.user.day.time / 1000 / 60) + ' мин.', 144.96, 1173.66 + 50.5);

                ctx.font = '76.5px SF Pro Rounded';
                ctx.fillText(shortIntegers(this.state.allPlayClicks), 610.96, 1085.39 + 70.5);

                this.setState({popout: null});
                this.share(canvas.toDataURL('image/png'));
            });
        });
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
                            setTimeout(() => this.setState({popout: null}), 400);
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
        await this.initMiniGameCounter('У Вас есть 10 секунд на то, чтобы успеть как можно больше раз кликнуть по призраку.');
        setTimeout(() => {
            const {mid_cps, max_cps, min_cps} = cps(this.state.mini_game_clicks);
            this.setState({
                mini_game: {mid_cps, max_cps, min_cps}
            });
            this.go('game_cps_result');
        }, 10000);
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
                setTimeout(async () => {
                    await this.setState({mini_game: {zone: this.state.mini_game.zone + 1}});
                    zone.classList.add('zone');
                    zone.style.top = `${getRandomInt(0, 95)}vh`;
                    zone.style.left = `${getRandomInt(0, 80)}vw`;
                    zone.src = require(`../assets/icons_battle_stat`);
                    zone.onclick = async (e) => await zoneClick(e);
                    zones.appendChild(zone);
                    const {mini_game_clicks} = this.state;
                    mini_game_clicks.push(Date.now());
                    await this.setState({mini_game_clicks});
                }, getRandomInt(1000, 3000));
            }
        }

        zoneClick();
    }

    async initGameFollow() {
        await this.initMiniGameCounter('Удерживайте палец на обезьянке, и не отпускайте, пока не устанете.');

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

    renderStats() {
        if (this.state.loading) return <PanelSpinner/>;

        return (
            <React.Fragment>
                <HorizontalScroll showArrows getScrollToLeft={i => i - 180} getScrollToRight={i => i + 180}>
                    <div className='HorizontalScrollFlex'>
                        <HorizontalCard
                            icon={<img src={require('../assets/icons_battle_stat/icon_play.png')} alt='icon'/>}
                            type={0}
                            description={`Перейти в <span style='color: white'>Битву Кликеров</span>`}
                            onButtonClick={() => bridge.send('VKWebAppOpenApp', {app_id: 7232677})}
                            buttonIcon={<Icon16Play/>}
                            buttonText='В бой'
                            buttonStretched={true}
                        />
                        <HorizontalCard
                            type={0}
                            title={shortIntegers(this.state.todayPlayClicks)}
                            description={decOfNum(this.state.todayPlayClicks, ['клик', 'клика', 'кликов'], false) + ' за сегодня'}
                            onButtonClick={() => this.share1()}
                            buttonIcon={<Icon20StoryOutline width={16} height={16}/>}
                            buttonText='Поделиться'
                            buttonStretched={true}
                        />
                        <HorizontalCard
                            type={2}
                            title='Игра пройдена на'
                            content={this.state.game_progress.percent}
                            buttonDisabled={this.state.game_progress.percent === 100}
                            style={this.state.game_progress.percent === 100 && {
                                background: `url(${require('../assets/icons_battle_stat/play-progress-background.svg')}), var(--card_background)`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPositionX: -32,
                                backgroundPositionY: -11,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                            onButtonClick={() => this.setActiveModal(MODAL_PAGE_PLAY_PROGRESS)}
                            buttonIcon={<Icon16Dropdown style={{transform: 'rotate(180deg)'}}/>}
                        />
                        {
                            this.state.all_games_card ? this.state.all_games_card :
                                <HorizontalCard
                                    onCardClick={() => {
                                        this.setState({all_games_card: <div style={{paddingRight: 140}}/>});
                                        setTimeout(() => this.setState({
                                            all_games_card:
                                                <HorizontalCard
                                                    onCardClick={() => {
                                                        this.setState({
                                                            all_games_card: <div style={{paddingRight: 140}}/>
                                                        });
                                                        setTimeout(() => this.setState({all_games_card: undefined}), 1);
                                                    }}
                                                    buttonDisabled={true}
                                                    type={0}
                                                    icon={<img
                                                        src={require('../assets/icons_battle_stat/icon_all_games.png')}
                                                        alt='icon'/>}
                                                    description={'<div style="font-size:12px">' + 'Из них ' + decOfNum(this.state.user.wins, ['победа', 'победы', 'побед']) + ' и ' + decOfNum(this.state.user.loses, ['поражение', 'поражения', 'поражений']) + '.'
                                                    + '<div style="height:14px"></div>' +
                                                    'Самая длинная серия – ' + decOfNum(this.state.win_streak, ['победа', 'победы', 'побед']) + '.</div>'}/>
                                        }), 1)
                                    }}
                                    onButtonClick={() => this.share2()}
                                    type={0}
                                    title={shortIntegers(this.state.user.wins + this.state.user.loses)}
                                    description={decOfNum(this.state.user.wins + this.state.user.loses, ['битва', 'битвы', 'битв'], false) + ' за всё время'}
                                    buttonIcon={<Icon20StoryOutline width={16} height={16}/>}
                                />
                        }
                        {
                            this.state.token &&
                            <HorizontalCard
                                icon={<img src={require('../assets/icons_battle_stat/icon_regdate.png')} alt='icon'/>}
                                type={1}
                                title={decOfNum(Math.ceil(Math.abs(Date.now() - new Date(this.state.user.createdAt).getTime()) / (1000 * 3600 * 24)), ['день', 'дня', 'дней'])}
                                description='прошло с первой битвы'
                                onButtonClick={() => this.share3()}
                                buttonIcon={<Icon20StoryOutline width={16} height={16}/>}
                            />
                        }
                        <HorizontalCard
                            icon={<img src={require('../assets/icons_battle_stat/icon_play_time.png')} alt='icon'/>}
                            type={1}
                            buttonDisabled={true}
                            title={decOfNum(Math.round(this.state.user.day.time / 1000 / 60), ['минута', 'минуты', 'минут'])}
                            description='сегодня в игре'/>
                        <HorizontalCard
                            type={0}
                            title={shortIntegers(this.state.allPlayClicks)}
                            description={decOfNum(this.state.allPlayClicks, ['клик', 'клика', 'кликов'], false) + ' за всё время'}
                            onButtonClick={() => this.share4()}
                            buttonIcon={<Icon20StoryOutline width={16} height={16}/>}
                        />
                    </div>
                </HorizontalScroll>
                <Div>
                    <div style={{height: 15}}/>
                    <MiniGamesCard slideIndex={this.state.gamesIndex}
                                   onChange={gamesIndex => this.setState({gamesIndex})} games={[
                        {
                            icon: require('../assets/icons_battle_stat/mini-game/icons/cps.png'),
                            title: 'КПС',
                            description: 'Эта мини-игра раскроет Ваши способности кликать',
                            onClick: () => {
                                this.go('game_cps');
                                this.initGameCps();
                            }
                        },
                        {
                            icon: require('../assets/icons_battle_stat/mini-game/icons/boss.png'),
                            title: 'Босс',
                            description: 'В этой мини-игре Вам предстоит победить босса',
                            onClick: () => {
                                this.go('game_boss');
                                this.initGameBoss();
                            }
                        },
                        {
                            icon: require('../assets/icons_battle_stat/mini-game/icons/reaction.png'),
                            title: 'Реакция',
                            description: 'Здесь Вы сможете испытать свои навыки в реакции',
                            onClick: () => {
                                this.go('game_reaction');
                                this.initGameReaction();
                            }
                        },
                        {
                            icon: require('../assets/icons_battle_stat/mini-game/icons/follow.png'),
                            title: 'По следу',
                            description: 'Вам необходимо будет следить пальцем за целью',
                            onClick: () => {
                                this.go('game_follow');
                                this.initGameFollow();
                            }
                        },
                        {
                            icon: require('../assets/icons_battle_stat/mini-game/icons/friends.png'),
                            title: '1vs1',
                            description: 'Вам предстоит сразиться с другом, и узнать кто сильнее',
                            onClick: () => {
                                this.go('game_friends');
                                this.initGameFriends();
                            }
                        }
                    ]}/>
                    <div style={{height: 15}}/>
                    <RankCard emoji={<img width={24} height={24}
                                          src={require(`../assets/icons_battle_stat`)}/>}
                              rank={ranks[this.state.user_rank]} onButtonClick={() => this.share6()}/>
                    <div style={{height: 15}}/>
                    <VerticalCard title='Следующий кейс'
                                  description={
                                      <span>Выиграйте {decOfNum(this.state.nextCase.left, ['бой', 'боя', 'боёв'])}, чтобы получить <span
                                          style={{color: '#FFFFFF'}}>{this.state.nextCase.name === 'mystic' ? 'мистический кейс' : 'обычный кейс'}</span></span>}
                                  icon={<img
                                      src={require(`../assets/icons_battle_stat`)}
                                      alt='case'/>}/>
                    <div style={{height: 15}}/>
                    <GraphicCard
                        data={this.state.historyClicks}
                        title={
                            <span>{shortIntegers(this.state.user.clicks)}
                                <span style={{color: 'rgba(255, 255, 255, 0.25)'}}>
                                            {(this.state.todayClicks >= 0 ? '+' : '-') + shortIntegers(Math.abs(this.state.todayClicks))}
                                        </span>
                                    </span>}
                        description={decOfNum(this.state.todayClicks, ['клик', 'клика', 'кликов'], false) + ' на балансе'}
                        onButtonClick={() => this.share5()}/>
                </Div>
                <Div>
                    {
                        this.state.all_games.length > 0 &&
                        <React.Fragment>
                            <div style={{height: 35}}/>
                            <div className='GameHistory_Title'>
                                История матчей
                            </div>
                            <div style={{height: 22}}/>
                            <GamesHistory>
                                {
                                    this.state.all_games.slice(0, 4).map(value =>
                                        <GameCard game={value}
                                                  onClick={async () => {
                                                      await this.setState({game_info: value});
                                                      this.setActiveModal(MODAL_PAGE_GAME_INFO);
                                                  }}/>)
                                }
                            </GamesHistory>
                        </React.Fragment>
                    }
                    {
                        this.state.all_games.length > 4 &&
                        <React.Fragment>
                            <div style={{height: 13}}/>
                            <TransparentButton onClick={() => {
                                this.setState({offset_all_games: 0});
                                this.go('all_games');
                            }} after={<Icon16Chevron/>}>
                                Посмотреть все
                            </TransparentButton>
                        </React.Fragment>
                    }
                    {
                        !this.state.advert_closed && this.state.advert_data &&
                        <React.Fragment>
                            <div style={{height: 13}}/>
                            <PromoBanner bannerData={this.state.advert_data}
                                         onClose={() => this.setState({advert_closed: true})}/>
                        </React.Fragment>
                    }
                    <div style={{height: 26}}/>
                </Div>
            </React.Fragment>
        )
    }

    render() {
        if (!this.state.user) return <div/>;

        const
            modal = (
                <ModalRoot
                    activeModal={this.state.activeModal}
                    onClose={this.modalBack}
                >
                    <ModalPage
                        id={MODAL_PAGE_PLAY_PROGRESS}
                        onClose={this.modalBack}
                    >
                        <div style={{
                            padding: '25px 29px 48px'
                        }}>
                            {
                                this.state.game_progress.descriptions.map((title, i) =>
                                    <ProgressInfo key={`progress_${i}`} title={title}
                                                  description={`Собрано ${this.state.game_progress.collect[i]} из ${this.state.game_progress.all[i]}`}
                                                  percent={Math.round(this.state.game_progress.collect[i] / this.state.game_progress.all[i] * 100)}/>
                                )
                            }
                        </div>
                    </ModalPage>
                    <ModalPage
                        id={MODAL_PAGE_GAME_INFO}
                        onClose={this.modalBack}
                    >
                        <GameInfo game={this.state.game_info} onWatchClick={() =>
                            this.go('replay')
                        }/>
                    </ModalPage>
                </ModalRoot>
            ),
            mini_games = [
                (
                    <Panel className='BackgrounPanel' id='game_cps' style={{
                        background: `url(${require('../assets/icons_battle_stat/mini-game/cps/background.png')}) -40.8vw 0.5vh / 180% no-repeat`
                    }}>
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
                    <Panel className='BackgrounPanel' id='game_boss' style={{
                        background: `url(${require('../assets/icons_battle_stat/mini-game/cps/background.png')}) center -4vh / 82vh no-repeat`
                    }}>
                        <HorizontalProgress height={1.7647} width={52.8} backgroundColor='#3C6B64' valueColor='#B6CF8E'
                                            percent={(200 - this.state.mini_game_clicks.length) / 2}/>
                        <div id='Boss' onClick={async () => {
                            const {mini_game_clicks} = this.state;
                            mini_game_clicks.push(Date.now());
                            await this.setState({mini_game_clicks});

                            if (mini_game_clicks.length >= 200) {
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
                    <Panel className='BackgrounPanel' id='game_reaction' style={{
                        background: `url(${require('../assets/icons_battle_stat/mini-game/reaction/background.png')}) center 29.88vh / 100vh no-repeat`
                    }}>
                        <div id='zones'/>
                    </Panel>
                ),
                (
                    <Panel id='game_follow'>
                        <img id='monkey' src={require('../assets/icons_battle_stat/mini-game/follow/monkey.png')}/>
                    </Panel>
                ),
                (
                    <Panel id='game_friends'>
                        <div id='zone_1'/>
                        <div id='zone_2'/>
                    </Panel>
                ),
                (
                    <Panel id='game_cps_result'>
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
                                 onClick={() => this.back()}
                                 style={{color: 'rgba(255, 255, 255, 0.25)'}}>
                                <span>Поделюсь потом</span>
                            </div>
                        </div>
                    </Panel>
                ),
                (
                    <Panel id='game_reaction_result'>
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
                                 onClick={() => this.back()}
                                 style={{color: 'rgba(255, 255, 255, 0.25)'}}>
                                <span>Поделюсь потом</span>
                            </div>
                        </div>
                    </Panel>
                ),
                (
                    <Panel id='game_follow_result'>
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
                                 onClick={() => this.back()}
                                 style={{color: 'rgba(255, 255, 255, 0.25)'}}>
                                <span>Поделюсь потом</span>
                            </div>
                        </div>
                    </Panel>
                ),
                (
                    <Panel id='game_friends_result'>
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
                                 onClick={() => this.back()}
                                 style={{color: 'rgba(255, 255, 255, 0.25)'}}>
                                <span>Поделюсь потом</span>
                            </div>
                        </div>
                    </Panel>
                )
            ]
        ;

        return (
            <AppRoot>
                <View activePanel={this.state.activePanel}
                      popout={this.state.popout}
                      modal={modal}>
                    <Panel id='placeholder'>
                        <Placeholder
                            stretched
                        >
                            <div className='Onboarding_Title'>
                                Упс
                            </div>
                            <div className='Onboarding_Text'>
                                Кажется, вы ещё не играли в Битву Кликеров. Самое время это исправить!
                            </div>
                            <Button
                                stretched
                                onClick={() => {
                                    bridge.send('VKWebAppOpenApp', {app_id: 7232677});
                                }}
                                after={<Icon16Chevron/>}
                                mode='secondary'
                                size='l'
                                style={{
                                    marginTop: 84
                                }}>
                                Играть
                            </Button>
                            <Button
                                stretched
                                onClick={() => this.back()}
                                mode='tertiary'
                                size='l'
                                style={{
                                    marginTop: 10,
                                    color: 'rgba(255, 255, 255, 0.5)'
                                }}>
                                Выйти
                            </Button>
                        </Placeholder>
                    </Panel>
                    <Panel id='onboarding'>
                        <Placeholder
                            icon={<img src={require('../assets/icons_battle_stat/logo.svg')} width={39} height={34}
                                       alt='logo'/>}
                            stretched
                        >
                            <div className='Onboarding_Title'>
                                Добро пожаловать, {this.state.user.name.split(' ')[0]}
                            </div>
                            <div className='Onboarding_Text'>
                                В приложении «Боевая статистика» собрана вся ваша статистика из <span
                                style={{color: '#FFFFFF'}}>Битвы Кликеров.</span>
                            </div>
                            <Button
                                stretched
                                onClick={async () => {
                                    if (isNewUser) {
                                        await bridge.send('VKWebAppStorageSet', {key: 'onboard', value: '1'});
                                        await bridge.send('VKWebAppStorageSet', {
                                            key: 'rank',
                                            value: this.state.user_rank + ''
                                        });
                                    }

                                    if (this.state.user.name.length === 0) {
                                        this.setState({
                                            history: ['placeholder'],
                                            activePanel: 'placeholder'
                                        });
                                    } else {
                                        this.go('main');
                                    }
                                }}
                                mode='secondary'
                                size='l'
                                style={{
                                    marginTop: 84
                                }}>
                                Погнали!
                            </Button>
                        </Placeholder>
                    </Panel>
                    <Panel id='main'>
                        <Div>
                            <div className='MobileOffsetTop'>
                                Добро пожаловать, {this.state.user.name.split(' ')[0]}
                            </div>
                            <div style={{height: 15}}/>
                            <BattlePassCard user={this.state.user}/>
                            <div style={{height: 15}}/>
                        </Div>
                        {
                            this.renderStats()
                        }
                    </Panel>
                    <Panel id='replay'>
                        <PanelHeader left={<PanelHeaderBack onClick={() => this.back()}/>} separator={false}/>
                        <Replay game={this.state.game_info}/>
                    </Panel>
                    <Panel id='all_games'>
                        <PanelHeader left={<PanelHeaderBack onClick={() => this.back()}/>} separator={false}/>
                        <Div>
                            <GamesHistory>
                                {
                                    this.state.all_games.slice(0, 100 + this.state.offset_all_games).map(value =>
                                        <GameCard game={value}
                                                  onClick={async () => {
                                                      await this.setState({game_info: value});
                                                      this.setActiveModal(MODAL_PAGE_GAME_INFO);
                                                  }}/>)
                                }
                            </GamesHistory>
                            {
                                this.state.all_games.length > 100 + this.state.offset_all_games &&
                                <React.Fragment>
                                    <div style={{height: 13}}/>
                                    <TransparentButton
                                        onClick={() => this.setState({offset_all_games: this.state.offset_all_games + 100})}
                                        after={<Icon16Dropdown/>}>Показать ещё</TransparentButton>
                                </React.Fragment>
                            }
                            <div style={{height: 26}}/>
                        </Div>
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