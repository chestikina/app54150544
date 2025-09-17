import {default as bridge} from '@vkontakte/vk-bridge';
import {createCanvas} from "canvas";
import {func} from "prop-types";
import axios from "axios";
import fixWebmDuration from "fix-webm-duration";
import fetch from "node-fetch";
import {proxyUrl} from "./defaults/catalin_tg_bot";

export function convertTextToLines(text, font, max_width) {
    const
        {createCanvas} = require('canvas'),
        canvas = createCanvas(1080, 1920),
        ctx = canvas.getContext('2d')
    ;
    ctx.font = font;
    let width = 0, lines = [], result, i, j;

    while (text.length) {
        for (i = text.length; ctx.measureText(text.substr(0, i)).width > max_width; i--) ;
        result = text.substr(0, i);

        console.log(result);
        if (i !== text.length)
            for (j = 0; result.indexOf(' ', j) !== -1; j = result.indexOf(' ', j) + 1) ;

        lines.push(result.substr(0, j || result.length));

        width = Math.max(width, ctx.measureText(lines[lines.length - 1]).width);
        text = text.substr(lines[lines.length - 1].length, text.length);
    }

    return lines;
}

export function convertTextToLines2(text, font, max_width) {
    // Переносятся только слова, не буквы
    const
        {createCanvas} = require('canvas'),
        canvas = createCanvas(1080, 1920),
        ctx = canvas.getContext('2d'),
        lines = [],
        textSplitted = text.split(' ')
    ;
    ctx.font = font;

    let line = '';
    for (const word of textSplitted) {
        const str = (line.length === 0 ? '' : ' ') + word;
        if (ctx.measureText(line + str).width <= max_width) {
            line += str;
        } else {
            lines.push(line.trim());
            line = str;
        }
    }
    if (line !== '') {
        lines.push(line.trim());
    }

    return lines;
}

export async function get(url, params = {}, options = {}) {
    const
        query = params ? '?' + Object.keys(params).map((value) =>
            encodeURIComponent(value) + '=' + encodeURIComponent(typeof params[value] === 'object' ? JSON.stringify(params[value]) : params[value])
        ).join('&') : '',
        url_ = `${url}${query}`;
    return await new Promise((res, rej) => {
        fetch(url_, {method: 'GET', ...options})
            .then(res =>
                res.json()
            )
            .then(answer =>
                res(answer)
            ).catch(err =>
            res({error: {code: -1, text: err.message}})
        );
    });
}

export async function post(url, params, data) {
    return await axios.request({
        method: 'POST', params, url, data,
        headers: {'Content-Type': 'application/json'}
    });
}

export const defaultFonts = [
    'SF Pro Text',
    'SF Pro Text Heavy',
    'SF Pro Text Semibold',
    'SF Pro Display',
    'SF Pro Display Bold',
    'SF Pro Display Semibold',
    'SF Pro Display Medium',
    'SF Pro Rounded',
    'SF Pro Rounded Semibold',
    'SF Pro Rounded Bold',
    'SF UI Display',
    'SF UI Text',
    'TT Commons',
    'TT Commons Bold',
    'TT Commons Demibold',
    'Manrope ExtraBold',
    'Manrope'
];

export function loadFonts(fonts = defaultFonts) {
    for (const font of fonts) {
        const span = document.createElement('span');
        span.style.position = 'fixed';
        span.style.fontFamily = font;
        span.style.opacity = '0';
        span.innerText = 'test';
        document.body.appendChild(span);
        span.onload = () => span.remove();
    }
}

