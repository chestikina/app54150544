import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '@vkontakte/vkui/dist/vkui.css';
import '../css/MedicalCard.css';

import {
    Button,
    Counter,
    Div,
    Panel,
    Placeholder,
    Text,
    Title,
    View,
    FixedLayout,
    PanelHeader,
    Avatar,
    Group,
    SimpleCell,
    Header,
    Footer,
    CellButton,
    PanelHeaderBack,
    ActionSheet,
    ActionSheetItem,
    ModalRoot,
    ModalPageHeader,
    ModalPage,
    IS_PLATFORM_IOS,
    IS_PLATFORM_ANDROID,
    PanelHeaderButton,
    FormItem,
    Input,
    Textarea,
    DatePicker,
    FormLayout,
    InfoRow,
    Separator,
    PanelHeaderClose,
    PullToRefresh, Snackbar, PopoutWrapper,
} from '@vkontakte/vkui';


import {
    Icon20RecentOutline,
    Icon20ShareOutline,
    Icon28WaterDropOutline,
    Icon28PawOutline,
    Icon28NameTagOutline,
    Icon28AccessibilityOutline,
    Icon28CalendarOutline,
    Icon28AddOutline,
    Icon28LockOutline,
    Icon28ChainOutline,
    Icon28UserIncomingOutline,
    Icon24Cancel,
    Icon28WriteOutline,
    Icon24Dismiss,
    Icon28DeleteOutlineAndroid, Icon28SortHorizontalOutline
} from '@vkontakte/icons';
import CellInfo from "../components/CellInfo";
import {decOfNum} from "../js/utils";
import {ColorSelect} from "../components/ColorSelect";
import Icon80Vk from "../assets/icons_track/Icon80Vk";

const request = require('request'),
    MODAL_PAGE_NEW_EVENT = 'new-event',
    MODAL_PAGE_NEW_ALLERGEN = 'new-allergen',
    MODAL_PAGE_NEW_DISEASE = 'new-disease',

    object_colors = [
        '#F95555',
        '#55A0F9',
        '#FFD15B',
        '#6F6CFF',
        '#5EDB6A',
        '#B155F9'
    ],
    history_types = [
        'Ссылка',
        'Запрос'
    ],
    blood_types = [
        [
            'O (I)', 'Rh+'
        ],
        [
            'O (I)', 'Rh-'
        ],
        [
            'A (II)', 'Rh+'
        ],
        [
            'A (II)', 'Rh-'
        ],
        [
            'B (III)', 'Rh+'
        ],
        [
            'B (III)', 'Rh-'
        ],
        [
            'AB (IV)', 'Rh+'
        ],
        [
            'AB (IV)', 'Rh-'
        ],
        [
            'Не указано', ''
        ]
    ],
    genders = [
        'Мужской',
        'Женский',
        'Не указано'
    ],
    allowView = [
        [
            'По ссылке', 'По ссылке и по запросу врача', <Icon28ChainOutline/>
        ],
        [
            'По запросу', 'Только по запросу врача', <Icon28UserIncomingOutline/>
        ]
    ]
;

let vkParams = {}, isNewUser, onlyRuEnLetters = /[^(а-яА-я0-9a-zA-Z|ёЁ|\-) ]/g;

