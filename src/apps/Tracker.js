import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import eruda from 'eruda';
import '@vkontakte/vkui/dist/vkui.css';
import '../css/Tracker.css';
import '../css/Error.css';

import {
    Panel,
    PanelHeader,
    View,
    Epic,
    Tabbar,
    TabbarItem,
    Tabs,
    TabsItem,
    PanelHeaderButton,
    Avatar,
    Placeholder,
    PanelHeaderContent,
    PanelHeaderContext,
    List, SimpleCell, Snackbar, ScreenSpinner,
    Input,
    Alert,
    Button,
    Footer
} from '@vkontakte/vkui';

import Icon28Truck from '../assets/icons_track/Icon28Truck.js';
import Icon28Clock from '../assets/icons_track/Icon28Clock.js';
import Icon80Vk from "../assets/icons_track/Icon80Vk.js";
import MainPlaceholderIcon from '../assets/icons_track/MainPlaceholderIcon.svg';
import MainPlaceholderButton from '../assets/icons_track/MainPlaceholderButton.svg';
import MainPlaceholderButtonLoading from '../assets/icons_track/MainPlaceholderButtonLoading.svg';
import {CustomPlaceholder} from "../components/Placeholder";
import Card from "../components/Card";
import ViewTabs from "../components/ViewTabs";
import TrackHistory from "../components/TrackHistory";

import {
    Icon16Done,
    Icon16Cancel,
    Icon16Dropdown,
    Icon28ChevronBack,
    Icon28EditOutline,
    Icon28CopyOutline,
    Icon28PlaceOutline,
    Icon28DeleteOutlineAndroid,
    Icon28NotificationDisableOutline,
    Icon28Notifications
} from '@vkontakte/icons';

import {sleep, decOfNum, avocadoApi} from "../js/utils";

const request = require('request');

class Tracker extends React.Component {

