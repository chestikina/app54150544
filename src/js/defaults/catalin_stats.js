import {get, getUrlParams} from "../utils";

const apiUrl = 'https://app-stat.special-backend.ru/method/';

export async function entryApp() {
    try {
        await get(apiUrl + 'apps.entry', getUrlParams());
    } catch (e) {

    }
}

export async function storyApp() {
    try {
        await get(apiUrl + 'apps.story', getUrlParams());
    } catch (e) {

    }
}

export async function resultApp() {
    try {
        await get(apiUrl + 'apps.result', getUrlParams());
    } catch (e) {

    }
}

export async function albumApp() {
    try {
        await get(apiUrl + 'apps.album', getUrlParams());
    } catch (e) {

    }
}