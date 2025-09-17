import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import '../css/Fonts.css';

import { Panel, ScreenSpinner, View, File, Input, Title, Headline, Text, Button, IconButton } from '@vkontakte/vkui';
import {
    Icon24AddCircleOutline,
    Icon24Back,
} from "@vkontakte/icons";

import { get, getClearUserId, getUrlParams, getVKUsers, openUrl, post, sleep, uploadFile, vk_local_users } from "../js/utils";
import { defaultViewProps, initializeNavigation } from "../js/defaults/navigation";
import { getToken, subscribeBridgeEvents, vkApi } from "../js/defaults/bridge_utils";
import { allowGroupMessages } from '../js/defaults/catalin_tg_bot';

import('../css/AzamTraffic.css');

export default class extends React.Component {

    constructor(props) {
        super(props);

        this.state = {

        }

        initializeNavigation.bind(this)('main');

        this.componentDidMount = this.componentDidMount.bind(this);
    }

    async api(method, params = {}) {
        const isPost = params._method === 'POST';
        delete params._method;
        const url = `https://vds2153927.my-ihor.ru:8090/method/${method}`;

        return isPost ?
            (await post(url, getUrlParams(), params)).data :
            await get(url, { ...getUrlParams(), ...params });
    }

    async componentDidMount() {
        //subscribeBridgeEvents({}, 'bright_light');
        //this.changeStatusBarColor();

        await bridge.send('VKWebAppInit');

        if (window.location.hash && window.location.hash.length > 1) {
            const id = window.location.hash.substring(1);
            if (id === 'admin') {
                this.setPopout(<ScreenSpinner />);
                const pages = await this.api('getPages');
                if (!pages.error) {
                    this.setPopout(null);
                    this.setState({ pages: pages.response });
                    this.go('admin');
                }
            } else {
                this.setPopout(<ScreenSpinner />);
                const page = await this.api('getPage', { id });
                if (page.response) {
                    this.setState(page.response);
                }
                this.setPopout(null);
            }
        }
    }

    changeStatusBarColor() {
        if (bridge.supports('VKWebAppSetViewSettings')) {
            bridge.send('VKWebAppSetViewSettings', {
                status_bar_style: 'dark',
                action_bar_color: '#FFFFFF'
            });
        }
    }