export async function loadCssFontsODR(needFonts = []) {
    let data = [
        ['SF Pro Text', require('../fonts/SF-Pro-Text-Regular.ttf')],
        ['SF Pro Text Heavy', require('../fonts/SF-Pro-Text-Heavy.otf')],
        ['SF Pro Text Medium', require('../fonts/SF-Pro-Text-Medium.otf')],
        ['SF Pro Text Semibold', require('../fonts/SF-Pro-Text-Semibold.otf')],
        ['SF Pro Text Bold', require('../fonts/SF-Pro-Text-Bold.otf')],
        ['Manrope', require('../fonts/Manrope.ttf')],
        ['Manrope Semibold', require('../fonts/Manrope-SemiBold.ttf')],
        ['Manrope Medium', require('../fonts/Manrope-Medium.ttf')],
        ['Manrope Bold', require('../fonts/Manrope-Bold.ttf')],
        ['Manrope ExtraBold', require('../fonts/Manrope-ExtraBold.ttf')],
        ['SF Pro Display', require('../fonts/SF-Pro-Display-Regular.otf')],
        ['SF Pro Display Bold', require('../fonts/SF-Pro-Display-Bold.otf')],
        ['SF Pro Display Semibold', require('../fonts/SF-Pro-Display-Semibold.otf')],
        ['SF Pro Display Medium', require('../fonts/SF-Pro-Display-Medium.otf')],
        ['SF Pro Display Heavy', require('../fonts/SF-Pro-Display-Heavy.otf')],
        ['SF Pro Rounded', require('../fonts/SF-Pro-Rounded-Regular.ttf')],
        ['SF Pro Rounded Semibold', require('../fonts/FontsFree-Net-SF-Pro-Rounded-Semibold.ttf')],
        ['SF Pro Rounded Bold', require('../fonts/FontsFree-Net-SF-Pro-Rounded-Bold.ttf')],
        ['SF Pro Rounded Black', require('../fonts/FontsFree-Net-SF-Pro-Rounded-Black.ttf')],
        ['SF Pro Rounded Heavy', require('../fonts/FontsFree-Net-SF-Pro-Rounded-Heavy.ttf')],
        ['SF UI Display', require('../fonts/SFUIDisplay-Regular.otf')],
        ['SF UI Text', require('../fonts/SFUIText-Regular.otf')],
        ['TT Commons', require('../fonts/TTCommons-Regular.ttf')],
        ['TT Commons Debimold', require('../fonts/TTCommons-DemiBold.ttf')],
        ['TT Commons Bold', require('../fonts/TTCommons-Bold.ttf')],
        ['Stupid Head', require('../fonts/Stupid-Head.ttf')],
        ['ProximaNova', require('../fonts/ProximaNova-Regular.ttf')],
        ['ProximaNova Bold', require('../fonts/ProximaNova-Bold.ttf')],
        ['ProximaNova Semibold', require('../fonts/ProximaNova-Semibold.ttf')],
        ['Montserrat', require('../fonts/Montserrat-Regular.ttf')],
        ['Montserrat Semibold', require('../fonts/Montserrat-SemiBold.ttf')],
        ['WC Mano Negra Bta', require('../fonts/WC-Mano-Negra-Bta.otf')],
        ['Roboto', require('../fonts/Roboto-Regular.ttf')],
        ['TT Firs Neue', require('../fonts/TTFirsNeue-Regular.ttf')],
        ['TT Firs Neue Medium', require('../fonts/TTFirsNeue-Medium.ttf')],
        ['TT Firs Neue DemiBold', require('../fonts/TTFirsNeue-DemiBold.ttf')],
        ['Gilroy', require('../fonts/Gilroy-Regular.ttf')],
        ['Gilroy Bold', require('../fonts/Gilroy-Bold.ttf')],
        ['Gilroy Medium', require('../fonts/Gilroy-Medium.ttf')],
        ['Gilroy Semibold', require('../fonts/Gilroy-SemiBold.ttf')],
        ['Inter', require('../fonts/Inter-Regular.ttf')],
        ['Inter Medium', require('../fonts/Inter-Medium.ttf')],
        ['Inter Semibold', require('../fonts/Inter-SemiBold.ttf')],
        ['Inter Bold', require('../fonts/Inter-Bold.ttf')],
        ['Inter Black', require('../fonts/Inter-Black.ttf')],
        ['Inter ExtraBold', require('../fonts/Inter-ExtraBold.ttf')],
        ['Alice', require('../fonts/Alice-Regular.ttf')]
    ];

    if (needFonts.length > 0) {
        data = data.filter(value => needFonts.indexOf(value[0]) > -1)
    }

    for (const fontData of data) {
        try {
            const url = getSrcUrl(fontData[1], false);
            const font_name = new FontFace(fontData[0], `url(${url})`);
            document.fonts.add(font_name);
            await font_name.load()
            console.log(`Loaded font "${fontData[0]}"`, url);
        } catch (e) {
            console.error(e);
            break;
        }
    }
}

