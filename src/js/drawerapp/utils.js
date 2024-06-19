import {getRandomInt, getUrlParams, sleep} from "../utils";
import {default as bridge} from "@vkontakte/vk-bridge";

export let
    vk_local_users = {},
    name_cases = ['first_name', 'last_name', 'first_name_dat', 'first_name_nom', 'first_name_gen', 'first_name_acc', 'first_name_ins', 'first_name_abl', 'last_name_dat', 'last_name_nom', 'last_name_gen', 'last_name_acc', 'last_name_ins', 'last_name_abl']
;

export async function getVKUsersServer(ids) {
    const
        user_ids = [
            ...new Set(
                ids
                    .filter(value => vk_local_users[value] === undefined && value !== undefined && value !== 0)
                    .map(
                        value => typeof value === 'number' ?
                            value :
                            value.replace('@', '')
                                .replace('id', '')
                                .replace('vk.com/', '')
                                .replace('http://', '')
                                .replace('https://', '')
                    )
            )
        ]
    ;

    if (user_ids.length > 0) {
        let users = [];

        for (let j = 0; j < Math.floor(user_ids.length / 100) + 1; j++) {
            let resp = (await drawAppApi('users.getVKd', {
                user_ids: user_ids.slice(j * 100, j * 100 + 100).join(','),
                d: 't'
            })).response;
            if (resp === null) {
                resp = await new Promise(resolve => {
                    let interval, iterations = 0, fetching = false;
                    interval = setInterval(async () => {
                        if (!fetching) {
                            fetching = true;
                            iterations++;

                            const data = (await drawAppApi('users.getVKd', {
                                user_ids: user_ids.slice(j * 100, j * 100 + 100).join(','),
                                d: 't'
                            })).response;

                            if (data !== null) {
                                resolve(data);
                                clearInterval(interval);
                            } else {
                                if (iterations >= 10) {
                                    resolve([]);
                                    clearInterval(interval);
                                }
                            }

                            fetching = false;
                        }
                    }, 400);
                });
            }
            users = users.concat(resp);
        }

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            vk_local_users[user.id] = user;
        }
    }

    return ids.map(value => vk_local_users[value] || vk_local_users[Object.keys(vk_local_users).find(key => vk_local_users[key].screen_name === value)]);
}

export async function getVKUsers(ids) {
    return await getVKUsersServer(ids);

    /*const
        user_ids = [
            ...new Set(
                (ids || [])
                    .filter(value => vk_local_users[value] === undefined)
                    .map(
                        value => typeof value === 'number' ? value : value.replace('@', '')
                            .replace('id', '')
                            .replace('vk.com/', '')
                            .replace('http://', '')
                            .replace('https://', '')
                    )
            )
        ],
        i = Math.floor(user_ids.length / 100)
    ;

    if (user_ids.length > 0) {
        let users = [];

        for (let j = 0; j < i + 1; j++) {
            try {
                const data = await vkApiRequestByPass('users.get', {
                    user_ids: user_ids.slice(j * 100, j * 100 + 100).join(','),
                    fields: ['screen_name', 'photo_100', 'photo_200', 'photo_max_orig', 'sex', ...name_cases].join(',')
                });
                console.log(`GET VK USERS`, data);
                users = users.concat(data);
            } catch (e) {
                if (e.error_data.error_reason.error_code === 6) {
                    j--;
                    await sleep(getRandomInt(10, 500));
                }
                console.error(`GET VK USERS`, e);
            }
        }

        for (const user of users) {
            vk_local_users[user.id] = user;
        }
    }

    return ids.map(value => vk_local_users[value] || vk_local_users[Object.keys(vk_local_users).find(key => vk_local_users[key].screen_name === value)]);*/
}

export async function getVKUsersBridge(ids) {
    const
        user_ids = [
            ...new Set(
                (ids || [])
                    .filter(value => vk_local_users[value] === undefined)
                    .map(
                        value => typeof value === 'number' ? value : value.replace('@', '')
                            .replace('id', '')
                            .replace('vk.com/', '')
                            .replace('http://', '')
                            .replace('https://', '')
                    )
            )
        ]
    ;

    if (user_ids.length > 0) {
        let users = [];
        for (let i = 0; i < user_ids.length; i++) {
            try {
                const data = await bridge.send('VKWebAppGetUserInfo', {user_id: user_ids[i]});
                users.push(data);
            } catch (e) {
                if (e.error_data.error_reason.error_code === 6) {
                    i--;
                    await sleep(getRandomInt(10, 500));
                }
                console.error(`GET VK USERS`, e);
            }
        }
        /*for (const user of users) {
            vk_local_users[user.id] = user;
        }*/
    }

    return ids.map(value => vk_local_users[value] || vk_local_users[Object.keys(vk_local_users).find(key => vk_local_users[key].screen_name === value)]);
}

export async function vkApiRequestByPass(method, params = {}) {
    return (await bridge.send('VKWebAppCallAPIMethod', {
        method,
        params: {
            ...params,
            v: '5.126',
            access_token: params.access_token ||
                (
                    [
                        'ede8cdc2ede8cdc2ede8cdc219eef92800eede8ede8cdc28e73969ca0f506dbc06a2bcd',
                        '6a9c901d6a9c901d6a9c901df8698e333d66a9c6a9c901d0977fffa1fc49657b4607cab'
                    ][getRandomInt(0, 1)]
                )
        }
    })).response
}

export async function drawAppApi(method, params = {}) {
    let attempts = 0;

    const
        p = {...getUrlParams(), ...params},
        query = '?' + Object.keys(p).map((value) =>
            encodeURIComponent(value) + '=' + encodeURIComponent(p[value])
        ).join('&'),
        url_ = `https://draw.avocado.special.vk-apps.com/api/${method}${query}`;
    return await new Promise((res, rej) => {
        let interval, fetching = false;
        interval = setInterval(() => {
            if (!fetching) {
                fetching = true;
                fetch(url_, {method: 'GET'})
                    .then(res =>
                        res.json()
                    )
                    .then(answer => {
                            clearInterval(interval);
                            fetching = false;
                            res(answer);
                        }
                    ).catch(err => {
                        attempts++;
                        if (attempts >= 5) {
                            res({error: null});
                            clearInterval(interval);
                        }
                        fetching = false;
                    }
                );
            }
        }, 400);
    });
}