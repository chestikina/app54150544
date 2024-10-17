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
    Spacing,
    Text,
    Subhead,
    Headline,
    Title,
    View,
    Separator, Textarea
} from '@vkontakte/vkui';
import {
    Icon12CancelOutline,
    Icon24Cancel, Icon24CommentOutline, Icon24LikeOutline, Icon24ShareOutline, Icon24ViewOutline,
    Icon28AddSquareOutline,
    Icon28AdvertisingOutline,
    Icon28LogoVkVideoOutline,
    Icon28Users3Outline
} from '@vkontakte/icons';

import bridge from "@vkontakte/vk-bridge";
import {defaultViewProps, initializeNavigation} from "../js/defaults/navigation";
import {getToken, subscribeBridgeEvents} from "../js/defaults/bridge_utils";
import {decOfNum, get, getUrlParams, openUrl, post, shortIntegers, sleep} from "../js/utils";

export default class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            wall_posts_count: 0,
            wall_posts_keys: [],
            wall_posts: {},

            wall_posts_2: [],

            multiplier: 20
        };

        initializeNavigation.bind(this)();
        this.api = this.api.bind(this);
        this.setAlert = this.setAlert.bind(this);
        this.analyze = this.analyze.bind(this);
    }

    async componentDidMount() {
        subscribeBridgeEvents();
        bridge.send('VKWebAppInit');
        this.setPopout(<ScreenSpinner/>);
        const user_token = await getToken('', true);
        this.setState({user_token});
        this.setPopout(null);
    }

    async api(method, params = {}) {
        try {
            const {user_token} = this.state;
            const data = await bridge.send('VKWebAppCallAPIMethod', {
                method,
                params: {
                    ...params,
                    v: '5.126', access_token: user_token
                }
            });
            if (data.response) {
                return data.response;
            } else {
                this.setAlert(
                    `Ошибка 0`,
                    JSON.stringify(data),
                    [{
                        title: 'Ок',
                        autoclose: true
                    }]
                );
                return false;
            }
        } catch (e) {
            console.error(e);
            const msg = e.error_data ? e.error_data.error_reason.error_msg : e.message;
            if (msg.includes('per second')) {
                await sleep(1000);
                return await this.api(method, params);
            } else {
                this.setAlert(
                    `Ошибка 1`, msg,
                    [{
                        title: 'Ок',
                        autoclose: true
                    }]
                );
                return false;
            }
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

    async analyze() {
        this.setPopout(<ScreenSpinner/>);
        const {wall_posts, wall_posts_2, multiplier} = this.state;
        const data = wall_posts_2.map(value => value.trim()) || Object.keys(wall_posts).map(value => wall_posts[value]);
        const clear = {}
        for (let e of data) {
            e = e.substring(e.indexOf('wall-') + 'wall'.length);
            if (e.indexOf('?') > -1) e = e.substring(0, e.indexOf('?'));
            e = e.split('_')
            clear[e[0]] = [...(clear[e[0]] || []), e[1]];
        }
        const output = {};
        const general = {};
        let resp = true;
        for (const owner_id of Object.keys(clear)) {
            const data = await this.api('stats.getPostReach', {owner_id, post_ids: clear[owner_id].join(',')});
            const wall = await this.api('wall.getById', {
                posts: clear[owner_id].map(value => `${owner_id}_${value}`).join(','),
                fields: 'name',
                extended: 1
            });

            if (!data || !wall) {
                resp = false;
                break;
            }

            for (let i = 0; i < Math.min(data.length, wall.items.length); i++) {
                const wall_data = {
                    likes: 0, reposts: 0, comments: 0
                };

                const e_data = data[i];
                const e_wall = wall.items[i];

                wall_data.name = wall.groups[0].name;
                wall_data.photo = wall.groups[0].photo_100;
                wall_data.price = Math.floor(e_data.reach_total / 1000 * multiplier);
                for (const k of ['likes', 'reposts', 'comments']) {
                    wall_data[k] = e_wall[k].count;
                    general[k] = (general[k] || 0) + e_wall[k].count;
                }

                for (const k of [...Object.keys(e_data), 'price']) {
                    general[k] = (general[k] || 0) + (e_data[k] || wall_data[k]);
                }

                output[owner_id] = [...(output[owner_id] || []), {...e_data, ...wall_data}];
            }
            await sleep(500);
        }
        if (resp) {
            this.setState({stats: {output, general}});
            await this.go('stats');
            this.setPopout(null);
        }
    }

    statsComponent(data, link) {
        const {
            reach_total,
            reach_subscribers,
            reach_viral,
            likes,
            reposts,
            comments,
            to_group,
            join_group,
            links,
            hide,
            report,
            unsubscribe,
            price,
            name
        } = data;
        return <Div style={{margin: '0px 12px 12px', paddingTop: 0}}>
            <div
                style={{display: 'flex', justifyContent: 'space-between'}}
            >
                <div style={{width: '50%'}}>
                    <Headline level="2" weight="2">
                        {link ?
                            <React.Fragment>
                                Охват <Link
                                target='_blank'
                                href={`https://vk.com/wall${link}`}
                            >
                                {link}
                            </Link>
                            </React.Fragment>
                            :
                            'Охват'
                        }
                        <br/> Стоимость: {price}
                    </Headline>
                    <Spacing size={6}/>
                    <div
                        style={{display: 'flex', gap: 6, alignItems: 'center'}}
                    >
                        <Icon24ViewOutline fill='var(--icon_outline_secondary)'/>
                        <Title level="1">
                            {shortIntegers(reach_total)}
                        </Title>
                    </div>
                    <Spacing size={6}/>
                    <div
                        style={{display: 'flex', gap: 6, alignItems: 'center'}}
                    >
                        <Subhead weight="1">{shortIntegers(reach_subscribers)}</Subhead>
                        <Subhead weight="3">/</Subhead>
                        <Subhead weight="1">{shortIntegers(reach_viral)}</Subhead>
                    </div>
                    <Spacing size={4}/>
                    <div
                        style={{display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text_secondary)'}}
                    >
                        <Subhead weight="1">подписчиков</Subhead>
                        <Subhead weight="3">/</Subhead>
                        <Subhead weight="1">виральных</Subhead>
                    </div>
                </div>
                <div style={{width: '50%'}}>
                    <Headline level="2" weight="2">
                        Обратная связь
                    </Headline>
                    <Spacing size={6}/>
                    <div
                        style={{display: 'flex', gap: 12, alignItems: 'center'}}
                    >
                        {
                            [
                                [<Icon24LikeOutline fill='var(--icon_outline_secondary)'/>, likes],
                                [<Icon24ShareOutline fill='var(--icon_outline_secondary)'/>, reposts],
                                [<Icon24CommentOutline fill='var(--icon_outline_secondary)'/>, comments]
                            ].map((value, index) =>
                                <div
                                    key={`e-${index}`}
                                    style={{display: 'flex', gap: 6, alignItems: 'center'}}
                                >
                                    {value[0]}
                                    <Title level="1">
                                        {shortIntegers(value[1])}
                                    </Title>
                                </div>
                            )
                        }
                    </div>
                    <Spacing size={6}/>
                    <Subhead weight="1" style={{color: 'var(--text_secondary)'}}>Количество реакций, репостов и
                        комментариев.</Subhead>
                </div>
            </div>
            <Spacing size={12}/>
            <div
                style={{display: 'flex', justifyContent: 'space-between'}}
            >
                <div style={{width: '50%'}}>
                    {
                        [
                            [to_group, decOfNum(to_group, ['переход', 'перехода', 'переходов'], false) + ' в группу'],
                            [join_group, decOfNum(join_group, ['вступление', 'вступления', 'вступлений'], false) + ' в группу'],
                            [links, decOfNum(links, ['переход', 'перехода', 'переходов'], false) + ' по ссылке']
                        ].map((value, index) =>
                            <div style={{display: 'flex', alignItems: 'center', gap: 4, marginTop: 4}}
                                 key={`e1-${index}`}>
                                <Subhead weight="1">{value[0]}</Subhead>
                                <Subhead weight="3">{value[1]}</Subhead>
                            </div>
                        )
                    }
                </div>
                <div style={{width: '50%'}}>
                    {
                        [
                            [hide, decOfNum(hide, ['скрытие', 'скрытия', 'скрытий'], false)],
                            [report, decOfNum(report, ['жалоба', 'жалобы', 'жалоб'], false)],
                            [unsubscribe, decOfNum(unsubscribe, ['скрытие', 'скрытия', 'скрытий'], false) + ' всех записей']
                        ].map((value, index) =>
                            <div style={{display: 'flex', alignItems: 'center', gap: 4, marginTop: 4}}
                                 key={`e1-${index}`}>
                                <Subhead weight="1">{value[0]}</Subhead>
                                <Subhead weight="3">{value[1]}</Subhead>
                            </div>
                        )
                    }
                </div>
            </div>
        </Div>
    }

    render() {
        let {
            wall_posts_count,
            wall_posts_keys,
            wall_posts,
            wall_posts_2,
            stats,
            multiplier
        } = this.state;
        return (
            <View
                {...defaultViewProps.bind(this)()}
            >
                <Panel id='main'>
                    <PanelHeader>Статистика</PanelHeader>
                    <Group>
                        {
                            true ?
                                <FormItem top='Ссылки на записи'>
                                    <Textarea
                                        placeholder='Введите ссылки, разделяя их с новой строчки'
                                        onChange={e => {
                                            this.setState({wall_posts_2: e.currentTarget.value.split('\n')});
                                        }}
                                    />
                                </FormItem>
                                :
                                <React.Fragment>
                                    <Header mode='secondary'>Ссылки на записи</Header>
                                    <List>
                                        {wall_posts_keys.map(
                                            (value, index) =>
                                                <Input
                                                    style={{margin: '6px 12px 12px'}}
                                                    getRef={ref => this[`inputUrl${value}`] = ref}
                                                    key={`post-${value}`}
                                                    onChange={e => {
                                                        wall_posts[value] = e.currentTarget.value;
                                                        this.setState({wall_posts});
                                                    }}
                                                    value={wall_posts[value]}
                                                    after={<IconButton
                                                        onClick={() => {
                                                            wall_posts_keys.splice(index, 1);
                                                            delete wall_posts[value];
                                                            this.setState({wall_posts_keys, wall_posts});
                                                        }}
                                                    >
                                                        <Icon12CancelOutline/>
                                                    </IconButton>}
                                                >

                                                </Input>
                                        )}
                                        <Input
                                            disabled={wall_posts_keys.length >= 100}
                                            style={{margin: '6px 12px 12px'}}
                                            placeholder='Добавить ссылку'
                                            onClick={async () => {
                                                wall_posts_count++;
                                                wall_posts_keys.push(wall_posts_count);
                                                wall_posts[wall_posts_count] = '';
                                                await this.setState({wall_posts_count, wall_posts_keys, wall_posts});
                                                this[`inputUrl${wall_posts_count}`].focus();
                                            }}
                                        />
                                    </List>
                                </React.Fragment>
                        }
                        <FormItem top='Множитель стоимости'>
                            <Input
                                type='number'
                                onChange={e => this.setState({multiplier: e.currentTarget.value})}
                                value={multiplier}
                            />
                        </FormItem>
                    </Group>
                    <Div>
                        <Button
                            disabled={wall_posts_2.length === 0 /*wall_posts_keys.length === 0 || wall_posts_keys.filter(value => wall_posts[value].length > 0).length !== wall_posts_keys.length*/}
                            size='m'
                            stretched
                            onClick={this.analyze}
                        >
                            Начать анализ
                        </Button>
                    </Div>
                </Panel>
                <Panel id='stats'>
                    <PanelHeader
                        left={<PanelHeaderBack onClick={this.back}/>}
                    >
                        Просмотр
                    </PanelHeader>
                    <Group>
                        <Header mode='secondary'><span style={{fontSize: 15}}>Общая статистика</span></Header>
                        {stats && this.statsComponent(stats.general)}
                    </Group>
                    {
                        stats && Object.keys(stats.output).map((owner_id, index) =>
                            <Group key={`stat-${index}`}>
                                <Header mode='secondary'>
                                    <span style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 15}}>
                                        <Avatar size={28} src={stats.output[owner_id][0].photo}/>
                                        Записи <Link
                                                target='_blank'
                                                href={`https://vk.com/club${-owner_id}`}
                                            >
                                            {stats.output[owner_id][0].name}
                                        </Link>
                                    </span>
                                </Header>
                                {
                                    stats.output[owner_id].map((data, index2) =>
                                        this.statsComponent(data, `${owner_id}_${data.post_id}`)
                                    )
                                }
                            </Group>
                        )
                    }
                </Panel>
            </View>
        )
    }

}