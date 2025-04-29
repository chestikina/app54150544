import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/VKIdScan.css';
import '../css/Fonts.css';

import {CustomSelect, Panel, ScreenSpinner, View, Text} from '@vkontakte/vkui';
import {InfiniteScroll} from '../components/InfiniteScroll'

import {get, getClearUserId, getUrlParams, getVKUsers, openUrl, post, sleep, vk_local_users} from "../js/utils";
import {defaultViewProps, initializeNavigation} from "../js/defaults/navigation";
import {getToken, subscribeBridgeEvents, vkApi} from "../js/defaults/bridge_utils";
import {ReactComponent as Logo} from "../assets/vk_id_scan/logo.svg"
import {ReactComponent as IconMessage} from "../assets/vk_id_scan/icon_32_message.svg"
import {ReactComponent as IconLikes} from "../assets/vk_id_scan/icon_24_likes.svg";
import {ReactComponent as IconComments} from "../assets/vk_id_scan/icon_24_comments.svg";
import {ReactComponent as Animation} from "../assets/vk_id_scan/Animation2.svg";
import Lottie from "lottie-react";

let timeoutSearchUser, loadingProcessInterval;

/**
 * Функция для генерации кода для метода execute.
 * Принимает массив объектов с параметрами для вызова (например, для friends.get).
 * Каждый объект должен содержать:
 *   - method: имя метода (например, 'friends.get')
 *   - params: объект с параметрами вызова
 *   - first: строка, вставляемая перед вызовом API (например, '{ "uid":123, "items":')
 *   - last: строка, вставляемая после вызова API (например, '.items}' )
 */
function generateExecute(calls) {
    let code = 'return [';
    code += calls.map(c => {
        const paramsStr = Object.entries(c.params)
            .map(([key, val]) => `${key}: ${JSON.stringify(val)}`)
            .join(',');
        return `${c.first || ''}API.${c.method}({${paramsStr}})${c.last || ''}`;
    }).join(',');
    code += '];';
    return code;
}

/**
 * Получение списка друзей для указанного массива userId, объединяя вызовы через execute.
 * Возвращает объект, где ключ – user_id, а значение – массив его друзей.
 */
async function batchGetFriends(ids, token) {
    const result = {};
    const batchSize = 25; // до 25 вызовов за один execute
    for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        // Формируем массив вызовов для каждого user_id из батча
        const calls = batch.map(userId => ({
            method: 'friends.get',
            params: {user_id: userId, count: 5000, v: '5.131', access_token: token},
            // Оборачиваем, чтобы вернуть объект с uid и items:
            first: `{"uid":${userId},"items":`,
            last: '.items}'
        }));
        const code = generateExecute(calls);
        try {
            const response = await bridge.send('VKWebAppCallAPIMethod', {
                method: 'execute',
                params: {code, access_token: token, v: '5.131'}
            });
            if (response && response.response && Array.isArray(response.response)) {
                // Каждый элемент response.response должен быть объектом: { uid: <userId>, items: [...] }
                for (const item of response.response) {
                    if (item && item.uid != null && item.items) {
                        result[item.uid] = item.items;
                    }
                }
            }
        } catch (e) {
            console.error('batchGetFriends error:', e);
        }
    }
    return result;
}

/**
 * Основная функция поиска цепочки рукопожатий между userA и userB (через друзей),
 * с ограничением поиска до 10 шагов.
 * @param {number} user - ID владельца токена (например, текущего пользователя)
 * @param {number} userA - начальный ID поиска (тот, от кого идёт поиск)
 * @param {number} userB - конечный ID поиска
 * @param {string} token - пользовательский токен с правами friends
 * @returns {Promise<number[] | []>} - массив ID от userA до userB или пустой массив, если путь не найден
 */
