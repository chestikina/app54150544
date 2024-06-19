import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {PanelHeader, PanelHeaderBack, ScreenSpinner} from "@vkontakte/vkui";
import {getSrcUrl} from "../../js/utils";
import {UserAvatar} from "./UserAvatarFrame";
import {vk_local_users} from "../../js/drawerapp/utils";

export class WeekGifts extends PureComponent {
    constructor(props) {
        super(props);

        this.authorClick = this.authorClick.bind(this);
    }

    authorClick(id) {
        const {t} = this.props;
        t.setPopout(<ScreenSpinner/>);
        t.socket.call('users.getById', {id}, async r1 => {
            t.socket.call('games.getByDrawerId', {id}, async r2 => {
                await t.setState({
                    author: {id, ...r1.response || {}},
                    author_works: r2.response
                });
                t.go('author');
                t.setPopout(null);
            });
        });
    }

    render() {
        const {t} = this.props;
        const {user, week_gift_top} = t.state;
        const rating = week_gift_top.map(value => ({...vk_local_users[value.id], ...value}));
        const in_top = week_gift_top.findIndex(value => value.id === user.id) > -1;

        return <React.Fragment>
            <PanelHeader
                left={<PanelHeaderBack onClick={t.back}/>}
                separator={false}
            />
            <div className='WeekGifts'>
                <div className='WeekGifts_Texts'>
                    <h1>Розыгрыш</h1>
                    <p>
                        На этой неделе мы дарим стикеры ВКонтакте трём активным художникам
                    </p>
                    <p>
                        Чем больше картин вы нарисуете, тем выше шанс того, что вы получите приз
                    </p>
                </div>
                {
                    rating[0] &&
                    <div className='WeekGifts_Users'>
                        <div
                            className='UserContainer'
                            onClick={() => rating[0].id === user.id ? t.go('gallery') : this.authorClick(rating[0].id)}
                        >
                            <UserAvatar
                                size={80}
                                src={rating[0].photo_100}
                                frame={rating[0].frame_type}
                                color={rating[0].frame_color}
                            />
                            <div className='UserNameScore'>
                                <h2>{rating[0].first_name}</h2>
                                <p>{rating[0].picturesWeek}</p>
                            </div>
                        </div>
                        <div className='UsersContainer'>
                            {
                                rating[1] &&
                                <div
                                    className='UserContainer'
                                    onClick={() => rating[1].id === user.id ? t.go('gallery') : this.authorClick(rating[1].id)}
                                >
                                    <UserAvatar
                                        size={80}
                                        src={rating[1].photo_100}
                                        frame={rating[1].frame_type}
                                        color={rating[1].frame_color}
                                    />
                                    <div className='UserNameScore'>
                                        <h2>{rating[1].first_name}</h2>
                                        <p>{rating[1].picturesWeek}</p>
                                    </div>
                                </div>
                            }
                            {
                                rating[2] &&
                                <div
                                    className='UserContainer'
                                    onClick={() => rating[2].id === user.id ? t.go('gallery') : this.authorClick(rating[2].id)}
                                >
                                    <UserAvatar
                                        size={80}
                                        src={rating[2].photo_100}
                                        frame={rating[2].frame_type}
                                        color={rating[2].frame_color}
                                    />
                                    <div className='UserNameScore'>
                                        <h2>{rating[2].first_name}</h2>
                                        <p>{rating[2].picturesWeek}</p>
                                    </div>
                                </div>
                            }
                        </div>
                        {
                            !in_top &&
                            <div className='UserContainer' onClick={() => t.go('gallery')}>
                                <UserAvatar
                                    size={46}
                                    src={vk_local_users[user.id].photo_100}
                                    frame={vk_local_users[user.id].frame_type}
                                    color={vk_local_users[user.id].frame_color}
                                />
                                <div className='UserNameScore'>
                                    <h2>Вы</h2>
                                    <p>{user.picturesWeek}</p>
                                </div>
                            </div>
                        }
                    </div>
                }
                <img
                    alt='background'
                    className='Background'
                    src={getSrcUrl(require('../../assets/drawing/backgrounds/gifts_panel.png'))}
                />
            </div>
        </React.Fragment>
    }

}

WeekGifts.defaultProps = {};

WeekGifts.propTypes = {
    t: PropTypes.object
};

export default WeekGifts;