export function animateValue(obj, start, end, duration, suffix) {
    try {
        if (start === end || end - start === 1) {
            obj.innerHTML = end;
        } else {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                obj.innerHTML = Math.floor(progress * (end - start) + start) + (suffix || '');
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                    if (this) this.forceUpdate();
                }
            };
            window.requestAnimationFrame(step);
        }
    } catch (e) {
    }
}

export function cps(array) {
    if (array.length !== 0) {
        let
            first_date = array[0],
            cur_pos = 0,
            clicks_per_second = []
        ;
        array = array.map(value => value - first_date);

        for (const click of array) {
            cur_pos = click < 1000 ? 0 : parseInt((click + '').substring(0, (click + '').length - 3));
            clicks_per_second[cur_pos] = clicks_per_second[cur_pos] > 0 ? clicks_per_second[cur_pos] + 1 : 1;
        }

        clicks_per_second = clicks_per_second.filter(value => value > 0);

        const
            max_cps = Math.max(...clicks_per_second),
            min_cps = Math.min(...clicks_per_second),
            mid_cps = Math.ceil((max_cps + min_cps) / 2)
        ;
        return {max_cps, min_cps, mid_cps};
    } else {
        return {max_cps: 0, min_cps: 0, mid_cps: 0};
    }
}

function componentToHex(c) {
    const hex = c.toString(16);
    return hex.length == 1 ? '0' + hex : hex;
}

export function rgbToHex(r, g, b) {
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export function getFadeMiddleColor(startColor, finishColor, i, count) {
    const aRGBStart = startColor.replace("#", "").match(/.{2}/g);
    const aRGBFinish = finishColor.replace("#", "").match(/.{2}/g);
    const finishPercent = i / count;
    const startPercent = 1 - finishPercent;

    return rgbToHex(
        Math.floor(('0x' + aRGBStart[0]) * startPercent + ('0x' + aRGBFinish[0]) * finishPercent),
        Math.floor(('0x' + aRGBStart[1]) * startPercent + ('0x' + aRGBFinish[1]) * finishPercent),
        Math.floor(('0x' + aRGBStart[2]) * startPercent + ('0x' + aRGBFinish[2]) * finishPercent)
    );
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function decOfNum(number, titles, needNumber = true) {
    if (typeof titles === 'object') {
        if (number !== undefined) {
            let decCache = [],
                decCases = [2, 0, 1, 1, 1, 2];
            if (!decCache[number]) decCache[number] = number % 100 > 4 && number % 100 < 20 ? 2 : decCases[Math.min(number % 10, 5)];
            return (needNumber ? number + ' ' : '') + titles[decCache[number]];
        }
    } else {
        return `${number} ${titles}`;
    }
}

export function numToStr(number) {
    if (number > 0 && number <= 10) {
        const words = [
            'первое', 'второе', 'третье', 'четвертое', 'пятое', 'шестое', 'седьмое', 'восьмое', 'девятое', 'десятое'
        ];
        return words[number - 1];
    } else {
        return number + '';
    }
}

export function shortIntegers(int) {
    try {
        return int.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
    } catch (e) {
        return 0;
    }
}

export function shortIntegersK(int) {
    const
        int_ = shortIntegers(int),
        split = int_.split(' ')
    ;
    return split[0] + new Array((split.length - 1)).fill('К').join('')
}

export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export function getRandomInts(min, max, count) {
    const array = [];
    for (let i = 0; i < count; i++) {
        const int = getRandomInt(min, max);
        if (array.indexOf(int) === -1) {
            array.push(int);
        } else {
            if (max >= count)
                i--;
            else
                array.push(int);
        }
    }
    return array;
}

export function nodeToString(node) {
    let tmpNode = document.createElement("div");
    tmpNode.appendChild(node.cloneNode(true));
    let str = tmpNode.innerHTML;
    tmpNode = node = null;
    return str;
}

export function convertMiliseconds(miliseconds) {
    let hours, minutes, total_hours, total_minutes, total_seconds;

    total_seconds = parseInt(Math.floor(miliseconds / 1000));
    total_minutes = parseInt(Math.floor(total_seconds / 60));
    total_hours = parseInt(Math.floor(total_minutes / 60));

    minutes = parseInt(total_minutes % 60);
    hours = parseInt(total_hours % 24);

    return hours + 'ч. ' + minutes + 'мин.';
}

export function convertMsToNormalTime(miliseconds) {
    let hours, minutes, seconds, total_hours, total_minutes, total_seconds;

    total_seconds = parseInt(Math.floor(miliseconds / 1000));
    total_minutes = parseInt(Math.floor(total_seconds / 60));
    total_hours = parseInt(Math.floor(total_minutes / 60));

    seconds = parseInt(total_seconds % 60);
    minutes = parseInt(total_minutes % 60);
    hours = parseInt(total_hours % 24);

    return {
        hours, minutes, seconds, str: {
            hours: hours.toLocaleString('ru', {minimumIntegerDigits: 2}),
            minutes: minutes.toLocaleString('ru', {minimumIntegerDigits: 2}),
            seconds: seconds.toLocaleString('ru', {minimumIntegerDigits: 2})
        }
    };
}

export function convertTimeToRuStandart(date) {
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        hour: 'numeric',
        minute: 'numeric'
    });
}

