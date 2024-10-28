import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    PanelHeader,
    PanelHeaderBack, ScreenSpinner
} from "@vkontakte/vkui";
import {
    decOfNum
} from "../../js/utils";
import {vk_local_users} from "../../js/drawerapp/utils";
import bridge from "@vkontakte/vk-bridge";
import {Icon28UsersOutline} from "@vkontakte/icons";
import {UserAvatar} from "./UserAvatarFrame";

export class FriendList extends PureComponent {

    constructor(props) {
        super(props);
    }

    render() {
        const
            {t} = this.props,
            {app_friends} = t.state
        ;
        return <React.Fragment>
            <PanelHeader
                left={<PanelHeaderBack onClick={t.back}/>}
                separator={false}
            />
            <div className='Panel_Container_Card Panel_Container_Card-TwoCards'>
                <div>
                    <Icon28UsersOutline width={36} height={36}/>
                    <div className='Panel_Container_Card-Text'>
                        <h2>Друзья</h2>
                        <p>Ваши друзья-художники прячутся здесь! Вы также можете посмотреть на их рисунки :)</p>
                    </div>
                    <div className='Panel_Container_Card-Buttons'>
                        <Button
                            stretched
                            size='m'
                            mode='gradient_gray'
                            onClick={async () => {
                                try {
                                    await bridge.send('VKWebAppRecommend');
                                } catch (e) {
                                }

                                try {
                                    await bridge.send('VKWebAppShare', {link: `https://vk.com/drawapp`});
                                } catch (e) {
                                }
                            }}
                        >
                            Пригласить друга
                        </Button>
                    </div>
                </div>
                <div>
                    {
                        app_friends.length > 0 ?
                            <React.Fragment>
                                <p className='Panel_Container_Card-Header'>
                                    {decOfNum(app_friends.length, ['друг', 'друга', 'друзей'])}
                                </p>
                                <div className='MiniCards'>
                                    {
                                        app_friends.map((value, index) => {
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
                                                    t.setPopout(<ScreenSpinner/>);
                                                    t.socket.call('users.getById', {id: value}, async r1 => {
                                                        t.socket.call('games.getByDrawerId', {id: value}, async r2 => {
                                                            await t.setState({
                                                                author: {id: value, ...r1.response || {}},
                                                                author_works: r2.response
                                                            });
                                                            t.go('author');
                                                            t.setPopout(null);
                                                        });
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

FriendList.defaultProps = {};

FriendList.propTypes = {
    t: PropTypes.object
};

export default FriendList;