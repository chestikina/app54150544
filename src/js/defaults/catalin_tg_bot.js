import React from 'react';
import {get, getRandomInt, getUrlParams, sleep} from "../utils";
import bridge from "@vkontakte/vk-bridge";
import {CustomSelect} from "@vkontakte/vkui";
import {getStorageValue, setStorageValue} from "./bridge_utils";

export const
    categoriesYears = 4, // Кол-во категорий для возрастов (до 23, после 23; до 23, до 29, после 29)
    countGroupsForMessage = 2, // Кол-во групп в одной категории (сообщения)
    countGroupsForSubscribe = 3, // Кол-во групп в одной категории (подписка)

    apiUrl = 'https://groups.special-backend.ru/api/',
    getAppUrl = apiUrl + 'apps.get',
    payloadUrl = apiUrl + 'payload.send',
    subscribeNotifyUrl = 'https://groups.special-backend.ru/api/users.enableNotifications',
    getRegDateUrl = 'https://groups.special-backend.ru/api/users.getRegDate',
    proxyUrl = 'https://proxy.special-backend.ru/'
;

let groupDetails = false;
let defaultCategory = 0;

export function getCategories() {
    return (
        {
            2: {
                2: { // мужской
                    0: 23,
                    1: 24
                },
                1: { // женский
                    2: 23,
                    3: 24
                },
            },
            3: {
                2: { // мужской
                    0: 23,
                    1: 29,
                    2: 30
                },
                1: { // женский
                    3: 23,
                    4: 29,
                    5: 30
                },
            },
            4: {
                2: { // мужской
                    0: 16,
                    1: 20,
                    2: 29,
                    3: 30
                },
                1: { // женский
                    4: 16,
                    5: 20,
                    6: 29,
                    7: 30
                },
            }
        }
    )[categoriesYears];
}

export function getCategory(sex, years) {
    const data = getCategories();
    if (sex === 0 || years === 0) return defaultCategory;

    const
        categories = data[sex],
        keys = Object.keys(categories),
        categories_years = keys.map(value => ([value, categories[value]]))
    ;

    for (let i = 0; i < categories_years.length; i++) {
        const category = categories_years[i];
        if (i === categories_years.length - 1)
            return parseInt(category[0]);

        if (parseInt(years) <= parseInt(category[1]))
            return parseInt(category[0]);
    }

    return defaultCategory;
}

async function updateGroupsData(app) {
    const keys = ['groupsJoinUser', 'groupsMessageUser'];
    const data = {};
    for (const key of keys) {
        data[key] = [];
        const groups = app[key];
        for (let i = 0; i < groups.length; i++) {
            try {
                const group_data = await bridge.send('VKWebAppGetGroupInfo', {group_id: groups[i]});
                data[key].push(group_data);
            } catch (e) {
                console.error(e);
                i--;
                await sleep(1000);
            }
        }
    }
    return {...app, ...data};
}

