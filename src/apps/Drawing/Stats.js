import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Avatar,
    PanelHeader,
    PanelHeaderBack,
    HorizontalCell,
    HorizontalScroll, ScreenSpinner, SegmentedControl
} from "@vkontakte/vkui";
import {
    isPlatformDesktop, isPlatformIOS, shortIntegers
} from "../../js/utils";
import {vk_local_users} from "../../js/drawerapp/utils";
import {
    Icon28CoinsOutline,
    Icon28LikeOutline,
    Icon28StarsOutline
} from "@vkontakte/icons";
import {UserAvatar} from "./UserAvatarFrame";

const isIos = isPlatformIOS();

export class Stats extends PureComponent {

    render() {
        const
            {t} = this.props,
            {state, socket} = t,
            {user} = t.state
        ;

        return <React.Fragment>
            <PanelHeader
                left={<PanelHeaderBack onClick={t.back}/>}
                separator={false}
            />
            <div className='Panel_Container_Card Panel_Container_Card-ManyCards'>
                <div>
                    <Icon28StarsOutline width={36} height={36}/>
                    <div className='Panel_Container_Card-Text'>
                        <h2>Статистика</h2>
                        <p>Здесь собрана вся твоя статистика, и рейтинги лучших игроков по разным категориям оценивания</p>
                    </div>
                    <SegmentedControl
                        value='likes'
                        onClick={e => {
                            const value = e.target.value;
                            if (value === 'likes') {
                                t.setAlert(
                                    'Информация',
                                    'Если будешь рисовать красиво, твои работы будут лайкать. Собирай больше лайков и становись популярным 😎',
                                    [{
                                        title: 'Понятно',
                                        autoclose: true
                                    }]
                                )
                            } else {
                                t.setAlert(
                                    'Информация',
                                    'Монеты – это игровая валюта. За неё можно покупать товары из магазина. Монеты можно получить: 20 монет, если твой рисунок угадали; 10 монет, если твой рисунок не угадали, или если ты угадал чей-то рисунок.',
                                    [{
                                        title: 'Понятно',
                                        autoclose: true
                                    }]
                                )
                            }
                        }}
                        options={[
                            {
                                label: <div style={{display: 'flex', alignItems: 'center', gap: 4}}>
                                    <Icon28LikeOutline width={20} height={20}/>
                                    <span>{shortIntegers(user.likes)}</span>
                                </div>,
                                value: 'likes'
                            },
                            {
                                label: <div style={{display: 'flex', alignItems: 'center', gap: 4}}>
                                    <Icon28CoinsOutline width={20} height={20}/>
                                    <span>{shortIntegers(user.coins)}</span>
                                </div>,
                                value: 'money'
                            }
                        ]}
                    />
                </div>
                {
                    [
                        ['top', 'Ежедневный топ по угаданным', 'guessedPicturesToday'],
                        ['users_topPictures', 'По количеству картин', 'pictures'],
                        ['users_topGuessedPictures', 'По угаданным картинам', 'guessedPictures'],
                        ['users_topLikes', 'По лайкам', 'likes']
                    ].map((value, index) =>
                        <div key={`Card-${index}`}>
                            <p className='Panel_Container_Card-Header'>
                                {value[1]}
                            </p>
                            <HorizontalScroll
                                showArrows
                                getScrollToLeft={(i) => i - 64 * 2}
                                getScrollToRight={(i) => i + 64 * 2}
                            >
                                <div style={{display: 'flex'}}>
                                    {
                                        state[value[0]].map((value1, index1) =>
                                            <HorizontalCell
                                                key={`User-${index1}`}
                                                header={vk_local_users[value1.id].first_name}
                                                subtitle={value1[value[2]]}
                                                onClick={() => {
                                                    t.setPopout(<ScreenSpinner/>);
                                                    socket.call('users.getById', {id: value1.id}, async r1 => {
                                                        socket.call('games.getByDrawerId', {id: value1.id}, async r2 => {
                                                            await t.setState({
                                                                author: {id: value1.id, ...r1.response || {}},
                                                                author_works: r2.response
                                                            });
                                                            t.go('author');
                                                            t.setPopout(null);
                                                        });
                                                    });
                                                }}
                                            >
                                                {
                                                    !isIos ?
                                                        <UserAvatar
                                                            size={48}
                                                            src={vk_local_users[value1.id].photo_100}
                                                            frame={vk_local_users[value1.id].frame_type}
                                                            color={vk_local_users[value1.id].frame_color}
                                                        />
                                                        :
                                                        <Avatar
                                                            size={36} shadow={false}
                                                            src={vk_local_users[value1.id].photo_100}
                                                        />
                                                }
                                            </HorizontalCell>
                                        )
                                    }
                                </div>
                            </HorizontalScroll>
                        </div>
                    )
                }
            </div>
        </React.Fragment>
    }

}

Stats.defaultProps = {};

Stats.propTypes = {
    t: PropTypes.object
};

export default Stats;