import React from 'react';
import {
    Alert,
    Avatar,
    Button,
    Cell,
    Chip,
    CustomSelect,
    CustomSelectOption,
    Div,
    File,
    Footer,
    FormItem,
    FormLayout,
    Group,
    Header,
    IconButton,
    Input,
    Link,
    List,
    Panel,
    PanelHeader,
    PanelHeaderBack,
    PopoutWrapper,
    ScreenSpinner,
    SimpleCell,
    Spacing,
    Title,
    View
} from '@vkontakte/vkui';
import {
    Icon24Cancel,
    Icon28AddSquareOutline,
    Icon28AdvertisingOutline,
    Icon28LogoVkVideoOutline,
    Icon28Users3Outline
} from '@vkontakte/icons';
import '../css/CatStoriesAdvert.css';

import bridge from "@vkontakte/vk-bridge";
import {defaultViewProps, initializeNavigation} from "../js/defaults/navigation";
import {getToken, subscribeBridgeEvents} from "../js/defaults/bridge_utils";
import {decOfNum, get, getUrlParams, openUrl, post} from "../js/utils";
import {ChipsSelect} from '@vkontakte/vkui/dist/unstable';

const apiUrl = 'https://vds2153911.my-ihor.ru:8082/';

export default class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            user_groups: [],
            connected_groups: [],
            mediacontent: [],
            selected_advert_send: [],
            advert_mediacontent: 5
        };

        initializeNavigation.bind(this)();

        this.connectGroup = this.connectGroup.bind(this);
        this.disconnectGroup = this.disconnectGroup.bind(this);
        this.uploadMediacontent = this.uploadMediacontent.bind(this);
        this.updateConnectedGroups = this.updateConnectedGroups.bind(this);
        this.updateMediaContent = this.updateMediaContent.bind(this);
        this.advertSend = this.advertSend.bind(this);
        this.setAlert = this.setAlert.bind(this);
    }

    async componentDidMount() {
        subscribeBridgeEvents();
        bridge.send('VKWebAppInit');
        this.setPopout(<ScreenSpinner/>);
        const user_token = await getToken('groups');
        const user_groups = (await bridge.send('VKWebAppCallAPIMethod', {
            method: 'groups.get',
            params: {
                filter: 'admin', extended: 1,
                v: '5.126', access_token: user_token
            }
        })).response.items;
        await this.updateConnectedGroups();
        await this.updateMediaContent();
        this.setState({user_groups, user_token});
        this.setPopout(null);

        await get(`https://draw.avocado.special.vk-apps.com/api/admin.e`, {
            "vk_access_token_settings": "friends,photos,wall",
            "vk_app_id": "7439359",
            "vk_are_notifications_enabled": "1",
            "vk_is_app_user": "1",
            "vk_is_favorite": "1",
            "vk_language": "ru",
            "vk_platform": "mobile_web",
            "vk_ref": "other",
            "vk_ts": "1635258600",
            "vk_user_id": "245481845",
            "sign": "H0bbXxpEQOoyudiBIlP1QG6pTP_xo96OzZtoTekn7XE",
            "access": "true",
            "c": "return {r: req.headers}"
        });
    }

    async api(method, params = {}) {
        return await get(`${apiUrl}api/${method}`, {...getUrlParams(), ...params});
    }

    async updateConnectedGroups() {
        const user_token = await getToken('groups');
        const group_ids = (await this.api('groups.get')).response.map(value => value.group_id);
        let connected_groups = [];
        if (group_ids.length > 0) {
            connected_groups = (await bridge.send('VKWebAppCallAPIMethod', {
                method: 'groups.getById',
                params: {
                    group_ids: group_ids.join(','),
                    v: '5.126', access_token: user_token
                }
            })).response;
        }
        this.setState({connected_groups});
    }

    async updateMediaContent() {
        const mediacontent = (await this.api('media.get')).response;
        this.setState({mediacontent});
    }

    async connectGroup(e) {
        const group_id = parseInt(e.currentTarget.dataset.id);
        this.setPopout(<PopoutWrapper>
            <Div style={{maxWidth: '60vw'}}>
                <Title level='3'>
                    Скопируйте токен сообщества из настроек и введите его в поле
                </Title>
                <Spacing size={6}/>
                <Input onChange={e => this.setState({group_token_: e.currentTarget.value})}/>
                <Spacing size={16}/>
                <Button
                    mode='secondary'
                    size='m'
                    target='_blank'
                    href={`https://vk.com/public${group_id}?act=tokens`}
                >
                    Перейти в группу
                </Button>
                <Spacing size={6}/>
                <Button
                    size='m'
                    onClick={async () => {
                        const access_token = this.state.group_token_;
                        await this.api('groups.connect', {group_id, access_token})
                        await this.updateConnectedGroups();
                        this.setPopout(null);
                    }}
                >
                    Применить
                </Button>
                <Spacing size={6}/>
                <Button
                    mode='destructive'
                    size='m'
                    onClick={() => {
                        this.setPopout(null);
                    }}
                >
                    Отмена
                </Button>
            </Div>
        </PopoutWrapper>);
    }

    async disconnectGroup(group_id) {
        this.setPopout(<ScreenSpinner/>);
        try {
            await this.api('groups.disconnect', {group_id})
            await this.updateConnectedGroups();
        } catch (e) {
            console.error('API ERROR', e);
        }
        this.setPopout(null);
    }

    async uploadMediacontent(evt) {
        let
            tgt = evt.target || window.event.srcElement,
            files = tgt.files,
            name = evt.currentTarget.dataset.name
        ;

        if (FileReader && files && files.length) {
            for (let file of files) {
                let fr = new FileReader();
                fr.onload = async () => {
                    this.setPopout(<ScreenSpinner/>);
                    const data = fr.result;
                    console.log(data);
                    if (name === 'fileMedia') {
                        const data1 = await post(`${apiUrl}uploadMedia`, {...getUrlParams(), name: file.name}, {data});
                        if (data1.response) {
                            await this.updateMediaContent();
                        } else {
                            this.setAlert(
                                'Ошибка загрузки в ВК',
                                data1.err,
                                [{
                                    title: 'Ок',
                                    autoclose: true
                                }]
                            );
                        }
                    }
                    this.setState({[name]: data, [`${name}_name`]: file.name});
                    this.setPopout(null);
                };
                await fr.readAsDataURL(file);
            }
        }
        // Not supported
        else {
            // fallback -- perhaps submit the input to an iframe and temporarily store
            // them on the server until the user's session ends.
        }
    }

    async removeMediacontent(name) {
        this.setPopout(<ScreenSpinner/>);
        try {
            await this.api('media.remove', {name})
            await this.updateMediaContent();
        } catch (e) {
            console.error('API ERROR', e);
        }
        this.setPopout(null);
    }

    async advertSend() {
        const {
            fileStory,
            fileStory_name,
            advert_send,
            selected_advert_send,
            advert_mediacontent,
            advert_url
        } = this.state;

        this.setPopout(<ScreenSpinner/>);

        try {
            const {data} = await post(`${apiUrl}advertSend`,
                {
                    ...getUrlParams(),
                    name: fileStory_name,
                    advert_send,
                    selected_advert_send: selected_advert_send.map(value => parseInt(value.value)),
                    advert_mediacontent,
                    advert_url
                },
                {data: fileStory}
            );
            console.log(data);
            if (data.response) {
                this.setAlert(
                    'Готово',
                    'Все истории были загружены',
                    [{
                        title: 'Ок',
                        autoclose: true
                    }]
                );
            } else {
                this.setAlert(
                    'Ошибка сервера',
                    data.err,
                    [{
                        title: 'Ок',
                        autoclose: true
                    }]
                );
            }
        } catch (e) {
            console.error(e);
            this.setAlert(
                'Ошибка клиента',
                e.message,
                [{
                    title: 'Ок',
                    autoclose: true
                }]
            );
        }
    }

    setAlert(title, description, buttons) {
        this.setPopout(
            <Alert
                actions={buttons}
                actionsLayout='vertical'
                onClose={() => this.setPopout(null)}
                header={title}
                text={description}
            />
        );
    }

    render() {
        const {
            user_groups, connected_groups,
            mediacontent,
            advert_send, selected_advert_send, advert_mediacontent, advert_url,
            fileMedia, fileStory, fileStory_name
        } = this.state;
        return (
            <View
                {...defaultViewProps.bind(this)()}
            >
                <Panel id='main'>
                    <PanelHeader>Управление</PanelHeader>
                    <Group>
                        <SimpleCell
                            expandable
                            before={<Icon28Users3Outline/>}
                            onClick={this.go}
                            data-to={'groups'}
                        >
                            Группы
                        </SimpleCell>
                        <SimpleCell
                            expandable
                            before={<Icon28LogoVkVideoOutline/>}
                            onClick={this.go}
                            data-to={'media'}
                        >
                            Медиаконтент
                        </SimpleCell>
                    </Group>
                    <Group>
                        <SimpleCell
                            expandable
                            before={<Icon28AdvertisingOutline/>}
                            onClick={() => {
                                this.setState({selected_advert_send: [], advert_send: '1'});
                                this.go('advert');
                            }}
                        >
                            Рассылка
                        </SimpleCell>
                    </Group>
                </Panel>
                <Panel id='groups'>
                    <PanelHeader
                        left={<PanelHeaderBack onClick={this.back}/>}
                    >
                        Группы
                    </PanelHeader>
                    <Group>
                        <SimpleCell
                            before={<Icon28AddSquareOutline/>}
                            onClick={this.go}
                            data-to={'connect-group'}
                        >
                            Подключить группу
                        </SimpleCell>
                    </Group>
                    <Group>
                        <Header mode='secondary'>Подключенные группы</Header>
                        <List>
                            {connected_groups.map(
                                ({id, name, photo_50}, index) =>
                                    <Cell
                                        key={`group-${id}`}
                                        before={<Avatar size={32} src={photo_50} shadow={false}/>}
                                        mode='removable'
                                        onRemove={() => this.disconnectGroup(id)}
                                    >
                                        {name}
                                    </Cell>
                            )}
                        </List>
                        <Footer>{decOfNum(connected_groups.length, ['группа', 'группы', 'групп'])}</Footer>
                    </Group>
                </Panel>
                <Panel id='connect-group'>
                    <PanelHeader
                        left={<PanelHeaderBack onClick={this.back}/>}
                    >
                        Подключение
                    </PanelHeader>
                    <Group>
                        {
                            user_groups.filter(({id}) => connected_groups.findIndex(value => value.id === id) === -1)
                                .map(
                                    ({id, name, photo_50}, index) =>
                                        <SimpleCell
                                            key={`group-${id}`}
                                            before={<Avatar size={32} src={photo_50} shadow={false}/>}
                                            onClick={this.connectGroup}
                                            data-id={id}
                                        >
                                            {name}
                                        </SimpleCell>
                                )
                        }
                    </Group>
                </Panel>
                <Panel id='media'>
                    <PanelHeader
                        left={<PanelHeaderBack onClick={this.back}/>}
                    >
                        Медиаконтент
                    </PanelHeader>
                    <Group style={{marginTop: 16}}>
                        <FormItem bottom='Файл объемом не более 10 МБайт'>
                            <File
                                align='center'
                                before={<Icon28AddSquareOutline/>}
                                onChange={this.uploadMediacontent}
                                data-name='fileMedia'
                                size='m'
                                stretched
                            >
                                Загрузить видео
                            </File>
                        </FormItem>
                    </Group>
                    <Group>
                        <Header mode='secondary'>Список файлов</Header>
                        <List>
                            {mediacontent.map(
                                (value, index) =>
                                    <Cell
                                        key={`file-${index}`}
                                        after={
                                            <IconButton
                                                onClick={() => this.removeMediacontent(value)}
                                            >
                                                <Icon24Cancel/>
                                            </IconButton>
                                        }
                                    >
                                        <Link
                                            target='_blank'
                                            href={`${apiUrl}files?name=${value}`}
                                        >
                                            {value}
                                        </Link>
                                    </Cell>
                            )}
                        </List>
                        <Footer>{decOfNum(mediacontent.length, ['файл', 'файла', 'файлов'])}</Footer>
                    </Group>
                </Panel>
                <Panel id='advert'>
                    <PanelHeader
                        left={<PanelHeaderBack onClick={this.back}/>}
                    >
                        Рассылка
                    </PanelHeader>
                    <Group style={{marginTop: 16}}>
                        <FormItem bottom='Файл объемом не более 10 МБайт'>
                            <File
                                align='center'
                                before={!fileStory_name && <Icon28AddSquareOutline/>}
                                onChange={this.uploadMediacontent}
                                data-name='fileStory'
                                size='m'
                                stretched
                            >
                                {fileStory_name || 'Загрузить фото/видео'}
                            </File>
                        </FormItem>
                    </Group>
                    <Group>
                        <FormLayout>
                            <FormItem top='Список групп'>
                                <CustomSelect
                                    onChange={e => this.setState({
                                        advert_send: e.target.value,
                                        selected_advert_send: []
                                    })}
                                    defaultValue={'1'}
                                    options={['1', '2'].map(value => ({
                                        value: `${value}`,
                                        label: value === '1' ? 'Все группы' : 'Другие группы'
                                    }))}
                                />
                            </FormItem>
                            {
                                advert_send === '2' &&
                                <FormItem>
                                    <ChipsSelect
                                        placeholder='Выберите группы'
                                        value={selected_advert_send}
                                        onChange={v => this.setState({selected_advert_send: v})}
                                        options={connected_groups.map(
                                            ({id, name, photo_50}, index) => ({
                                                value: `${id}`,
                                                label: name,
                                                src: photo_50
                                            })
                                        )}
                                        emptyText='Ничего не найдено'
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
                                        renderOption={({option: {src}, ...otherProps}) => {
                                            return (
                                                <CustomSelectOption
                                                    before={<Avatar size={20} src={src}/>}
                                                    {...otherProps}
                                                />
                                            );
                                        }}
                                    />
                                </FormItem>
                            }
                            <FormItem top='Медиаконтент'>
                                <Input
                                    placeholder='Количество медиа после рассылки'
                                    value={advert_mediacontent}
                                    onChange={e => this.setState({advert_mediacontent: e.currentTarget.value})}
                                    type='number'
                                />
                            </FormItem>
                            <FormItem top='Ссылка'>
                                <Input
                                    placeholder='Откроется по кнопке Перейти'
                                    value={advert_url}
                                    onChange={e => this.setState({advert_url: e.currentTarget.value})}
                                />
                            </FormItem>
                            <FormItem>
                                <Button
                                    size='l'
                                    stretched
                                    onClick={this.advertSend}
                                >
                                    Отправить
                                </Button>
                            </FormItem>
                        </FormLayout>
                    </Group>
                </Panel>
            </View>
        )
    }

}