export async function findHandshakePath(user, userA, userB, token) {
    // Если пользователь не владеет токеном (user !== userA) – пропускаем прямую проверку
    if (user == userA) {
        try {
            const areFriendsRes = await bridge.send('VKWebAppCallAPIMethod', {
                method: 'friends.areFriends',
                params: {user_ids: userB, access_token: token, v: '5.131'}
            });
            if (areFriendsRes.response && areFriendsRes.response[0] && areFriendsRes.response[0].friend_status === 3) {
                return [userA, userB];
            }
        } catch (e) {
            console.warn('friends.areFriends error:', e);
        }
    }

    // Проверим взаимных друзей (2 рукопожатия)
    try {
        const mutualRes = await bridge.send('VKWebAppCallAPIMethod', {
            method: 'friends.getMutual',
            params: {source_uid: userA, target_uid: userB, access_token: token, v: '5.131'}
        });
        if (mutualRes.response && mutualRes.response.length > 0) {
            return [userA, mutualRes.response[0], userB];
        }
    } catch (e) {
        console.warn('friends.getMutual error:', e);
    }

    // Инициализация двунаправленного BFS
    const maxDepth = 10;
    const visitedA = new Map(); // key: user id, value: родитель (для восстановления пути)
    const visitedB = new Map();
    visitedA.set(userA, null);
    visitedB.set(userB, null);
    let frontierA = [userA];
    let frontierB = [userB];
    let foundMeeting = null;
    let meetingId = null;
    let depth = 0;

    // Функция для восстановления пути от A до B через встречный узел meet
    function buildPath(meet) {
        const pathA = [];
        let cur = meet;
        while (cur !== null) {
            pathA.push(cur);
            cur = visitedA.get(cur);
        }
        pathA.reverse(); // от userA до meet

        const pathB = [];
        cur = meet;
        while (cur !== null) {
            pathB.push(cur);
            cur = visitedB.get(cur);
        }
        // Убираем дублирование meet
        pathB.shift();
        return pathA.concat(pathB);
    }

    // Двунаправленный BFS c batch‑запросами
    while (depth < maxDepth && frontierA.length && frontierB.length) {
        depth++;
        // Расширяем сторону с меньшим количеством текущих узлов
        let expandSide, oppositeVisited;
        if (frontierA.length <= frontierB.length) {
            expandSide = 'A';
            oppositeVisited = visitedB;
        } else {
            expandSide = 'B';
            oppositeVisited = visitedA;
        }
        // Получаем текущую группу узлов для расширения с выбранной стороны
        const currentFrontier = expandSide === 'A' ? frontierA : frontierB;
        // Вместо последовательного вызова friends.get для каждого узла, объединяем их в один batch
        const friendsMap = await batchGetFriends(currentFrontier, token);
        // Обновляем новую волну
        const nextFrontier = [];
        // Перебираем каждого узла из текущей волны
        for (const u of currentFrontier) {
            const friendList = friendsMap[u] || [];
            for (const f of friendList) {
                // Если уже посещён этой стороной, пропускаем
                if (expandSide === 'A') {
                    if (!visitedA.has(f)) {
                        visitedA.set(f, u); // запоминаем родителя
                        // Если f уже посещён с противоположной стороны, найдено пересечение!
                        if (oppositeVisited.has(f)) {
                            foundMeeting = true;
                            meetingId = f;
                            break;
                        }
                        nextFrontier.push(f);
                    }
                } else {  // expandSide === 'B'
                    if (!visitedB.has(f)) {
                        visitedB.set(f, u);
                        if (oppositeVisited.has(f)) {
                            foundMeeting = true;
                            meetingId = f;
                            break;
                        }
                        nextFrontier.push(f);
                    }
                }
            }
            if (foundMeeting) break;
        }
        // Обновляем frontier для выбранной стороны
        if (expandSide === 'A') {
            frontierA = nextFrontier;
        } else {
            frontierB = nextFrontier;
        }
        if (foundMeeting) {
            return buildPath(meetingId);
        }
    }

    // Если ничего не нашли до maxDepth – возвращаем пустой массив
    return [];
}

