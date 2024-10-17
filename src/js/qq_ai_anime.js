import axios from 'axios';
import {get, getUrlParams} from "./utils";

const servers = [
    'https://vm4133545.25ssd.had.wf:8080',
    'https://vm4133760.25ssd.had.wf:8080'
];
let currentServer;

const selectOptimalServer = async () => {
    let data = {};
    for (const i in servers) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const {queue} = await get(`${servers[i]}/queue`, getUrlParams(), {signal: controller.signal});
        console.debug(`Got queue from server ${i} = ${queue}`);
        if (queue !== undefined) data[queue] = i;
    }
    currentServer = servers[data[Math.min(...Object.keys(data).map(value => parseInt(value)))]];
    console.debug({currentServer});
}

const uploadPhoto = async (imgData) => {
    // select optimal server
    console.debug('Select optimal server...');
    await selectOptimalServer();

    if (currentServer) {
        // upload photo to queue
        console.debug('Upload photo...');
        const {response, queue} = (await axios.request({
            method: 'POST',
            params: getUrlParams(),
            url: `${currentServer}/uploadImage`,
            data: {imgData},
            headers: {'Content-Type': 'application/json'},
            timeout: 80000,
        })).data;
        console.debug({response, queue});

        return response ? queue : false;
    } else {
        throw new Error('Кажется, что-то пошло не так. Попробуйте снова.');
    }
};

const getResult = async () => {
    const response = await get(`${currentServer}/queue`, getUrlParams());
    console.debug({response});
    if (response.data) {
        const data = response.data;

        if (!data) {
            throw new Error('Данные не были получены. Попробуйте ещё раз.');
        }

        if (data.msg === 'VOLUMN_LIMIT') {
            throw new Error('Слишком много запросов. Попробуйте позже.');
        }

        if (data.msg === 'IMG_ILLEGAL') {
            throw new Error('Попробуйте другое фото.');
        }

        if (data.code === 1001) {
            throw new Error('Мы не увидели лицо. Попробуйте другое фото.');
        }

        if (data.code === -2100) {
            throw new Error('Попробуйте другое фото.');
        }

        if (data.code === 2119 || data.code === -2111) {
            console.error('Blocked', JSON.stringify(data));
            throw new Error('Запрос был отклонён. Попробуйте позже.');
        }

        if (!data.extra) {
            console.error(data);
            throw new Error('Не получилось обработать данные.');
        }

        const extra = JSON.parse(data.extra);
        return extra.img_urls[1];
    } else {
        return response.queue;
    }
}

export {uploadPhoto, getResult};