    constructor(props) {
        super(props);
        //eruda.init();

        this.state = {
            popout: null,
            history: {
                add: ['add'],
                history: ['history']
            },
            activePanel: {
                add: 'add',
                history: 'history'
            },
            activePanel_: 'main',
            activeStory: 'add',
            activeTabHistory: 'all',

            tracks: [], all: [], transit: [], delivered: [],
            track: {
                history: [], packageName: ''
            },

            canGetMoreTracks: true,
            offset: 0
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.back = this.back.bind(this);
        this.go = this.go.bind(this);
        this.onStoryChange = this.onStoryChange.bind(this);
        this.toggleTrackContext = this.toggleTrackContext.bind(this);
        this.updateData = this.updateData.bind(this);

        this.toggleNotifications = this.toggleNotifications.bind(this);
        this.changeTrackName = this.changeTrackName.bind(this);
        this.copyTrackCode = this.copyTrackCode.bind(this);
        this.changeTrackStatus = this.changeTrackStatus.bind(this);
        this.deleteTrack = this.deleteTrack.bind(this);

        this.trackCard = this.trackCard.bind(this);
    }

    async componentDidMount() {
        window.addEventListener('load', (event) => {
            console.log('load');
            window.addEventListener('offline', (event) => {
                this.setState({activePanel_: 'error'});
            });

            window.addEventListener('online', (event) => {
                this.setState({activePanel_: 'main'});
            });
        });

        await this.updateData();

        bridge.send('VKWebAppInit');

        window.addEventListener('popstate', e => {
            e.preventDefault();
            this.back(e);
        });

        bridge.subscribe(async ({detail: {type, data}}) => {
            if (type !== undefined) console.log(type, data);
            if (type === 'VKWebAppUpdateConfig') {
                const schemeAttribute = document.createAttribute('scheme');
                schemeAttribute.value = data.scheme ? data.scheme === 'client_light' ? 'bright_light' : data.scheme : 'bright_light';
                document.body.attributes.setNamedItem(schemeAttribute);

                if (data.scheme === 'space_gray') {
                    if (bridge.supports('VKWebAppSetViewSettings')) {
                        bridge.send('VKWebAppSetViewSettings', {
                            status_bar_style: data.scheme === 'bright_light' ? 'dark' : 'light',
                            action_bar_color: data.scheme === 'bright_light' ? '#FFFFFF' : '#343537'
                        });
                    }
                }
            } else if (type === 'VKWebAppViewRestore') {
                this.setState({snackbar: null});
            }
        });
    }

    back = () => {
        if (this.state.trackContextOpened) this.toggleTrackContext();
        if (this.state.popout !== null) {
            this.setState({popout: null});
            window.history.pushState({pop: 'popout'}, 'Title');
            return;
        }
        let {activePanel, activeStory, history} = this.state;
        let history_ = history[activeStory];
        if (history_.length === 1) {
            bridge.send('VKWebAppClose', {status: 'success'});
        } else if (history_.length > 1) {
            history_.pop();
            activePanel[activeStory] = history_[history_.length - 1];
            this.setState({activePanel, history, snackbar: null});
        }
    };

    go(panel) {
        let {activeStory, history, activePanel} = this.state;
        let history_ = history[activeStory];
        if (history_[history_.length - 1] !== panel) {
            history_.push(panel);
            window.history.pushState({activePanel: panel}, 'Title');
            activePanel[activeStory] = panel;
            this.setState({activePanel, history, snackbar: null});
        }
    }

    onStoryChange(e) {
        let story = e.currentTarget.dataset.story;

        if (
            this.state.activeStory === story && this.state.history[story].length > 1
        )
            this.back();

        this.setState({activeStory: story, snackbar: null});
    }

    toggleTrackContext() {
        this.setState({trackContextOpened: !this.state.trackContextOpened});
    }

    clearArray(array) {
        return array.filter(function (val) {
            return val !== undefined;
        });
    }

    removeDuplicatesFromArray = (arr) => [...new Set(
        arr.map(el => JSON.stringify(el))
    )].map(e => JSON.parse(e));

    transformTrackObject(track) {
        let
            history = track.events,
            lastHistory = undefined,
            deliveredStatus = track.deliveredStatus ? track.deliveredStatus : 0
        ;
        let date = new Date(track.lastUpdate), date_ = new Date(),
            options = {
                month: 'long',
                day: 'numeric'
            },
            last_updated = date.toLocaleString('ru', options);
        if (date.getMonth() === date_.getMonth() && date.getFullYear() === date_.getFullYear()) {
            if (date.getUTCDate() === date_.getUTCDate())
                last_updated = 'Сегодня';
            else if (date.getUTCDate() === date_.getUTCDate() - 1)
                last_updated = 'Вчера';
            else if (date.getUTCDate() === date_.getUTCDate() - 2)
                last_updated = 'Позавчера';
        }
        history = this.removeDuplicatesFromArray(this.clearArray(history));
        for (let j in history) {
            let his = history[j];
            if (his.hasOwnProperty('operationAttributeOriginal')) {
                his.operationAttributeOriginal = his.operationAttributeOriginal.replace(' Track24', '');
                if (!lastHistory) lastHistory = his.operationAttributeOriginal;
                his.operationDateTime = new Date(his.operationDateTime).getTime();
            } else {
                delete history[j];
            }
        }
        history = history.sort((a, b) => b.operationDateTime - a.operationDateTime);
        return {...track, history, last_updated, deliveredStatus, lastHistory};
    }

    trackCard(track) {
        return <Card
            key={'trackCard' + track.packageNumber}
            getRootRef={(ref) => {
                this['trackCard' + track.packageNumber] = ref;
            }}
            onClick={(e) => {
                this.setState({track});
                this.go('tracking');
            }}
            title={(track.hasOwnProperty('packageName') ? track.packageName.length > 0 ? track.packageName + ' · ' : '' : '') + track.packageNumber}
            description={track.deliveredStatus === 1 ? 'Доставлено' : track.lastHistory ? track.lastHistory : 'В пути'}
            expandable
        />;
    }

    async updateData(data, removed = false) {
        try {
            const {canGetMoreTracks, offset} = this.state;
            const keys = ['all', 'transit', 'delivered'];

            if (removed) {
                console.log('Remove track');
                data = this.state.track;
                const {tracks} = this.state;
                const index = tracks.findIndex(value => value.packageNumber === data.packageNumber);
                if (index > -1) {
                    console.log(`Remove element#${index} from tracks`, JSON.stringify(tracks.map(value => value.packageNumber)));
                    tracks.splice(index, 1);
                    console.log(JSON.stringify(tracks.map(value => value.packageNumber)));
                }
                this.setState({tracks});
                for (const key of keys) {
                    const list = this.state[key];
                    const index = list.findIndex(value => value.packageNumber === data.packageNumber);
                    if (index > -1) {
                        console.log(`Remove element#${index} from ${key}`, JSON.stringify(list.map(value => value.packageNumber)));
                        list.splice(index, 1);
                        console.log(JSON.stringify(list.map(value => value.packageNumber)));
                    }
                    this.setState({[key]: list});
                }
                return;
            }

            if (data) {
                console.log('Change/add track');
                const {tracks} = this.state;
                const index = tracks.findIndex(value => value.packageNumber === data.packageNumber);

                const list = this.state[keys[0]];
                const indexData = list.findIndex(value => value.packageNumber === data.packageNumber);
                if (indexData === -1) {
                    console.log(`Set ${keys[0]}`, JSON.stringify(list.map(value => value.packageNumber)));
                    list.push(data);
                    console.log(JSON.stringify(list.map(value => value.packageNumber)));
                } else {
                    console.log(`Update ${keys[0]}`, JSON.stringify(list.map(value => value.packageNumber)));
                    list[indexData] = data;
                    console.log(JSON.stringify(list.map(value => value.packageNumber)));
                }

                const list1 = this.state[keys[1]];
                const list2 = this.state[keys[2]];
                const transitIndex = list1.findIndex(value => value.packageNumber === data.packageNumber);
                const deliveredIndex = list2.findIndex(value => value.packageNumber === data.packageNumber);
                if (data.deliveredStatus === 0) {
                    if (transitIndex === -1) {
                        console.log(`Set ${keys[1]}`, JSON.stringify(list1.map(value => value.packageNumber)));
                        list1.push(data);
                        console.log(JSON.stringify(list1.map(value => value.packageNumber)));
                    }
                    if (deliveredIndex > -1) {
                        list2.splice(deliveredIndex, 1);
                    }
                } else if (data.deliveredStatus === 1) {
                    if (deliveredIndex === -1) {
                        console.log(`Set ${keys[2]}`, JSON.stringify(list2.map(value => value.packageNumber)));
                        list2.push(data);
                        console.log(JSON.stringify(list2.map(value => value.packageNumber)));
                    }
                    if (transitIndex > -1) {
                        list1.splice(transitIndex, 1);
                    }
                }

                if (index === -1) {
                    tracks.push(data);
                } else {
                    tracks[index] = data;
                }

                await this.setState({[keys[0]]: list, [keys[1]]: list1, [keys[2]]: list2, tracks});
                this.forceUpdate();
                console.log(keys[0], this.state[keys[0]]);
                console.log(keys[1], this.state[keys[1]]);
                console.log(keys[2], this.state[keys[2]]);
                console.log('tracks', this.state.tracks);

                return;
            }

            if (canGetMoreTracks) {
                console.log('Update all track');
                let tracks = await this.api('GET', 'packages', {offset: offset});
                tracks = tracks.data.map(value => this.transformTrackObject(value));
                if (tracks.length < 100) {
                    this.setState({canGetMoreTracks: false});
                }
                this.setState({offset: offset + tracks.length});
                const data = {};
                for (const key of keys) {
                    data[key] = this.state[key];
                }
                for (const track of tracks) {
                    data[keys[0]].push(track);
                    if (track.deliveredStatus === 0)
                        data[keys[1]].push(track);
                    else if (track.deliveredStatus === 1)
                        data[keys[2]].push(track);
                }
                for (const key of keys) {
                    console.log(`Set ${key}`, JSON.stringify(data[key].map(value => value.packageNumber)));
                    await this.setState({[key]: data[key]});
                }

                await this.setState({tracks: [...this.state.tracks, ...tracks], activeTabHistory: 'all'});

                if (this.state.activeStory === 'history' && this.state.activePanel.history === 'tracking') {
                    let track = tracks.find(value => value.packageNumber === this.state.track.packageNumber);
                    let {notification, packageName} = track;
                    this.setState({track: {...this.state.track, ...{notification, packageName}}});
                }
                this.forceUpdate();
            }
        } catch (e) {
            console.error(e);
        }
    }

    async get(method, params) {
        if (params === undefined || params === null) params = {};
        let vkParams = JSON.parse('{"' + decodeURI(window.location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
        let str = [];
        params = {...params, ...vkParams};
        for (let p in params)
            if (params.hasOwnProperty(p)) {
                str.push(encodeURIComponent(p) + '=' + encodeURIComponent(params[p]));
            }
        params = str.join('&'); //https://package-vk.herokuapp.com/webhook
        let url = 'https://package-vk.herokuapp.com/' + method + '?' + params;
        console.log(url);
        let response_ = new Promise((resolve, reject) => {
            request.get({url}, function (err, httpResponse, body) {
                resolve(body);
            });
        });
        let response = JSON.parse(await response_);
        console.log(response);
        return response;
    }

    async api(type, method, params) {
        return await avocadoApi(type, `trackpack/${method}`, params);
    }

    async toggleNotifications() {
        this.setState({popout: <ScreenSpinner/>});
        try {
            const {track} = this.state;
            if (!track.notification) await bridge.sendPromise('VKWebAppAllowNotifications');
            track.notification = !track.notification;
            //await this.get('change-notification-status/' + !this.state.track.notification, {packageNumber: this.state.track.packageNumber});
            await this.api('PUT', 'package', {
                packageNumber: track.packageNumber,
                packageName: track.packageName,
                notification: track.notification
            });

            this.setState({track});
            await this.updateData(track);
        } catch (e) {
            console.error(e);
        }
        this.setState({popout: null});
    }

    async changeTrackName() {
        this.toggleTrackContext();
        this.setState({
            popout:
                <Alert
                    actionsLayout='vertical'
                    actions={[{
                        title: 'Сохранить',
                        mode: 'default',
                        action: async () => {
                            const {track} = this.state;

                            let newPackageName = this.inputNewName.value.toString(),
                                newPackageName_ = newPackageName.trim();

                            this.setState({popout: <ScreenSpinner/>});
                            let response =
                                (newPackageName_.length !== newPackageName.length && newPackageName_.length === 0)
                                ||
                                newPackageName.length > 20 || newPackageName.length === 0 ?
                                    {data: false}
                                    :
                                    await this.api('PUT', 'package', {
                                        packageNumber: track.packageNumber,
                                        packageName: newPackageName,
                                        notification: track.notification
                                    });
                            /*await this.get('change-package-name', {
                                packageNumber: this.state.track.packageNumber,
                                newPackageName
                            });*/
                            this.setState({popout: null});
                            if (response.data) {
                                track.packageName = newPackageName;
                                this.setState({track});
                                await this.updateData(track);
                                this.setState({
                                    snackbar:
                                        <Snackbar
                                            duration={3000}
                                            onClose={() => this.setState({snackbar: null})}
                                            before={<Icon16Done
                                                fill='var(--color)' width={24}
                                                height={24}/>}
                                        >
                                            {newPackageName.length === 0 ? 'Название удалено' : 'Название изменено'}
                                        </Snackbar>
                                });
                            } else {
                                this.setState({
                                    snackbar:
                                        <Snackbar
                                            duration={3000}
                                            onClose={() => this.setState({snackbar: null})}
                                            before={<Icon16Cancel
                                                fill='var(--color)' width={24}
                                                height={24}/>}
                                        >
                                            Некорректное название
                                        </Snackbar>
                                });
                            }
                        }
                    }]}
                    onClose={() => {
                        this.setState({popout: null});
                    }}
                >
                    <h2>Изменить название</h2>
                    <Input defaultValue={this.state.track.packageName} getRef={(ref) => {
                        this.inputNewName = ref;
                    }} placeholder='Введите новое название'/>
                </Alert>
        });
    }

    async copyTrackCode() {
        this.toggleTrackContext();
        try {
            await bridge.sendPromise('VKWebAppCopyText', {text: this.state.track.packageNumber});
            this.setState({
                snackbar:
                    <Snackbar
                        duration={3000}
                        onClose={() => this.setState({snackbar: null})}
                        before={<Icon16Done
                            fill='var(--color)' width={24} height={24}/>}
                    >
                        Трек-код скопирован в буфер обмена
                    </Snackbar>
            });
        } catch (e) {
            this.setState({
                snackbar:
                    <Snackbar
                        duration={3000}
                        onClose={() => this.setState({snackbar: null})}
                        before={<Icon16Cancel
                            fill='var(--color)' width={24} height={24}/>}
                    >
                        Ошибка
                    </Snackbar>
            });
        }
    }

    async changeTrackStatus() {
        this.toggleTrackContext();
        //let response = await this.get('change-delivered-status', {packageNumber: this.state.track.packageNumber});
        let response = await this.api('POST', 'delivered', {
            packageNumber: this.state.track.packageNumber
        });
        if (response.data) {
            const {track} = this.state;
            track.deliveredStatus = 1;
            await this.setState({track});
            await this.updateData(track);
            this.setState({
                snackbar:
                    <Snackbar
                        duration={3000}
                        onClose={() => this.setState({snackbar: null})}
                        before={<Icon16Done
                            fill='var(--color)' width={24} height={24}/>}
                    >
                        Статус посылки изменён
                    </Snackbar>
            });
        } else {
            this.setState({
                snackbar:
                    <Snackbar
                        duration={3000}
                        onClose={() => this.setState({snackbar: null})}
                        before={<Icon16Cancel
                            fill='var(--color)' width={24} height={24}/>}
                    >
                        Произошла ошибка
                    </Snackbar>
            });
        }
    }

    async deleteTrack() {
        this.toggleTrackContext();
        this.setState({popout: <ScreenSpinner/>});
        //let response = await this.get('delete-package', {packageNumber: this.state.track.packageNumber});
        try {
            await this.api('DELETE', 'package', {
                packageNumber: this.state.track.packageNumber
            });
            await this.updateData(false, true);
            this.setState({popout: null});
            await this.back();
            this.setState({
                snackbar:
                    <Snackbar
                        duration={3000}
                        onClose={() => this.setState({snackbar: null})}
                        before={<Icon16Done
                            fill='var(--color)' width={24} height={24}/>}
                    >
                        Трек-код успешно удалён
                    </Snackbar>
            });
        } catch (e) {
            this.setState({
                snackbar:
                    <Snackbar
                        duration={3000}
                        onClose={() => this.setState({snackbar: null})}
                        before={<Icon16Cancel
                            fill='var(--color)' width={24} height={24}/>}
                    >
                        Произошла ошибка
                    </Snackbar>
            });
            console.error(e);
        }
        this.setState({popout: null});
    }

    render() {
        return (
            <View activePanel={this.state.activePanel_}>
                <Panel id='main'>
                    <Epic activeStory={this.state.activeStory} tabbar={
                        <Tabbar>
                            <TabbarItem
                                onClick={this.onStoryChange}
                                selected={this.state.activeStory === 'add'}
                                data-story='add'
                            ><Icon28Truck active={this.state.activeStory === 'add'}/></TabbarItem>
                            <TabbarItem
                                onClick={this.onStoryChange}
                                selected={this.state.activeStory === 'history'}
                                data-story='history'
                            ><Icon28Clock active={this.state.activeStory === 'history'}/></TabbarItem>
                        </Tabbar>
                    }>
                        <View id='add' activePanel={this.state.activePanel.add} popout={this.state.popout}
                              history={this.state.history.add} onSwipeBack={this.back}>
                            <Panel id='add'>
                                <PanelHeader separator={false}></PanelHeader>
                                <CustomPlaceholder
                                    title='Отслеживайте посылки'
                                    description='Введите трек-код своей посылки!'
                                    topIcon={MainPlaceholderIcon}
                                    btnIcon={MainPlaceholderButton}
                                    btnIconLoading={MainPlaceholderButtonLoading}
                                    btnOnClick={async (e, input) => {
                                        let packageNumber = input.value;
                                        let response, isNew;
                                        try {
                                            isNew = false;
                                            response = await this.api('GET', `package/${packageNumber}`);
                                        } catch (e) {
                                            isNew = true;
                                            response = await this.api('POST', 'package', {
                                                packageNumber: packageNumber,
                                                packageName: packageNumber
                                            });
                                        }
                                        try {
                                            //let response = await this.get('add-package', {packageNumber});
                                            if (response.hasOwnProperty('error')) {
                                                let error_code = response.error.status;
                                                if (error_code === 400 || error_code === 500) {
                                                    this.setState({
                                                        snackbar:
                                                            <Snackbar
                                                                duration={3000}
                                                                onClose={() => this.setState({snackbar: null})}
                                                                before={<Icon16Cancel
                                                                    fill='var(--color)' width={24} height={24}/>}
                                                            >
                                                                Неверный трек-код
                                                            </Snackbar>
                                                    });
                                                } else {
                                                    console.error(response.error);
                                                    this.setState({
                                                        snackbar:
                                                            <Snackbar
                                                                duration={3000}
                                                                onClose={() => this.setState({snackbar: null})}
                                                                before={<Icon16Cancel
                                                                    fill='var(--color)' width={24} height={24}/>}
                                                            >
                                                                Ошибка сервера
                                                            </Snackbar>
                                                    });
                                                }
                                            } else if (response.hasOwnProperty('data')) {
                                                if (response.data) {
                                                    const data = this.transformTrackObject(response.data);
                                                    this.updateData(data);
                                                    input.value = '';
                                                    setTimeout(async () => {
                                                        await this.setState({
                                                            activeStory: 'history',
                                                            activeTabHistory: 'all',
                                                            track: data
                                                        });
                                                        await sleep(200);
                                                        this.go('tracking');
                                                    }, 200);
                                                }
                                            }
                                        } catch (e) {
                                            console.error(e);
                                            this.setState({
                                                snackbar:
                                                    <Snackbar
                                                        duration={3000}
                                                        onClose={() => this.setState({snackbar: null})}
                                                        before={<Icon16Cancel
                                                            fill='var(--color)' width={24} height={24}/>}
                                                    >
                                                        Произошла ошибка
                                                    </Snackbar>
                                            });
                                        }
                                    }}
                                    inputPlaceholder='Пример: RU123HK'
                                    inputMaxLength={20}
                                />
                                {this.state.snackbar}
                            </Panel>
                        </View>
                        <View id='history' activePanel={this.state.activePanel.history} popout={this.state.popout}
                              history={this.state.history.history} onSwipeBack={this.back}>
                            <Panel id='history'>
                                <PanelHeader separator={false}>История</PanelHeader>
                                {
                                    this.state.tracks.length > 0 ?
                                        <div>
                                            <Tabs mode='buttons' style={{overflowX: 'auto'}}>
                                                <TabsItem
                                                    onClick={() => this.setState({activeTabHistory: 'all'})}
                                                    selected={this.state.activeTabHistory === 'all'}
                                                >
                                                    Все
                                                </TabsItem>
                                                {
                                                    this.state.transit.length > 0 &&
                                                    <TabsItem
                                                        onClick={() => this.setState({activeTabHistory: 'transit'})}
                                                        selected={this.state.activeTabHistory === 'transit'}
                                                    >
                                                        В пути
                                                    </TabsItem>
                                                }
                                                {
                                                    this.state.delivered.length > 0 &&
                                                    <TabsItem
                                                        onClick={() => this.setState({activeTabHistory: 'delivered'})}
                                                        selected={this.state.activeTabHistory === 'delivered'}
                                                    >
                                                        Доставлено
                                                    </TabsItem>
                                                }
                                            </Tabs>
                                            <div style={{overflowX: 'hidden'}}>
                                                <ViewTabs activeTab={this.state.activeTabHistory}>
                                                    <div id='all'>
                                                        {
                                                            this.state.all.map(value => this.trackCard(value))
                                                        }
                                                        <div
                                                            style={{
                                                                display: !this.state.canGetMoreTracks ? 'none' : 'flex',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <Button onClick={async () => {
                                                                await this.updateData();
                                                                this.forceUpdate();
                                                            }}>
                                                                Показать ещё
                                                            </Button>
                                                        </div>
                                                        <Footer>{decOfNum(this.state.all.length, ['посылка', 'посылки', 'посылок'])}</Footer>
                                                    </div>
                                                    <div id='transit'>
                                                        {
                                                            this.state.transit.map(value => this.trackCard(value))
                                                        }
                                                        <Footer>{decOfNum(this.state.transit.length, ['посылка', 'посылки', 'посылок'])}</Footer>
                                                    </div>
                                                    <div id='delivered'>
                                                        {
                                                            this.state.delivered.map(value => this.trackCard(value))
                                                        }
                                                        <Footer>{decOfNum(this.state.delivered.length, ['посылка', 'посылки', 'посылок'])}</Footer>
                                                    </div>
                                                </ViewTabs>
                                            </div>
                                        </div>
                                        :
                                        <Placeholder
                                            className={'simple_placeholder'}
                                            stretched
                                            header='Тут ничего нет'
                                        >
                                            История Ваших запросов появится на этом экране.
                                        </Placeholder>
                                }

                                {this.state.snackbar}
                            </Panel>
                            <Panel id='tracking'>
                                <PanelHeader separator={false} left={<PanelHeaderButton
                                    onClick={this.back}><Icon28ChevronBack/></PanelHeaderButton>}>
                                    <PanelHeaderContent
                                        aside={<Icon16Dropdown
                                            style={{transform: `rotate(${this.state.trackContextOpened ? '180deg' : '0'})`}}/>}
                                        onClick={this.toggleTrackContext}
                                    >
                                        {(this.state.track.packageName ? this.state.track.packageName.length > 0 ? this.state.track.packageName : this.state.track.packageNumber : this.state.track.packageNumber)}
                                    </PanelHeaderContent>
                                </PanelHeader>
                                <PanelHeaderContext opened={this.state.trackContextOpened}
                                                    onClose={this.toggleTrackContext}>
                                    <List>
                                        <SimpleCell
                                            before={this.state.track.notification ?
                                                <Icon28NotificationDisableOutline/> :
                                                <Icon28Notifications/>
                                            }
                                            onClick={async () => {
                                                await this.toggleNotifications();
                                            }}>
                                            {
                                                this.state.track.notification ? 'Выключить уведомления' : 'Включить уведомления'
                                            }
                                        </SimpleCell>
                                        <SimpleCell
                                            before={<Icon28EditOutline/>}
                                            onClick={async () => {
                                                await this.changeTrackName();
                                            }}
                                        >
                                            Изменить название
                                        </SimpleCell>
                                        <SimpleCell
                                            before={<Icon28CopyOutline/>}
                                            onClick={async () => {
                                                await this.copyTrackCode();
                                            }}
                                        >
                                            Скопировать трек-номер
                                        </SimpleCell>
                                        {
                                            this.state.track.deliveredStatus !== 1 &&
                                            <SimpleCell
                                                before={<Icon28PlaceOutline/>}
                                                onClick={async () => {
                                                    await this.changeTrackStatus();
                                                }}
                                            >
                                                Установить статус "Доставлено"
                                            </SimpleCell>
                                        }
                                        <SimpleCell
                                            className='SimpleCell__destructive'
                                            before={<Icon28DeleteOutlineAndroid/>}
                                            onClick={async () => {
                                                await this.deleteTrack();
                                            }}
                                        >
                                            Удалить трек из базы
                                        </SimpleCell>
                                    </List>
                                </PanelHeaderContext>
                                <TrackHistory
                                    track={this.state.track}
                                    updated={this.state.track.last_updated}
                                    this={this}
                                />
                                {this.state.snackbar}
                            </Panel>
                        </View>
                    </Epic>
                </Panel>
                <Panel id='error'>
                    <div className='main'>
                        <div className='logo'>
                            <Icon80Vk/>
                        </div>
                        <div className='logo-space'></div>
                        <div className='picture'></div>
                        <div className='text-1'>Интернет-соединение потеряно</div>
                        <div className='text-2'>Попробуйте повторить позднее</div>
                        <div className='button-wrap'>
                            <Button onClick={() => {
                                if (window.navigator.onLine) {
                                    this.setState({activePanel_: 'main', popout: null});
                                }
                            }}>
                                Повторить попытку
                            </Button>
                        </div>
                        <div className='logo-space'></div>
                    </div>
                </Panel>
            </View>
        );
    }
}

export default Tracker;