export async function getAppInfo(group_details_need = false) {
    groupDetails = group_details_need;
    let
        app_id = parseInt(getUrlParams().vk_app_id || 0),
		app_info = await get(getAppUrl, {app_id}),
        app = app_info.response
    ;
	/*console.log(`App api url`, getAppUrl, app_id);
	console.log(`Get app info`, app_info);
	console.log(`Get app info response`, app);*/

    if (!app)
        app = {
            app_id,
            group_id_join: new Array(categoriesYears * countGroupsForSubscribe * 2).fill(1),
            group_id_message: new Array(categoriesYears * countGroupsForMessage * 2).fill(1),
            save_photo_album: true,
            need_panel_upload_photo: true,
            tg_urls: [],
            is_show_tg: false,
            categories_for_tg: [],
            category_group_default: 0,
            album_name: "🤪",
            album_caption: "Узнай как получить бесплатные стикеры - vk.com/app51535584#mark",
            need_upload_default_album_photo: false,
            album_default_photo_url: "https://i.ibb.co/vDCcZsf/photo-2023-01-27-14-38-48.jpg"
        }

    const
        groupsJoinCategory = [],
        groupsMessageCategory = [],

        {
            category_group_default,
            is_show_tg,
            categories_for_tg,
            need_panel_upload_photo,
            need_upload_default_album_photo,
            album_default_photo_url,
            group_id_join,
            group_id_message,
            save_photo_album,
            tg_urls
        } = app
    ;

    defaultCategory = category_group_default;

    for (let i = 0; i < group_id_join.length; i += countGroupsForSubscribe) {
        groupsJoinCategory.push(group_id_join.slice(i, i + countGroupsForSubscribe));
    }

    for (let i = 0; i < group_id_message.length; i += countGroupsForMessage) {
        groupsMessageCategory.push(group_id_message.slice(i, i + countGroupsForMessage));
    }

    const
        vk_user = await bridge.send('VKWebAppGetUserInfo'),
        {sex, bdate} = vk_user,
        years = bdate ? (bdate.split('.').length === 3 ? (new Date().getFullYear() - parseInt(vk_user.bdate.split('.')[2])) : 0) : 0,

        showGroupsCategory = getCategory(sex, years),

        groupsJoinUser = groupsJoinCategory[group_id_join.length < countGroupsForSubscribe ? defaultCategory : showGroupsCategory],
        groupsMessageUser = groupsMessageCategory[group_id_message.length < countGroupsForMessage ? defaultCategory : showGroupsCategory]
    ;

    let data = {
        groupsJoinCategory,
        groupsJoinUser,
        groupsMessageCategory,
        groupsMessageUser,
        vk_user,
        app,
        showGroupsCategory,
        savePhotoAlbum: save_photo_album,
        need_upload_default_album_photo,
        album_default_photo_url,
        is_show_tg,
        categories_for_tg,
        need_panel_upload_photo,
        need_panel_sex_years: sex === 0 || years === 0,
        tg_urls,
        sex,
        years
    };
    if (groupDetails) {
        data = await updateGroupsData(data);
    }
    console.debug(data);
    return data;
}

export function inputSex() {
    return <CustomSelect
        onChange={e => this.setState({selectedSex: e.target.value})}
        defaultValue={(this.state.sex === 0 || this.state.sex === 1) ? '1' : '2'}
        options={Object.keys(getCategories()).map(value => ({
            value: `${value}`,
            label: value == 1 ? 'женский' : 'мужской'
        }))}
    />
}

export function inputYears() {
    return <CustomSelect
        onChange={e => this.setState({selectedYears: e.target.value})}
        defaultValue={`${getCategories()['2']['0']}`}
        options={Object.keys(getCategories()[this.state.selectedSex || 1]).map(
            (value, index, array) => {
                const
                    years = getCategories()[this.state.selectedSex || 1][value],
                    label = index === 0 ? `до ${years}` : (
                        array[index + 1] ?
                            `от ${getCategories()[this.state.selectedSex || 1][array[index - 1]] + 1} до ${
                                years
                            }` : `от ${years}`
                    )
                ;
                return {value: `${years}`, label}
            }
        )}
    />
}

export function inputsSexAndYears() {
    return <React.Fragment>
        {inputSex.bind(this)()}
        {inputYears.bind(this)()}
    </React.Fragment>
}

export async function buttonSexAndYears(nextPanel) {
    if (typeof nextPanel === 'object' && nextPanel.currentTarget)
        nextPanel = nextPanel.currentTarget.dataset.to;

    let {selectedSex, selectedYears} = this.state;
    if (!selectedSex)
        selectedSex = (this.state.sex === 0 || this.state.sex === 1) ? '1' : '2';

    if (!selectedYears)
        selectedYears = `${getCategories()['2']['0']}`;

    try {
        const
            {groupsJoinCategory, groupsMessageCategory} = this.state,
            showGroupsCategory = getCategory(selectedSex, selectedYears),
            groupsJoinUser = groupsJoinCategory[showGroupsCategory],
            groupsMessageUser = groupsMessageCategory[showGroupsCategory]
        ;
        let data = {
            sex: selectedSex,
            years: selectedYears,
            groupsJoinUser,
            groupsMessageUser,
            showGroupsCategory,
            ...(nextPanel ? {
                history: [nextPanel],
                activePanel: nextPanel
            } : {})
        };
        if (groupDetails) {
            data = await updateGroupsData(data);
        }
        this.setState(data);
        console.debug(data);
    } catch (e) {
        console.error('ERR', e, this.state);
        console.debug({selectedSex, selectedYears});
    }
}