export const getImage = (src) =>
    new Promise((res, rej) => {
        const image = new Image();

        image.onload = () => res(image);
        image.crossOrigin = 'anonymous';
        image.onstalled = (e) => {
            console.log('Failed to fetch data, but trying.', e);
            rej(e);
        };
        image.onerror = (e) => {
            console.log('Failed to fetch data, error.', e);
            rej(e);
        };
        image.src = src;
    });

export async function toBlob(object, dataUrl = true) {
    const
        myCanvas = document.createElement('canvas'),
        ctxt = myCanvas.getContext('2d');

    let base = typeof object === 'string' ? object : window.btoa(object);
    console.log(base);
    const img = await getImage(typeof object === 'string' ? base : `data:image/svg+xml;base64,${base}`);
    myCanvas.height = img.height;
    myCanvas.width = img.width;
    if (ctxt === null) {
        return "";
    }
    ctxt.drawImage(img, 0, 0, img.width, img.height);
    return dataUrl ? myCanvas.toDataURL() : myCanvas;
}

export function getUrlParams() {
    /*const params = window.location.search.length > 0 && JSON.parse('{"' + decodeURI(window.location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
    if (params && params.vk_chat_id) params.vk_chat_id = decodeURIComponent(params.vk_chat_id);
    return params;*/
    /*const params = {};
    if (window.location.search.length > 0)
        window.location.search.substring(1).split('&').map(value => [value.substring(0, value.indexOf('=')), value.substring(value.indexOf('=') + 1)]).forEach(v => obj[v[0]] = decodeURIComponent(v[1]));
    return params;*/
    const params = {};
    for (const [key, value] of new URLSearchParams(window.location.search)) {
        params[key] = value;
    }
    return params;
}

export const platforms = {
    desktop_web: /desktop_web/g,
    mobile_android: /mobile_android/g,
    mobile_android_messenger: /mobile_android_messenger/g,
    mobile_ipad: /mobile_ipad/g,
    mobile_iphone: /mobile_iphone/g,
    mobile_iphone_messenger: /mobile_iphone_messenger/g,
    mobile_web: /mobile_web/g,

    android: /mobile_android|mobile_android_messenger/g,
    ios: /mobile_ipad|mobile_iphone|mobile_iphone_messenger/g
};