class MedicalCard extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: ['landing_1'],
            activePanel: 'landing_1',

            activeModal: null,
            modalHistory: [],

            user: {
                events: [],
                allergens: [],
                diseases: [],
                history: [],
                _id: '',
                bloodType: 0,
                sex: 0,
                allowView: 0
            },

            event_: {},
            new_event: {},
            edit_event: {},

            allergen_: {},
            new_allergen: {},
            edit_allergen: {},

            disease_: {},
            new_disease: {},
            edit_disease: {},

            another_card: false,
            fetchingUser: false,

            canGoBack: true
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.back = this.back.bind(this);
        this.go = this.go.bind(this);

        vkParams = JSON.parse('{"' + decodeURI(window.location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
        this.modalBack = () => {
            this.setActiveModal(this.state.modalHistory[this.state.modalHistory.length - 2]);
        };
    }

    async updateUserData() {
        try {
            let
                user = await bridge.send('VKWebAppGetUserInfo'),
                user_ = await this.get('user/get');
            this.setState({
                user: {history: user_.history.reverse(), ...user, ...user_, photo: user.photo_200}
            });
            return true;
        } catch (e) {
            if (e.error_type === 'client_error') {
                await this.setState({history: [], activeModal: null, modalHistory: [], popout: null});
                await this.setState({activePanel: 'error'});
            }
            return false;
        }
    }

    async componentDidMount() {
        try {
            isNewUser = (await bridge.send('VKWebAppStorageGet', {keys: ['landing']})).keys[0].value === '';

            let
                user = await bridge.send('VKWebAppGetUserInfo'),
                user_ = await this.get('user/get');

            this.setState({
                user: {history: user_.history.reverse(), ...user, ...user_, photo: user.photo_200},
                history: [isNewUser ? 'landing_1' : 'data'],
                activePanel: isNewUser ? 'landing_1' : 'data',
                another_card: false
            });

            window.addEventListener('popstate', e => {
                e.preventDefault();
                this.back();
            });

            window.addEventListener('offline', async event => {
                await this.setState({history: [], activeModal: null, modalHistory: [], popout: null});
                await this.setState({activePanel: 'error'});
            });

            window.addEventListener('online', async event => {
                const isNewUser = (await bridge.send('VKWebAppStorageGet', {keys: ['landing']})).keys[0].value === '';
                this.go(isNewUser ? 'landing_1' : 'data');
            });

            bridge.subscribe(async ({detail: {type, data}}) => {
                if (type !== undefined) console.log(type, data);
                if (type === 'VKWebAppUpdateConfig') {
                    const schemeAttribute = document.createAttribute('scheme');
                    schemeAttribute.value = data.scheme ? data.scheme === 'client_light' ? 'bright_light' : data.scheme : 'bright_light';
                    document.body.attributes.setNamedItem(schemeAttribute);
                } else if (type === 'VKWebAppViewRestore') {
                    this.setState({snackbar: null, popout: null});
                } else if (type === 'VKWebAppInitResult') {
                    let uuid = window.location.hash.length > 0 ? window.location.hash.substring(1) : '';

                    if (uuid.length > 0) {
                        user_ = await this.get('user/get', {uuid});
                        console.log(user_);
                        if (user_.status !== 401) {
                            this.setState({
                                user: {...user_, history: user_.history.reverse()},
                                another_card: true
                            });
                        }
                    }
                }
            });

            bridge.send('VKWebAppInit');
        } catch (e) {
            bridge.send('VKWebAppInit');
            console.error(e);
        }

        console.log('App version — 1.6__prod-test');
    }

    back = async () => {
        if (!this.state.canGoBack) {
            window.history.pushState({pop: 'popout'}, 'Title');
            return;
        }

        let {popout, history, modalHistory} = this.state;

        if (popout !== null) {
            this.setState({popout: null});
            return;
        }

        if (modalHistory.length > 0) {
            this.modalBack();
            return;
        }

        if (history.length === 1) {
            bridge.send('VKWebAppClose', {status: 'success'});
        } else if (history.length > 1) {
            history.pop();
            this.setState({activePanel: history[history.length - 1], history, snackbar: null, canGoBack: false});
        }
    };

    go(panel) {
        let {history} = this.state;
        if (history[history.length - 1] !== panel) {
            history.push(panel);
            window.history.pushState({activePanel: panel}, 'Title');
            this.setState({activePanel: panel, history, snackbar: null});
        }
    }

    setActiveModal(activeModal) {
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

    async get(method, params) {
        try {
            if (params === undefined || params === null) params = {};
            let str = [];
            console.log(method, params);
            params = {...params, ...vkParams};
            for (let p in params)
                if (params.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + '=' + encodeURIComponent(params[p]));
                }
            params = str.join('&');
            let url = 'https://medical-card-avocado.herokuapp.com/' + method + '?' + params;
            let response_ = new Promise((resolve, reject) => {
                request.get({url}, function (err, httpResponse, body) {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        resolve({status: -1});
                    }
                });
            }), response = await response_;
            console.log(url, response);
            if (response.status && response.status != 200) {
                await this.back();
                this.setState({
                    snackbar:
                        <Snackbar
                            layout='vertical'
                            onClose={() => this.setState({snackbar: null})}
                        >
                            {response.status === 429 ? 'Слишком много запросов' : 'Произошла ошибка'}
                        </Snackbar>
                });
            }
            return response;
        } catch (e) {
            return {error: {code: -1}}
        }
    }

    renderEventForm(mode) {
        return (
            <FormLayout>
                <FormItem top='Название события'>
                    <Input
                        maxlength={50}
                        defaultValue={mode.startsWith('edit_') ? this.state[mode].title : null}
                        onChange={value => {
                            value = value.currentTarget.value.replace(onlyRuEnLetters, '');
                            this.setState({
                                [mode]: {
                                    ...this.state[mode],
                                    title: value.length > 0 ? value : undefined
                                }
                            })
                        }}
                        value={this.state[mode].title}
                        placeholder='Введите название события'/>
                </FormItem>
                <FormItem top='Описание события'>
                    <Textarea
                        defaultValue={mode.startsWith('edit_') ? this.state[mode].description : null}
                        onChange={value => {
                            this.setState({
                                [mode]: {
                                    ...this.state[mode],
                                    description: value.currentTarget.value.length > 0 ? value.currentTarget.value : undefined
                                }
                            })
                        }}
                        placeholder='Введите описание события'/>
                </FormItem>
                <FormItem top='Дата события'>
                    <DatePicker
                        defaultValue={mode.startsWith('edit_') ? this.state[mode].date : null}
                        min={{day: 1, month: 1, year: 1971}}
                        max={{day: 1, month: 1, year: new Date().getUTCFullYear() + 100}}
                        onDateChange={value => {
                            if (Object.keys(value).map(val => value[val] > 0 ? 1 : 0).reduce((value1, value2) => value1 + value2) >= 3) {
                                this.setState({
                                    [mode]: {
                                        ...this.state[mode],
                                        date: value
                                    }
                                })
                            }
                        }}
                        dayPlaceholder='Д'
                        monthPlaceholder='ММ'
                        yearPlaceholder='ГГ'
                    />
                </FormItem>
                <FormItem top='Цвет'>
                    <ColorSelect
                        defaultValue={mode.startsWith('edit_') ? this.state[mode].color : null}
                        items={object_colors}
                        onChange={value => {
                            this.setState({
                                [mode]: {
                                    ...this.state[mode],
                                    color: value
                                }
                            })
                        }}/>
                </FormItem>
                <Div>
                    <Button disabled={
                        !(
                            this.state[mode].title !== undefined
                            &&
                            this.state[mode].title.trim().length > 0
                            &&
                            this.state[mode].title.trim().length < 50
                            &&
                            this.state[mode].description !== undefined
                            &&
                            this.state[mode].date !== undefined
                            &&
                            this.state[mode].color > -1
                        )
                    } mode='secondary' size='l' stretched onClick={async () => {
                        await this.setState({popout: <PopoutWrapper hasMask={false}/>});
                        let {title, description, date, color, $id, _id} = this.state[mode];
                        if (title) title = title.trim();
                        let date_ = new Date(0);
                        date_.setUTCDate(date.day);
                        date_.setMonth(date.month - 1);
                        date_.setFullYear(date.year);

                        let events = this.state.user.events;
                        if (mode.startsWith('edit_')) {
                            events[$id] = {
                                ...this.state[mode],
                                date: date_.getTime()
                            };
                            await this.get('event/edit', {
                                ...events[$id],
                                id: _id
                            });
                            this.setState({
                                user: {...this.state.user, events},
                                event_: events[$id],
                                [mode]: {},
                                history: ['data', 'event'],
                                activePanel: 'event',
                                popout: null
                            });
                        } else if (mode.startsWith('new_')) {
                            let req = await this.get('event/add', {
                                title,
                                description,
                                date: date_.getTime(),
                                color
                            });

                            if (req.status == 200) {
                                events.push({
                                    title,
                                    description,
                                    date: date_.getTime(),
                                    color
                                });
                            }
                            this.setState({user: {...this.state.user, events}, [mode]: {}});
                            await this.updateUserData();
                            await this.setState({popout: null});
                            if (IS_PLATFORM_IOS) this.back();
                            else this.modalBack();
                        }
                    }}>{mode.startsWith('edit_') ? 'Сохранить' : 'Добавить'}</Button>
                </Div>
            </FormLayout>
        );
    }

    renderAllergenForm(mode) {
        return (
            <FormLayout>
                <FormItem top='Название аллергена'>
                    <Input
                        maxlength={50}
                        defaultValue={mode.startsWith('edit_') ? this.state[mode].title : null}
                        onChange={value => {
                            value = value.currentTarget.value.replace(onlyRuEnLetters, '');
                            this.setState({
                                [mode]: {
                                    ...this.state[mode],
                                    title: value.length > 0 ? value : undefined
                                }
                            })
                        }}
                        value={this.state[mode].title}
                        placeholder='Введите название аллергена'/>
                </FormItem>
                <FormItem top='Дата обнаружения (необязательно)'>
                    <DatePicker
                        defaultValue={mode.startsWith('edit_') ? this.state[mode].date : null}
                        min={this.state.user.birthday > 0 ?
                            {
                                day: new Date(this.state.user.birthday).getUTCDate(),
                                month: new Date(this.state.user.birthday).getMonth() + 1,
                                year: new Date(this.state.user.birthday).getFullYear()
                            } : {day: 1, month: 1, year: 1971}}
                        max={{
                            day: new Date().getUTCDate(),
                            month: new Date().getMonth() + 1,
                            year: new Date().getFullYear()
                        }}
                        onDateChange={value => {
                            this.setState({
                                [mode]: {
                                    ...this.state[mode],
                                    date: value
                                }
                            })
                        }}
                        dayPlaceholder='Д'
                        monthPlaceholder='ММ'
                        yearPlaceholder='ГГ'
                    />
                </FormItem>
                <FormItem top='Цвет'>
                    <ColorSelect
                        defaultValue={mode.startsWith('edit_') ? this.state[mode].color : null}
                        items={object_colors}
                        onChange={value => {
                            this.setState({
                                [mode]: {
                                    ...this.state[mode],
                                    color: value
                                }
                            })
                        }}/>
                </FormItem>
                <Div>
                    <Button disabled={
                        !(
                            this.state[mode].title !== undefined
                            &&
                            this.state[mode].title.trim().length > 0
                            &&
                            this.state[mode].title.trim().length < 50
                            &&
                            (
                                (this.state[mode].date !== null && this.state[mode].date !== undefined) ? (
                                        Object.keys(this.state[mode].date).map(value => this.state[mode].date[value] > 0 ? 1 : 0).reduce((value1, value2) => value1 + value2) > 0 &&
                                        Object.keys(this.state[mode].date).map(value => this.state[mode].date[value] > 0 ? 1 : 0).reduce((value1, value2) => value1 + value2) >= 3
                                    )
                                    :
                                    true
                            )
                            &&
                            (
                                (this.state[mode].date !== null && this.state[mode].date !== undefined && this.state.user.birthday > 0) ?
                                    new Date(`${this.state[mode].date.month}-${this.state[mode].date.day}-${this.state[mode].date.year}`).getTime()
                                    >=
                                    this.state.user.birthday
                                    :
                                    true
                            )
                            &&
                            this.state[mode].color > -1
                        )
                    } mode='secondary' size='l' stretched onClick={async () => {
                        await this.setState({popout: <PopoutWrapper hasMask={false}/>});
                        let {title, description, date, color, $id, _id} = this.state[mode];
                        if (title) title = title.trim();
                        let date_ = new Date(0);
                        if ((date === null || date === undefined || date < 1) === false) {
                            date_.setUTCDate(date.day);
                            date_.setMonth(date.month - 1);
                            date_.setFullYear(date.year);
                        }

                        let allergens = this.state.user.allergens;
                        if (mode.startsWith('edit_')) {
                            allergens[$id] = {
                                ...this.state[mode],
                                date: date_.getTime()
                            };
                            await this.get('user/editAllergen', {
                                ...allergens[$id],
                                allergenId: _id
                            });
                            this.setState({
                                user: {...this.state.user, allergens},
                                allergen_: allergens[$id],
                                [mode]: {},
                                history: ['data', 'allergens', 'allergen'],
                                activePanel: 'allergen',
                                popout: null
                            });
                        } else if (mode.startsWith('new_')) {
                            let req = await this.get('user/addAllergen', {
                                title,
                                description,
                                date: date_.getTime(),
                                color
                            });

                            if (req.status == 200) {
                                allergens.push({
                                    title,
                                    description,
                                    date: date_.getTime(),
                                    color
                                });
                            }
                            this.setState({user: {...this.state.user, allergens}, [mode]: {}});
                            await this.updateUserData();
                            await this.setState({popout: null});
                            if (IS_PLATFORM_IOS) this.back();
                            else this.modalBack();
                        }
                    }}>{mode.startsWith('edit_') ? 'Сохранить' : 'Добавить'}</Button>
                </Div>
            </FormLayout>
        );
    }

    renderDiseaseForm(mode) {
        return (
            <FormLayout>
                <FormItem top='Название болезни'>
                    <Input
                        maxlength={50}
                        defaultValue={mode.startsWith('edit_') ? this.state[mode].title : null}
                        onChange={value => {
                            value = value.currentTarget.value.replace(onlyRuEnLetters, '');
                            this.setState({
                                [mode]: {
                                    ...this.state[mode],
                                    title: value.length > 0 ? value : undefined
                                }
                            })
                        }}
                        value={this.state[mode].title}
                        placeholder='Введите название болезни'/>
                </FormItem>
                <FormItem top='Дата обнаружения (необязательно)'>
                    <DatePicker
                        defaultValue={mode.startsWith('edit_') ? this.state[mode].dateStart : null}
                        min={this.state.user.birthday > 0 ?
                            {
                                day: new Date(this.state.user.birthday).getUTCDate(),
                                month: new Date(this.state.user.birthday).getMonth() + 1,
                                year: new Date(this.state.user.birthday).getFullYear()
                            } : {day: 1, month: 1, year: 1971}}
                        max={{
                            day: new Date().getUTCDate(),
                            month: new Date().getMonth() + 1,
                            year: new Date().getFullYear()
                        }}
                        onDateChange={value => {
                            console.log('Date start: ', value);
                            this.setState({
                                [mode]: {
                                    ...this.state[mode],
                                    dateStart: value
                                }
                            })
                        }}
                        dayPlaceholder='Д'
                        monthPlaceholder='ММ'
                        yearPlaceholder='ГГ'
                    />
                </FormItem>
                <FormItem top='Дата выздоровления (необязательно)'>
                    <DatePicker
                        defaultValue={mode.startsWith('edit_') ? this.state[mode].dateEnd : null}
                        min={this.state[mode].dateStart ? this.state[mode].dateStart : this.state.user.birthday > 0 ?
                            {
                                day: new Date(this.state.user.birthday).getUTCDate(),
                                month: new Date(this.state.user.birthday).getMonth() + 1,
                                year: new Date(this.state.user.birthday).getFullYear()
                            } : {day: 1, month: 1, year: 1971}}
                        max={{day: 1, month: 1, year: new Date().getUTCFullYear() + 100}}
                        onDateChange={value => {
                            console.log('Date end: ', value);
                            this.setState({
                                [mode]: {
                                    ...this.state[mode],
                                    dateEnd: value
                                }
                            })
                        }}
                        dayPlaceholder='Д'
                        monthPlaceholder='ММ'
                        yearPlaceholder='ГГ'
                    />
                </FormItem>
                <FormItem top='Цвет'>
                    <ColorSelect
                        defaultValue={mode.startsWith('edit_') ? this.state[mode].color : null}
                        items={object_colors}
                        onChange={value => {
                            this.setState({
                                [mode]: {
                                    ...this.state[mode],
                                    color: value
                                }
                            })
                        }}/>
                </FormItem>
                <Div>
                    <Button disabled={
                        !(
                            this.state[mode].title !== undefined
                            &&
                            this.state[mode].title.trim().length > 0
                            &&
                            this.state[mode].title.trim().length < 50
                            &&
                            (
                                (this.state[mode].dateStart !== null && this.state[mode].dateStart !== undefined) ?
                                    (
                                        Object.keys(this.state[mode].dateStart).map(value => this.state[mode].dateStart[value] > 0 ? 1 : 0).reduce((value1, value2) => value1 + value2) > 0
                                        &&
                                        Object.keys(this.state[mode].dateStart).map(value => this.state[mode].dateStart[value] > 0 ? 1 : 0).reduce((value1, value2) => value1 + value2) >= 3
                                    )
                                    :
                                    true
                            )
                            &&
                            (
                                (this.state[mode].dateEnd !== null && this.state[mode].dateEnd !== undefined) ?
                                    (
                                        Object.keys(this.state[mode].dateEnd).map(value => this.state[mode].dateEnd[value] > 0 ? 1 : 0).reduce((value1, value2) => value1 + value2) > 0
                                        &&
                                        Object.keys(this.state[mode].dateEnd).map(value => this.state[mode].dateEnd[value] > 0 ? 1 : 0).reduce((value1, value2) => value1 + value2) >= 3
                                    )
                                    :
                                    true
                            )
                            &&
                            (
                                (this.state[mode].dateStart !== null && this.state[mode].dateStart !== undefined && this.state[mode].dateEnd !== null && this.state[mode].dateEnd !== undefined) ?
                                    new Date(`${this.state[mode].dateEnd.month}-${this.state[mode].dateEnd.day}-${this.state[mode].dateEnd.year}`).getTime()
                                    >=
                                    new Date(`${this.state[mode].dateStart.month}-${this.state[mode].dateStart.day}-${this.state[mode].dateStart.year}`).getTime()
                                    :
                                    true
                            )
                            &&
                            (
                                (this.state[mode].dateStart !== null && this.state[mode].dateStart !== undefined && this.state.user.birthday > 0) ?
                                    new Date(`${this.state[mode].dateStart.month}-${this.state[mode].dateStart.day}-${this.state[mode].dateStart.year}`).getTime()
                                    >=
                                    this.state.user.birthday
                                    :
                                    true
                            )
                            &&
                            (
                                (this.state[mode].dateEnd !== null && this.state[mode].dateEnd !== undefined && this.state.user.birthday > 0) ?
                                    new Date(`${this.state[mode].dateEnd.month}-${this.state[mode].dateEnd.day}-${this.state[mode].dateEnd.year}`).getTime()
                                    >=
                                    this.state.user.birthday
                                    :
                                    true
                            )
                            &&
                            this.state[mode].color > -1
                        )
                    } mode='secondary' size='l' stretched onClick={async () => {
                        await this.setState({popout: <PopoutWrapper hasMask={false}/>});
                        let {title, description, dateStart, dateEnd, color, $id, _id} = this.state[mode];
                        if (title) title = title.trim();
                        let date_ = new Date(0), date__ = new Date(0);
                        if ((dateStart === null || dateStart === undefined || dateStart < 1) === false) {
                            date_.setUTCDate(dateStart.day);
                            date_.setMonth(dateStart.month - 1);
                            date_.setFullYear(dateStart.year);
                        }

                        if ((dateEnd === null || dateEnd === undefined || dateEnd < 1) === false) {
                            date__.setUTCDate(dateEnd.day);
                            date__.setMonth(dateEnd.month - 1);
                            date__.setFullYear(dateEnd.year);
                        }

                        let diseases = this.state.user.diseases;
                        if (mode.startsWith('edit_')) {
                            diseases[$id] = {
                                ...this.state[mode],
                                dateStart: date_.getTime(),
                                dateEnd: date__.getTime()
                            };
                            await this.get('user/editDisease', {
                                ...diseases[$id],
                                diseaseId: _id
                            });
                            this.setState({
                                user: {...this.state.user, diseases},
                                disease_: diseases[$id],
                                [mode]: {},
                                history: ['data', 'diseases', 'disease'],
                                activePanel: 'disease',
                                popout: null
                            });
                        } else if (mode.startsWith('new_')) {
                            let req = await this.get('user/addDisease', {
                                title,
                                description,
                                dateStart: date_.getTime(),
                                dateEnd: date__.getTime(),
                                color
                            });

                            if (req.status == 200) {
                                diseases.push({
                                    title,
                                    description,
                                    dateStart: date_.getTime(),
                                    dateEnd: date__.getTime(),
                                    color
                                });
                            }
                            this.setState({user: {...this.state.user, diseases}, [mode]: {}});
                            await this.updateUserData();
                            await this.setState({popout: null});
                            if (IS_PLATFORM_IOS) this.back();
                            else this.modalBack();
                        }
                    }}>{mode.startsWith('edit_') ? 'Сохранить' : 'Добавить'}</Button>
                </Div>
            </FormLayout>
        );
    }

    render() {
        const modal = (
            <ModalRoot
                activeModal={this.state.activeModal}
                onClose={this.modalBack}
            >
                <ModalPage
                    dynamicContentHeight={true}
                    id={MODAL_PAGE_NEW_EVENT}
                    onClose={this.modalBack}
                    header={
                        <ModalPageHeader
                            left={IS_PLATFORM_ANDROID &&
                            <PanelHeaderButton onClick={this.modalBack}><Icon24Cancel/></PanelHeaderButton>}
                            right={IS_PLATFORM_IOS &&
                            <PanelHeaderButton onClick={this.modalBack}><Icon24Dismiss/></PanelHeaderButton>}
                        >
                            Новое событие
                        </ModalPageHeader>
                    }
                >
                    {
                        this.renderEventForm('new_event')
                    }
                </ModalPage>
                <ModalPage
                    dynamicContentHeight={true}
                    id={MODAL_PAGE_NEW_ALLERGEN}
                    onClose={this.modalBack}
                    header={
                        <ModalPageHeader
                            left={IS_PLATFORM_ANDROID &&
                            <PanelHeaderButton onClick={this.modalBack}><Icon24Cancel/></PanelHeaderButton>}
                            right={IS_PLATFORM_IOS &&
                            <PanelHeaderButton onClick={this.modalBack}><Icon24Dismiss/></PanelHeaderButton>}
                        >
                            Новый аллерген
                        </ModalPageHeader>
                    }
                >
                    {
                        this.renderAllergenForm('new_allergen')
                    }
                </ModalPage>
                <ModalPage
                    dynamicContentHeight={true}
                    id={MODAL_PAGE_NEW_DISEASE}
                    onClose={this.modalBack}
                    header={
                        <ModalPageHeader
                            left={IS_PLATFORM_ANDROID &&
                            <PanelHeaderButton onClick={this.modalBack}><Icon24Cancel/></PanelHeaderButton>}
                            right={IS_PLATFORM_IOS &&
                            <PanelHeaderButton onClick={this.modalBack}><Icon24Dismiss/></PanelHeaderButton>}
                        >
                            Новая болезнь
                        </ModalPageHeader>
                    }
                >
                    {
                        this.renderDiseaseForm('new_disease')
                    }
                </ModalPage>
            </ModalRoot>
        );

        return (
            <View activePanel={this.state.activePanel} popout={this.state.popout} modal={modal}
                  onTransition={() => this.setState({canGoBack: true})} onSwipeBack={this.back}>
                <Panel id='landing_1'>
                    <Placeholder
                        icon={<img alt='landing' src={require('../assets/icons_medical_card/landing.svg')}/>}
                        stretched
                    >
                        <Title weight='semibold' level={2}>Добро пожаловать</Title>
                        <Text style={{
                            marginTop: 15
                        }} weight='regular'>Заполните медицинскую карту, чтобы спасти себе жизнь.</Text>
                        <Button
                            stretched
                            onClick={async () => {
                                if (isNewUser)
                                    await bridge.send('VKWebAppStorageSet', {key: 'landing', value: '1'});
                                this.go('landing_2');
                            }}
                            mode='secondary'
                            size='l'
                            style={{
                                marginTop: '7vh'
                            }}>
                            Продолжить
                        </Button>
                        <Button
                            stretched
                            target='_blank'
                            href='https://vk.com/im?sel=-197416979'
                            mode='tertiary'
                            size='l'
                            style={{
                                marginTop: 12
                            }}>
                            Я врач
                        </Button>
                    </Placeholder>
                </Panel>
                <Panel id='landing_2'>
                    <Title style={{
                        marginTop: 'calc(75px + var(--safe-area-inset-top))',
                        textAlign: 'center'
                    }} weight='semibold' level={2}>Как это работает</Title>
                    <Div>
                        {
                            [
                                'Вы заполняете анкету с важными медицинскими данными.',
                                'В случае возникновения происшествия врачи могут запросить Вашу карточку для дальнейшего использования.',
                                'Вы можете делиться карточкой при помощи персонального QR-кода и ссылки.'
                            ].map((value, i) =>
                                <CellInfo key={`cellinfo_${i}`} style={{margin: `${i === 0 ? 76 : 26}px 32px 0`}}
                                          before={<Counter mode='primary'>{i + 1}</Counter>}>
                                    {value}
                                </CellInfo>
                            )
                        }
                        <Button
                            style={{marginTop: '14vh'}}
                            stretched
                            onClick={() => this.setState({
                                history: ['data'],
                                activePanel: 'data'
                            })}
                            mode='secondary'
                            size='l'>Хорошо</Button>
                    </Div>
                </Panel>
                <Panel id='data'>
                    <PanelHeader separator={false} fixed={!IS_PLATFORM_IOS}>Карточка</PanelHeader>
                    <PullToRefresh onRefresh={async () => {
                        this.setState({fetchingUser: true});
                        await this.updateUserData();
                        this.setState({
                            fetchingUser: false,
                            another_card: false
                        });
                    }} isFetching={this.state.fetchingUser}>
                        <Input
                            onChange={(e) => {
                                try {
                                    if (e.target.value && e.target.value.length > 0) {
                                        if (new Date(e.target.value).getTime() <= Date.now()) {
                                            this.get('user/changeBirthday', {birthday: new Date(e.target.value).getTime()});
                                            this.setState({
                                                user: {
                                                    ...this.state.user,
                                                    birthday: new Date(e.target.value).getTime()
                                                }
                                            });
                                        }
                                    }
                                } catch (e) {
                                }
                            }}
                            className='InputBirthday'
                            min={new Date(86400000).toLocaleString('ru', {
                                day: 'numeric',
                                month: 'numeric',
                                year: 'numeric'
                            }).split('.').reverse().join('-')}
                            max={new Date().toLocaleString('ru', {
                                day: 'numeric',
                                month: 'numeric',
                                year: 'numeric'
                            }).split('.').reverse().join('-')}
                            type='date'
                            getRef={(ref) => {
                                this.inputDateRef = ref;
                            }}/>
                        <div className='centered' style={{marginTop: 21}}>
                            <Avatar size={80} src={this.state.user.photo} shadow={false}/>
                        </div>
                        <Title style={{
                            marginTop: 15,
                            textAlign: 'center'
                        }} weight='semibold'
                               lvl={3}>{this.state.another_card ? this.state.user.userName : this.state.user.first_name}</Title>
                        {
                            !this.state.another_card &&
                            <Div style={{display: 'flex', marginTop: 10}}>
                                {
                                    this.state.user.history.length > 0 &&
                                    <Button
                                        before={<Icon20RecentOutline/>}
                                        after={<Counter mode='primary'>{this.state.user.history.length}</Counter>}
                                        stretched
                                        size='l'
                                        mode='secondary'
                                        onClick={() => this.go('history')}
                                    >
                                        История
                                    </Button>
                                }
                                <Button
                                    onClick={() => bridge.send('VKWebAppShare', {link: `https://vk.com/app${vkParams.vk_app_id}#${this.state.user._id}`})}
                                    style={{
                                        marginLeft: this.state.user.history.length > 0 && 6
                                    }}
                                    before={<Icon20ShareOutline/>}
                                    stretched
                                    size='l'
                                    mode='secondary'
                                >
                                    Поделиться
                                </Button>
                            </Div>
                        }
                        <Group header={<Header mode='secondary'>Основное</Header>}>
                            <SimpleCell
                                disabled={this.state.another_card}
                                before={<Icon28WaterDropOutline/>}
                                description={
                                    `${blood_types[this.state.user.bloodType][0]} ${blood_types[this.state.user.bloodType][1]}`
                                }
                                onClick={() => {
                                    console.log('push');
                                    window.history.pushState({pop: 'actionsheet'}, 'Title');
                                    this.setState({
                                        popout:
                                            <ActionSheet
                                                iosCloseItem={<ActionSheetItem autoclose
                                                                               mode='cancel'>Отменить</ActionSheetItem>}
                                                onClose={() => this.setState({popout: null})}
                                            >
                                                {
                                                    blood_types.map((value, i) =>
                                                        <ActionSheetItem
                                                            key={'bloodType-' + i}
                                                            onChange={() => {
                                                                this.get('user/changeBloodType', {bloodType: i});
                                                                this.setState({
                                                                    user: {
                                                                        ...this.state.user,
                                                                        bloodType: i
                                                                    }
                                                                });
                                                            }}
                                                            checked={this.state.user.bloodType === i}
                                                            name='bloodType'
                                                            value={i}
                                                            autoclose
                                                            selectable
                                                        >
                                                            {value[0]}
                                                            {
                                                                value[1] !== '' &&
                                                                <span
                                                                    className='ActionSheetItem__description'>{value[1]}</span>
                                                            }
                                                        </ActionSheetItem>
                                                    )
                                                }
                                            </ActionSheet>
                                    });
                                }}
                            >
                                Группа крови
                            </SimpleCell>
                            <SimpleCell
                                before={<Icon28PawOutline/>}
                                description={this.state.user.allergens.length === 0 && 'Нет'}
                                expandable
                                onClick={() => this.go('allergens')}
                            >
                                Аллергены
                            </SimpleCell>
                            <SimpleCell
                                before={<Icon28NameTagOutline/>}
                                description={this.state.user.diseases.length === 0 && 'Не указано'}
                                expandable
                                onClick={() => this.go('diseases')}
                            >
                                Болезни
                            </SimpleCell>
                        </Group>
                        <Group header={<Header mode='secondary'>Дополнительно</Header>}>
                            <SimpleCell
                                disabled={this.state.another_card}
                                onClick={() => {
                                    window.history.pushState({pop: 'actionsheet'}, 'Title');
                                    this.setState({
                                        popout:
                                            <ActionSheet
                                                iosCloseItem={<ActionSheetItem autoclose
                                                                               mode='cancel'>Отменить</ActionSheetItem>}
                                                onClose={() => this.setState({popout: null})}
                                            >
                                                {
                                                    genders.map((value, i) =>
                                                        <ActionSheetItem
                                                            key={'sex-' + i}
                                                            onChange={() => {
                                                                this.get('user/changeGender', {sex: Math.abs(i - 2)});
                                                                this.setState({
                                                                    user: {
                                                                        ...this.state.user,
                                                                        sex: Math.abs(i - 2)
                                                                    }
                                                                });
                                                            }}
                                                            checked={this.state.user.sex === Math.abs(i - 2)}
                                                            name='sex'
                                                            value={i}
                                                            autoclose
                                                            selectable
                                                        >
                                                            {value}
                                                        </ActionSheetItem>
                                                    )
                                                }
                                            </ActionSheet>
                                    });
                                }}
                                before={<Icon28AccessibilityOutline/>}
                                description={genders[Math.abs(this.state.user.sex - 2)]}
                            >
                                Пол
                            </SimpleCell>
                            <SimpleCell
                                disabled={this.state.another_card}
                                before={<Icon28CalendarOutline/>}
                                description={this.state.user.birthday > 0 ? new Date(this.state.user.birthday).toLocaleString('ru', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                }) : 'Не указано'}
                                onClick={() => {
                                    this.inputDateRef.focus();
                                    this.inputDateRef.click();
                                }}
                            >
                                День рождения
                            </SimpleCell>
                            {
                                !this.state.another_card &&
                                <SimpleCell
                                    onClick={() => {
                                        window.history.pushState({pop: 'actionsheet'}, 'Title');
                                        this.setState({
                                            popout:
                                                <ActionSheet
                                                    iosCloseItem={<ActionSheetItem autoclose
                                                                                   mode='cancel'>Отменить</ActionSheetItem>}
                                                    onClose={() => this.setState({popout: null})}
                                                >
                                                    {
                                                        allowView.map((value, i) =>
                                                            <ActionSheetItem
                                                                before={value[2]}
                                                                key={'allowView-' + i}
                                                                onChange={() => {
                                                                    this.get('user/changeAllowView', {allowView: i});
                                                                    this.setState({
                                                                        user: {
                                                                            ...this.state.user,
                                                                            allowView: i
                                                                        }
                                                                    });
                                                                }}
                                                                checked={this.state.user.allowView === i}
                                                                name='allowView'
                                                                value={i}
                                                                autoclose
                                                                selectable
                                                            >
                                                                {value[1]}
                                                            </ActionSheetItem>
                                                        )
                                                    }
                                                </ActionSheet>
                                        });
                                    }}
                                    before={<Icon28LockOutline/>}
                                    description={allowView[this.state.user.allowView][0]}
                                >
                                    Доступ
                                </SimpleCell>
                            }
                        </Group>
                        <Group
                            header={<Header mode='secondary'>События</Header>}
                            description={!this.state.another_card && 'Добавьте все важные медицинские события, например, посещение врача.'}
                        />
                        {
                            !this.state.another_card &&
                            <CellButton
                                onClick={() => IS_PLATFORM_IOS ? this.go('new_event') : this.setActiveModal(MODAL_PAGE_NEW_EVENT)}
                                style={{color: 'var(--accent)'}}
                                before={<Icon28AddOutline/>}
                            >
                                Добавить событие
                            </CellButton>
                        }
                        {
                            this.state.user.events.map((value, i) =>
                                <SimpleCell
                                    key={'event-' + i}
                                    before={
                                        value.color || value.color > -1 ?
                                            <div className='ObjectColor__container'>
                                                <div
                                                    className='ObjectColor'
                                                    style={{backgroundColor: object_colors[value.color]}}
                                                />
                                            </div> : undefined
                                    }
                                    description={new Date(value.date).toLocaleString('ru', {
                                        month: 'long',
                                        day: 'numeric',
                                        ...new Date(value.date).getFullYear() !== new Date(Date.now()).getFullYear() ? {year: 'numeric'} : {}
                                    })}
                                    onClick={() => {
                                        this.setState({event_: {...value, $id: i}});
                                        this.go('event');
                                    }}
                                >{value.title}</SimpleCell>
                            )
                        }
                        <Footer
                            onClick={() => this.setState({
                                history: ['landing_2'],
                                activePanel: 'landing_2'
                            })}
                        >
                            Как это работает?</Footer>
                        {
                            this.state.snackbar
                        }
                    </PullToRefresh>
                </Panel>
                <Panel id='history'>
                    <PanelHeader separator={false} fixed={!IS_PLATFORM_IOS}
                                 left={<PanelHeaderBack onClick={() => this.back()}/>}>История</PanelHeader>
                    {
                        this.state.user.history.map((value, i) =>
                            <SimpleCell
                                target='_blank'
                                href={`https://vk.com/id${value.guestId}`}
                                key={'history-' + i}
                                before={<Avatar src={value.photo}/>}
                                description={new Date(value.createdAt).toLocaleString('ru', {
                                    month: 'long',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    ...new Date(value.createdAt).getFullYear() !== new Date(Date.now()).getFullYear() ? {year: 'numeric'} : {}
                                }) + ' · ' + history_types[value.type]}>{value.guestName}</SimpleCell>
                        )
                    }
                    <Footer>{decOfNum(this.state.user.history.length, ['просмотр', 'просмотра', 'просмотров'])}</Footer>
                </Panel>
                <Panel id='new_event'>
                    <PanelHeader separator={false} fixed={!IS_PLATFORM_IOS}
                                 left={<PanelHeaderBack onClick={() => this.back()}/>}>
                        Новое событие
                    </PanelHeader>
                    {
                        this.renderEventForm('new_event')
                    }
                </Panel>
                <Panel id='event'>
                    <PanelHeader separator={false} fixed={!IS_PLATFORM_IOS}
                                 left={<PanelHeaderBack onClick={() => this.back()}/>}/>
                    <Div style={{
                        marginTop: 24,
                        paddingBottom: !this.state.another_card && 68
                    }}>
                        <div style={{
                            display: 'flex'
                        }}>
                            {
                                this.state.event_.color || this.state.event_.color > -1 ?
                                    <div className='Color__container'>
                                        <div className='Color' style={{
                                            backgroundColor: object_colors[this.state.event_.color]
                                        }}/>
                                    </div> : undefined
                            }
                            <Title weight='bold' level={2}>{this.state.event_.title}</Title>
                        </div>
                        <InfoRow style={{marginTop: 25, whiteSpace: 'pre-wrap'}} header='Описание события'>
                            {
                                this.state.event_.description
                            }
                        </InfoRow>
                        <InfoRow style={{marginTop: 26}} header='Дата события'>
                            {new Date(this.state.event_.date).toLocaleString('ru', {
                                month: 'long',
                                day: 'numeric',
                                ...new Date(this.state.event_.date).getFullYear() !== new Date(Date.now()).getFullYear() ? {year: 'numeric'} : {}
                            })}
                        </InfoRow>
                    </Div>
                    {
                        !this.state.another_card &&
                        <FixedLayout vertical='bottom' filled={true}>
                            <Separator wide/>
                            <Div style={{display: 'flex'}}>
                                <Button
                                    size='l'
                                    mode='secondary'
                                    before={<Icon28WriteOutline/>}
                                    stretched
                                    onClick={() => {
                                        const date = new Date(this.state.event_.date);
                                        this.setState({
                                            edit_event: {
                                                ...this.state.event_,
                                                date: {
                                                    day: date.getUTCDate(),
                                                    month: date.getMonth() + 1,
                                                    year: date.getFullYear()
                                                }
                                            }
                                        });
                                        this.go('edit_event');
                                    }}
                                >
                                    Изменить
                                </Button>
                                <Button
                                    style={{marginLeft: 6}}
                                    size='l'
                                    mode='secondary'
                                    before={<Icon28DeleteOutlineAndroid/>}
                                    stretched
                                    onClick={() => {
                                        this.get('event/delete', {id: this.state.event_._id});
                                        this.state.user.events.splice(this.state.event_.$id, 1);
                                        this.back();
                                    }}
                                >
                                    Удалить
                                </Button>
                            </Div>
                        </FixedLayout>
                    }
                </Panel>
                <Panel id='edit_event'>
                    <PanelHeader separator={false} fixed={!IS_PLATFORM_IOS}
                                 left={<PanelHeaderClose onClick={() => this.back()}/>}>
                        Редактировать
                    </PanelHeader>
                    {
                        this.renderEventForm('edit_event')
                    }
                </Panel>
                <Panel id='allergens'>
                    <PanelHeader separator={false} fixed={!IS_PLATFORM_IOS}
                                 left={<PanelHeaderBack onClick={() => this.back()}/>}>Аллергены</PanelHeader>
                    {
                        !this.state.another_card &&
                        <CellButton
                            onClick={() => IS_PLATFORM_IOS ? this.go('new_allergen') : this.setActiveModal(MODAL_PAGE_NEW_ALLERGEN)}
                            style={{color: 'var(--accent)'}}
                            before={<Icon28AddOutline/>}
                        >
                            Добавить аллерген
                        </CellButton>
                    }
                    {
                        this.state.user.allergens.map((value, i) =>
                            <SimpleCell
                                key={'allegren-' + i}
                                before={
                                    value.color || value.color > -1 ?
                                        <div className='ObjectColor__container'>
                                            <div
                                                className='ObjectColor'
                                                style={{backgroundColor: object_colors[value.color]}}
                                            />
                                        </div> : undefined
                                }
                                description={value.date !== null && value.date !== undefined && value.date > 0 &&
                                new Date(value.date).toLocaleString('ru', {
                                    month: 'long',
                                    day: 'numeric',
                                    ...new Date(value.date).getFullYear() !== new Date(Date.now()).getFullYear() ? {year: 'numeric'} : {}
                                })}
                                onClick={() => {
                                    this.setState({allergen_: {...value, $id: i}});
                                    this.go('allergen');
                                }}
                            >{value.title}</SimpleCell>
                        )
                    }
                    {
                        this.state.another_card && this.state.user.allergens.length === 0 &&
                        <Footer>Пусто</Footer>
                    }
                </Panel>
                <Panel id='new_allergen'>
                    <PanelHeader separator={false} fixed={!IS_PLATFORM_IOS}
                                 left={<PanelHeaderBack onClick={() => this.back()}/>}>
                        Новый аллерген
                    </PanelHeader>
                    {
                        this.renderAllergenForm('new_allergen')
                    }
                </Panel>
                <Panel id='allergen'>
                    <PanelHeader separator={false} fixed={!IS_PLATFORM_IOS}
                                 left={<PanelHeaderBack onClick={() => this.back()}/>}/>
                    <Div style={{
                        marginTop: 24,
                        paddingBottom: !this.state.another_card && 68
                    }}>
                        <div style={{
                            display: 'flex'
                        }}>
                            {
                                this.state.allergen_.color || this.state.allergen_.color > -1 ?
                                    <div className='Color__container'>
                                        <div className='Color' style={{
                                            backgroundColor: object_colors[this.state.allergen_.color]
                                        }}/>
                                    </div> : undefined
                            }
                            <Title weight='bold' level={2}>{this.state.allergen_.title}</Title>
                        </div>
                        {
                            this.state.allergen_.date !== null && this.state.allergen_.date !== undefined && this.state.allergen_.date > 0 &&
                            <InfoRow style={{marginTop: 26}} header='Дата обнаружения'>
                                {new Date(this.state.allergen_.date).toLocaleString('ru', {
                                    month: 'long',
                                    day: 'numeric',
                                    ...new Date(this.state.allergen_.date).getFullYear() !== new Date(Date.now()).getFullYear() ? {year: 'numeric'} : {}
                                })}
                            </InfoRow>
                        }
                    </Div>
                    {
                        !this.state.another_card &&
                        <FixedLayout vertical='bottom' filled={true}>
                            <Separator wide/>
                            <Div style={{display: 'flex'}}>
                                <Button
                                    size='l'
                                    mode='secondary'
                                    before={<Icon28WriteOutline/>}
                                    stretched
                                    onClick={() => {
                                        const date = new Date(this.state.allergen_.date);
                                        this.setState({
                                            edit_allergen: {
                                                ...this.state.allergen_,
                                                date: this.state.allergen_.date !== null && this.state.allergen_.date !== undefined && this.state.allergen_.date > 0 ? {
                                                    day: date.getUTCDate(),
                                                    month: date.getMonth() + 1,
                                                    year: date.getFullYear()
                                                } : null
                                            }
                                        });
                                        this.go('edit_allergen');
                                    }}
                                >
                                    Изменить
                                </Button>
                                <Button
                                    style={{marginLeft: 6}}
                                    size='l'
                                    mode='secondary'
                                    before={<Icon28DeleteOutlineAndroid/>}
                                    stretched
                                    onClick={() => {
                                        this.get('user/deleteAllergen', {allergenId: this.state.allergen_._id});
                                        this.state.user.allergens.splice(this.state.allergen_.$id, 1);
                                        this.back();
                                    }}
                                >
                                    Удалить
                                </Button>
                            </Div>
                        </FixedLayout>
                    }
                </Panel>
                <Panel id='edit_allergen'>
                    <PanelHeader separator={false} fixed={!IS_PLATFORM_IOS}
                                 left={<PanelHeaderClose onClick={() => this.back()}/>}>
                        Редактировать
                    </PanelHeader>
                    {
                        this.renderAllergenForm('edit_allergen')
                    }
                </Panel>
                <Panel id='diseases'>
                    <PanelHeader separator={false} fixed={!IS_PLATFORM_IOS}
                                 left={<PanelHeaderBack onClick={() => this.back()}/>}>Болезни</PanelHeader>
                    {
                        !this.state.another_card &&
                        <CellButton
                            onClick={() => IS_PLATFORM_IOS ? this.go('new_disease') : this.setActiveModal(MODAL_PAGE_NEW_DISEASE)}
                            style={{color: 'var(--accent)'}}
                            before={<Icon28AddOutline/>}
                        >
                            Добавить болезнь
                        </CellButton>
                    }
                    {
                        this.state.user.diseases.map((value, i) =>
                            <SimpleCell
                                key={'disease-' + i}
                                before={
                                    value.color || value.color > -1 ?
                                        <div className='ObjectColor__container'>
                                            <div
                                                className='ObjectColor'
                                                style={{backgroundColor: object_colors[value.color]}}
                                            />
                                        </div> : undefined
                                }
                                description={value.dateStart !== null && value.dateStart !== undefined && value.dateStart > 0 &&
                                (new Date(value.dateStart).toLocaleString('ru', {
                                    month: 'long',
                                    day: 'numeric',
                                    ...new Date(value.dateStart).getFullYear() !== new Date(Date.now()).getFullYear() ? {year: 'numeric'} : {}
                                }) + (value.dateEnd > 0 ? (' — ' + new Date(value.dateEnd).toLocaleString('ru', {
                                    month: 'long',
                                    day: 'numeric',
                                    ...new Date(value.dateEnd).getFullYear() !== new Date(Date.now()).getFullYear() ? {year: 'numeric'} : {}
                                })) : ''))}
                                onClick={() => {
                                    this.setState({disease_: {...value, $id: i}});
                                    this.go('disease');
                                }}
                            >{value.title}</SimpleCell>
                        )
                    }
                    {
                        this.state.another_card && this.state.user.diseases.length === 0 &&
                        <Footer>Пусто</Footer>
                    }
                </Panel>
                <Panel id='new_disease'>
                    <PanelHeader separator={false} fixed={!IS_PLATFORM_IOS}
                                 left={<PanelHeaderBack onClick={() => this.back()}/>}>
                        Новая болезнь
                    </PanelHeader>
                    {
                        this.renderDiseaseForm('new_disease')
                    }
                </Panel>
                <Panel id='disease'>
                    <PanelHeader separator={false} fixed={!IS_PLATFORM_IOS}
                                 left={<PanelHeaderBack onClick={() => this.back()}/>}/>
                    <Div style={{
                        marginTop: 24,
                        paddingBottom: !this.state.another_card && 68
                    }}>
                        <div style={{
                            display: 'flex'
                        }}>
                            {
                                this.state.disease_.color || this.state.disease_.color > -1 ?
                                    <div className='Color__container'>
                                        <div className='Color' style={{
                                            backgroundColor: object_colors[this.state.disease_.color]
                                        }}/>
                                    </div> : undefined
                            }
                            <Title weight='bold' level={2}>{this.state.disease_.title}</Title>
                        </div>
                        {
                            this.state.disease_.dateStart !== null && this.state.disease_.dateStart !== undefined && this.state.disease_.dateStart > 0 &&
                            <InfoRow style={{marginTop: 26}} header='Дата обнаружения'>
                                {new Date(this.state.disease_.dateStart).toLocaleString('ru', {
                                    month: 'long',
                                    day: 'numeric',
                                    ...new Date(this.state.disease_.dateStart).getFullYear() !== new Date(Date.now()).getFullYear() ? {year: 'numeric'} : {}
                                })}
                            </InfoRow>
                        }
                        {
                            this.state.disease_.dateEnd !== null && this.state.disease_.dateEnd !== undefined && this.state.disease_.dateEnd > 0 &&
                            <InfoRow style={{marginTop: 26}} header='Дата выздоровления'>
                                {new Date(this.state.disease_.dateEnd).toLocaleString('ru', {
                                    month: 'long',
                                    day: 'numeric',
                                    ...new Date(this.state.disease_.dateEnd).getFullYear() !== new Date(Date.now()).getFullYear() ? {year: 'numeric'} : {}
                                })}
                            </InfoRow>
                        }
                    </Div>
                    {
                        !this.state.another_card &&
                        <FixedLayout vertical='bottom' filled={true}>
                            <Separator wide/>
                            <Div style={{display: 'flex'}}>
                                <Button
                                    size='l'
                                    mode='secondary'
                                    before={<Icon28WriteOutline/>}
                                    stretched
                                    onClick={() => {
                                        const date1 = new Date(this.state.disease_.dateStart),
                                            date2 = new Date(this.state.disease_.dateEnd);
                                        this.setState({
                                            edit_disease: {
                                                ...this.state.disease_,
                                                dateStart: this.state.disease_.dateStart !== null && this.state.disease_.dateStart !== undefined && this.state.disease_.dateStart > 0 ? {
                                                    day: date1.getUTCDate(),
                                                    month: date1.getMonth() + 1,
                                                    year: date1.getFullYear()
                                                } : null,
                                                dateEnd: this.state.disease_.dateEnd !== null && this.state.disease_.dateEnd !== undefined && this.state.disease_.dateEnd > 0 ? {
                                                    day: date2.getUTCDate(),
                                                    month: date2.getMonth() + 1,
                                                    year: date2.getFullYear()
                                                } : null
                                            }
                                        });
                                        this.go('edit_disease');
                                    }}
                                >
                                    Изменить
                                </Button>
                                <Button
                                    style={{marginLeft: 6}}
                                    size='l'
                                    mode='secondary'
                                    before={<Icon28DeleteOutlineAndroid/>}
                                    stretched
                                    onClick={() => {
                                        this.get('user/deleteDisease', {diseaseId: this.state.disease_._id});
                                        this.state.user.diseases.splice(this.state.disease_.$id, 1);
                                        this.back();
                                    }}
                                >
                                    Удалить
                                </Button>
                            </Div>
                        </FixedLayout>
                    }
                </Panel>
                <Panel id='edit_disease'>
                    <PanelHeader separator={false} fixed={!IS_PLATFORM_IOS}
                                 left={<PanelHeaderClose onClick={() => this.back()}/>}>
                        Редактировать
                    </PanelHeader>
                    {
                        this.renderDiseaseForm('edit_disease')
                    }
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
                            <Button onClick={async () => {
                                if (window.navigator.onLine) {
                                    const isNewUser = (await bridge.send('VKWebAppStorageGet', {keys: ['landing']})).keys[0].value === '';
                                    this.go(isNewUser ? 'landing_1' : 'data');
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

export default MedicalCard;