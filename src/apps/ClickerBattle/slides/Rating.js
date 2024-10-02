import React, {PureComponent} from 'react';
import bridge from '@vkontakte/vk-bridge';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/slides/Rating.css';
import Person from "../../../assets/clickerbattle/persons/Person";
import InfoBanner from "../../../components/ClickerBattle/InfoBanner";
import {ReactComponent as IconInfo} from "../../../assets/clickerbattle/info-24.svg";
import Button from "../../../components/ClickerBattle/Button";
import {CustomSelect, CustomSelectOption, Snackbar} from "@vkontakte/vkui";
import {
    decOfNum,
    getSrcUrl,
    getUrlLocation,
    getUrlParams,
    openUrl,
    shortIntegers
} from "../../../js/utils";
import {
    getVKUsers, vk_local_users
} from '../../../js/drawerapp/utils';
import {Icon16ErrorCircleFill} from "@vkontakte/icons";

export class Rating extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            selectedTop: 'day',
            top: {}
        };

        props.t.client.emit('users.getTop', {}, async response => {
            for (const key of Object.keys(response.response)) {
                const user_ids = response.response[key].map(value => value.id);
                await getVKUsers(user_ids);
            }
            this.setState({top: response.response});
        })
    }

    render() {
        const
            {props, state} = this,
            {t} = props,
            {selectedTop, top, snackbar, top_friends} = state
        ;

        return (
            <div className='Rating'>
                <div className='Best3Players HiddenScrollBar'>
                    {
                        top.week && top.week.map((value, i) =>
                            <div key={`rating_div_${i}`} style={{marginLeft: i > 0 && 26}}>
                                <Person
                                    name={t.state.persons[t.state.persons.findIndex(val => val.id === value.activePerson)].file_name}
                                    skin={value.activeSkins[value.activePerson] && t.state.persons[t.state.persons.findIndex(val => val.id === value.activePerson)].skins[value.activeSkins[value.activePerson]]}
                                    width={215} height={250}/>
                                <div>
                                    <div>{`#${i + 1}`}</div>
                                    <div>{vk_local_users[value.id].first_name} {vk_local_users[value.id].last_name}</div>
                                </div>
                            </div>
                        )
                    }
                </div>
                <InfoBanner
                    before={<IconInfo/>}
                    action={!t.state.user.isRatingEvent && 'Принять участие'}
                    onActionClick={async () => {
                        try {
                            await bridge.send('VKWebAppShowStoryBox', {
                                background_type: 'image',
                                url: getSrcUrl(require('../../../assets/clickerbattle/stories/Stickers_MiniGame.png')),
                                attachment: {
                                    url: 'https://vk.com/app' + getUrlParams().vk_app_id,
                                    text: 'go_to',
                                    type: 'url'
                                }
                            });
                            t.client.emit('users.setRatingEvent');
                            t.setState({user: {...t.state.user, isRatingEvent: true}});
                            this.forceUpdate();
                        } catch (e) {
                            if (snackbar) return;
                            this.setState({
                                snackbar: <Snackbar
                                    onClose={() => this.setState({snackbar: null})}
                                    before={<Icon16ErrorCircleFill width={20} height={20}/>}
                                >
                                    Вы не выполнили обязательное условие для участия.
                                </Snackbar>
                            });
                        }
                    }}
                >
                    Три лучших игрока получают стикеры каждую неделю
                </InfoBanner>
                <div className='RatingTitle'>
                    Рейтинг
                    <CustomSelect
                        options={[
                            {value: 'day', label: 'За сегодня'},
                            {value: 'clicks', label: 'За всё время'},
                            {value: 'lvl', label: 'По уровню'}
                        ]}
                        value={selectedTop}
                        onChange={(option) => this.setState({selectedTop: option.target.value})}
                        renderOption={(props) => {
                            return (
                                <CustomSelectOption
                                    {...props}
                                />
                            );
                        }}
                    />
                </div>
                <div className='RatingList'>
                    {top_friends &&
                    <div className='PlayersList'>
                        {
                            top_friends[selectedTop] && top_friends[selectedTop].map((value, i) =>
                                <div key={`rating_2_div_${i}`} className='RatingPlayer'
                                     style={{marginTop: i > 0 && 12}}>
                                    <div>{`#${value.num}`}</div>
                                    <img src={vk_local_users[value.id].photo_100} alt='avatar'/>
                                    <div>
                                        <div>{vk_local_users[value.id].first_name} {vk_local_users[value.id].last_name}</div>
                                        <div>{
                                            selectedTop === 'day' ?
                                                (
                                                    shortIntegers(value.day.clicks) + ' ' + decOfNum(value.day.clicks, ['клик', 'клика', 'кликов'], false)
                                                )
                                                : selectedTop === 'clicks' ?
                                                (
                                                    shortIntegers(value.clicks) + ' ' + decOfNum(value.clicks, ['клик', 'клика', 'кликов'], false)
                                                )
                                                : selectedTop === 'lvl' &&
                                                (
                                                    shortIntegers(value.lvl) + ' уровень'
                                                )
                                        }</div>
                                    </div>
                                </div>
                            )
                        }
                    </div>}
                    {!top_friends &&
                    <div>
                        <Button
                            onClick={async () => {
                                try {
                                    const access_token = await bridge.send('VKWebAppGetAuthToken', {
                                        app_id: parseInt(getUrlParams().vk_app_id),
                                        scope: 'friends'
                                    });
                                    if (access_token.scope === 'friends') {
                                        const friends = await bridge.send('VKWebAppCallAPIMethod', {
                                            method: 'friends.get',
                                            params: {
                                                fields: 'photo_100',
                                                v: '5.124',
                                                access_token: access_token.access_token
                                            }
                                        });
                                        t.client.emit('users.getTopFriends', {friends: friends.response.items}, async response => {
                                            for (const key of Object.keys(response.response)) {
                                                const user_ids = response.response[key].map(value => value.id);
                                                await getVKUsers(user_ids);
                                                response.response[key] = response.response[key].sort((a, b) => a.num - b.num);
                                            }
                                            this.setState({top_friends: response.response});
                                        });
                                    }
                                } catch (e) {

                                }
                            }}
                            style={{width: '57vw', height: '6.9vh'}}
                        >
                            Посмотреть друзей
                        </Button>
                    </div>
                    }
                    <div className='Spacing'/>
                    <div className='PlayersList'>
                        {
                            top[selectedTop] && top[selectedTop].map((value, i) =>
                                <div
                                    key={`rating_2_div_${i}`} className='RatingPlayer'
                                    style={{marginTop: i > 0 && 12}}
                                    onClick={() => openUrl('https://vk.com/id' + value.id)}
                                >
                                    <div>{`#${i + 1}`}</div>
                                    <img src={vk_local_users[value.id].photo_100} alt='avatar'/>
                                    <div>
                                        <div>{vk_local_users[value.id].first_name} {vk_local_users[value.id].last_name}</div>
                                        <div>{
                                            selectedTop === 'day' ?
                                                (
                                                    shortIntegers(value.day.clicks) + ' ' + decOfNum(value.day.clicks, ['клик', 'клика', 'кликов'], false)
                                                )
                                                : selectedTop === 'clicks' ?
                                                (
                                                    shortIntegers(value.clicks) + ' ' + decOfNum(value.clicks, ['клик', 'клика', 'кликов'], false)
                                                )
                                                : selectedTop === 'lvl' &&
                                                (
                                                    shortIntegers(value.lvl) + ' уровень'
                                                )
                                        }</div>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </div>
                {snackbar}
            </div>
        )
    }
}

Rating.defaultProps = {};

Rating.propTypes = {
    t: PropTypes.object
};

export default Rating;