export function isPlatformIOS() {
    return getUrlParams().vk_platform === 'mobile_iphone';
}

export function isPlatformAndroid() {
    return platforms.android.test(getUrlParams().vk_platform);
}

export function isPlatformDesktop() {
    return getUrlParams().vk_platform === 'desktop_web';
}

export function isPlatformMVK() {
    return getUrlParams().vk_platform === 'mobile_web';
}

export let
    vk_local_users = {},
    name_cases = ['first_name', 'last_name', 'first_name_dat', 'first_name_nom', 'first_name_gen', 'first_name_acc', 'first_name_ins', 'first_name_abl', 'last_name_dat', 'last_name_nom', 'last_name_gen', 'last_name_acc', 'last_name_ins', 'last_name_abl']
;

export async function getVKUsers(ids, access_token) {
    const
        user_ids = [
            ...new Set(
                ids
                    .filter(value => vk_local_users[value] === undefined)
                    .map(
                        value => typeof value === 'number' ? value : getClearUserId(value)
                    )
            )
        ],
        i = Math.floor(user_ids.length / 100)
    ;

    if (user_ids.length > 0) {
        let users = [];

        for (let j = 0; j < i + 1; j++) {
            users = users.concat(
                await vkApiRequest('users.get', {
                    user_ids: user_ids.slice(j * 100, j * 100 + 100).join(','),
                    fields: ['last_seen', 'screen_name', 'photo_100', 'photo_200', 'photo_max_orig', 'sex', ...name_cases].join(','),
                    access_token
                })
            );
        }

        for (const user of users) {
            vk_local_users[user.id] = user;
        }
    }

    return ids.map(value => vk_local_users[value] || vk_local_users[Object.keys(vk_local_users).find(key => vk_local_users[key].screen_name === value || `id${key}` === value)]);
}

export async function vkApiRequest(method, params = {}) {
    return (await bridge.send('VKWebAppCallAPIMethod', {
        method,
        params: {
            ...params,
            v: '5.126',
            access_token: params.access_token || '7a8d6dcc7a8d6dcc7a8d6dcc637afa8f4477a8d7a8d6dcc1b06a888634e406617b4aef3'
        }
    })).response
}

export function viewportToPixels(value) {
    const
        parts = value.match(/([0-9\.]+)(vh|vw)/),
        q = Number(parts[1]),
        side = window[['innerHeight', 'innerWidth'][['vh', 'vw'].indexOf(parts[2])]]
    ;
    return side * (q / 100)
}

export function openUrl(url, download) {
    const element = document.createElement('a');
    element.href = url;
    if (download) {
        element.download = download;
    }
    element.target = '_blank';
    element.click();
    element.remove();
}

export function getUrlLocation() {
    return parseInt(getUrlParams().vk_app_id) === 7985972 ? (isPlatformDesktop() ? 'https://ilyasteik.github.io/DrawerApp/auto/' : 'https://ilyasteik.github.io/DrawerApp/auto') : (window.location.origin + window.location.pathname.replace('/index.html', ''));
}

export function getSrcUrl(resource, forceLocalhost = true) {
    if (forceLocalhost && window.location.origin.includes('localhost')) return resource;
    if (resource.includes('data:') && resource.includes('base64')) return resource;

    const urlLocation = getUrlLocation();
    const res = urlLocation[urlLocation.length - 1] === '/' ? (resource[0] === '/' ? resource.substring(1) : resource) : (resource[0] === '/' ? resource : ('/' + resource));

    return urlLocation + res;
}

export async function getBase64Image(imageUri, needCors = true) {
    const
        canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        img = new Image()
    ;
    img.src = (needCors ? proxyUrl : '') + imageUri;
    img.crossOrigin = 'Anonymous';
    return await new Promise(resolve =>
        img.onload = function () {
            canvas.width = this.width;
            canvas.height = this.height;
            ctx.drawImage(img, 0, 0, this.width, this.height);
            resolve(canvas.toDataURL('image/png'));
        }
    );
}

