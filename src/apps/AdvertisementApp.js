import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/AdvertisementApp.css';

import {
    Panel,
    View,
    withAdaptivity,
    SplitLayout,
    SplitCol,
    Epic,
    Group,
    Cell,
    Tabbar,
    TabbarItem,
    PanelHeader,
    PanelHeaderBack,
    ViewWidth,
    PanelHeaderClose,
    Button,
    FormLayout,
    FormItem,
    Input,
    FormLayoutGroup,
    Div,
    ModalRoot,
    ModalPage,
    ModalPageHeader,
    PanelHeaderSubmit,
    IconButton,
    CardGrid,
    Card,
    Title,
    Link,
    Subhead,
    Headline,
    Text,
    CustomSelectOption,
    Avatar,
    Select,
    Textarea,
    ScreenSpinner,
    Snackbar, SliderSwitch, Chip,
    SegmentedControl, Alert
} from '@vkontakte/vkui';
import {ChipsSelect} from '@vkontakte/vkui/dist/unstable';
import {
    Icon28ServicesCircleFillBlue,
    Icon28Profile,
    Icon28AddOutline,
    Icon16LinkOutline,
    Icon16InfoOutline,
    Icon28Users3Outline,
    Icon28StatisticCircleFillBlue,
    Icon28MessageCircleFillGreen,
    Icon28RepostCircleFillGreen,
    Icon28MoneyTransferCircleFillRed,
    Icon24DeleteOutline,
    Icon28StarsCircleFillViolet,
    Icon16Fullscreen,
    Icon28TextOutline,
    Icon28CopyOutline, Icon24RefreshOutline
} from "@vkontakte/icons";

import fetch from 'node-fetch';

import {registerFont, createCanvas, loadImage} from 'canvas';
import request from "request";

import {get, adAppApi, getUrlParams, openUrl, decOfNum, sleep, convertTimeToRuStandart} from "../js/utils";

const
    uploadUrl = 'https://murmuring-bastion-20764.herokuapp.com/https://api.imgbb.com/1/upload?key=b2bfb837d63c6adae4d191841abb04dc',

    MODAL_PAGE_EDIT_PROFILE = 'edit-profile',
    MODAL_PAGE_ADD_PROFILE = 'add-profile',
    MODAL_PAGE_VIEW_PROFILE = 'view-profile',
    MODAL_PAGE_EDIT_APP = 'edit-app',
    MODAL_PAGE_ADD_APP = 'add-app',
    MODAL_PAGE_EDIT_GROUP = 'edit-group',
    MODAL_PAGE_ADD_GROUP = 'add-group',
    MODAL_PAGE_INFO_REF = 'info-ref',
    MODAL_PAGE_ADD_WALL = 'add-wall',
    MODAL_PAGE_ADD_STICKER = 'add-sticker',
    MODAL_PAGE_EDIT_STICKER = 'edit-sticker',

    MODAL_PAGE_TEXT_UTILS = 'text-utils'
;

const
    _vk_ref = {
        'catalog_recent': 'категория недавних',
        'catalog_favourites': 'категория избранных',
        'catalog_recommendation': 'категория рекомендуемых',
        'catalog_top_dau': 'категория популярных',
        'catalog_entertainment': 'категория развлечений',
        'catalog_communication': 'категория общение',
        'catalog_tools': 'категория инструментов',
        'catalog_shopping': 'категория покупок',
        'catalog_events': 'категория мероприятий',
        'catalog_education': 'категория образование',
        'catalog_payments': 'категория оплаты услуг',
        'catalog_finance': 'категория финансов',
        'catalog_food': 'категория еды и напитков',
        'catalog_health': 'категория красоты и здоровья',
        'catalog_travel': 'категория путешествий',
        'catalog_taxi': 'категория такси',
        'catalog_jobs': 'категория работы в каталоге',
        'catalog_realty': 'категория недвижимости',
        'catalog_business': 'категория бизнеса',
        'catalog_lifestyle': 'категория образа жизни',
        'catalog_admin': 'категория созданных',
        'board_topic_all': 'превью обсуждения',
        'board_topic_view': 'внутренний экран',
        'feed': 'первый таб с лентой',
        'feed_post': 'по ссылке без сниппета внутри поста',
        'feed_comments': 'из комментариев',
        'featuring_discover': 'дискавери выдача',
        'featuring_menu': 'дискавери меню',
        'featuring_new': 'фичеринг во втором табе',
        'fave': 'общий список',
        'fave_links': 'список ссылок',
        'fave_posts': 'список постов',
        'group': 'со стены сообщества',
        'group_menu': 'из меню сообщества (Android)',
        'group_messages': 'из сообщений',
        'group_addresses': 'адрес сообщества',
        'snippet_post': 'переход из сниппета поста',
        'snippet_im': 'переход из сниппета в личных сообщениях',
        'clips': 'из экрана клипов (iOS)',
        'comments_list_clip': 'из комментариев к клипу (Android)',
        'im': 'превью чата',
        'im_chat': 'внутри чата',
        'notifications': 'внешний экран уведомлений',
        'notifications_grouped': 'экран сгрупированных уведомлений',
        'notifications_auto': 'одно или сгруппированное автоуведомление',
        'article_read': 'из статьи',
        'music_playlist': 'из музыкального плейлиста',
        'video_carousel': 'из видео (iOS)',
        'photo_browser': 'из поста после нативного просмотрщика (iOS)',
        'shopping_center': 'из ленты товаров (iOS)',
        'market_item': 'из экрана товара',
        'widget': 'переход из второй вкладки приложения',
        'home_screen': 'запуск с главного экрана устройства (Android)',
        'left_nav': 'переход из левого меню на вебе',
        'quick_search': 'результаты быстрого поиска',
        'menu': 'переход из недавних через пятый таб в мобильном вебе',
        'other': 'прочие переходы.'
    }
;

