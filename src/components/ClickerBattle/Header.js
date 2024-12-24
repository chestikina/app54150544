import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {Avatar} from "@vkontakte/vkui";
import {ReactComponent as IconZap} from "../../assets/clickerbattle/zap.svg";
import {ReactComponent as IconStar} from "../../assets/clickerbattle/star-14.svg"
import {ReactComponent as IconAccept} from "../../assets/clickerbattle/check-14.svg";
import {ReactComponent as IconCancel} from "../../assets/clickerbattle/cancel-14.svg";
import '../../css/ClickerBattle/Header.css';
import {getVKUsers, vk_local_users} from "../../js/utils";

export class Header extends PureComponent {

    constructor(props) {
        super(props);
        this.state = {};
        const {t} = props;

        t.client.on('gameInvite', async data => {
            await getVKUsers([data.user_id]);
            this.setState({inviteFriend: true, inviteFriendId: data.user_id});
        });

        t.client.on('cancelInvite', () => {
            this.setState({inviteFriend: false});
        });
    }


    componentDidMount() {
        try {
            document.body.style.setProperty('--header_height', document.getElementsByClassName('Header')[0].clientHeight + 'px');
        } catch (e) {
        }
    }

    render() {
        const
            {props, state} = this,
            {children, t} = props,
            {inviteFriend, inviteFriendId} = state,
            {user} = t.state
        ;

        return (
            <div className='Header' style={props.style}>
                <div className='HeaderBackground'/>
                <div className='TopSpacing'/>
                <div className='HeaderTop'>
                    <div className='EnergyContainer' onClick={() => t.setState({specificPanelOpened: 0})}>
                        <IconZap/>
                        <span>{user.energy}</span>
                    </div>
                    <div className='XPContainer' onClick={() => t.setState({specificPanelOpened: 7})}>
                        <IconStar/>
                        <span>{user.xp}</span>
                    </div>
                </div>
                {children}
                <div className={`FriendInvite ${inviteFriend ? 'FriendInviteShow' : 'FriendInviteHide'}`}>
                    {
                        vk_local_users[inviteFriendId] !== undefined && <React.Fragment>
                            <div>
                                <Avatar size={36} shadow={false} src={vk_local_users[inviteFriendId].photo_100}/>
                                <div>
                                    <span style={{fontFamily: 'SF Pro Text Bold'}}>
                                        {vk_local_users[inviteFriendId].first_name}
                                    </span> вызывает тебя в бой
                                </div>
                            </div>
                            <div>
                                <div onClick={() => {
                                    t.setState({
                                        slideBarAnimationEnd: true,
                                        slideBarPrev: 0,
                                        slideBarIndex: 0,
                                        specificPanelOpened: null,
                                    });
                                    t.client.emit('friends.acceptInvite', {friend_id: inviteFriendId});
                                    this.setState({inviteFriend: false});
                                }}>
                                    <IconAccept/>
                                    <div>Принять</div>
                                </div>
                                <div onClick={() => {
                                    t.client.emit('friends.denyInvite', {friend_id: inviteFriendId});
                                    this.setState({inviteFriend: false});
                                }}>
                                    <IconCancel/>
                                    <div>Отклонить</div>
                                </div>
                            </div>
                        </React.Fragment>
                    }
                </div>
                {(inviteFriend || t.state.inviteFriend) && <div className='BlockHeaderClicks'/>}
            </div>
        )
    }
}

Header.propTypes = {
    t: PropTypes.object
};

export default Header;