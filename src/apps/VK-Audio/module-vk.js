import {getRandomInt} from "../../js/utils";
const proxyUrl = ['https://murmuring-bastion-20764.herokuapp.com/', 'https://vds2153919.my-ihor.ru:8088/'][getRandomInt(0, 1)];

export default class VK {

    async isAuth() {
        await this.syncAuthData();
        if (!this.access_token)
            return {error: true};

        let user;
        for (let i = 0; i < 1; i++) {
            user = await this.api('users.get', {fields: ['photo_100']});
            if (user.error && user.error_code === 10) {
                i--;
            } else if (user.error) {
                return {error: user.error.error_msg};
            } else {
                return {response: user[0]};
            }
        }
    }

    async auth(username, password, code = 'GET_CODE') {
        return await new Promise(resolve =>
            fetch(`https://vds2153927.my-ihor.ru:8088/auth?username=${username}&password=${password}&code=${code}`)
                .then(response => response.json())
                .then(async data => {
                    if (data.error) {
                        if (data.error === 'need_validation') {
                            resolve({response: {redirect_uri: data.redirect_uri}});
                        } else {
                            resolve({error: data.error_description || data.error});
                        }
                    } else {
                        const {access_token, user_agent} = data;
                        await this.syncAuthData(access_token, user_agent);
                        resolve({response: {access_token, user_agent}});
                    }
                })
                .catch(err => {
                    resolve({error: err.toString()});
                })
        )
    }

    async syncAuthData(access_token = '', user_agent = '') {
        if ((access_token.length + user_agent.length) > 2) {
            console.log('Сохранение новых данных...', {access_token, user_agent});
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('user_agent', user_agent);
            this.access_token = access_token;
            this.user_agent = user_agent || 'KateMobileAndroid/56 lite-460 (Android 4.4.2; SDK 19; x86; unknown Android SDK built for x86; en)';
        } else {
            let
                user_agent = localStorage.getItem('user_agent'),
                access_token = localStorage.getItem('access_token')
            ;
            console.log('Получение сохранённых данных...', {access_token, user_agent});
            if (access_token !== null && access_token.length > 1) {
                if (user_agent === null) {
                    user_agent = 'KateMobileAndroid/56 lite-460 (Android 4.4.2; SDK 19; x86; unknown Android SDK built for x86; en)';
                }
                this.access_token = access_token;
                this.user_agent = user_agent;
            }
        }
        return true;
    }

    async logout() {
        localStorage.setItem('access_token', '');
        localStorage.setItem('user_agent', '');
        this.access_token = '';
        this.user_agent = '';
    }

    async api(method, query) {
        return new Promise(res => {
            const url = `https://vds2153927.my-ihor.ru:8088/api/${method}?${new URLSearchParams({
                access_token: this.access_token, v: '5.181',
                ...query
            })}`;
            console.log('Request api method ' + method, url, this.user_agent);
            fetch(url, {
                headers: new Headers({
                    'user-agent': this.user_agent
                })
            })
                .then(response => response.json())
                .then(async data => {
                    res(data.response ? data.response : data);
                })
                .catch(err => {
                    res({error: err.toString()});
                })
            ;
        })
    }

}