const counters = {subscribe: 0, messages: 0};
const skipedSubscribes = {subscribe: [], messages: []};

export async function subscribeGroup() {
    const
        {groupsJoinUser} = this.state,
        k = 'subscribe',
        c = counters[k],
        g = typeof groupsJoinUser[c] === 'object' ? groupsJoinUser[c].id : groupsJoinUser[c]
    ;
    if (this._rulesVKAPP) {
        const lastUserDeny = await getStorageValue('_last_user_deny_bridge_subscribe');
        if (lastUserDeny !== '') {
            if ((Date.now() - parseInt(lastUserDeny)) < 30 * 24 * 60 * 60 * 1000) {
                return;
            }
        }
    }
    if (g) {
        try {
            await bridge.send('VKWebAppJoinGroup', {group_id: g});
        } catch (e) {
            await setStorageValue('_last_user_deny_bridge_subscribe', Date.now() + '');
            skipedSubscribes[k].push(g);
        }
        counters[k]++;
    }
}

export async function subscribeSkipedGroup() {
    const
        k = 'subscribe',
        g = skipedSubscribes[k][0]
    ;
    if (this._rulesVKAPP) {
        const lastUserDeny = await getStorageValue('_last_user_deny_bridge_subscribe');
        if (lastUserDeny !== '') {
            if ((Date.now() - parseInt(lastUserDeny)) < 30 * 24 * 60 * 60 * 1000) {
                return;
            }
        }
    }
    if (g) {
        try {
            await bridge.send('VKWebAppJoinGroup', {group_id: g});
            skipedSubscribes[k].splice(0, 1);
        } catch (e) {
            await setStorageValue('_last_user_deny_bridge_subscribe', Date.now() + '');
        }
    }
}

export async function allowGroupMessages() {
    const
        {groupsMessageUser} = this.state,
        k = 'messages',
        c = counters[k],
        g = typeof groupsMessageUser[c] === 'object' ? groupsMessageUser[c].id : groupsMessageUser[c]
    ;
    if (this._rulesVKAPP) {
        const lastUserDeny = await getStorageValue('_last_user_deny_bridge_messages');
        if (lastUserDeny !== '') {
            if ((Date.now() - parseInt(lastUserDeny)) < 30 * 24 * 60 * 60 * 1000) {
                return;
            }
        }
    }
    if (g) {
        try {
            await bridge.send('VKWebAppAllowMessagesFromGroup', {group_id: g});
        } catch (e) {
            await setStorageValue('_last_user_deny_bridge_messages', Date.now() + '');
            skipedSubscribes[k].push(g);
        }
        counters[k]++;
    }
}

export async function allowSkipedGroupMessages() {
    const
        k = 'messages',
        g = skipedSubscribes[k][0]
    ;
    if (this._rulesVKAPP) {
        const lastUserDeny = await getStorageValue('_last_user_deny_bridge_messages');
        if (lastUserDeny !== '') {
            if ((Date.now() - parseInt(lastUserDeny)) < 30 * 24 * 60 * 60 * 1000) {
                return;
            }
        }
    }
    if (g) {
        try {
            await bridge.send('VKWebAppAllowMessagesFromGroup', {group_id: g});
            skipedSubscribes[k].splice(0, 1);
        } catch (e) {
            await setStorageValue('_last_user_deny_bridge_messages', Date.now() + '');
        }
    }
}