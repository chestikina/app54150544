import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    IconButton,
    PanelHeader,
    PanelHeaderBack,
    Banner
} from "@vkontakte/vkui";
import {
    Icon16Cancel,
    Icon16Share, Icon28SlidersOutline
} from "@vkontakte/icons";
import {
    getUrlParams,
    isPlatformDesktop, isPlatformIOS
} from "../../js/utils";
import {getVKUsers, vk_local_users} from "../../js/drawerapp/utils";
import bridge from "@vkontakte/vk-bridge";
import {UserAvatar} from "./UserAvatarFrame";

const
    isDesktop = isPlatformDesktop()
;

export class FriendLobby extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            removed: false,
            ready: [],
            members: [],
            splashShow: false
        };

        setTimeout(async () => {
            const {friend_lobby} = this.props.t.state;
            await getVKUsers(friend_lobby.members);
            this.setState({members: friend_lobby.members, ready: friend_lobby.ready});
            console.log({friend_lobby});
        }, 1);

        this.playerComponent = this.playerComponent.bind(this);
    }

    async componentDidMount() {
        const {t} = this.props;
        await t.log('game_logs');
        const {socket, state, setSnackbar, back, go} = t;
        socket.unsubscribe('changeLobbyUsers', 'gameStart', 'chooseWord', 'setWord', 'draw', 'removeLobby', 'wakeUp', 'ready');
        socket.subscribe('wakeUp', async r => {
            if (r.user_ids.indexOf(state.user.id) > -1) {
                for (let i = 0; i < 3; i++) {
                    setTimeout(async () => {
                        if (bridge.supports('VKWebAppTapticNotificationOccurred')) {
                            await bridge.send('VKWebAppTapticNotificationOccurred', {type: 'success'});
                        }
                        await this.setState({splashShow: !this.state.splashShow});
                        setTimeout(() => {
                            this.setState({splashShow: !this.state.splashShow});
                        }, 100);
                    }, 200 + i * 200)
                }
            }
        });
        socket.subscribe('removeLobby', async r => {
            this.props.t.log('game_logs', 'in_removeLobby');
            this.setState({removed: true});
        });
        socket.subscribe('changeLobbyUsers', async r => {
            this.props.t.log('game_logs', 'in_changeLobbyUsers', {p: r.players});
            const {friend_lobby} = this.props;
            await getVKUsers(r.players);
            friend_lobby.members = r.players;
            t.setState({friend_lobby});
            setTimeout(async () => {
                await this.setState({members: friend_lobby.members});
                this.forceUpdate();
                if (r.players.indexOf(state.user.id) === -1 && this.props.friend_lobby.owner_id !== state.user.id) {
                    back();
                    if (this.state.removed) {
                        setSnackbar('Лобби было удалено');
                    } else {
                        setSnackbar('Вас выгнали из лобби');
                    }
                }
            }, 400);
        });
        socket.subscribe('ready', async r => {
            this.props.t.log('game_logs', 'in_ready', {r: r.ready});
            const {friend_lobby} = this.props;
            friend_lobby.ready = r.ready;
            t.setState({friend_lobby});
            this.setState({ready: r.ready});
        });
        socket.subscribe('chooseWord', async r => {
            t.setState({chooseWords: r.words});
            t.log('game_logs', 'in_chooseWord', {words: r.words});
            setTimeout(() => {
                this.props.t.forceUpdate();
            }, 400);
        });
        socket.subscribe('setWord', async r => {
            t.setState({word: r.word});
            t.log('game_logs', 'in_setWord', {word: r.word});
            setTimeout(() => {
                this.props.t.forceUpdate();
            }, 400);
        });
        socket.subscribe('gameStart', async r => {
            socket.unsubscribe('changeLobbyUsers');
            const
                {players, lobbyId, drawerId, timeout} = r,
                {friend_lobby} = this.props
            ;
            await this.props.t.setState({api_manager: 1});
            t.log('game_logs', 'in_gameStart', {drawer: drawerId, lobby: lobbyId, manager: 1});
            await t.setState({
                game_players: players,

                game_timeout: timeout,
                lobbyId,
                drawerId,
                gameStart: Date.now(),
                isOnlineDrawing: true,
                subGameInfo: {friendly: true, owner_id: friend_lobby.owner_id, data: friend_lobby}
            });
            go('game');
        });
    }

    playerComponent(data) {
        const
            {t, friend_lobby} = this.props,
            {socket} = t,
            {user} = t.state,
            {ready} = this.state,
            vk_data = vk_local_users[data.id]
        ;
        if (!vk_data) {
            getVKUsers([data.id]);
        }
        return vk_data && <div key={data.key}>
            <UserAvatar
                size={32}
                src={data.photo_100}
                frame={vk_data.frame_type}
                color={vk_data.frame_color}
                style={{opacity: ready.indexOf(data.id) > -1 ? 1 : .5}}
            />
            <span style={{opacity: ready.indexOf(data.id) > -1 ? 1 : .5}}>{data.name}</span>
            {
                friend_lobby.owner_id === user.id && data.id !== user.id &&
                <IconButton className='KickButton' onClick={() => {
                    socket.call('friends.kickFromLobby', {user_id: data.id});
                }}><Icon16Cancel fill='var(--icon_tertiary)'/></IconButton>
            }
        </div>
    }

    render() {
        const
            {t, friend_lobby} = this.props,
            {socket} = t,
            {user, vk_user} = t.state,
            {members, ready, splashShow} = this.state,
            imReady = ready.indexOf(user.id) > -1,
            readyText = vk_user.sex === 1 ? 'готова' : 'готов'
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
                <div className='FriendSplash' style={{opacity: splashShow ? 1 : 0}}/>
                <div className='FriendLobby'>
                    {
                        !isDesktop && <h2 style={{textAlign: 'left'}}>Дружеская игра</h2>
                    }
                    {
                        friend_lobby.owner_id !== user.id ?
                            <Banner
                                header='Информация'
                                subheader='Вы находитесь в лобби. Ждите, пока создатель начнёт игру, а пока что приготовьтесь. Если закроете эту страницу, игра не будет засчитана.'
                            />
                            :
                            <Banner
                                header='Информация'
                                subheader='Вы являетесь создателем лобби. Если закроете эту страницу, лобби будет удалено, а все участники будут исключены. Подождите, пока игроки зайдут к вам в лобби, и готовьтесь начать игру.'
                            />
                    }
                    {
                        friend_lobby.owner_id === user.id &&
                        <div
                            style={{
                                marginTop: 24,
                                width: '100%',
                                display: 'flex'
                            }}
                        >
                            <Button
                                before={<Icon28SlidersOutline width={16} height={16}/>}
                                size='m' mode='gradient_light_gray' stretched
                                onClick={() => {
                                    //t.setActiveModal(MODAL_PAGE_FRIEND_LOBBY_SETTINGS);
                                    if (user.vk_donut || user.admin || user.premium) {
                                        t.go('friend_lobby_settings');
                                    } else {
                                        if (isPlatformIOS()) {
                                            t.go('vk_donut_blocked');
                                        } else {
                                            t.go('vk_donut_avocado');
                                        }
                                    }
                                }}
                            >
                                Настройки
                            </Button>
                            <Button
                                style={{
                                    marginLeft: 6
                                }}
                                before={<Icon16Share width={16} height={16}/>}
                                size='m' mode='gradient_gray' stretched
                                onClick={async () => {
                                    try {
                                        if (t.vkChatIntegration || t.isFromCatalogChat || t.isFromChatWidget) {
                                            const {vk_chat_id} = getUrlParams();
                                            await bridge.send('VKWebAppAddToChat', {
                                                action_title: 'Рисуй с нами',
                                                hash: `lobby${user.id}`,
                                                close_app: false
                                            });
                                            socket.call('friends.shareLobbyChat', {chat_id: vk_chat_id}, r => this.props.t.setState({friend_lobby: r.response}));
                                            t.setAlert(
                                                'Виджет отправлен',
                                                'Вы молодец! Теперь остается подождать, пока игроки из чата присоединятся к вам. А пока что приготовьтесь 😊',
                                                [{
                                                    title: 'Хорошо',
                                                    autoclose: true
                                                }]
                                            );
                                        } else {
                                            await bridge.send('VKWebAppShare', {link: `https://vk.com/drawapp#lobby${user.id}`});
                                        }
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }}
                            >
                                {(t.vkChatIntegration || t.isFromCatalogChat || t.isFromChatWidget) ? 'Добавить в чат' : 'Пригласить'}
                            </Button>
                        </div>
                    }
                    <div className='Span' style={{marginTop: 24}}>
                        Создатель лобби
                    </div>
                    <div className='LobbyList'>
                        {
                            this.playerComponent({
                                photo_100: vk_local_users[friend_lobby.owner_id] && vk_local_users[friend_lobby.owner_id].photo_100,
                                name: `${vk_local_users[friend_lobby.owner_id] ? vk_local_users[friend_lobby.owner_id].first_name : ''} ${vk_local_users[friend_lobby.owner_id] ? vk_local_users[friend_lobby.owner_id].last_name.substring(0, 1) : ''}.`,
                                id: friend_lobby.owner_id
                            })
                        }
                    </div>
                    <div className='Span' style={{marginTop: 24}}>
                        {members.length > 0 ? 'Игроки' : 'Другие игроки пока ещё не зашли 🥱'}
                    </div>
                    <div className='LobbyList'>
                        {
                            members.length > 0 && members.map((value, index) =>
                                this.playerComponent({
                                    photo_100: vk_local_users[value] && vk_local_users[value].photo_100,
                                    name: `${vk_local_users[value] ? vk_local_users[value].first_name : ''} ${vk_local_users[value] ? vk_local_users[value].last_name.substring(0, 1) : ''}.`,
                                    id: value,
                                    key: `user-${index}`
                                })
                            )
                        }
                    </div>
                    <div className='LobbyActions'>
                        <Button
                            size='l' mode={imReady ? 'gradient_light_gray' : 'gradient_gray'} stretched
                            onClick={() => {
                                socket.call('friends.ready', {owner_id: friend_lobby.owner_id});
                            }}
                        >
                            {imReady ? `Я не ${readyText}` : `Я ${readyText}!`}
                        </Button>
                        {
                            friend_lobby.owner_id === user.id &&
                            <Button
                                disabled={members.length === 0 || ready.length < (members.length + 1)}
                                size='l' mode='gradient_blue' stretched
                                onClick={() => {
                                    socket.call('friends.startGame', {}, r => {
                                        if (r.error) {
                                            this.props.t.setActivePanel('main');
                                            this.props.t.setAlert(
                                                'Ошибка',
                                                r.error.message,
                                                [{
                                                    title: 'Ок',
                                                    autoclose: true
                                                }]
                                            );
                                        }
                                    });
                                }}
                            >
                                Начать игру
                            </Button>
                        }
                    </div>
                </div>
            </React.Fragment>
        )
    }

}

FriendLobby.defaultProps = {};

FriendLobby.propTypes = {
    t: PropTypes.object,
    friend_lobby: PropTypes.object
};

export default FriendLobby;