export default class extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            searchUser: false,
            searchUsers: [],
            top_activity_selected: 0,
            activity_selected: 0,
            loading_process: 0,
            reviews: [],
            incoming_activity: [],
            outgoing_activity: []
        }

        initializeNavigation.bind(this)('main');

        this.componentDidMount = this.componentDidMount.bind(this);
        this.fetchReport = this.fetchReport.bind(this);
        this.fetchReportActions = this.fetchReportActions.bind(this);
        this.saveToken = this.saveToken.bind(this);
        this.fetchUserData = this.fetchUserData.bind(this);
        this.fetchHandshake = this.fetchHandshake.bind(this);
        this.fetchReviews = this.fetchReviews.bind(this);
        this.fetchActivity = this.fetchActivity.bind(this);
    }

    async api(method, params = {}) {
        if (method === 'getReport') {
            return (await post(`https://idscan.special-backend.ru/method/${method}`, {...getUrlParams(), ...params})).data;
        } else {
            return await get(`https://idscan.special-backend.ru/method/${method}`, {...getUrlParams(), ...params});
        }
    }

    async componentDidMount() {
        subscribeBridgeEvents({}, 'space_gray');
        this.changeStatusBarColor();

        await bridge.send('VKWebAppInit');

        const vk_user = await bridge.send('VKWebAppGetUserInfo');
        await this.setState({vk_user});
        await this.fetchUserData();
        const {userInfo} = this.state;
        await this.setActivePanel(!userInfo.agreement ? 'main' : 'select-scan');
        if (userInfo.agreement) {
            if (window.location.hash && window.location.hash.length > 1) {
                const report_id = window.location.hash.substring(1);
                this.fetchReport(report_id);
            }
        }

    }

    changeStatusBarColor() {
        if (bridge.supports('VKWebAppSetViewSettings')) {
            bridge.send('VKWebAppSetViewSettings', {
                status_bar_style: 'light',
                action_bar_color: '#07092C'
            });
        }
    }

    async saveToken() {
        await this.setPopout(<ScreenSpinner/>);
        let access_token;
        for (let i = 0; i < 1; i++) {
            access_token = await getToken('friends');
            if (!access_token) {
                await this.setSnackbar('Для поиска пользователей нужен доступ.');
                await sleep(1000);
                i--;
            }
        }
        await this.setState({access_token});
        await this.setPopout(null);
    }

    async fetchUserData() {
        await this.setPopout(<ScreenSpinner/>);
        let {access_token, vk_user, userInfo} = this.state;
        if (!this.state.userInfo) {
            userInfo = (await this.api('getUser')).response;
            /*userInfo = {
                user_id: 245481845,
                history: [1],
                agreement: true
            };*/ // fetch from api
            await this.setState({userInfo});
        }
        if (userInfo.agreement && !access_token) {
            await this.saveToken();
            access_token = this.state.access_token;
            await this.setPopout(<ScreenSpinner/>);
        }
        if (access_token) {
            userInfo.history = userInfo.history.slice(Math.max(0, userInfo.history.length - 10), Math.max(0, userInfo.history.length - 10) + 10);
            if (!userInfo.history.includes(vk_user.id + '')) {
                userInfo.history.unshift(vk_user.id);
            }
            userInfo.history = await getVKUsers(userInfo.history, access_token);
            await this.setState({userInfo, searchUsers: userInfo.history});
        }
        await this.setPopout(null);
    }

    async fetchReport(report_id) {
        await getVKUsers([report_id], this.state.access_token);
        await this.setActivePanel('loading');
        await this.setPopout(<ScreenSpinner/>);
        const report = await this.api('getReport', {source_id: report_id}); // fetch from api
        console.log({step: 0, report});
        await sleep(1000);
        if (report.response) {
            await this.setState({report: report.response});
            await this.setPopout(null);
            await this.setActivePanel('result');
            this.fetchReportActions();
        } else if (report.response === false) {
            await this.setPopout(null);
            await this.setActivePanel('select-scan');
            await this.setSnackbar(report.blocked ? 'Пользователь заблокировал сканирование.' : 'Не удалось получить данные. Пожалуйста, откройте приложение из бота.');
        } else {
            await this.setPopout(null);
            loadingProcessInterval = setInterval(async () => {
                const status = (await this.api('getReportStatus', {source_id: report_id})).response; // fetch from api get report status
                this.setState({loading_process: status});
                if (status >= 100) {
                    clearInterval(loadingProcessInterval);
                    const report = await this.api('getReport', {source_id: report_id}); // fetch from api
                    console.log({step: 1, report});
                    if (report.response === false) {
                        await this.setPopout(null);
                        await this.setActivePanel('select-scan');
                        return await this.setSnackbar(report.blocked ? 'Пользователь заблокировал сканирование.' : 'Не удалось получить данные. Пожалуйста, откройте приложение из бота.');
                    }
                    await this.setState({report: report.response});
                    await this.setPopout(null);
                    await this.setActivePanel('result');
                    this.fetchReportActions();
                }
            }, 3000);
        }
    }

    async fetchReportActions() {
        await this.saveToken();

        const {access_token, report} = this.state;

        // Блок 1: Топ активности
        const outgoing_activity_data = {}, incoming_activity_data = {};

        report.outgoing_activity.forEach(activity => {
            const owner_id = activity.source.substring(activity.source.startsWith('photo') ? 'photo'.length : 'wall'.length).split('_')[0];
            if (!outgoing_activity_data[owner_id])
                outgoing_activity_data[owner_id] = {
                    likes: 0,
                    comments: 0,
                    total: 0
                }

            outgoing_activity_data[owner_id].total++;
            outgoing_activity_data[owner_id][activity.type === 'like' ? 'likes' : 'comments']++;
        });

        report.incoming_activity.forEach(activity => {
            if (!incoming_activity_data[activity.from_id])
                incoming_activity_data[activity.from_id] = {
                    likes: 0,
                    comments: 0,
                    total: 0
                }

            incoming_activity_data[activity.from_id].total++;
            incoming_activity_data[activity.from_id][activity.type === 'like' ? 'likes' : 'comments']++;
        });

        const outgoing_activity_top = Object.keys(outgoing_activity_data).sort((a, b) => outgoing_activity_data[b].total - outgoing_activity_data[a].total).slice(0, 20);
        if (outgoing_activity_top.length > 0)
            await getVKUsers(outgoing_activity_top, access_token);

        const incoming_activity_top = Object.keys(incoming_activity_data).sort((a, b) => incoming_activity_data[b].total - incoming_activity_data[a].total).slice(0, 20);
        if (incoming_activity_top.length > 0)
            await getVKUsers(incoming_activity_top, access_token);

        await this.setState({
            outgoing_activity_data,
            outgoing_activity_top,
            incoming_activity_data,
            incoming_activity_top
        });

        // Блок 2: Вероятные друзья
        if (report.possible_friends.length > 0)
            await getVKUsers(report.possible_friends, access_token);
        await this.setState({possible_friends: true});

        await this.fetchActivity(true);
        await this.fetchReviews(true);
    }

    async fetchReviews(first) {
        await this.setState({fetch_reviews: true});
        const {reviews, report} = this.state;
        const data = (await this.api('getReviews', {source_id: report.user_id, offset: reviews.length})).response;// fetch from api
        if (data.length === 0 && first !== true) {
            this.setSnackbar('Отзывов пока что нет.');
        }
        reviews.push(...data);
        await this.setState({reviews, fetch_reviews: false});
    }

    async fetchActivity(first) {
        await this.setState({fetch_activity: true});

        let {incoming_activity, outgoing_activity, report, access_token, activity_selected} = this.state;
        for (let i = 0; i < 2; i++) {
            const is_incoming_activity = first === true ? i : activity_selected === 1;
            if (is_incoming_activity ?
                (report.incoming_activity.length <= incoming_activity.length) :
                (report.outgoing_activity.length <= outgoing_activity.length)) {
                if (first !== true) {
                    this.setSnackbar('Вы достигли конца списка');
                }
            } else {
                const next_activity = report[is_incoming_activity ? 'incoming_activity' : 'outgoing_activity']
                    .slice(
                        (is_incoming_activity ? incoming_activity : outgoing_activity).length,
                        (is_incoming_activity ? incoming_activity : outgoing_activity).length + 10
                    )
                ;
                if (is_incoming_activity) {
                    incoming_activity.push(...next_activity);
                } else {
                    outgoing_activity.push(...next_activity);
                }

                const activity_user_ids = [
                    ...next_activity.map(activity =>
                        is_incoming_activity ?
                            activity.from_id :
                            activity.source.substring(activity.source.startsWith('photo') ? 'photo'.length : 'wall'.length).split('_')[0]
                    )
                ].filter(v => !!v);
                if (activity_user_ids.length > 0)
                    await getVKUsers(activity_user_ids, access_token);

            }
            if (first !== true) {
                break;
            }
        }
        this.setState({incoming_activity, outgoing_activity});

        await this.setState({fetch_activity: false});
    }

    async fetchHandshake(user_id) {
        await this.setState({handshake_fetch: true, handshake: []});
        const {access_token, report, vk_user} = this.state;
        const source_id = report.user_id;
        if (user_id == source_id) {
            return this.setSnackbar('Пользователь не найден.');
        }
        let user_data = (await getVKUsers([user_id], access_token))[0];
        if (user_data) {
            user_id = user_data.id;
            const data = await findHandshakePath(vk_user.id, report.user_id, user_id, access_token);
            console.log(data);
            if (data.length === 0) {
                await this.setSnackbar('Не удалось получить данные :(');
            } else {
                await getVKUsers(data);
                await this.setState({handshake: data});
            }
        } else {
            await this.setSnackbar('Пользователь не найден.');
        }
        await this.setState({handshake_fetch: false});
    }

    render() {
        const {
            vk_user,
            snackbar,
            searchUser,
            searchUsers,
            userInfo,
            access_token,
            scanId,
            loading_process,
            allow_messages,
            report,
            top_activity_selected, activity_selected,
            handshake,
            handshake_url,
            handshake_fetch,
            selected_score,
            score_text,

            incoming_activity_data, incoming_activity_top,
            outgoing_activity_data, outgoing_activity_top,
            possible_friends,
            reviews, fetch_reviews,

            incoming_activity, outgoing_activity, fetch_activity
        } = this.state;
        const is_incoming_activity = activity_selected === 1;

        return (
            <View
                {...defaultViewProps.bind(this)()}
            >

                <Panel id='main'>
                    <Logo id='logo'/>
                    <h1>Привет! <img alt='icon' src={require('../assets/vk_id_scan/icon_hand.webp')}/></h1>
                    <h2>Прежде чем мы продолжим, ознакомься:</h2>
                    <div className='agreements'>
                        {
                            [
                                ['Правила сервиса', 'https://vk.com/topic-135209264_52897843'],
                                ['Пользовательское соглашение', 'https://vk.com/topic-135209264_52897844'],
                                ['Политика конфиденциальности', 'https://vk.com/topic-135209264_52897846'],
                                ['Условия предоставления услуг', 'https://vk.com/topic-135209264_52897848']
                            ].map((value, index) =>
                                <button
                                    key={index}
                                    onClick={() => openUrl(value[1])}
                                >
                                    {value[0]}
                                </button>
                            )
                        }
                    </div>
                    <button
                        onClick={async () => {
                            await this.saveToken();
                            // fetch from api acceptAgreement
                            await this.api('acceptAgreement');
                            userInfo.agreement = true;
                            await this.setState({userInfo});
                            await this.fetchUserData();
                            await this.setActivePanel('select-scan');
                        }}
                    >
                        Ознакомился, я согласен!
                    </button>
                    {snackbar}
                </Panel>

                <Panel id='select-scan'>
                    <Logo id='logo'/>
                    <h1>Какую страницу будем сканировать? </h1>
                    <h2>Введите ссылку на страницу:</h2>
                    <CustomSelect
                        options={
                            (searchUsers.length > 0 ? searchUsers : (userInfo ? userInfo.history : [])).map(value => ({
                                label: `${value.first_name} ${value.last_name}`,
                                value: `${value.id}`,
                                screen_name: `${value.screen_name}`
                            }))
                        }
                        searchable={true}
                        placeholder={'vk.com/id12345'}
                        disabled={searchUser}
                        onInputChange={(e) => {
                            clearTimeout(timeoutSearchUser);
                            timeoutSearchUser = setTimeout(async () => {
                                const value = getClearUserId(e.target.value);
                                if (!value) {
                                    this.setState({searchUsers: []});
                                    return;
                                }

                                this.setState({searchUser: true});
                                const users = (await getVKUsers([value], access_token)).filter(v => !!v);
                                await this.setState({searchUsers: users, searchUser: false});
                                this.forceUpdate();
                            }, 1000);
                        }}
                        onChange={(e) => {
                            const value = e.target.value;
                            this.setState({scanId: value});
                        }}
                        filterFn={(value, option) => {
                            try {
                                return searchUsers.length > 0 ? true : option.label.toLowerCase().includes(value.toLowerCase()) ||
                                    option.value.toLowerCase().includes(value.toLowerCase()) ||
                                    option.screen_name.includes(getClearUserId(value))
                            } catch(e) {
                                return true;
                            }
                        }}
                        onOpen={() => this.setState({searchUsers: []})}
                        fetching={searchUser}
                    />
                    <button
                        onClick={async () => {
                            if (!scanId) return this.setSnackbar('Сначала выбери пользователя');
                            await this.fetchReport(scanId);
                        }}
                    >
                        <img alt='icon' src={require('../assets/vk_id_scan/icon_search.webp')}/>
                        Сканировать
                    </button>
                    {snackbar}
                </Panel>

                <Panel id='loading'>
                    <Logo id='logo'/>
                    <h1>Идет обработка {loading_process > 0 &&
                        <React.Fragment><br/>({loading_process}%)</React.Fragment>}</h1>
                    <h2>Это может занять от 1 минут до 24 часов</h2>
                    <div className='box'>
                        <div>
                            <IconMessage/>
                            <p>Результат будет отправлен вам в личные сообщения!</p>
                        </div>
                        <button
                            style={{
                                display: allow_messages ? 'none' : ''
                            }}
                            onClick={() => {
                                bridge.send('VKWebAppAllowMessagesFromGroup', {group_id: 135209264})
                                    .then(() => {
                                        this.setSnackbar('Отлично! Скоро пришлём результат.');
                                        this.setState({allow_messages: true});
                                    })
                                    .catch(() => this.setSnackbar('Доступ к сообщениям не был получен.'))
                            }}
                        >
                            Разрешить сообщения
                        </button>
                    </div>
                    {
                        false ?
                            <Animation/>
                            :
                            <Lottie
                                id='animation'
                                autoplay={true}
                                loop={true}
                                animationData={require(`../assets/vk_id_scan/animation.json`)}
                                width={window.innerWidth}
                            />
                    }
                    {snackbar}
                </Panel>

                <Panel id='result'>
                    <Logo id='logo'/>
                    {
                        report && <React.Fragment>
                            <p>Результат:</p>

                            <div className='user-header'>
                                <img alt='avatar' src={report.photo_100}/>
                                <p>{report.first_name} {report.last_name}</p>
                            </div>

                            <div className='grid'>
                                {
                                    [
                                        ['ID:', report.user_id],
                                        ['Пол:', report.sex === 2 ? 'Мужской' : 'Женский'],
                                        ['Дата рождения:', report.bdate || 'Не указана'],
                                        ['Страна:', report.country || 'Не указана'],
                                        ['Дата регистрации:', report.regdate],
                                        ['Последний заход:', new Date(vk_local_users[report.user_id] && vk_local_users[report.user_id].last_seen ? vk_local_users[report.user_id].last_seen.time * 1000 : parseInt(report.last_seen)).toLocaleDateString('ru-RU', {
                                            day: 'numeric',
                                            month: 'numeric',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric'
                                        })],
                                        ['Подписчиков:', report.followers_count]
                                    ].map((value, index) =>
                                        <div key={index}>
                                            <p>{value[0]}</p>
                                            <p>{value[1]}</p>
                                        </div>
                                    )
                                }
                            </div>

                            <div className='block block-1'>
                                <h1>
                                    <span>1</span>
                                    Активность
                                </h1>
                                <div className='switch'>
                                    {
                                        ['Исходящая', 'Входящая'].map((value, index) =>
                                            <button
                                                key={index}
                                                onClick={() => this.setState({top_activity_selected: index})}
                                                className={top_activity_selected === index ? 'active' : ''}
                                            >
                                                {value}
                                            </button>)
                                    }
                                    <span className='background' style={{
                                        left: `${top_activity_selected * (100 / 2)}%`,
                                        width: `${100 / 2}%`
                                    }}/>
                                </div>
                                <p>
                                    {
                                        top_activity_selected === 0 ?
                                            'Топ страниц, на которых пользователь производил активности:'
                                            :
                                            'Топ страниц, которые производили активность на странице пользователя:'
                                    }
                                </p>
                                {
                                    outgoing_activity_data && outgoing_activity_top && incoming_activity_data && incoming_activity_top ?
                                        <div className='list'>
                                            {
                                                (top_activity_selected === 0 ? outgoing_activity_top : incoming_activity_top).map((id, index) =>
                                                    <div
                                                        key={index}
                                                        onClick={() => openUrl(`https://vk.com/id${id}`)}
                                                    >
                                                        <span>{index + 1}</span>
                                                        <img alt='avatar' src={vk_local_users[id].photo_100}/>
                                                        <span>{vk_local_users[id].first_name} {vk_local_users[id].last_name}</span>
                                                        <div>
                                                            <span>
                                                                <IconLikes/>
                                                                {(top_activity_selected === 0 ? outgoing_activity_data : incoming_activity_data)[id].likes}
                                                            </span>
                                                            <span>
                                                                <IconComments/>
                                                                {(top_activity_selected === 0 ? outgoing_activity_data : incoming_activity_data)[id].comments}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        </div>
                                        :
                                        <ScreenSpinner/>
                                }
                            </div>

                            <div className='block block-2'>
                                <h1>
                                    <span>2</span>
                                    Вероятные друзья
                                </h1>
                                <p>
                                    Страницы, которых нет в друзьях у пользователя, но которые часто пересекаются среди его
                                    друзей:
                                </p>
                                {
                                    possible_friends ?
                                        <div className='list'>
                                            <InfiniteScroll
                                                items={report.possible_friends}
                                                initialCount={50}
                                                step={10}
                                                renderItem={(id, index) =>
                                                    <div
                                                        key={index}
                                                        onClick={() => openUrl(`https://vk.com/id${id}`)}
                                                    >
                                                        <span>{index + 1}</span>
                                                        <img alt='avatar' src={vk_local_users[id].photo_100}/>
                                                        <span>{vk_local_users[id].first_name} {vk_local_users[id].last_name}</span>
                                                    </div>
                                                }
                                            />
                                        </div>
                                        :
                                        <ScreenSpinner/>
                                }
                            </div>

                            <div className='block block-3'>
                                <h1>
                                    <span>3</span>
                                    История активности
                                </h1>
                                <div className='switch'>
                                    {
                                        ['Исходящая', 'Входящая'].map((value, index) =>
                                            <button
                                                key={index}
                                                onClick={() => this.setState({activity_selected: index})}
                                                className={activity_selected === index ? 'active' : ''}
                                            >
                                                {value}
                                            </button>)
                                    }
                                    <span className='background' style={{
                                        left: `${activity_selected * (100 / 2)}%`,
                                        width: `${100 / 2}%`
                                    }}/>
                                </div>
                                <div className='list'>
                                    {
                                        (is_incoming_activity ? incoming_activity : outgoing_activity).map(
                                            (activity, index) => {
                                                const source_id = activity.source.substring(activity.source.startsWith('photo') ? 'photo'.length : 'wall'.length).split('_')[0];
                                                const user_data = vk_local_users[is_incoming_activity ? activity.from_id : report.user_id];
                                                const user_data2 = vk_local_users[!is_incoming_activity ? source_id : report.user_id];
                                                const action = {
                                                    like: `поставил${is_incoming_activity && user_data.sex === 1 ? 'а' : ''} лайк на ${activity.source.startsWith('photo') ? 'фото' : (activity.source.startsWith('wall') ? 'запись' : 'комментарий')}`,
                                                    comment: `написал${is_incoming_activity && user_data.sex === 1 ? 'а' : ''} комментарий под ${activity.source.startsWith('photo') ? 'фото' : (activity.source.startsWith('wall') ? 'записью' : 'комментарий')}`,
                                                    post: `написал${is_incoming_activity && user_data.sex === 1 ? 'а' : ''} пост на стене`
                                                };
                                                return <div
                                                    key={index}
                                                    onClick={() => openUrl(`https://vk.com/${activity.source}`)}
                                                >
                                                    <span>{index + 1}</span>
                                                    <img alt='avatar'
                                                         src={(is_incoming_activity ? user_data : user_data2).photo_100}/>
                                                    <span>{user_data.first_name} {action[activity.type]} {user_data2.first_name_gen}</span>
                                                </div>
                                            }
                                        )
                                    }
                                </div>
                                {
                                    fetch_activity && <ScreenSpinner/>
                                }
                                <button
                                    className='load-more'
                                    onClick={this.fetchActivity}
                                    style={fetch_activity ? {opacity: .5, pointerEvents: 'none'} : {}}
                                >
                                    Загрузить ещё...
                                </button>
                            </div>

                            <div className='block block-4'>
                                <h1>
                                    <span>4</span>
                                    Возраст и пол друзей
                                </h1>
                                <p>
                                    Мы анализируем страницы друзей и презентуем вам сводную статистику об их показателях.
                                    Делайте выводы!)
                                </p>
                                <div className='graph-sex'>
                                    <div>
                                        <span>{report.friends.graph[0] || 0}%</span>
                                        <span>{report.friends.graph[1] || 0}%</span>
                                    </div>
                                    <div>
                                        <div style={{width: `${report.friends.graph[0] || 0}%`}}/>
                                    </div>
                                    <div>
                                        <span>Мужской</span>
                                        <span>Женский</span>
                                    </div>
                                </div>
                                <div className='graph-years'>
                                    {
                                        [
                                            [report.friends.years[0] || 0, 'до 18'],
                                            [report.friends.years[1] || 0, '19-25'],
                                            [report.friends.years[2] || 0, '26-35'],
                                            [report.friends.years[3] || 0, '36+']
                                        ].map((value, index) =>
                                            <div key={index}>
                                                <span>{value[0]}%</span>
                                                <div style={{height: `${value[0]}%`}}/>
                                                <span>{value[1]}</span>
                                            </div>
                                        )
                                    }
                                </div>
                            </div>

                            <div className='block block-5'>
                                <h1>
                                    <span>5</span>
                                    Важные сообщества
                                </h1>
                                <p>
                                    Сообщества, с которыми пользователь, скорее всего, часто взаимодействует:
                                </p>
                                <div className='list'>
                                    <InfiniteScroll
                                        items={report.groups}
                                        initialCount={50}
                                        step={10}
                                        renderItem={(value, index) =>
                                            <div
                                                key={index}
                                                onClick={() => openUrl(`https://vk.com/club${value.id}`)}
                                            >
                                                <span>{index + 1}</span>
                                                <img alt='avatar' src={value.photo_100}/>
                                                <span>{value.name}</span>
                                            </div>
                                        }
                                    />
                                </div>
                            </div>

                            <div className='block block-6'>
                                <h1>
                                    <span>6</span>
                                    Шесть рукопожатий
                                </h1>
                                <p>
                                    Проверить через сколько рукопожатий данный пользователь знаком с другим
                                </p>
                                {handshake && <div className='list'>
                                    {
                                        handshake.map((id, index) =>
                                            <div
                                                key={index}
                                                onClick={() => openUrl(`https://vk.com/id${id}`)}
                                            >
                                                <span>{index + 1}</span>
                                                <img alt='avatar' src={vk_local_users[id].photo_100}/>
                                                <span>{vk_local_users[id].first_name} {vk_local_users[id].last_name}</span>
                                            </div>
                                        )
                                    }
                                </div>}
                                {
                                    handshake_fetch && <ScreenSpinner/>
                                }
                                <input
                                    style={handshake_fetch ? {opacity: .5, pointerEvents: 'none'} : {}}
                                    placeholder='vk.com/id12345'
                                    onChange={(e) => {
                                        this.setState({handshake_url: e.target.value})
                                    }}
                                />
                                <button
                                    style={handshake_fetch ? {opacity: .5, pointerEvents: 'none'} : {}}
                                    onClick={async () => {
                                        const user_id = getClearUserId(handshake_url);
                                        if (user_id) {
                                            this.fetchHandshake(user_id);
                                        } else {
                                            this.setSnackbar('Сначала введи ссылку на страницу');
                                        }
                                    }}
                                >
                                    <img alt='icon' src={require('../assets/vk_id_scan/icon_search.webp')}/>
                                    Искать
                                </button>
                            </div>

                            <div className='block block-7'>
                                <h1>
                                    <span>7</span>
                                    Отзывы
                                </h1>
                                <div className='user-header'>
                                    <img alt='avatar' src={report.photo_100}/>
                                    <p>{report.first_name} {report.last_name}</p>
                                </div>
                                <p className='score'>
                                    Средняя оценка:
                                    <span>{reviews && reviews.length > 0 ? (reviews.map(v => v.score).reduce((a, b) => a + b) / reviews.length).toFixed(2) : 0}/10</span>
                                </p>
                                <div className='list'>
                                    {
                                        reviews.map((value, index) =>
                                            <div
                                                key={index}
                                                onClick={() => openUrl(`https://vk.com/id${value.from_id}`)}
                                            >
                                                <span>{value.score}</span>
                                                <div>
                                                    <p>
                                                        {vk_local_users[value.from_id].first_name} {vk_local_users[value.from_id].last_name}
                                                    </p>
                                                    <p>
                                                        {value.text}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    }
                                </div>
                                {
                                    fetch_reviews && <ScreenSpinner/>
                                }
                                <button
                                    className='load-more'
                                    onClick={this.fetchReviews}
                                    style={fetch_reviews ? {opacity: .5, pointerEvents: 'none'} : {}}
                                >
                                    Загрузить ещё...
                                </button>
                                <p>
                                    Вы можете оценить данного пользователя и оставить короткий отзыв:
                                </p>
                                <div className='score-grid'>
                                    {
                                        new Array(10).fill(0).map((value, index) =>
                                            <div
                                                key={index}
                                                className={selected_score === index ? 'active' : ''}
                                                onClick={() => {
                                                    this.setState({selected_score: selected_score === index ? -1 : index})
                                                }}
                                            >
                                                {index + 1}
                                            </div>
                                        )
                                    }
                                </div>
                                <input
                                    placeholder='Напишите свой отзыв здесь'
                                    id='input_score_text'
                                    onChange={(e) => {
                                        this.setState({score_text: e.target.value})
                                    }}
                                />
                                <button
                                    onClick={async () => {
                                        if (!(selected_score >= 0 && selected_score <= 9)) {
                                            return this.setSnackbar('Сначала поставь оценку');
                                        }

                                        if (!score_text || score_text.trim().length < 10) {
                                            return this.setSnackbar('Слишком короткий отзыв');
                                        }

                                        if (score_text && score_text.trim().length > 1024) {
                                            return this.setSnackbar('Слишком длинный отзыв');
                                        }

                                        if (vk_user.id == report.user_id) {
                                            return this.setSnackbar('Вы не можете оставить отзыв самому себе');
                                        }

                                        await this.setPopout(<ScreenSpinner/>);
                                        const review = await this.api('sendReview', {
                                            source_id: report.user_id,
                                            text: score_text,
                                            score: selected_score + 1
                                        }); // fetch from api
                                        if (review.response) {
                                            reviews.push(review.response);
                                            this.setState({reviews});
                                            document.querySelector('#input_score_text').value = '';
                                            this.setState(({selected_score: -1}));
                                        }
                                        await this.setPopout(null);
                                    }}
                                >
                                    Оставить отзыв
                                </button>
                            </div>

                        </React.Fragment>
                    }
                    {snackbar}
                </Panel>

            </View>
        )
    }

}