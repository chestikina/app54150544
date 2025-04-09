import bridge from "@vkontakte/vk-bridge";
import {getUrlParams, sleep} from "../utils";
import fetch from "node-fetch";
import {proxyUrl} from "./catalin_tg_bot";

export async function getStorageKeys() {
    return (await bridge.send('VKWebAppStorageGetKeys', {count: 1000})).keys;
}

export async function getStorageValue(key) {
    try {
        return (await bridge.send('VKWebAppStorageGet', {keys: [key]})).keys[0].value;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export function setStorageValue(key, value) {
    return bridge.send('VKWebAppStorageSet', {key, value});
}

export async function isEmptyKey(key) {
    return (await getStorageValue(key)) === '';
}

export async function isEmptyKeyWithSet(key) {
    if (await isEmptyKey(key)) {
        await setStorageValue(key, '1');
        return true;
    } else {
        return false;
    }
}

export async function getToken(scope, require = false) {
    try {
        const response = await bridge.send('VKWebAppGetAuthToken', {app_id: parseInt(getUrlParams().vk_app_id), scope});
        if (scope.includes(',') ? response.scope.split(',').length === scope.split(',').length : response.scope === scope) {
            return response.access_token;
        } else {
            if (require) {
                return await getToken(scope, require);
            } else {
                return false;
            }
        }
    } catch (e) {
        if (require) {
            return await getToken(scope, require);
        } else {
            return false;
        }
    }
}

export async function vkApi(method = '', params = {}) {
    if (!params.v) params.v = '5.126';
    return await bridge.send('VKWebAppCallAPIMethod', {method, params});
}

export function subscribeBridgeEvents(events = {}, defaultScheme) {
    bridge.subscribe(async ({detail: {type, data}}) => {
        if (type !== undefined) console.debug(type, data);
        if (type === 'VKWebAppUpdateConfig') {
            const schemeAttribute = document.createAttribute('scheme');
            const scheme = data.scheme ? data.scheme === 'client_light' ? 'bright_light' : data.scheme : 'bright_light';
            schemeAttribute.value = defaultScheme || scheme;
            document.body.attributes.setNamedItem(schemeAttribute);
            if (events[type] && typeof events[type] === 'function')
                events[type]();
        } else if (events[type] && typeof events[type] === 'function') {
            events[type]();
        }
    });
}

export async function shareWallPhoto(image_blob, caption, copyright, access_token) {
    const
        uploadWallUrl = (await bridge.send('VKWebAppCallAPIMethod', {
            method: 'photos.getWallUploadServer',
            params: {
                v: '5.126',
                access_token
            }
        })).response.upload_url,
        bodyFormData = new FormData()
    ;

    bodyFormData.append('photo', image_blob, 'image.png');

    try {
        fetch(proxyUrl + uploadWallUrl, {
            method: 'POST',
            body: bodyFormData
        })
            .then(res_ => {
                return res_.json();
            })
            .then(async response => {
                const {server, photo, hash} = response;
                const wallPhoto = (await bridge.send('VKWebAppCallAPIMethod', {
                    method: 'photos.saveWallPhoto',
                    params: {
                        server, photo, hash, caption, v: '5.126', access_token
                    }
                })).response[0];

                bridge.send('VKWebAppShowWallPostBox', {
                    message: '', copyright, attachments: `photo${wallPhoto.owner_id}_${wallPhoto.id}`
                });
            });
    } catch (e) {
        console.error(e);
    }
}

export async function shareAlbumPhoto(image_blob, album_name, album_caption, access_token, perm_album = false, perm_album_key = 'perm_album') {
    if (!access_token) {
        access_token = await getToken('photos');
        if (!access_token) {
            return -1;
        }
    }

    let album_id;
    const saved_id = perm_album && await getStorageValue(perm_album_key);
    if (saved_id === '' || !perm_album) {
        album_id = (await bridge.send('VKWebAppCallAPIMethod', {
            method: 'photos.createAlbum',
            params: {
                title: album_name,
                v: '5.126',
                access_token
            }
        })).response.id;
        if (perm_album) {
            await setStorageValue(perm_album_key, `${album_id}`);
        }
    } else {
        album_id = parseInt(saved_id);
    }

    let uploadAlbumUrl;
    let album_id_changed = false;

    for (let i = 0; i < 1; i++) {
        try {
            uploadAlbumUrl = (await bridge.send('VKWebAppCallAPIMethod', {
                method: 'photos.getUploadServer',
                params: {
                    album_id,
                    v: '5.126',
                    access_token
                }
            })).response.upload_url;
        } catch (e) {
            if (!album_id_changed) {
                album_id_changed = true;
                i--;
                album_id = (await bridge.send('VKWebAppCallAPIMethod', {
                    method: 'photos.createAlbum',
                    params: {
                        title: album_name,
                        v: '5.126',
                        access_token
                    }
                })).response.id;
                if (perm_album) {
                    await setStorageValue(perm_album_key, `${album_id}`);
                }
            } else {
                console.error(e);
                return -2;
            }
        }
    }

    if (image_blob instanceof Blob) {
        image_blob = [image_blob];
    }

    return await new Promise(async res => {
        for (const blob of image_blob) {
            let bodyFormData = new FormData();
            bodyFormData.append('photo', blob, 'image.png');

            let attempts = 0;
            for (let i = 0; i < 1; i++) {
                try {
                    attempts++;

                    const response = await fetch(proxyUrl + uploadAlbumUrl, {
                        method: 'POST',
                        body: bodyFormData
                    }).then(res_ => {
                        return res_.json()
                    });
                    const {server, photos_list, hash} = response;
                    const save = await bridge.send('VKWebAppCallAPIMethod', {
                        method: 'photos.save',
                        params: {
                            album_id, server, photos_list, hash,
                            caption: album_caption,
                            v: '5.126', access_token
                        }
                    });
                    if (save.error) {
                        throw new Error(JSON.stringify(save));
                    }
                } catch (e) {
                    if (attempts >= 10) {
                        console.error(e);
                        res(-4);
                    } else {
                        i--;
                        await sleep(400);
                    }
                }
            }
        }
        res(album_id);
    });
}