class AdvertisementApp extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            activeStory: 'apps',
            storyHistory: {
                apps: ['apps'],
                accounts: ['accounts'],
                groups: ['groups'],
                stats: ['stats'],
                advert_messages: ['advert_messages'],
                our_advert_messages: ['our_advert_messages'],
                advert_group: ['advert_group'],
                our_advert_group: ['our_advert_group'],
                site_content: ['site_content']
            },

            activeModalRoot: '',
            modalHistory: [],
            modalInfo: {},
            panelInfo: {},

            advert_messages_groups: [],
            advert_messages_params: [],
            advert_messages_params_values: [],

            advert_group_groups: [],
            advert_group_params: [],
            advert_group_params_values: [],

            group_keyboard_inline: false,
            group_keyboard_buttons: [],
            group_keyboard_buttons_params: [],

            selectedGroupIdForWall: [],

            data_apps: [],
            data_accounts: [],
            data_groups: [],
            data_stats: [],
            data_advert_messages: [],
            data_our_advert_messages: [],
            data_advert_group: [],
            data_our_advert_group: [],
            data_site_content: []
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.canGoBack = () => {
            const currentHistory = this.state.storyHistory[this.state.activeStory];
            return currentHistory.length > 1;
        };
        this.back = () => {
            if (this.state.popout !== null) {
                this.setState({popout: null});
                window.history.pushState({pop: 'popout'}, 'Title');
                return;
            }
            const
                {activeStory, storyHistory} = this.state,
                currentHistory = storyHistory[activeStory]
            ;

            if (currentHistory.length > 1) {
                currentHistory.pop();
                this.setState({storyHistory, snackbar: null});
            } else {
                bridge.send('VKWebAppClose', {status: 'success'});
            }
        };
        this.go = (panel) => {
            const
                {activeStory, storyHistory} = this.state,
                currentHistory = storyHistory[activeStory]
            ;

            currentHistory.push(panel);
            this.setState({storyHistory, snackbar: null});
            window.history.pushState({activePanel: panel}, 'Title');
        };
        this.onStoryChange = (story) => this.setState({activeStory: story});
        this.onInputChange = (e) => {
            const {name, value} = e.currentTarget;
            this.setState({[name]: value});
        };
        this.modalBack = () => {
            const {modalHistory} = this.state;
            modalHistory.pop();
            this.setState({modalHistory})
        };
        this.setActiveModal = (activeModal) => this.setState({
            modalHistory: [...this.state.modalHistory, activeModal]
        });
        this.setModalRoot = (activeModalRoot) => this.setState({activeModalRoot});
        this.setSnackbar = (text, url) => {
            let snackbar = <Snackbar
                onClose={() => this.setState({snackbar: null})}
            >
                {text}
            </Snackbar>;

            if (url) {
                snackbar = React.cloneElement(snackbar, {action: 'Открыть', onActionClick: () => openUrl(url)});
            }

            this.setState({
                snackbar: text === null ? text : snackbar,
                popout: null,
                modalHistory: [],
                activeModalRoot: null
            });
        }
    }

    async componentDidMount() {
        window.addEventListener('popstate', e => {
            e.preventDefault();
            this.back();
        });

        bridge.subscribe(async ({detail: {type, data}}) => {
            if (type !== undefined) console.log(type, data);
            if (type === 'VKWebAppUpdateConfig') {
                const schemeAttribute = document.createAttribute('scheme');
                schemeAttribute.value = data.scheme ? data.scheme === 'client_light' ? 'bright_light' : data.scheme : 'bright_light';
                document.body.attributes.setNamedItem(schemeAttribute);
            } else if (type === 'VKWebAppViewRestore') {
                this.setState({popout: null});
            }
        });

        bridge.send('VKWebAppInit');
        bridge.send('VKWebAppEnableSwipeBack');

        this.setState({popout: <ScreenSpinner/>});
        await this.setState({
            data_apps: (await this.api('apps.get')).response
        });

        try {
            const token = (await (bridge.send('VKWebAppGetAuthToken', {
                app_id: parseInt(getUrlParams().vk_app_id),
                scope: 'wall'
            }))).access_token;
            this.setState({token});
        } catch (e) {
            this.setSnackbar('Некоторые функции будут работать неправильно.');
        }
        this.setState({popout: null});
    }

    async uploadFile(evt) {
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

                            await request({
                                url: uploadUrl, method: 'POST', form: {
                                    image: canvas.toDataURL('image/png').replace('data:image/png;base64,', '')
                                }
                            }, (error, response, body) => {
                                try {
                                    if (response.statusCode === 200) {
                                        resolve(JSON.parse(body).data.url);
                                    } else {
                                        console.log('error', body);
                                        resolve(false);
                                    }
                                } catch (e) {
                                    console.error(e);
                                    resolve(false);
                                }
                            });
                        };
                    }
                };

                await fr.readAsDataURL(file);
            });
        }
    }

    async api(method, params = {}) {
        console.log(method, params);
        const response = await adAppApi(method, params);
        console.log(response);
        return response;
    }

    async vkApi(method, params = {}) {
        const access_token = this.state.token;
        return await bridge.send('VKWebAppCallAPIMethod', {
            method, params: {v: '5.131', ...params, access_token}
        });
    }

    panelKeyboardBuilder(title, onClickSave) {
        const
            {
                group_keyboard_inline,
                group_keyboard_buttons,
                group_keyboard_buttons_params
            } = this.state
        ;
        return <Panel id='group_keyboard'>
            <PanelHeader
                left={this.canGoBack() ? <PanelHeaderBack onClick={this.back}/> :
                    <PanelHeaderClose onClick={this.back}/>}
            >
                {title}
            </PanelHeader>
            <Button
                mode='primary' size='l'
                onClick={onClickSave}
            >
                Сохранить
            </Button>
            <Group style={{marginTop: 12}}>
                <FormLayout>
                    <FormLayoutGroup mode='horizontal'>
                        <FormItem top='inline'>
                            <SegmentedControl
                                size='m'
                                value={`${group_keyboard_inline}`}
                                onChange={(value) => this.setState({group_keyboard_inline: value === 'true'})}
                                options={[
                                    {
                                        label: 'true',
                                        value: 'true',
                                    },
                                    {
                                        label: 'false',
                                        value: 'false',
                                    }
                                ]}
                            />
                        </FormItem>
                    </FormLayoutGroup>
                    <FormItem top='Добавьте кнопку'>
                        <ChipsSelect
                            value={group_keyboard_buttons}
                            onChange={buttons => {
                                if (group_keyboard_buttons.length !== buttons.length) {
                                    const value = group_keyboard_buttons.filter(value => buttons.findIndex(value1 => value1.value === value.value) === -1);
                                    for (let i in value) {
                                        this[`input_kb_${i}_type`] = undefined;
                                        this[`input_kb_${i}_color`] = undefined;
                                    }
                                }
                                this.setState({
                                    group_keyboard_buttons: buttons,
                                    group_keyboard_buttons_params: buttons.map((value, index) =>
                                        ({
                                            ...(group_keyboard_buttons_params[index] || {}),
                                            label: value.value
                                        })
                                    )
                                });
                            }}
                            creatable={true}
                        />
                    </FormItem>
                    {group_keyboard_buttons.map((_v, index) => {
                        const value = group_keyboard_buttons_params[index];
                        return <FormLayoutGroup key={`LayoutGroup_${index}`} mode='horizontal'>
                            <FormItem top='label'>
                                <Input readOnly value={value.label}/>
                            </FormItem>
                            <FormItem top='type'>
                                <Select
                                    value={value.type}
                                    onChange={(value1) => {
                                        const
                                            index_to_change = group_keyboard_buttons_params.findIndex(value2 => value2.label === value.label)
                                        ;
                                        group_keyboard_buttons_params[index_to_change].type = value1.currentTarget.value;
                                        this.setState({group_keyboard_buttons_params});
                                    }}
                                    options={[
                                        {label: 'textButton', value: 'textButton'},
                                        {label: 'urlButton', value: 'urlButton'},
                                        {label: 'applicationButton', value: 'applicationButton'}
                                    ]}
                                />
                            </FormItem>
                            {
                                value.type === 'textButton' &&
                                <FormItem top='color'>
                                    <Select
                                        value={value.color}
                                        onChange={(value1) => {
                                            const
                                                index_to_change = group_keyboard_buttons_params.findIndex(value2 => value2.label === value.label)
                                            ;
                                            group_keyboard_buttons_params[index_to_change].color = value1.currentTarget.value;
                                            this.setState({group_keyboard_buttons_params});
                                        }}
                                        options={[
                                            {label: 'primary', value: 'primary'},
                                            {label: 'secondary', value: 'secondary'},
                                            {label: 'negative', value: 'negative'},
                                            {label: 'positive', value: 'positive'}
                                        ]}
                                    />
                                </FormItem>
                            }
                            <FormItem
                                top='url'
                                style={{
                                    display: value.type !== 'urlButton' && 'none'
                                }}
                            >
                                <Input
                                    value={value.url}
                                    onChange={async (value1) => {
                                        const
                                            index_to_change = group_keyboard_buttons_params.findIndex(value2 => value2.label === value.label)
                                        ;
                                        group_keyboard_buttons_params[index_to_change].url = value1.currentTarget.value;
                                        this.setState({group_keyboard_buttons_params});
                                    }}
                                />
                            </FormItem>
                            <FormItem
                                top='app_id'
                                style={{
                                    display: value.type !== 'applicationButton' && 'none'
                                }}
                            >
                                <Input
                                    type='number'
                                    value={value.app_id}
                                    onChange={(value1) => {
                                        const
                                            index_to_change = group_keyboard_buttons_params.findIndex(value2 => value2.label === value.label)
                                        ;
                                        group_keyboard_buttons_params[index_to_change].app_id = value1.currentTarget.value;
                                        this.setState({group_keyboard_buttons_params});
                                    }}
                                />
                            </FormItem>
                        </FormLayoutGroup>
                    })}
                </FormLayout>
            </Group>
        </Panel>
            ;
    }

    async onTabChange(id, method, preload, story) {
        this.onStoryChange(story);
        if (method) {
            this.setState({popout: <ScreenSpinner/>});
            const data = (await this.api(method, getUrlParams())).response;
            await this.setState({[`data_${id}`]: data});
            if (preload && typeof preload === 'function') await preload(data);
        }

        this.setState({popout: null});
    }

    async setTab(id) {
        const {method, preload} = this.tabs.find(value => value.id === id);
        await this.onTabChange(id, method, preload, id);
    }

    setAlert(title, description, buttons) {
        this.setState({
            popout: <Alert
                actions={buttons}
                actionsLayout='vertical'
                onClose={() => this.setState({popout: null})}
                header={title}
                text={description}
            />
        });
    }

    async confirmRemove(text) {
        return await new Promise(resolve =>
            this.setState({
                popout: <Alert
                    actions={[{
                        title: 'Удалить',
                        action: () => resolve(true),
                        mode: 'destructive',
                        autoclose: true
                    }, {
                        title: 'Отмена',
                        action: () => resolve(false),
                        autoclose: true,
                        mode: 'cancel'
                    }]}
                    actionsLayout='vertical'
                    onClose={() => this.setState({popout: null})}
                    header='Подтвердите действие'
                    text={text}
                />
            })
        )
    }

    get tabs() {
        const
            {
                modalHistory,
                modalInfo,
                panelInfo,

                advert_messages_groups,
                advert_messages_params,
                advert_messages_params_values,

                advert_group_groups,
                advert_group_params,
                advert_group_params_values,

                selectedGroupIdForWall,

                data_apps,
                data_accounts,
                data_groups,
                data_stats,
                data_advert_messages,
                data_our_advert_messages,
                data_advert_group,
                data_our_advert_group,
                data_site_content,
                uploadedFile
            } = this.state
        ;

        return [
            {
                caption: 'Приложения*',
                icon: <Icon28ServicesCircleFillBlue/>,
                id: 'apps',
                panels: [
                    <Panel id='apps'>
                        <PanelHeader left={this.canGoBack() ? <PanelHeaderBack onClick={this.back}/> :
                            <PanelHeaderClose onClick={this.back}/>}
                        >
                            Приложения
                        </PanelHeader>
                        <Button
                            size='l' before={<Icon28AddOutline/>}
                            onClick={() => {
                                this.setActiveModal(MODAL_PAGE_ADD_APP);
                            }}
                        >
                            Добавить
                        </Button>
                        {
                            data_apps.map((value, index) =>
                                <Group key={`Group_${index}`} style={{marginTop: 12}}>
                                    <FormLayout>
                                        <FormLayoutGroup mode='horizontal'>
                                            <FormItem top='Идентификатор'>
                                                <Input

                                                    readOnly value={value.app_id}
                                                    after={<IconButton
                                                        onClick={() => openUrl('https://vk.com/app' + value.app_id)}><Icon16LinkOutline/></IconButton>}
                                                />
                                            </FormItem>
                                            <FormItem top='Название'>
                                                <Input

                                                    readOnly value={value.app_name}
                                                />
                                            </FormItem>
                                        </FormLayoutGroup>
                                        <FormLayoutGroup mode='horizontal'>
                                            <FormItem top='Администратор'>
                                                <Input

                                                    readOnly value={value.admin_id}
                                                    after={<IconButton
                                                        onClick={async () => {
                                                            this.setState({popout: <ScreenSpinner/>});
                                                            const account = (await this.api('account.getById', {user_id: value.admin_id})).response;
                                                            this.setState({
                                                                modalInfo: account !== null ? account : {}
                                                            });
                                                            if (account === null) this.setSnackbar('Аккаунта нет в базе данных');
                                                            if (account !== null) {
                                                                this.setActiveModal(MODAL_PAGE_VIEW_PROFILE);
                                                            }
                                                        }}><Icon16InfoOutline/></IconButton>}
                                                />
                                            </FormItem>
                                            <FormItem
                                                top='APP_URL'
                                            >
                                                <Input
                                                    readOnly
                                                    value={value.app_url}/>
                                            </FormItem>
                                            <FormItem
                                                top='APP_SIGN'
                                            >
                                                <Input
                                                    readOnly
                                                    value={value.app_sign}/>
                                            </FormItem>
                                        </FormLayoutGroup>
                                        <FormLayoutGroup mode='horizontal'>
                                            <FormItem
                                                top='Группа на сообщения'
                                            >
                                                <Input
                                                    readOnly
                                                    value={value.group_messages}
                                                    after={<IconButton
                                                        onClick={() => openUrl('https://vk.com/public' + value.group_messages)}><Icon16LinkOutline/></IconButton>}
                                                />
                                            </FormItem>
                                            <FormItem
                                                top='Группа на подписку'
                                            >
                                                <Input
                                                    readOnly
                                                    value={value.group_subscribe}
                                                    after={<IconButton
                                                        onClick={() => openUrl('https://vk.com/public' + value.group_subscribe)}><Icon16LinkOutline/></IconButton>}
                                                />
                                            </FormItem>
                                        </FormLayoutGroup>
                                        <Div style={{display: 'flex'}}>
                                            <Button
                                                stretched mode='editable' size='m'
                                                onClick={async () => {
                                                    await this.setState({modalInfo: {...value, index}});
                                                    console.log(value);
                                                    this.setActiveModal(MODAL_PAGE_EDIT_APP);
                                                }}
                                            >
                                                Изменить
                                            </Button>
                                            <Button
                                                stretched mode='destructive' size='m'
                                                style={{
                                                    marginLeft: 12
                                                }}
                                                onClick={async () => {
                                                    const remove = await this.confirmRemove('Вы уверены, что хотите удалить приложение из базы данных?');
                                                    if (remove) {
                                                        this.setState({popout: <ScreenSpinner/>});
                                                        const response = await this.api('apps.remove', {app_id: value.app_id});
                                                        if (!response.response) {
                                                            this.setSnackbar(response.err);
                                                            return;
                                                        }
                                                        data_apps.splice(index, 1)
                                                        this.setState({popout: null, data_apps});
                                                    }
                                                }}
                                            >
                                                Удалить
                                            </Button>
                                        </Div>
                                    </FormLayout>
                                </Group>
                            )
                        }
                    </Panel>
                ],
                modal: <ModalRoot activeModal={modalHistory[modalHistory.length - 1]}>
                    <ModalPage
                        id={MODAL_PAGE_VIEW_PROFILE}
                        onClose={this.modalBack}
                        header={
                            <ModalPageHeader>Профиль</ModalPageHeader>
                        }
                    >
                        <Group>
                            <FormLayout>
                                <FormLayoutGroup mode='horizontal'>
                                    <FormItem top='Логин'>
                                        <Input
                                            readOnly
                                            value={modalInfo.login}/>
                                    </FormItem>
                                    <FormItem top='Пароль'>
                                        <Input
                                            readOnly
                                            value={modalInfo.password}/>
                                    </FormItem>
                                </FormLayoutGroup>
                                <Button
                                    stretched mode='primary' size='m'
                                    onClick={() => openUrl('https://vk.com/id' + modalInfo.id)}
                                >
                                    Перейти
                                </Button>
                            </FormLayout>
                        </Group>
                    </ModalPage>
                    <ModalPage
                        id={MODAL_PAGE_EDIT_APP}
                        onClose={this.modalBack}
                        header={
                            <ModalPageHeader
                                right={<PanelHeaderSubmit onClick={async () => {
                                    const
                                        data = {
                                            app_id: this.inputAppIdRef.value,
                                            app_name: this.inputAppNameRef.value,
                                            admin_id: this.inputAppAdminRef.value,
                                            app_url: this.inputAppUrlRef.value,
                                            app_sign: this.inputAppSignRef.value,
                                            group_messages: this.inputAppGroupMessagesRef.value,
                                            group_subscribe: this.inputAppGroupSubscribeRef.value
                                        }
                                    ;
                                    this.setState({popout: <ScreenSpinner/>});
                                    const response = await this.api('apps.edit', data);
                                    if (response.error) {
                                        this.setSnackbar(response.error.message);
                                        return;
                                    }
                                    this.modalBack();
                                    data_apps.splice(modalInfo.index, 1, response.response)
                                    this.setState({popout: null, data_apps});
                                }}/>}
                            >
                                Редактирование
                            </ModalPageHeader>
                        }
                    >
                        <Group>
                            <FormLayout>
                                <FormLayoutGroup mode='horizontal'>
                                    <FormItem top='Идентификатор'>
                                        <Input
                                            defaultValue={modalInfo.app_id}
                                            getRef={(ref) => this.inputAppIdRef = ref}
                                        />
                                    </FormItem>
                                    <FormItem top='Название'>
                                        <Input
                                            defaultValue={modalInfo.app_name}
                                            getRef={(ref) => this.inputAppNameRef = ref}
                                        />
                                    </FormItem>
                                </FormLayoutGroup>
                                <FormLayoutGroup mode='horizontal'>
                                    <FormItem top='Администратор'>
                                        <Input
                                            defaultValue={modalInfo.admin_id}
                                            getRef={(ref) => this.inputAppAdminRef = ref}
                                        />
                                    </FormItem>
                                    <FormItem
                                        top='APP_URL'
                                    >
                                        <Input
                                            defaultValue={modalInfo.app_url}
                                            getRef={(ref) => this.inputAppUrlRef = ref}/>
                                    </FormItem>
                                    <FormItem
                                        top='APP_SIGN'
                                    >
                                        <Input
                                            defaultValue={modalInfo.app_sign}
                                            getRef={(ref) => this.inputAppSignRef = ref}/>
                                    </FormItem>
                                </FormLayoutGroup>
                                <FormLayoutGroup mode='horizontal'>
                                    <FormItem
                                        top='Группа на сообщения'
                                    >
                                        <Input
                                            defaultValue={modalInfo.group_messages}
                                            getRef={(ref) => this.inputAppGroupMessagesRef = ref}
                                        />
                                    </FormItem>
                                    <FormItem
                                        top='Группа на подписку'
                                    >
                                        <Input
                                            defaultValue={modalInfo.group_subscribe}
                                            getRef={(ref) => this.inputAppGroupSubscribeRef = ref}
                                        />
                                    </FormItem>
                                </FormLayoutGroup>
                            </FormLayout>
                        </Group>
                    </ModalPage>
                    <ModalPage
                        id={MODAL_PAGE_ADD_APP}
                        onClose={this.modalBack}
                        header={
                            <ModalPageHeader
                                right={<PanelHeaderSubmit onClick={async () => {
                                    const
                                        data = {
                                            app_id: this.inputAppIdRef.value,
                                            admin_id: this.inputAppAdminRef.value,
                                            app_url: this.inputAppUrlRef.value,
                                            app_sign: this.inputAppSignRef.value,
                                            group_messages: this.inputAppGroupMessagesRef.value,
                                            group_subscribe: this.inputAppGroupSubscribeRef.value
                                        }
                                    ;
                                    this.setState({popout: <ScreenSpinner/>});
                                    const response = await this.api('apps.add', data);
                                    if (response.error) {
                                        this.setSnackbar(response.error.message);
                                        return;
                                    }
                                    this.modalBack();
                                    this.setState({
                                        popout: null,
                                        data_apps: [...this.state.data_apps, response.response]
                                    });
                                }}/>}
                            >
                                Добавление
                            </ModalPageHeader>
                        }
                    >
                        <Group>
                            <FormLayout>
                                <FormLayoutGroup mode='horizontal'>
                                    <FormItem top='Идентификатор'>
                                        <Input
                                            getRef={(ref) => this.inputAppIdRef = ref}
                                        />
                                    </FormItem>
                                    <FormItem top='Название'>
                                        <Input
                                            defaultValue={modalInfo.app_name}
                                            getRef={(ref) => this.inputAppNameRef = ref}
                                        />
                                    </FormItem>
                                </FormLayoutGroup>
                                <FormLayoutGroup mode='horizontal'>
                                    <FormItem top='Администратор'>
                                        <Input
                                            getRef={(ref) => this.inputAppAdminRef = ref}
                                        />
                                    </FormItem>
                                    <FormItem
                                        top='APP_URL'
                                    >
                                        <Input getRef={(ref) => this.inputAppUrlRef = ref}/>
                                    </FormItem>
                                    <FormItem
                                        top='APP_SIGN'
                                    >
                                        <Input getRef={(ref) => this.inputAppSignRef = ref}/>
                                    </FormItem>
                                </FormLayoutGroup>
                                <FormLayoutGroup mode='horizontal'>
                                    <FormItem
                                        top='Группа на сообщения'
                                    >
                                        <Input getRef={(ref) => this.inputAppGroupMessagesRef = ref}
                                        />
                                    </FormItem>
                                    <FormItem
                                        top='Группа на подписку'
                                    >
                                        <Input getRef={(ref) => this.inputAppGroupSubscribeRef = ref}
                                        />
                                    </FormItem>
                                </FormLayoutGroup>
                            </FormLayout>
                        </Group>
                    </ModalPage>
                </ModalRoot>,
                method: 'apps.get'
            },
            {
                caption: 'Аккаунты*',
                icon: <Icon28Profile/>,
                id: 'accounts',
                panels: [
                    <Panel id='accounts'>
                        <PanelHeader left={this.canGoBack() ? <PanelHeaderBack onClick={this.back}/> :
                            <PanelHeaderClose onClick={this.back}/>}
                        >
                            Аккаунты
                        </PanelHeader>
                        <Button
                            size='l' before={<Icon28AddOutline/>}
                            onClick={() => {
                                this.setActiveModal(MODAL_PAGE_ADD_PROFILE);
                            }}
                        >
                            Добавить
                        </Button>
                        {
                            data_accounts.map((value, index) =>
                                <Group key={`Group_${index}`} style={{marginTop: 12}}>
                                    <FormLayout>
                                        <FormLayoutGroup mode='horizontal'>
                                            <FormItem top='Идентификатор'>
                                                <Input
                                                    readOnly value={value.user_id}
                                                    after={<IconButton
                                                        onClick={() => {
                                                            openUrl('https://vk.com/id' + value.user_id)
                                                        }}><Icon16LinkOutline/></IconButton>}
                                                />
                                            </FormItem>
                                            <FormItem top='Логин'>
                                                <Input
                                                    readOnly value={value.login}/>
                                            </FormItem>
                                            <FormItem top='Пароль'>
                                                <Input
                                                    readOnly value={value.password}/>
                                            </FormItem>
                                        </FormLayoutGroup>
                                        <FormItem
                                            top='Токен'
                                        >
                                            <Input
                                                readOnly value={value.access_token}/>
                                        </FormItem>
                                        <Div style={{display: 'flex'}}>
                                            <Button
                                                stretched mode='editable' size='m'
                                                onClick={() => {
                                                    this.setState({modalInfo: {...value, index}});
                                                    this.setActiveModal(MODAL_PAGE_EDIT_PROFILE);
                                                }}
                                            >
                                                Изменить
                                            </Button>
                                            <Button
                                                stretched mode='destructive' size='m'
                                                style={{
                                                    marginLeft: 12
                                                }}
                                                onClick={async () => {
                                                    const remove = await this.confirmRemove('Вы уверены, что хотите удалить аккаунт из базы данных?');
                                                    if (remove) {
                                                        this.setState({popout: <ScreenSpinner/>});
                                                        const response = await this.api('account.remove', {user_id: value.user_id});
                                                        if (!response.response) {
                                                            this.setSnackbar(response.err);
                                                            return;
                                                        }
                                                        data_accounts.splice(index, 1)
                                                        this.setState({popout: null, data_accounts});
                                                    }
                                                }}
                                            >
                                                Удалить
                                            </Button>
                                        </Div>
                                    </FormLayout>
                                </Group>
                            )
                        }
                    </Panel>
                ],
                modal: <ModalRoot activeModal={modalHistory[modalHistory.length - 1]}>
                    <ModalPage
                        id={MODAL_PAGE_EDIT_PROFILE}
                        onClose={this.modalBack}
                        header={
                            <ModalPageHeader
                                right={<PanelHeaderSubmit onClick={async () => {
                                    const
                                        data = {
                                            login: this.inputLoginRef.value,
                                            password: this.inputPasswordRef.value,
                                            access_token: this.inputTokenRef.value
                                        }
                                    ;
                                    this.setState({popout: <ScreenSpinner/>});
                                    const response = await this.api('account.edit', data);
                                    if (!response.response) {
                                        this.setSnackbar(response.err);
                                        return;
                                    }
                                    this.modalBack();
                                    data_accounts.splice(modalInfo.index, 1, response.response)
                                    this.setState({popout: null, data_accounts});
                                }}/>}
                            >
                                Редактирование
                            </ModalPageHeader>
                        }
                    >
                        <Group>
                            <FormLayout>
                                <FormLayoutGroup mode='horizontal'>
                                    <FormItem top='Логин'>
                                        <Input getRef={(ref) => this.inputLoginRef = ref}
                                               defaultValue={modalInfo.login}/>
                                    </FormItem>
                                    <FormItem top='Пароль'>
                                        <Input getRef={(ref) => this.inputPasswordRef = ref}
                                               defaultValue={modalInfo.password}/>
                                    </FormItem>
                                </FormLayoutGroup>
                                <FormItem
                                    top='Токен'
                                >
                                    <Input getRef={(ref) => this.inputTokenRef = ref}
                                           defaultValue={modalInfo.access_token}/>
                                </FormItem>
                            </FormLayout>
                        </Group>
                    </ModalPage>
                    <ModalPage
                        id={MODAL_PAGE_ADD_PROFILE}
                        onClose={this.modalBack}
                        header={
                            <ModalPageHeader
                                right={<PanelHeaderSubmit onClick={async () => {
                                    const
                                        data = {
                                            login: this.inputLoginRef.value,
                                            password: this.inputPasswordRef.value,
                                            access_token: this.inputTokenRef.value
                                        }
                                    ;
                                    this.setState({popout: <ScreenSpinner/>});
                                    const response = await this.api('account.add', data);
                                    if (!response.response) {
                                        if (response.url)
                                            this.setSnackbar(response.err, response.url);
                                        else
                                            this.setSnackbar(response.err);
                                        return;
                                    }
                                    this.modalBack();
                                    this.setState({
                                        popout: null,
                                        data_accounts: [...this.state.data_accounts, response.response]
                                    });
                                }}/>}
                            >
                                Добавление
                            </ModalPageHeader>
                        }
                    >
                        <Group>
                            <FormLayout>
                                <FormLayoutGroup mode='horizontal'>
                                    <FormItem top='Логин'>
                                        <Input getRef={(ref) => this.inputLoginRef = ref}/>
                                    </FormItem>
                                    <FormItem top='Пароль'>
                                        <Input getRef={(ref) => this.inputPasswordRef = ref}/>
                                    </FormItem>
                                </FormLayoutGroup>
                                <FormItem top='Токен'>
                                    <Input getRef={(ref) => this.inputTokenRef = ref}/>
                                </FormItem>
                            </FormLayout>
                        </Group>
                    </ModalPage>
                </ModalRoot>,
                method: 'account.get'
            },
            {
                caption: 'Группы*',
                icon: <Icon28Users3Outline/>,
                id: 'groups',
                panels: [
                    <Panel id='groups'>
                        <PanelHeader left={this.canGoBack() ? <PanelHeaderBack onClick={this.back}/> :
                            <PanelHeaderClose onClick={this.back}/>}
                        >
                            Группы
                        </PanelHeader>
                        <Button
                            size='l' before={<Icon28AddOutline/>}
                            onClick={() => {
                                this.setActiveModal(MODAL_PAGE_ADD_GROUP);
                            }}
                        >
                            Создать
                        </Button>
                        {
                            data_groups.map((value, index) =>
                                <Group key={`Group_${index}`} style={{marginTop: 12}}>
                                    <FormLayout>
                                        <FormLayoutGroup mode='horizontal'>
                                            <Avatar size={62} src={value.photo_url} style={{marginRight: 24}}/>
                                            <FormItem top='Название'>
                                                <Input
                                                    readOnly value={value.group_name}/>
                                            </FormItem>
                                        </FormLayoutGroup>
                                        <FormLayoutGroup mode='horizontal'>
                                            <FormItem top='Идентификатор'>
                                                <Input

                                                    readOnly value={value.group_id}
                                                    after={<IconButton
                                                        onClick={() => openUrl('https://vk.com/public' + value.group_id)}><Icon16LinkOutline/></IconButton>}
                                                />
                                            </FormItem>
                                            <FormItem top='Администратор'>
                                                <Input

                                                    readOnly value={value.admin_id}
                                                    after={<IconButton
                                                        onClick={async () => {
                                                            const account = value.Account;
                                                            if (account === null) this.setSnackbar('Аккаунта нет в базе данных');
                                                            if (account !== null) {
                                                                this.setState({modalInfo: account});
                                                                this.setActiveModal(MODAL_PAGE_VIEW_PROFILE);
                                                            }
                                                        }}><Icon16InfoOutline/></IconButton>}
                                                />
                                            </FormItem>
                                            <FormItem
                                                top='PHOTO_URL'
                                            >
                                                <Input
                                                    readOnly
                                                    value={value.photo_url}/>
                                            </FormItem>
                                            <FormItem top='Токен'>
                                                <Input
                                                    readOnly
                                                    value={value.access_token}/>
                                            </FormItem>
                                        </FormLayoutGroup>
                                        <FormItem top='Приветственное сообщение'>
                                            <Textarea
                                                readOnly
                                                value={value.message_text_on_subscribe}/>
                                        </FormItem>
                                        <FormLayoutGroup mode='horizontal'>
                                            <FormItem top='Вложения к сообщению'>
                                                <Input
                                                    readOnly
                                                    value={value.message_attachment_on_subscribe}/>
                                            </FormItem>
                                            <Button
                                                stretched mode='secondary' size='m'
                                                style={{marginLeft: 12, height: 36, alignSelf: 'end'}}
                                                onClick={() => {
                                                    const
                                                        {message_keyboard_on_subscribe} = value,
                                                        parsed_data = message_keyboard_on_subscribe && JSON.parse(message_keyboard_on_subscribe)
                                                    ;
                                                    this.setState({
                                                        group_keyboard_inline: parsed_data ? parsed_data.inline : false,
                                                        group_keyboard_buttons: parsed_data ? parsed_data.buttons.map(value => ({
                                                            label: value.label,
                                                            value: value.label
                                                        })) : [],
                                                        group_keyboard_buttons_params: parsed_data ? parsed_data.buttons : [],
                                                        panelInfo: value
                                                    });
                                                    this.go('group_keyboard');
                                                }}
                                            >
                                                Клавиатура бота
                                            </Button>
                                        </FormLayoutGroup>
                                        <Div style={{display: 'flex'}}>
                                            <Button
                                                stretched mode='editable' size='m'
                                                onClick={() => {
                                                    this.setState({modalInfo: {...value, index}});
                                                    this.setActiveModal(MODAL_PAGE_EDIT_GROUP);
                                                }}
                                            >
                                                Изменить
                                            </Button>
                                            <Button
                                                stretched mode='destructive' size='m'
                                                style={{
                                                    marginLeft: 12
                                                }}
                                                onClick={async () => {
                                                    const remove = await this.confirmRemove('Вы уверены, что хотите удалить группу из базы данных?');
                                                    if (remove) {
                                                        this.setState({popout: <ScreenSpinner/>});
                                                        const response = await this.api('groups.remove', {group_id: value.group_id});
                                                        if (!response.response) {
                                                            this.setSnackbar(response.err);
                                                            return;
                                                        }
                                                        data_groups.splice(index, 1)
                                                        this.setState({popout: null, data_groups});
                                                    }
                                                }}
                                            >
                                                Удалить
                                            </Button>
                                        </Div>
                                    </FormLayout>
                                </Group>
                            )
                        }
                    </Panel>,
                    this.panelKeyboardBuilder('Клавиатура бота', async () => {
                        const
                            data = {
                                group_id: panelInfo.group_id,
                                message_keyboard_on_subscribe: JSON.stringify(
                                    {
                                        inline: this.state.group_keyboard_inline,
                                        buttons: this.state.group_keyboard_buttons_params
                                    }
                                )
                            }
                        ;
                        this.setState({popout: <ScreenSpinner/>});
                        const response = await this.api('groups.edit', data);
                        if (response.error) {
                            this.setSnackbar(response.error.message);
                            return;
                        }
                        data_groups.splice(panelInfo.index, 1, response.response)
                        this.setState({
                            popout: null,
                            data_groups,
                            group_keyboard_inline: false,
                            group_keyboard_buttons: [],
                            group_keyboard_buttons_params: []
                        });
                        this.back();
                    })
                ],
                modal: <ModalRoot activeModal={modalHistory[modalHistory.length - 1]}>
                    <ModalPage
                        id={MODAL_PAGE_VIEW_PROFILE}
                        onClose={this.modalBack}
                        header={
                            <ModalPageHeader>Профиль</ModalPageHeader>
                        }
                    >
                        <Group>
                            <FormLayout>
                                <FormLayoutGroup mode='horizontal'>
                                    <FormItem top='Логин'>
                                        <Input
                                            readOnly
                                            value={modalInfo.login}/>
                                    </FormItem>
                                    <FormItem top='Пароль'>
                                        <Input
                                            readOnly
                                            value={modalInfo.password}/>
                                    </FormItem>
                                </FormLayoutGroup>
                                <Button
                                    stretched mode='primary' size='m'
                                    onClick={() => openUrl('https://vk.com/id' + modalInfo.id)}
                                >
                                    Перейти
                                </Button>
                            </FormLayout>
                        </Group>
                    </ModalPage>
                    <ModalPage
                        id={MODAL_PAGE_EDIT_GROUP}
                        onClose={this.modalBack}
                        header={
                            <ModalPageHeader
                                right={<PanelHeaderSubmit onClick={async () => {
                                    const
                                        data = {
                                            group_id: modalInfo.group_id,
                                            group_name: this.inputGroupNameRef.value,
                                            photo_url: this.inputGroupPhotoUrlRef.value,
                                            access_token: this.inputGroupTokenRef.value,
                                            message_text_on_subscribe: this.inputGroupMessageTextRef.value,
                                            message_attachment_on_subscribe: this.inputGroupMessageAttachmentRef.value
                                        }
                                    ;
                                    this.setState({popout: <ScreenSpinner/>});
                                    const response = await this.api('groups.edit', data);
                                    if (response.error) {
                                        this.setSnackbar(response.error.message);
                                        return;
                                    }
                                    this.modalBack();
                                    data_groups.splice(modalInfo.index, 1, response.response)
                                    this.setState({popout: null, data_groups});
                                }}/>}
                            >
                                Редактирование
                            </ModalPageHeader>
                        }
                    >
                        <Group>
                            <FormLayout>
                                <FormLayoutGroup mode='horizontal'>
                                    <FormItem top='Название'>
                                        <Input getRef={(ref) => this.inputGroupNameRef = ref}
                                               defaultValue={modalInfo.group_name}/>
                                    </FormItem>
                                    <FormItem top='PHOTO_URL'>
                                        <Input getRef={(ref) => this.inputGroupPhotoUrlRef = ref}
                                               defaultValue={modalInfo.photo_url}/>
                                    </FormItem>
                                    <FormItem top='Токен'>
                                        <Input getRef={(ref) => this.inputGroupTokenRef = ref}
                                               defaultValue={modalInfo.access_token}/>
                                    </FormItem>
                                </FormLayoutGroup>
                                <FormItem top='Приветственное сообщение'>
                                    <Textarea getRef={(ref) => this.inputGroupMessageTextRef = ref}
                                              defaultValue={modalInfo.message_text_on_subscribe}/>
                                </FormItem>
                                <FormLayoutGroup mode='horizontal'>
                                    <FormItem top='Вложения к сообщению'>
                                        <Input getRef={(ref) => this.inputGroupMessageAttachmentRef = ref}
                                               defaultValue={modalInfo.message_attachment_on_subscribe}/>
                                    </FormItem>
                                </FormLayoutGroup>
                            </FormLayout>
                        </Group>
                    </ModalPage>
                    <ModalPage
                        id={MODAL_PAGE_ADD_GROUP}
                        onClose={this.modalBack}
                        header={
                            <ModalPageHeader
                                right={<PanelHeaderSubmit onClick={async () => {
                                    const
                                        data = {
                                            group_name: this.inputGroupNameRef.value,
                                            admin_id: this.inputGroupAdminIdRef.value,
                                            photo_url: this.inputGroupPhotoUrlRef.value
                                        }
                                    ;
                                    this.setState({popout: <ScreenSpinner/>});
                                    const response = await this.api('groups.create', data);
                                    if (response.e) {
                                        this.setSnackbar(response.e);
                                        return;
                                    }
                                    this.modalBack();
                                    this.setState({
                                        popout: null,
                                        data_groups: [...this.state.data_groups, response.response]
                                    });
                                }
                                }/>}
                            >
                                Создание
                            </ModalPageHeader>
                        }
                    >
                        <Group>
                            <FormLayout>
                                <FormItem top='Название'>
                                    <Input getRef={(ref) => this.inputGroupNameRef = ref}/>
                                </FormItem>
                                <FormLayoutGroup mode='horizontal'>
                                    <FormItem top='Администратор'>
                                        <Input
                                            getRef={(ref) => this.inputGroupAdminIdRef = ref}
                                        />
                                    </FormItem>
                                    <FormItem
                                        top='PHOTO_URL'
                                    >
                                        <Input getRef={(ref) => this.inputGroupPhotoUrlRef = ref}/>
                                    </FormItem>
                                </FormLayoutGroup>
                            </FormLayout>
                        </Group>
                    </ModalPage>
                </ModalRoot>,
                method: 'groups.get'
            },
            {
                caption: 'Статистика*',
                icon: <Icon28StatisticCircleFillBlue/>,
                id: 'stats',
                panels: [
                    <Panel id='stats'>
                        <PanelHeader left={this.canGoBack() ? <PanelHeaderBack onClick={this.back}/> :
                            <PanelHeaderClose onClick={this.back}/>}
                        >
                            Статистика
                        </PanelHeader>
                        {
                            data_stats.map((value, index) =>
                                <Group key={`Group_${index}`} style={{marginTop: 12}}>
                                    <Title style={{margin: 12}} level='2' weight='regular'>
                                        {value.app_name} — <Link href={'https://vk.com/app' + value.app_id}
                                                                 target='_blank'>app{value.app_id}</Link>
                                    </Title>
                                    <CardGrid style={{marginTop: 12}}>
                                        <Card size='l' mode='shadow'>
                                            <div className='CardStats__Container'>
                                                <Headline weight='regular'>
                                                    Пользователи
                                                </Headline>
                                                <Title style={{marginTop: 4}} weight='bold' level={1}>
                                                    {value.users}
                                                </Title>
                                                <Subhead style={{marginTop: 4}} weight='semibold'>
                                                    +{value.users_today}
                                                </Subhead>
                                            </div>
                                        </Card>
                                        {
                                            [
                                                ['Историй', 'story_shares'],
                                                ['Разрешили сообщения', 'allowed_message', 'group_messages', 'allowed_message_today'],
                                                ['Подписались на группу', 'subscribed_group', 'group_subscribe', 'subscribed_group_today']
                                            ].map((value1, index) =>
                                                <Card key={`Card_${index}`} size='l' mode='shadow'>
                                                    <div className='CardStats__Container'>
                                                        {
                                                            value1.length > 2 ?
                                                                <Link
                                                                    target='_blank'
                                                                    href={'https://vk.com/public' + [value[value1[2]]]}
                                                                >
                                                                    <Headline weight='regular'>
                                                                        {value1[0]}
                                                                    </Headline>
                                                                </Link>
                                                                :
                                                                <Headline weight='regular'>
                                                                    {value1[0]}
                                                                </Headline>
                                                        }
                                                        <Title style={{marginTop: 4}} weight='bold' level={1}>
                                                            {value[value1[1]]}
                                                        </Title>
                                                        {value1[3] &&
                                                            <Subhead style={{marginTop: 4}} weight='semibold'>
                                                                +{value[value1[3]]}
                                                            </Subhead>
                                                        }
                                                    </div>
                                                </Card>
                                            )
                                        }
                                        <Card size='l' mode='shadow'>
                                            <div className='CardStats__Container'>
                                                <div style={{display: 'flex', alignItems: 'center'}}>
                                                    <Link onClick={() => {
                                                        this.setState({modalInfo: value.refs});
                                                        this.setActiveModal(MODAL_PAGE_INFO_REF);
                                                    }}>
                                                        <Headline weight='regular'>
                                                            Источник
                                                        </Headline>
                                                    </Link>
                                                </div>
                                                <Title style={{marginTop: 4}} weight='bold' level={1}>
                                                    {Object.keys(value.refs).sort((a, b) => value.refs[a] - value.refs[b]).reverse()[0]}
                                                </Title>
                                                <Subhead style={{marginTop: 4}} weight='semibold'>
                                                    {value.refs[Object.keys(value.refs).sort((a, b) => value.refs[a] - value.refs[b]).reverse()[0]]}
                                                </Subhead>
                                            </div>
                                        </Card>
                                    </CardGrid>
                                </Group>
                            )
                        }
                    </Panel>
                ],
                modal: <ModalRoot activeModal={modalHistory[modalHistory.length - 1]}>
                    <ModalPage
                        id={MODAL_PAGE_INFO_REF}
                        onClose={this.modalBack}
                        header={
                            <ModalPageHeader>Переходы в приложение</ModalPageHeader>
                        }
                    >
                        <Group>
                            <SliderSwitch
                                activeValue={modalInfo.translate_ref ? 1 : 0}
                                onSwitch={value => {
                                    this.setState({modalInfo: {...modalInfo, translate_ref: value}});
                                }}
                                options={[
                                    {
                                        name: 'Исходный',
                                        value: 0,
                                    },
                                    {
                                        name: 'Перевод',
                                        value: 1,
                                    },
                                ]}
                            />
                            {
                                [
                                    Object.keys(modalInfo).sort((a, b) => modalInfo[a] - modalInfo[b]).reverse().map((value, index) =>
                                        <Div key={`div_${index}`} style={{display: 'flex'}}>
                                            <Text weight='regular'>
                                                {modalInfo.translate_ref === 1 ? (_vk_ref[value] || value) : value}
                                            </Text>
                                            <span style={{padding: '0 4px'}}> — </span>
                                            <Text weight='semibold'>{modalInfo[value]}</Text>
                                        </Div>
                                    )
                                ]
                            }
                        </Group>
                    </ModalPage>
                </ModalRoot>,
                method: 'stats.get'
            },
            {
                caption: 'Рассылка',
                icon: <Icon28MessageCircleFillGreen/>,
                id: 'advert_messages',
                panels: [
                    <Panel id='advert_messages'>
                        <PanelHeader left={this.canGoBack() ? <PanelHeaderBack onClick={this.back}/> :
                            <PanelHeaderClose onClick={this.back}/>}
                        >
                            Рассылка
                        </PanelHeader>
                        <FormLayout>
                            <FormItem top='Выберите группы'>
                                <ChipsSelect
                                    value={advert_messages_groups}
                                    onChange={advert_messages_groups => this.setState({advert_messages_groups})}
                                    options={data_advert_messages.map(({group_id, group_name, photo_url}) => ({
                                        value: `${group_id}`, label: group_name, src: photo_url
                                    }))}
                                    placeholder='Не выбраны'
                                    emptyText='Ничего не найдено :('
                                    showSelected={false}
                                    closeAfterSelect={false}
                                    renderChip={({value, label, option: {src}, ...rest}) => (
                                        <Chip
                                            value={value}
                                            before={<Avatar size={20} src={src}/>}
                                            {...rest}
                                        >
                                            {label}
                                        </Chip>
                                    )}
                                    renderOption={({option: {src, value, icon}, ...otherProps}) => {
                                        return (
                                            <CustomSelectOption
                                                before={<Avatar size={20} src={src}/>}
                                                {...otherProps}
                                            />
                                        );
                                    }}
                                />
                            </FormItem>
                            <FormItem top='Добавьте параметр'>
                                <ChipsSelect
                                    value={advert_messages_params}
                                    onChange={async advert_messages_params => {
                                        if (this.state.advert_messages_params.length !== advert_messages_params.length) {
                                            const
                                                n_value = this.state.advert_messages_params
                                                    .map(((value, index) => ({value, index})))
                                                    .filter(value => advert_messages_params.findIndex(value1 => value1.value === value.value.value) === -1)
                                            ;
                                            let deleted = 0;
                                            for (let e of n_value) {
                                                advert_messages_params_values.splice(e.index - deleted, 1);
                                                deleted++;
                                            }
                                        }

                                        await this.setState({
                                            advert_messages_params,
                                            advert_messages_params_values
                                        });
                                    }}
                                    options={['message', 'attachment', 'keyboard', 'dont_parse_links'].map(value => {
                                        return {value, label: value}
                                    })}
                                    creatable={true}
                                />
                            </FormItem>
                            {advert_messages_params.map((value, index) => (
                                <FormLayoutGroup key={`LayoutGroup_${index}`} mode='horizontal'>
                                    <FormItem>
                                        <Input readOnly value={value.value}/>
                                    </FormItem>
                                    <FormItem>
                                        {value.value === 'message' ?
                                            <Textarea
                                                value={advert_messages_params_values[index]}
                                                onChange={value => {
                                                    advert_messages_params_values[index] = value.currentTarget.value;
                                                    this.setState({advert_messages_params_values});
                                                }}
                                            />
                                            :
                                            <Input
                                                value={advert_messages_params_values[index]}
                                                onChange={value => {
                                                    advert_messages_params_values[index] = value.currentTarget.value;
                                                    this.setState({advert_messages_params_values});
                                                }}
                                                after={value.value === 'keyboard' &&
                                                    <IconButton
                                                        onClick={() => {
                                                            let parsed_data;
                                                            try {
                                                                parsed_data = JSON.parse(advert_messages_params_values[index]);
                                                            } catch (e) {
                                                            }
                                                            this.setState({
                                                                group_keyboard_inline: parsed_data ? parsed_data.inline : false,
                                                                group_keyboard_buttons: parsed_data ? parsed_data.buttons.map(value => ({
                                                                    label: value.label,
                                                                    value: value.label
                                                                })) : [],
                                                                group_keyboard_buttons_params: parsed_data ? parsed_data.buttons : [],
                                                                _panelInfo: index
                                                            });

                                                            this.go('group_keyboard');
                                                        }}
                                                    >
                                                        <Icon16Fullscreen/>
                                                    </IconButton>
                                                }
                                            />}
                                    </FormItem>
                                </FormLayoutGroup>
                            ))}
                            <Div style={{display: 'flex'}}>
                                <Button
                                    size='l'
                                    onClick={async () => {
                                        /*this.setState({popout: <ScreenSpinner/>});
                                        const
                                            group_ids = advert_group_groups.map(value => parseInt(value.value)),
                                            params = {}
                                        ;
                                        advert_group_params.forEach((value, index) => {
                                            params[value.value] = advert_group_params_values[index];
                                        })

                                        const response = await this.api('wall.create', {group_ids, params});
                                        this.setSnackbar(`Запись успешно опубликована в ${decOfNum(response.response.successfully.length, ['группе', 'группах', 'группах'])}`);
                                        if (response.response.with_error.length > 0) {
                                            setTimeout(async () => {
                                                this.setSnackbar(null);
                                                await sleep(400);
                                                this.setSnackbar(`Запись опубликована с ошибкой в ${decOfNum(response.response.with_error.length, ['группе', 'группах', 'группах'])}`);
                                            }, 3000);
                                        }
                                        */
                                    }}
                                >
                                    Отправить
                                </Button>
                                <Button
                                    size='l'
                                    mode='secondary'
                                    style={{marginLeft: 12}}
                                    onClick={() => this.setTab('our_advert_messages')}
                                >
                                    Посмотреть список
                                </Button>
                            </Div>
                        </FormLayout>
                    </Panel>,
                    this.panelKeyboardBuilder('Конструктор клавиатуры', async () => {
                        advert_messages_params_values[this.state._panelInfo] = JSON.stringify({
                            inline: this.state.group_keyboard_inline,
                            buttons: this.state.group_keyboard_buttons_params
                        });
                        await this.setState({
                            advert_messages_params_values,
                            group_keyboard_inline: false,
                            group_keyboard_buttons: [],
                            group_keyboard_buttons_params: []
                        });
                        this.back();
                    })
                ],
                method: 'groups.get'
            },
            {
                caption: 'Рассылки',
                id: 'our_advert_messages',
                panels: [
                    <Panel id='our_advert_messages'>
                        <PanelHeader left={this.canGoBack() ? <PanelHeaderBack onClick={this.back}/> :
                            <PanelHeaderClose onClick={this.back}/>}
                        >
                            Рассылки
                        </PanelHeader>
                        <FormItem top='Фильтр по группе'>
                            <ChipsSelect
                                value={selectedGroupIdForWall}
                                onChange={selectedGroupIdForWall => this.setState({selectedGroupIdForWall})}
                                options={data_our_advert_messages.map(value => ({
                                    value: `${value.Group.group_id}`,
                                    label: value.Group.group_name,
                                    src: value.Group.photo_url
                                }))}
                                placeholder='Не выбраны'
                                emptyText='Ничего не найдено :('
                                showSelected={false}
                                closeAfterSelect={false}
                                renderChip={({value, label, option: {src}, ...rest}) => (
                                    <Chip
                                        value={value}
                                        before={<Avatar size={20} src={src}/>}
                                        {...rest}
                                    >
                                        {label}
                                    </Chip>
                                )}
                                renderOption={({option: {src, value, icon}, ...otherProps}) => {
                                    return (
                                        <CustomSelectOption
                                            before={<Avatar size={20} src={src}/>}
                                            {...otherProps}
                                        />
                                    );
                                }}
                            />
                        </FormItem>
                        {
                            data_our_advert_messages.filter(value => selectedGroupIdForWall.length === 0 || selectedGroupIdForWall.findIndex(value1 => value1.value === `${-value.owner_id}`) > -1).map((value, index) =>
                                <Group key={`Wall_${index}`} style={{marginTop: 12}}>
                                    <div style={{display: 'flex', alignItems: 'center'}}>
                                        <Title style={{margin: 12}} level='2' weight='regular'>
                                            <Link
                                                href={`https://vk.com/club${value.group_id}`}
                                                target='_blank'
                                            >
                                                {value.Group.group_name}
                                            </Link> ({convertTimeToRuStandart(new Date(value.createdAt))})
                                        </Title>
                                        <IconButton
                                            style={{color: 'var(--destructive)'}}
                                            onClick={async () => {
                                                const remove = await this.confirmRemove('Вы уверены, что хотите удалить рассылку из истории базы данных?');
                                            }}
                                        >
                                            <Icon24DeleteOutline/>
                                        </IconButton>
                                    </div>
                                    <CardGrid style={{marginTop: 12}}>
                                        {
                                            [
                                                ['Текст сообщения', 'message'],
                                                ['Отправлено', 'likes'],
                                                ['Всего на рассылке', 'comments'],
                                                ['Беседы', 'reposts'],
                                                ['Стоимость', 'price']
                                            ].map((value1, index) =>
                                                <Card key={`Card_${index}`} size='l' mode='shadow'>
                                                    <div className='CardStats__Container'>
                                                        {
                                                            value1[1] === 'message' ?
                                                                <Link onClick={() => {
                                                                    this.setState({modalInfo: value.message});
                                                                    //this.setActiveModal(MODAL_PAGE_INFO_MESSAGE);
                                                                }}>
                                                                    <Headline weight='regular'>
                                                                        {value1[0]}
                                                                    </Headline>
                                                                </Link> :
                                                                <React.Fragment>
                                                                    <Headline weight='regular'>
                                                                        {value1[0]}
                                                                    </Headline>
                                                                    <Title
                                                                        style={{marginTop: 4}} weight='bold'
                                                                        level={1}
                                                                    >
                                                                        {value[value1[1]]}
                                                                    </Title>
                                                                </React.Fragment>
                                                        }
                                                    </div>
                                                </Card>
                                            )
                                        }
                                    </CardGrid>
                                </Group>
                            )
                        }
                    </Panel>
                ],
                visibility: false,
                method: 'wall.get'
            },
            {
                caption: 'Реклама в группе*',
                icon: <Icon28RepostCircleFillGreen/>,
                id: 'advert_group',
                panels: [
                    <Panel id='advert_group'>
                        <PanelHeader left={this.canGoBack() ? <PanelHeaderBack onClick={this.back}/> :
                            <PanelHeaderClose onClick={this.back}/>}
                        >
                            Рекламный пост
                        </PanelHeader>
                        <FormLayout>
                            <FormItem top='Выберите группы'>
                                <ChipsSelect
                                    value={advert_group_groups}
                                    onChange={advert_group_groups => this.setState({advert_group_groups})}
                                    options={data_advert_group.map(({group_id, group_name, photo_url}) => ({
                                        value: `${group_id}`, label: group_name, src: photo_url
                                    }))}
                                    placeholder='Не выбраны'
                                    emptyText='Ничего не найдено :('
                                    showSelected={false}
                                    closeAfterSelect={false}
                                    renderChip={({value, label, option: {src}, ...rest}) => (
                                        <Chip
                                            value={value}
                                            before={<Avatar size={20} src={src}/>}
                                            {...rest}
                                        >
                                            {label}
                                        </Chip>
                                    )}
                                    renderOption={({option: {src, value, icon}, ...otherProps}) => {
                                        return (
                                            <CustomSelectOption
                                                before={<Avatar size={20} src={src}/>}
                                                {...otherProps}
                                            />
                                        );
                                    }}
                                />
                            </FormItem>
                            <FormItem top='Добавьте параметр'>
                                <ChipsSelect
                                    value={advert_group_params}
                                    onChange={async advert_group_params => {
                                        if (this.state.advert_group_params.length !== advert_group_params.length) {
                                            const
                                                n_value = this.state.advert_group_params
                                                    .map(((value, index) => ({value, index})))
                                                    .filter(value => advert_group_params.findIndex(value1 => value1.value === value.value.value) === -1)
                                            ;
                                            let deleted = 0;
                                            for (let e of n_value) {
                                                advert_group_params_values.splice(e.index - deleted, 1);
                                                deleted++;
                                            }
                                        }

                                        await this.setState({
                                            advert_group_params,
                                            advert_group_params_values
                                        });
                                    }}
                                    options={['message', 'attachments', 'mark_as_ads', 'close_comments', 'copyright'].map(value => {
                                        return {value, label: value}
                                    })}
                                    creatable={true}
                                />
                            </FormItem>
                            {advert_group_params.map((value, index) => (
                                <FormLayoutGroup key={`LayoutGroup_${index}`} mode='horizontal'>
                                    <FormItem>
                                        <Input readOnly value={value.value}/>
                                    </FormItem>
                                    <FormItem>
                                        {value.value === 'message' ?
                                            <Textarea
                                                value={advert_group_params_values[index]}
                                                onChange={value => {
                                                    advert_group_params_values[index] = value.currentTarget.value;
                                                    this.setState({advert_group_params_values});
                                                }}
                                            />
                                            :
                                            <Input
                                                value={advert_group_params_values[index]}
                                                onChange={value => {
                                                    advert_group_params_values[index] = value.currentTarget.value;
                                                    this.setState({advert_group_params_values});
                                                }}
                                            />}
                                    </FormItem>
                                </FormLayoutGroup>
                            ))}
                            <Div style={{display: 'flex'}}>
                                <Button
                                    size='l'
                                    onClick={async () => {
                                        this.setState({popout: <ScreenSpinner/>});
                                        const
                                            group_ids = advert_group_groups.map(value => parseInt(value.value)),
                                            params = {}
                                        ;
                                        advert_group_params.forEach((value, index) => {
                                            params[value.value] = advert_group_params_values[index];
                                        })

                                        const response = await this.api('wall.create', {group_ids, params});
                                        this.setSnackbar(`Запись успешно опубликована в ${decOfNum(response.response.successfully.length, ['группе', 'группах', 'группах'])}`);
                                        if (response.response.with_error.length > 0) {
                                            setTimeout(async () => {
                                                this.setSnackbar(null);
                                                await sleep(400);
                                                this.setSnackbar(`Запись опубликована с ошибкой в ${decOfNum(response.response.with_error.length, ['группе', 'группах', 'группах'])}`);
                                            }, 3000);
                                        }
                                    }}
                                >
                                    Отправить
                                </Button>
                                <Button
                                    size='l'
                                    mode='secondary'
                                    style={{marginLeft: 12}}
                                    onClick={() => this.setTab('our_advert_group')}
                                >
                                    Посмотреть список
                                </Button>
                            </Div>
                        </FormLayout>
                    </Panel>
                ],
                method: 'groups.get'
            },
            {
                caption: 'Рекламные записи*',
                id: 'our_advert_group',
                panels: [
                    <Panel id='our_advert_group'>
                        <PanelHeader left={this.canGoBack() ? <PanelHeaderBack onClick={this.back}/> :
                            <PanelHeaderClose onClick={this.back}/>}
                        >
                            Рекламные записи
                        </PanelHeader>
                        <FormItem top='Фильтр по группе'>
                            <ChipsSelect
                                value={selectedGroupIdForWall}
                                onChange={selectedGroupIdForWall => this.setState({selectedGroupIdForWall})}
                                options={data_our_advert_group.map(value => ({
                                    value: `${value.Group.group_id}`,
                                    label: value.Group.group_name,
                                    src: value.Group.photo_url
                                }))}
                                placeholder='Не выбраны'
                                emptyText='Ничего не найдено :('
                                showSelected={false}
                                closeAfterSelect={false}
                                renderChip={({value, label, option: {src}, ...rest}) => (
                                    <Chip
                                        value={value}
                                        before={<Avatar size={20} src={src}/>}
                                        {...rest}
                                    >
                                        {label}
                                    </Chip>
                                )}
                                renderOption={({option: {src, value, icon}, ...otherProps}) => {
                                    return (
                                        <CustomSelectOption
                                            before={<Avatar size={20} src={src}/>}
                                            {...otherProps}
                                        />
                                    );
                                }}
                            />
                        </FormItem>
                        {
                            data_our_advert_group.filter(value => selectedGroupIdForWall.length === 0 || selectedGroupIdForWall.findIndex(value1 => value1.value === `${-value.owner_id}`) > -1).map((value, index) =>
                                <Group key={`Wall_${index}`} style={{marginTop: 12}}>
                                    <div style={{display: 'flex', alignItems: 'center'}}>
                                        <Title style={{margin: 12}} level='2' weight='regular'>
                                            <Link
                                                href={`https://vk.com/wall${value.owner_id}_${value.id}`}
                                                target='_blank'
                                            >
                                                {`wall${value.owner_id}_${value.id}`}
                                            </Link> ({convertTimeToRuStandart(new Date(value.createdAt))})
                                        </Title>
                                        <IconButton
                                            onClick={async () => {
                                                this.setState({popout: <ScreenSpinner/>});
                                                try {
                                                    const
                                                        data = (await this.vkApi('wall.getById', {posts: `${value.owner_id}_${value.id}`}))
                                                    ;
                                                    if (data.response) {
                                                        const
                                                            views = data.views ? data.views.count : 0,
                                                            likes = data.likes ? data.likes.count : 0,
                                                            comments = data.comments ? data.comments.count : 0,
                                                            reposts = data.reposts ? data.reposts.count : 0
                                                        ;
                                                        data_our_advert_group.splice(index, 1, {
                                                            ...value,
                                                            views, likes, comments, reposts
                                                        });
                                                        this.setState({data_our_advert_group, popout: null});
                                                    } else {
                                                        console.log(data);
                                                        this.setSnackbar('Произошла ошибка.');
                                                    }
                                                } catch (e) {
                                                    console.error(e);
                                                    this.setSnackbar(e.message);
                                                }
                                            }}
                                        >
                                            <Icon24RefreshOutline/>
                                        </IconButton>
                                        <IconButton
                                            style={{color: 'var(--destructive)'}}
                                            onClick={() => {
                                                this.setAlert(
                                                    'Подтвердите действие',
                                                    'Можно удалить пост из группы и из базы данных, а можно только из базы данных.',
                                                    [{
                                                        title: 'Полностью',
                                                        action: async () => {
                                                            this.setState({popout: <ScreenSpinner/>});
                                                            const data = await this.api('wall.remove', {
                                                                key: value.key,
                                                                delete_wall: true
                                                            });
                                                            if (data.response) {
                                                                data_our_advert_group.splice(index, 1);
                                                                this.setState({data_our_advert_group});
                                                                this.setSnackbar('Запись удалена полностью.');
                                                            } else {
                                                                this.setSnackbar(data.error.message);
                                                            }
                                                        },
                                                        autoclose: true
                                                    }, {
                                                        title: 'Частично',
                                                        action: async () => {
                                                            this.setState({popout: <ScreenSpinner/>});
                                                            const data = await this.api('wall.remove', {
                                                                key: value.key,
                                                                delete_wall: false
                                                            });
                                                            if (data.response) {
                                                                data_our_advert_group.splice(index, 1);
                                                                this.setState({data_our_advert_group});
                                                                this.setSnackbar('Запись удалена частично.');
                                                            } else {
                                                                this.setSnackbar(data.error.message);
                                                            }
                                                        },
                                                        autoclose: true
                                                    }, {
                                                        title: 'Отмена',
                                                        autoclose: true,
                                                        mode: 'cancel'
                                                    }]
                                                );
                                            }}
                                        >
                                            <Icon24DeleteOutline/>
                                        </IconButton>
                                    </div>
                                    <CardGrid style={{marginTop: 12}}>
                                        {
                                            [
                                                ['Просмотры', 'views'],
                                                ['Лайки', 'likes'],
                                                ['Комментарии', 'comments'],
                                                ['Репосты', 'reposts'],
                                                ['Стоимость', 'price']
                                            ].map((value1, index) =>
                                                <Card key={`Card_${index}`} size='l' mode='shadow'>
                                                    <div className='CardStats__Container'>
                                                        <Headline weight='regular'>
                                                            {value1[0]}
                                                        </Headline>
                                                        <Title style={{marginTop: 4}} weight='bold' level={1}>
                                                            {value[value1[1]]}
                                                        </Title>
                                                    </div>
                                                </Card>
                                            )
                                        }
                                    </CardGrid>
                                </Group>
                            )
                        }
                    </Panel>
                ],
                visibility: false,
                method: 'wall.get'
            },
            {
                caption: 'Контент сайта*',
                icon: <Icon28StarsCircleFillViolet/>,
                id: 'site_content',
                panels: [
                    <Panel id='site_content'>
                        <PanelHeader left={this.canGoBack() ? <PanelHeaderBack onClick={this.back}/> :
                            <PanelHeaderClose onClick={this.back}/>}
                        >
                            Контент сайта
                        </PanelHeader>
                        <Button
                            size='l' before={<Icon28AddOutline/>}
                            onClick={() => {
                                this.setState({uploadedFile: false});
                                this.setActiveModal(MODAL_PAGE_ADD_STICKER);
                            }}
                        >
                            Добавить
                        </Button>
                        {
                            data_site_content.map((value, index) =>
                                <Group key={`Group_${index}`} style={{marginTop: 12}}>
                                    <FormLayout>
                                        <FormLayoutGroup mode='horizontal'>
                                            <Avatar size={62} src={value.image}/>
                                            <FormItem style={{marginLeft: 12}} top='Название'>
                                                <Input

                                                    readOnly value={value.title}
                                                    after={<IconButton
                                                        onClick={() => openUrl('https://stickers.ad-app.ru/#article' + value.id)}><Icon16LinkOutline/></IconButton>}/>
                                            </FormItem>
                                            <FormItem top='Просмотры'>
                                                <Input
                                                    readOnly value={value.views}/>
                                            </FormItem>
                                            <FormItem top='Лайки'>
                                                <Input
                                                    readOnly value={value.likes}/>
                                            </FormItem>
                                        </FormLayoutGroup>
                                        <FormItem top='Описание'>
                                            <Textarea
                                                readOnly value={value.description}/>
                                        </FormItem>
                                        <Div style={{display: 'flex'}}>
                                            <Button
                                                stretched mode='editable' size='m'
                                                onClick={() => {
                                                    this.setState({modalInfo: value, uploadedFile: false});
                                                    this.setActiveModal(MODAL_PAGE_EDIT_STICKER);
                                                }}
                                            >
                                                Изменить
                                            </Button>
                                            <Button
                                                stretched mode='destructive' size='m'
                                                style={{
                                                    marginLeft: 12
                                                }}
                                                onClick={async () => {
                                                    const response = (await this.api('stickers.remove', {
                                                        id: value.id,
                                                        ...getUrlParams()
                                                    })).response;
                                                    if (response) {
                                                        data_site_content.splice(index, 1);
                                                        this.setState({data_site_content});
                                                    } else {
                                                        console.log(response.err);
                                                    }
                                                }}
                                            >
                                                Удалить
                                            </Button>
                                        </Div>
                                    </FormLayout>
                                </Group>
                            )
                        }
                    </Panel>
                ],
                modal: <ModalRoot activeModal={modalHistory[modalHistory.length - 1]}>
                    <ModalPage
                        id={MODAL_PAGE_ADD_STICKER}
                        onClose={this.modalBack}
                        header={
                            <ModalPageHeader
                                right={<PanelHeaderSubmit onClick={async () => {
                                    const sticker = await this.api('stickers.add', {
                                        ...getUrlParams(), image: uploadedFile,
                                        title: this.inputStickerTitleRef.value,
                                        description: this.inputStickerDescriptionRef.value.replaceAll('\n', '<br/>'),
                                        url: this.inputStickerUrlRef.value,
                                        id_: this.inputStickerIdRef.value
                                    });
                                    this.setState({data_site_content: [...this.state.data_site_content, sticker.response]});
                                    this.modalBack();
                                }}/>}
                            >
                                Добавление
                            </ModalPageHeader>
                        }
                    >
                        <Group>
                            <FormLayout>
                                <FormLayoutGroup mode='horizontal'>
                                    <input
                                        accept='.png'
                                        type='file'
                                        multiple={false}
                                        ref={ref => this.uploadStickerImageRef = ref}
                                        style={{display: 'none'}}
                                        onChange={async event => this.setState({uploadedFile: await this.uploadFile(event)})}
                                    />
                                    <Avatar size={62} src={uploadedFile}
                                            onClick={() => this.uploadStickerImageRef.click()}/>
                                    <FormItem style={{marginLeft: 12}} top='Название'>
                                        <Input getRef={(ref) => this.inputStickerTitleRef = ref}/>
                                    </FormItem>
                                </FormLayoutGroup>
                                <FormItem top='Описание'>
                                    <Textarea getRef={(ref) => this.inputStickerDescriptionRef = ref}/>
                                </FormItem>
                                <FormLayoutGroup mode='horizontal'>
                                    <FormItem top='Ссылка на переход'>
                                        <Input getRef={(ref) => this.inputStickerUrlRef = ref}/>
                                    </FormItem>
                                    <FormItem top='ID'>
                                        <Input getRef={(ref) => this.inputStickerIdRef = ref}/>
                                    </FormItem>
                                </FormLayoutGroup>
                            </FormLayout>
                        </Group>
                    </ModalPage>
                    <ModalPage
                        id={MODAL_PAGE_EDIT_STICKER}
                        onClose={this.modalBack}
                        header={
                            <ModalPageHeader
                                right={<PanelHeaderSubmit onClick={async () => {
                                    const
                                        to_check = [
                                            this.inputStickerTitleRef,
                                            this.inputStickerDescriptionRef,
                                            this.inputStickerUrlRef,
                                            this.inputStickerIdRef
                                        ],
                                        edited_keys = {}
                                    ;

                                    for (const element of to_check) {
                                        const {key} = element.dataset;
                                        if (element.value !== modalInfo[key]) {
                                            edited_keys[key] = element.value === '' ? undefined : element.value;
                                        }
                                    }

                                    if (uploadedFile) {
                                        edited_keys.image = uploadedFile;
                                    }

                                    if (Object.keys(edited_keys).length > 0) {
                                        const response = (await this.api('stickers.edit', {
                                            ...getUrlParams(), ...edited_keys,
                                            id: modalInfo.id
                                        })).response;
                                        if (response) {
                                            const {data_site_content} = this.state;
                                            data_site_content[data_site_content.findIndex(value => value.id === response.id)] = response;
                                            await this.setState({data_site_content});
                                        }
                                    }
                                    this.modalBack();
                                }}/>}
                            >
                                Редактирование
                            </ModalPageHeader>
                        }
                    >
                        <Group>
                            <FormLayout>
                                <FormLayoutGroup mode='horizontal'>
                                    <input
                                        accept='.png'
                                        type='file'
                                        multiple={false}
                                        ref={ref => this.uploadStickerImageRef = ref}
                                        style={{display: 'none'}}
                                        onChange={async event => this.setState({uploadedFile: await this.uploadFile(event)})}
                                    />
                                    <Avatar size={62} src={uploadedFile || modalInfo.image}
                                            onClick={() => this.uploadStickerImageRef.click()}/>
                                    <FormItem style={{marginLeft: 12}} top='Название'>
                                        <Input
                                            data-key='title'
                                            getRef={(ref) => this.inputStickerTitleRef = ref}
                                            defaultValue={modalInfo.title}
                                        />
                                    </FormItem>
                                </FormLayoutGroup>
                                <FormItem top='Описание'>
                                    <Textarea data-key='description'
                                              getRef={(ref) => this.inputStickerDescriptionRef = ref}
                                              defaultValue={modalInfo.description}
                                    />
                                </FormItem>
                                <FormLayoutGroup mode='horizontal'>
                                    <FormItem top='Ссылка на переход'>
                                        <Input data-key='url' getRef={(ref) => this.inputStickerUrlRef = ref}
                                               defaultValue={modalInfo.url}/>
                                    </FormItem>
                                    <FormItem top='ID'>
                                        <Input data-key='id_' getRef={(ref) => this.inputStickerIdRef = ref}
                                               defaultValue={modalInfo.id_}/>
                                    </FormItem>
                                </FormLayoutGroup>
                            </FormLayout>
                        </Group>
                    </ModalPage>
                </ModalRoot>,
                method: 'stickers.get'
            }
        ];
    }

    render() {
        const
            {
                activeStory,
                storyHistory,
                activeModalRoot,

                popout
            } = this.state,
            tabs = this.tabs
        ;

        const modalRoot = <ModalRoot activeModal={activeModalRoot}>
            <ModalPage
                id={MODAL_PAGE_TEXT_UTILS}
                onClose={() => this.setModalRoot(null)}
                header={
                    <ModalPageHeader>Text Utility</ModalPageHeader>
                }
            >
                <Group>
                    <FormLayout>
                        <FormItem top='Input'>
                            <Input
                                getRef={ref => this.modalRootInput = ref}
                                after={<IconButton
                                    onClick={async () => {
                                        try {
                                            await bridge.send('VKWebAppCopyText', {text: this.modalRootInput.value});
                                            this.setSnackbar('Текст скопирован в буфер обмена');
                                        } catch (e) {
                                            console.error(e);
                                            this.setSnackbar('Произошла ошибка при копировании');
                                        }
                                    }}
                                ><Icon28CopyOutline width={16} height={16}/></IconButton>}
                            />
                        </FormItem>
                        <FormItem top='Textarea'>
                            <Textarea
                                getRef={ref => this.modalRootTextarea = ref}
                            />
                            <Button
                                size='l' stretched
                                style={{marginTop: 12}}
                                before={<Icon28CopyOutline width={16} height={16}/>}
                                onClick={async () => {
                                    try {
                                        await bridge.send('VKWebAppCopyText', {text: this.modalRootTextarea.value});
                                        this.setSnackbar('Текст скопирован в буфер обмена');
                                    } catch (e) {
                                        console.error(e);
                                        this.setSnackbar('Произошла ошибка при копировании');
                                    }
                                }}
                            >
                                Скопировать
                            </Button>
                        </FormItem>
                    </FormLayout>
                </Group>
            </ModalPage>
        </ModalRoot>;

        const Application = withAdaptivity(({viewWidth}) => {
            const
                isDesktop = viewWidth >= ViewWidth.SMALL_TABLET,
                styleForSelectedCell = {
                    backgroundColor: 'var(--button_secondary_background)',
                    borderRadius: 8
                }
            ;

            return (
                <SplitLayout
                    style={{justifyContent: 'center'}}
                    modal={modalRoot}
                >
                    {isDesktop && (
                        <SplitCol fixed width='280px' maxWidth='280px'>
                            <Panel>
                                <Group>
                                    {
                                        tabs.map(((value, index) =>
                                                <Cell
                                                    key={`Cell_${index}`}
                                                    disabled={activeStory === value.id}
                                                    style={{
                                                        marginTop: index > 0 && 4, ...activeStory === value.id ? styleForSelectedCell : {},
                                                        display: value.visibility === false && 'none'
                                                    }}
                                                    data-story={value.id}
                                                    onClick={(e) => this.onTabChange(value.id, value.method, value.preload, e.currentTarget.dataset.story)}
                                                    before={value.icon}
                                                >
                                                    {value.caption}
                                                </Cell>
                                        ))
                                    }
                                </Group>
                                <Group>
                                    <Cell
                                        onClick={() => this.setModalRoot(MODAL_PAGE_TEXT_UTILS)}
                                        before={<Icon28TextOutline/>}
                                    >
                                        Text Utility
                                    </Cell>
                                </Group>
                            </Panel>
                        </SplitCol>
                    )}
                    <SplitCol
                        animate={!isDesktop}
                        spaced={isDesktop}
                        width={isDesktop ? '700px' : '100%'}
                        maxWidth={isDesktop ? '700px' : '100%'}
                    >
                        <Epic activeStory={activeStory} tabbar={!isDesktop &&
                            <Tabbar>
                                {
                                    tabs.map(((value, index) =>
                                            <TabbarItem
                                                key={`Cell_${index}`}
                                                onClick={this.onStoryChange}
                                                selected={activeStory === value.id}
                                                data-story={value.id}
                                                text={value.caption}
                                            >{value.icon}</TabbarItem>
                                    ))
                                }
                            </Tabbar>
                        }>
                            {
                                tabs.map(((value, index) =>
                                        <View
                                            key={`View_${index}`} id={value.id}
                                            activePanel={storyHistory[value.id][storyHistory[value.id].length - 1]}
                                            modal={value.modal}
                                            popout={popout}
                                        >
                                            {value.panels.map((value, index) => React.cloneElement(value, {key: `panel_${index}`}))}
                                        </View>
                                ))
                            }
                        </Epic>
                        {this.state.snackbar}
                    </SplitCol>
                </SplitLayout>
            );
        }, {
            viewWidth: true
        });

        return (
            <Application/>
        );
    }
}

export default AdvertisementApp;