export async function getAnonymosImage(imageUrl, needCors = true) {
    const image_ = await getBase64Image(imageUrl, needCors);
    const image = new Image();
    image.src = image_;
    return await new Promise(resolve =>
        image.onload = function () {
            resolve(image);
        }
    )
}

export function ctxDrawImageWithRound(ctx, image, radius, imageSettings, canvasSettings = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
}, angle = 0) {
    radius = typeof radius === 'number' ? new Array(4).fill(radius) : radius

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(canvasSettings.x + radius[0], canvasSettings.y);
    ctx.lineTo(canvasSettings.x + canvasSettings.width - radius[1], canvasSettings.y);
    ctx.quadraticCurveTo(canvasSettings.x + canvasSettings.width, canvasSettings.y, canvasSettings.x + canvasSettings.width, canvasSettings.y + radius[1]);
    ctx.lineTo(canvasSettings.x + canvasSettings.width, canvasSettings.y + canvasSettings.height - radius[2]);
    ctx.quadraticCurveTo(canvasSettings.x + canvasSettings.width, canvasSettings.y + canvasSettings.height, canvasSettings.x + canvasSettings.width - radius[2], canvasSettings.y + canvasSettings.height);
    ctx.lineTo(canvasSettings.x + radius[3], canvasSettings.y + canvasSettings.height);
    ctx.quadraticCurveTo(canvasSettings.x, canvasSettings.y + canvasSettings.height, canvasSettings.x, canvasSettings.y + canvasSettings.height - radius[3]);
    ctx.lineTo(canvasSettings.x, canvasSettings.y + radius[0]);
    ctx.quadraticCurveTo(canvasSettings.x, canvasSettings.y, canvasSettings.x + radius[0], canvasSettings.y);
    ctx.closePath();

    let
        x = imageSettings ? imageSettings.x : canvasSettings.x,
        y = imageSettings ? imageSettings.y : canvasSettings.y,
        width = imageSettings ? imageSettings.width : canvasSettings.width,
        height = imageSettings ? imageSettings.height : canvasSettings.height
    ;

    ctx.clip();
    ctx.drawImage(image, x, y, width, height);
    ctx.restore();
}

export async function loadCrossOriginImage(url) {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.src = url;
    await new Promise(res => img.onload = () => res());
    return img;
}

export async function loadScriptUrl(url) {
    const script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);
    return await new Promise(res =>
        script.onload = () => res(true)
    );
}

export function appendScript(code) {
    let
        container = document.getElementById('advert_container'),
        script = document.createElement('script')
    ;
    script.innerHTML = code;
    if (container === null) {
        container = document.createElement('div');
        container.id = 'advert_container';
        document.body.appendChild(container);
    }
    container.innerHTML = '';
    setTimeout(() => {
        container.appendChild(script);
    }, 400);
}

export async function adAppApi(method, params) {
    return false;
    /*try {
        return await get('https://api.ad-app.ru/method/' + method, {...getUrlParams(), ...params})
    } catch (e) {
        console.error(e);
        return false;
    }*/
}

export async function uploadFile(evt, format = 'png') {
    const
        tgt = evt.target || window.event.srcElement,
        {files} = tgt
    ;

    if (FileReader && files && files.length) {
        return await new Promise(async resolve => {
            let
                file = files[0],
                fr = new FileReader()
            ;

            fr.onload = async () => {
                if (file.type.includes('image')) {
                    let image = new Image();
                    image.src = fr.result;
                    image.onload = async () => {
                        const
                            canvas = createCanvas(image.width, image.height),
                            ctx = canvas.getContext('2d')
                        ;
                        ctx.drawImage(image, 0, 0, image.width, image.height);

                        resolve({image, data: canvas.toDataURL(`image/${format}`)});
                    };
                } else {
                    console.error('File type not image');
                }
            };

            await fr.readAsDataURL(file);
        });
    } else {
        console.error('UNKNOWN ERROR');
    }
}

export async function avocadoApi(type, endpoint, data = {}) {
    return (await axios.request({
        method: type,
        params: {...getUrlParams(), ...type.toLowerCase() === 'get' ? data : {}},
        url: `https://showtime.app-dich.com/api/${endpoint}`,
        data,
        headers: {'Content-Type': 'application/json'}
    })).data;
}