    render() {
        const {
            image,
            image_id,
            title,
            text,
            group_id,
            button,
            url,
            back,

            id,
            pages,
            snackbar
        } = this.state;

        return (
            <View
                {...defaultViewProps.bind(this)()}
            >

                <Panel id='main'>
                    {
                        back && <IconButton onClick={this.back}>
                            <Icon24Back />
                        </IconButton>
                    }
                    {
                        (image || image_id) && <img alt='img' src={image || `https://vds2153927.my-ihor.ru:8090/img/${image_id}`} />
                    }
                    {
                        title && <Title level={3}>
                            {title}
                        </Title>
                    }
                    {
                        text && <Text>
                            {text}
                        </Text>
                    }
                    {
                        button && <Button size='l' onClick={async () => {
                            try {
                                await bridge.send('VKWebAppAllowMessagesFromGroup', { group_id: parseInt(group_id) });
                                openUrl(url);
                            } catch (e) {
                            }
                        }}>
                            {button}
                        </Button>
                    }
                </Panel>

                <Panel id='admin'>

                    <Button
                        size='l' mode='primary'
                        onClick={() => {
                            this.setState({ image: null, image_id: null, title: null, text: null, group_id: null, id: null, url: null, button: null });
                            this.go('edit');
                        }}
                    >
                        Новая страница
                    </Button>

                    <Title level={3}>
                        Список страниц
                    </Title>

                    {
                        pages && Array.isArray(pages) && pages.map((value, index) =>
                            <Button
                                size='l' mode='outline'
                                key={`page-${value.id}`}
                                onClick={async () => {
                                    this.setPopout(<ScreenSpinner />);
                                    const page = await this.api('getPage', { id: value.id });
                                    if (page.response) {
                                        this.setState(page.response);
                                        this.go('edit');
                                    }
                                    this.setPopout(null);
                                }}
                            >
                                {value.title}
                            </Button>
                        )
                    }

                </Panel>

                <Panel id='edit'>

                    <IconButton onClick={this.back}>
                        <Icon24Back />
                    </IconButton>

                    <File onChange={async (e) => {
                        const data = await uploadFile(e, 'webp');
                        console.log(data);
                        if (data) {
                            this.setState({ image: data.data });
                        }
                    }}>
                        {
                            (image || image_id) ? <img alt='img' src={image || `https://vds2153927.my-ihor.ru:8090/img/${image_id}`} />
                                :
                                <div className='UploadContent'>
                                    <Icon24AddCircleOutline fill='#FFFFFF' width={32} height={32} />
                                    <Text>Загрузить изображение</Text>
                                </div>
                        }
                    </File>

                    {id && <React.Fragment>
                        <Title level={3}>
                            Ссылка на страницу
                        </Title>
                        <Input
                            value={`https://vk.com/app54108848#${id}`}
                        />
                    </React.Fragment>}

                    <Title level={3}>
                        Заголовок
                    </Title>
                    <Input
                        defaultValue={title}
                        onChange={(e) => {
                            this.setState({ title: e.currentTarget.value });
                        }}
                    />

                    <Title level={3}>
                        Текст
                    </Title>
                    <Input
                        defaultValue={text}
                        onChange={(e) => {
                            this.setState({ text: e.currentTarget.value });
                        }}
                    />

                    <Title level={3}>
                        Текст кнопки
                    </Title>
                    <Input
                        defaultValue={button}
                        onChange={(e) => {
                            this.setState({ button: e.currentTarget.value });
                        }}
                    />

                    <Title level={3}>
                        Ссылка по кнопке
                    </Title>
                    <Input
                        defaultValue={url}
                        onChange={(e) => {
                            this.setState({ url: e.currentTarget.value });
                        }}
                    />

                    <Title level={3}>
                        Айди группы для разрешения лс
                    </Title>
                    <Input
                        defaultValue={group_id}
                        onChange={(e) => {
                            this.setState({ group_id: e.currentTarget.value });
                        }}
                    />

                    <Button
                        size='l' mode='outline'
                        onClick={() => {
                            this.setState({ back: true })
                            this.go('main');
                        }}
                    >
                        Предпросмотр
                    </Button>
                    <Button
                        size='l' mode='primary'
                        onClick={async () => {
                            try {
                                const data = await this.api(id ? 'updatePage' : 'createPage', { _method: 'POST', id, title, text, url, button, group_id, image });
                                console.log(data, data.error);
                                if (data.error) {
                                    return this.setSnackbar('Ошибка: ' + data.error);
                                }

                                if (data.response && typeof data.response === 'object') {
                                    await bridge.send('VKWebAppCopyText', { text: `https://vk.com/app54108848#${data.response.id}` });
                                    this.setState({ ...data.response, pages: [data.response, ...this.state.pages] });
                                    this.setSnackbar('Ссылка на страницу скопирована');
                                } else {
                                    this.setSnackbar('Страница сохранена');
                                }
                            } catch (e) {
                                console.error(e);
                                this.setSnackbar('Ошибка: ' + e.message);
                            }
                        }}
                        style={{ marginBottom: !id && 32 }}
                    >
                        Сохранить
                    </Button>
                    {
                        id &&
                        <Button
                            size='l' mode='primary' appearance='negative'
                            onClick={async () => {
                                try {
                                    const data = await this.api('removePage', { id });
                                    if (data.error) {
                                        return this.setSnackbar('Ошибка: ' + data.error);
                                    }

                                    if (data.response) {
                                        this.state.pages.splice(this.state.pages.findIndex(v => v.id == id), 1);
                                        this.setState({ pages: this.state.pages });
                                        this.go('admin');
                                        this.setSnackbar('Страница удалена');
                                    }
                                } catch (e) {
                                    console.error(e);
                                    this.setSnackbar('Ошибка: ' + e.message);
                                }
                            }}
                            style={{ marginBottom: 32 }}
                        >
                            Удалить
                        </Button>
                    }

                    {snackbar}
                </Panel>

            </View>
        )
    }

}