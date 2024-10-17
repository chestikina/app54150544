import React, {PureComponent} from 'react';
import bridge from '@vkontakte/vk-bridge';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/slides/Friends.css';
import {ReactComponent as IconCancel} from "../../../assets/clickerbattle/cancel-18.svg";
import Button from "../../../components/ClickerBattle/Button";
import {Avatar} from "@vkontakte/vkui";
import {getUrlParams} from "../../../js/utils";
import {
    getVKUsers, vk_local_users
} from '../../../js/drawerapp/utils';

export class Friends extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            invited: false,
            friends_online: [],
            friends_offline: []
        };

        const {t} = props;
        this.t = t;
        this.getFriends();

        t.client.on('denyInvite', () => {
            t.setState({inviteFriend: false});
            this.setState({invited: false});
        });

        t.client.on('acceptInvite', () => {
            t.setState({
                inviteFriend: false,
                slideBarAnimationEnd: true,
                slideBarPrev: 0,
                slideBarIndex: 0,
                specificPanelOpened: null,
            });
            this.setState({invited: false});
        });
    }

    async getFriends() {
        try {
            const getAccessToken = await bridge.send('VKWebAppGetAuthToken', {
                app_id: parseInt(getUrlParams().vk_app_id),
                scope: 'friends'
            });
            if (getAccessToken.scope.indexOf('friends') > -1) {
                const {access_token} = getAccessToken;
                this.setState({friendsAccessToken: access_token});
                this.t.setState({friendsAccessToken: access_token});
                const response = await bridge.send('VKWebAppCallAPIMethod', {
                    method: 'friends.get',
                    params: {v: '5.131', access_token}
                });
                await getVKUsers(response.response.items);
                this.t.client.emit('friends.getList', {friends: response.response.items}, friends => {
                    this.setState({
                        friends_online: friends.response.online,
                        friends_offline: friends.response.offline
                    });
                });
            }
        } catch (e) {

        }
    }

    render() {
        const
            {props, state} = this,
            {t} = props,
            {invited, friends_online, friends_offline} = state,
            friendsAccessToken = t.state.friendsAccessToken || this.state.friendsAccessToken
        ;

        return (
            <div className='Friends'>
                <div className='SlideTitle'>
                    {friends_online.length > 0 ? 'Друзья' : 'Друзья не в сети'}
                </div>
                <div style={{height: 14}}/>
                {
                    !friendsAccessToken &&
                    <Button className='GetFriends'
                            onClick={() => {
                                this.getFriends();
                            }}
                    >
                        Обновить
                    </Button>
                }
                {
                    friendsAccessToken && friends_online.map((value, index) => {
                        const
                            not_invited = invited === false || invited !== index,
                            cant_invite = invited !== false && invited !== index,
                            vk_user = vk_local_users[value]
                        ;
                        return <React.Fragment key={'friends_' + index}>
                            <div className='Friend'>
                                <Avatar shadow={false} size={50} src={vk_user.photo_100}/>
                                <div className='FriendName'>
                                    {vk_user.first_name} {vk_user.last_name}
                                </div>
                                {
                                    not_invited ?
                                        <Button
                                            style={{
                                                opacity: cant_invite && .5,
                                                pointerEvents: cant_invite && 'none'
                                            }}
                                            className='FriendButton'
                                            onClick={() => {
                                                t.setState({inviteFriend: true});
                                                this.setState({invited: index});
                                                t.client.emit('friends.invite', {friend_id: vk_user.id}, response => {
                                                    if (!response.response) {
                                                        t.setState({inviteFriend: false});
                                                        this.setState({invited: false});
                                                    }
                                                });
                                            }}
                                        >
                                            Вызвать в бой
                                        </Button>
                                        :
                                        <Button className='FriendButton'
                                                before={<IconCancel/>}
                                                onClick={() => {
                                                    t.setState({inviteFriend: false});
                                                    this.setState({invited: false});
                                                    t.client.emit('friends.cancelInvite');
                                                }}
                                        >
                                            Отменить
                                        </Button>
                                }
                            </div>
                            {
                                index === friends_online.length - 1 &&
                                <div className='Spacing'/>
                            }
                        </React.Fragment>
                    })
                }
                {
                    (friendsAccessToken && friends_offline.length > 0 && friends_online.length > 0) &&
                    <div className='FriendsOfflineTitle'>
                        Друзья не в сети
                    </div>
                }
                {
                    friendsAccessToken && friends_offline.map((value, index) => {
                        const
                            vk_user = vk_local_users[value]
                        ;

                        return <div className='Friend' key={'friends_2_' + index}>
                            <Avatar shadow={false} size={50} src={vk_user.photo_100}/>
                            <div className='FriendName'>
                                {vk_user.first_name} {vk_user.last_name}
                            </div>
                        </div>
                    })
                }
            </div>
        )
    }
}

Friends.defaultProps = {};

Friends.propTypes = {
    t: PropTypes.object
};

export default Friends;