export function hexToRgb(hex = '', opacity = 1) {
    const rgb = parseInt(hex.startsWith('var') ? getComputedStyle(document.body).getPropertyValue(hex.substring('var(').length, hex.length - 1) : hex.substring(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    return {rgb: [r, g, b], rgba: [r, g, b, opacity]};
}

export function isDarkColor(color = '') {
    const {r, g, b} = hexToRgb(color);
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    return luma < 50;
}

export function sortUniqueObject(arr = [], key = 'id') {
    return arr.filter((value, index) => arr.findIndex(v => v[key] === value[key]) === index)
}

export function recordElement(element, {
    durationMs = 0,
    filename = 'clip.mp4',
    onError = (message) => {
    },
    onStop = (url) => {
    }
} = {}) {
    try {
        const startTime = Date.now();
        const chunks = [];
        console.log('captureStream');
        const stream = element.captureStream(60);
        console.log('MediaRecorder');
        const options = {mimeType: 'video/webm;codecs=h264'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            onError('Тип файла не поддерживается.');
            return;

            console.log(options.mimeType + ' is not Supported');
            options.mimeType = 'video/webm;codecs=vp8';
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.log(options.mimeType + ' is not Supported');
                options.mimeType = 'video/mp4;codecs=avc1';
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    console.log(options.mimeType + ' is not Supported');
                    onError('Тип файла не поддерживается.');
                    return;
                }
            }
        }
        const rec = new MediaRecorder(stream, options);
        console.log('ondataavailable');
        rec.ondataavailable = e => chunks.push(e.data);
        console.log('onstop');
        rec.onstop = e => {
            try {
                const duration = Date.now() - startTime;
                const fixWebmDuration = require("fix-webm-duration");
                fixWebmDuration(new Blob(chunks, {type: 'video/mp4'}), duration, async fixedBlob => {
                    const url = URL.createObjectURL(fixedBlob);
                    console.log('file url = ', url);
                    if (isPlatformDesktop()) {
                        openUrl(url, filename);
                    } else {
                        try {
                            await bridge.send('VKWebAppDownloadFile', {url, filename});
                        } catch (e) {
                            console.error('Error download via bridge', e);
                        }
                    }
                    onStop(url);
                });
            } catch (e) {
                onError('Ошибка при сохранении файла.');
                console.error('err rec stop', e);
            }
        };

        console.log('rec start()');
        rec.start();

        if (durationMs && durationMs > 0)
            setTimeout(() => rec.stop(), durationMs);

        return rec;
    } catch (e) {
        onError('Неизвестная ошибка.');
        console.error('err rec', e);
    }
}

export function getMostRepeatingValue(arr) {
    return arr.sort((a, b) =>
        arr.filter(v => v === a).length
        - arr.filter(v => v === b).length
    ).pop();
}

const yadiskApi = 'https://cloud-api.yandex.net/v1/disk/public/resources?public_key=';

export async function getFilesYaDisk(folderUrl) {
    const data = await (await fetch(yadiskApi + folderUrl)).json();
    return data._embedded.items;
}

export async function getYaDiskImage(url) {
    const blob = await fetch(url, {
        referrer: '', headers: {
            Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
            Referer: ''
        }
    }).then(res => res.blob());
    const urlCreator = window.URL || window.webkitURL;
    return urlCreator.createObjectURL(blob);
}

export function replaceExtensionPath(path) {
    return path.split('.').slice(0, -1).join('.');
}

export function getClearUserId(text = '') {
    try {
        text = text.trim().replace('@', '');
        if (text.includes('http') || text.includes('vk.')) {
            text = text.replace('https', '').replace('http', '').replace('://', '').split('/')[1];
        }
        if (text.includes('[') && text.includes('|') && text.includes(']')) {
            text = text.replace('[', '').split('|')[0];
        }
        return text;
    } catch (e) {
        return text;
    }
}