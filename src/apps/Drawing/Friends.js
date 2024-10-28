import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Avatar,
    Button,
    PanelHeader,
    PanelHeaderBack, PromoBanner,
    SimpleCell, ScreenSpinner, Link
} from "@vkontakte/vkui";
import {
    getUrlParams,
    isPlatformDesktop, openUrl
} from "../../js/utils";
import {getVKUsers, vk_local_users} from "../../js/drawerapp/utils";
import bridge from "@vkontakte/vk-bridge";
import {Icon12User, Icon28Users3Outline} from "@vkontakte/icons";
import {UserAvatar} from "./UserAvatarFrame";

const isDesktop = isPlatformDesktop();

export class Friends extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            friends: [],
            others: [],
            players_count: {}
        };

        this.updateFriends = this.updateFriends.bind(this);
    }

    async updateFriends() {
        const {socket} = this.props.t;
        socket.call('friends.getLobbies', {ids: await this.props.t.getFriendsIds()}, async r => {
            if (r.error) {
                this.props.t.setSnackbar(r.error.message);
            } else {
                const {friend_lobbies, public_lobbies} = r.response;

                const all_lobbies = [...friend_lobbies, ...public_lobbies];
                const friend_ids = friend_lobbies.map(value => value.lobbyId);
                const public_ids = public_lobbies.map(value => value.lobbyId);
                const all_ids = [...new Set([...friend_ids, ...public_ids])];

                const {players_count} = this.state;
                for (const lobby of all_lobbies) {
                    players_count[lobby.lobbyId] = [lobby.count, lobby.max];
                }

                await getVKUsers(all_ids);
                this.setState({players_count, friends: friend_ids, others: public_ids});
            }
        });
    }

    componentDidMount() {
        const {socket} = this.props.t;
        socket.unsubscribe('createLobby', 'removeLobby');
        socket.subscribe('createLobby', async r => {
            const {friends, others} = this.state;
            if (r.changeMode && others.indexOf(r.id) === -1 && friends.indexOf(r.id) === -1) {
                await getVKUsers([r.id]);
                this.setState({others: [...others, r.id]});
            } else if (!r.changeMode && friends.indexOf(r.id) === -1) {
                this.setState({friends: [...friends, r.id]});
            }
        });
        socket.subscribe('removeLobby', async r => {
            const {friends, others} = this.state;
            if (r.changeMode && others.indexOf(r.id) > -1 && friends.indexOf(r.id) === -1) {
                others.splice(others.indexOf(r.id), 1);
                this.setState({others});
            } else if (!r.changeMode && friends.indexOf(r.id) > -1) {
                friends.splice(friends.indexOf(r.id), 1);
                this.setState({friends});
            }
            this.forceUpdate();
        });
        socket.subscribe('changeLobbyPlayersCount', async r => {
            const {players_count} = this.state;
            players_count[r.lobbyId] = [r.count, r.max];
            this.setState({players_count});
            this.forceUpdate();
        });

        this.updateFriends();
    }

    render_old() {
        const
            {t} = this.props,
            {socket} = t,
            {user, banners} = t.state,
            {friends, others} = this.state
        ;

        return (
            <React.Fragment>
                <PanelHeader
                    left={<PanelHeaderBack onClick={t.back}/>}
                    separator={false}
                >
                    {
                        isDesktop && 'Дружеская игра'
                    }
                </PanelHeader>
                <div className='Friends'>
                    {
                        !isDesktop && <h2 style={{textAlign: 'left'}}>Дружеская игра</h2>
                    }
                    <p style={{margin: '8px 40px 0 0'}}>
                        Создать лобби может любой человек.
                    </p>
                    <p style={{margin: '4px 40px 0 0'}}>
                        Количество игроков – до 20.
                    </p>
                    <p style={{margin: '4px 40px 0 0'}}>
                        <Link target='_blank' href='https://vk.com/@draw_app-lobby'>Узнайте подробнее тут 🔖</Link>
                    </p>
                    <div style={{display: 'flex', marginTop: 24}}>
                        <Button
                            stretched
                            size='m'
                            mode='gradient_violet'
                            onClick={() => {
                                t.setPopout(<ScreenSpinner/>);
                                socket.call('friends.createLobby', {}, r => {
                                    if (r.response) {
                                        t.setState({friend_lobby: r.response});
                                        t.go('friend_lobby');
                                        t.setPopout(null);
                                    } else {
                                        t.setAlert(
                                            'Ошибка',
                                            r.error.message,
                                            [{
                                                title: 'Ок',
                                                mode: 'cancel',
                                                autoclose: true
                                            }]
                                        );
                                    }
                                });
                            }}
                        >
                            Создать лобби
                        </Button>
                        <Button
                            style={{marginLeft: 4}}
                            stretched
                            size='m'
                            mode='gradient_gray'
                            onClick={async () => {
                                await this.updateFriends();
                            }}
                        >
                            Обновить список
                        </Button>
                    </div>
                    <div className='FriendsList' style={{paddingBottom: !t.newAdSupports && banners[7] && 140}}>
                        {
                            friends.length > 0 ?
                                <React.Fragment>
                                    <span className='Span'>
                                        Выберите друга, в чьё лобби хотите присоединиться:
                                    </span>
                                    <div style={{marginTop: 8}}>
                                        {
                                            friends.filter(value => vk_local_users[value]).map((value, index) =>
                                                <SimpleCell
                                                    key={`SCell_${index}`}
                                                    before={<Avatar size={32} shadow={false}
                                                                    src={vk_local_users[value].photo_100}/>}
                                                    expandable={true}
                                                    onClick={() => {
                                                        socket.call('friends.joinLobby', {owner_id: value}, async r => {
                                                            await getVKUsers(r.response.members);
                                                            await t.setState({friend_lobby: r.response});
                                                            t.go('friend_lobby');
                                                        });
                                                    }}
                                                >
                                                    {vk_local_users[value].first_name} {vk_local_users[value].last_name.substring(0, 1)}.
                                                </SimpleCell>
                                            )
                                        }
                                    </div>
                                </React.Fragment>
                                :
                                <span className='Span'>
                                    На данный момент открытых лобби нет.
                                </span>
                        }
                        {
                            others.length > 0 &&
                            <React.Fragment>
                                <br/>
                                <div className='Span' style={{marginTop: 12}}>
                                    Другие игроки:
                                </div>
                                <div style={{marginTop: 8}}>
                                    {
                                        others.filter(value => vk_local_users[value]).map((value, index) =>
                                            <SimpleCell
                                                key={`SCell_${index}`}
                                                before={<Avatar size={32} shadow={false}
                                                                src={vk_local_users[value].photo_100}/>}
                                                expandable={true}
                                                onClick={() => {
                                                    socket.call('friends.joinLobby', {owner_id: value}, async r => {
                                                        await getVKUsers(r.response.members);
                                                        await t.setState({friend_lobby: r.response});
                                                        t.go('friend_lobby');
                                                    });
                                                }}
                                            >
                                                {vk_local_users[value].first_name} {vk_local_users[value].last_name.substring(0, 1)}.
                                            </SimpleCell>
                                        )
                                    }
                                </div>
                            </React.Fragment>
                        }
                    </div>
                    {
                        !t.newAdSupports && banners[7] &&
                        <PromoBanner
                            bannerData={banners[7]}
                            onClose={async () => {
                                banners[7] = false;
                                await t.setState({banners});
                                this.forceUpdate();
                            }}
                        />
                    }
                </div>
            </React.Fragment>
        )
    }

    render() {
        const
            {t} = this.props,
            {socket} = t,
            {user} = t.state,
            {friends, others, players_count} = this.state,
            lobbies = [...new Set([...friends, ...others])].filter(value => vk_local_users[value] && players_count[value])
        ;
        return <React.Fragment>
            <PanelHeader
                left={<PanelHeaderBack onClick={t.back}/>}
                separator={false}
            />
            <div className='Panel_Container_Card Panel_Container_Card-TwoCards'>
                <div>
                    <Icon28Users3Outline width={36} height={36}/>
                    <div className='Panel_Container_Card-Text'>
                        <h2>Дружеская игра</h2>
                        <p>Играйте вместе со своими друзьями и устраивайте соревнования!</p>
                    </div>
                    <div className='Panel_Container_Card-Buttons'>
                        <Button
                            stretched
                            size='m'
                            mode='gradient_violet'
                            onClick={() => {
                                t.setPopout(<ScreenSpinner/>);
                                socket.call('friends.createLobby', {}, r => {
                                    if (r.response) {
                                        t.setState({friend_lobby: r.response});
                                        t.go('friend_lobby');
                                        t.setPopout(null);
                                    } else {
                                        t.setAlert(
                                            'Ошибка',
                                            r.error.message,
                                            [{
                                                title: 'Ок',
                                                mode: 'cancel',
                                                autoclose: true
                                            }]
                                        );
                                    }
                                });
                            }}
                        >
                            Создать лобби
                        </Button>
                        <Button
                            stretched
                            size='m'
                            mode='gradient_gray'
                            onClick={() => {
                                openUrl('https://vk.com/@draw_app-avocadoplus');
                            }}
                        >
                            Подробнее
                        </Button>
                    </div>
                </div>
                <div>
                    {
                        lobbies.length > 0 ?
                            <React.Fragment>
                                <p className='Panel_Container_Card-Header'>
                                    Список игроков
                                </p>
                                <div className='MiniCards'>
                                    {
                                        lobbies.map((value, index) => {
                                            const {
                                                photo_100,
                                                first_name,
                                                last_name,
                                                frame_type,
                                                frame_color
                                            } = vk_local_users[value];
                                            return <div
                                                className='MiniCard'
                                                key={`Card-${index}`}
                                                onClick={() => {
                                                    socket.call('friends.joinLobby', {owner_id: value}, async r => {
                                                        await getVKUsers(r.response.members);
                                                        await t.setState({friend_lobby: r.response});
                                                        t.go('friend_lobby');
                                                    });
                                                }}
                                            >
                                                <UserAvatar
                                                    size={32}
                                                    src={photo_100}
                                                    frame={frame_type}
                                                    color={frame_color}
                                                />
                                                <div>
                                                    <span>{first_name} {last_name.substring(0, 1)}.</span>
                                                    <div>
                                                        <Icon12User/>
                                                        <span>{players_count[value][0]} из {players_count[value][1]}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        })
                                    }
                                </div>
                            </React.Fragment>
                            :
                            <p className='Panel_Container_Card-Header Panel_Container_Card-Header-Center'>
                                На данный момент открытых лобби нет
                            </p>
                    }
                </div>
            </div>
        </React.Fragment>
    }
}

Friends.defaultProps = {};

Friends.propTypes = {
    t: PropTypes.object
};

export default Friends;