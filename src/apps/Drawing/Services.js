import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {PanelHeader, PanelHeaderBack, ScreenSpinner} from "@vkontakte/vkui";
import {
    getUrlParams, hexToRgb, openUrl,
} from "../../js/utils";
import bridge from "@vkontakte/vk-bridge";
import {getVKUsers} from "../../js/drawerapp/utils";
import {
    Icon12Chevron,
    Icon28BookmarkOutline, Icon28BookSpreadOutline, Icon28CrownOutline,
    Icon28FavoriteOutline,
    Icon28NewsfeedLinesOutline, Icon28ReportOutline,
    Icon28SearchOutline,
    Icon28UsersOutline
} from "@vkontakte/icons";

export class Services extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {};

        this.openFriends = this.openFriends.bind(this);
        this.openFeed = this.openFeed.bind(this);
    }

    componentDidMount() {

    }

    async openFriends() {
        const {t} = this.props;
        const friend_ids = await t.getFriendsIds();
        if (friend_ids) {
            t.go('friend_list');
        }
    }

    async openFeed() {
        const {t} = this.props;
        t.setPopout(<ScreenSpinner/>);
        t.socket.call('pictures.getFeed', {limit: 10}, async r => {
            t.setState({picturesFeed: r.response});
            let user_ids = r.response.map(value => value.drawerId);
            await getVKUsers(user_ids);
            t.setPopout(null);
            t.go('feed');
        });
    }

    get actions() {
        const {t} = this.props;
        return [
            {
                icon: <Icon28UsersOutline/>,
                text: 'Друзья',
                color: '#61A1EC',
                action: this.openFriends
            },
            {
                icon: <Icon28NewsfeedLinesOutline/>,
                text: 'Лента',
                color: '#BC7FFB',
                action: this.openFeed
            },
            {
                icon: <Icon28BookmarkOutline/>,
                text: 'Избранные',
                color: '#FBCF0F',
                action: () => t.go('bookmarks')
            },
            {
                icon: <Icon28FavoriteOutline/>,
                text: 'Предложения',
                color: '#FE66A7',
                action: () => t.go('suggestions')
            },
            {
                icon: <Icon28ReportOutline/>,
                text: 'Репорты',
                color: 'var(--color_primary)',
                action: () => t.go('reports')
            },
            {
                icon: <Icon28CrownOutline/>,
                text: 'Пропуск',
                color: '#FF635E',
                action: () => {

                },
                hide: true
            },
            {
                icon: <Icon28BookSpreadOutline/>,
                text: 'Обновления',
                color: '#A4A6AA',
                action: () => openUrl('https://vk.me/join/yNNyasDRQHYq/pocnHHdrTjq25GT7sVC/4M=')
            },
        ];
    }

    render() {
        const
            {t} = this.props
        ;

        return <React.Fragment>
            <PanelHeader
                left={<PanelHeaderBack onClick={t.back}/>}
                separator={false}
            />
            <div className='Panel_Container_Card Panel_Container_Card-ManyCards'>
                <div className='MiniCards'>
                    {
                        this.actions.map(({icon, text, color, action, hide}, index) =>
                            <div
                                style={{
                                    display: hide && 'none'
                                }}
                                key={`service-act-${index}`}
                                onClick={action}
                            >
                                <div style={{
                                    background: `rgba(${hexToRgb(color, .05).rgba})`,
                                    color
                                }}>
                                    {icon}
                                </div>
                                <span>{text}</span>
                            </div>
                        )
                    }
                </div>
                <div
                    style={{
                        cursor: 'pointer'
                    }}
                    onClick={() => t.go('search')}
                >
                    <div
                        className='SearchCard'
                    >
                        <Icon28SearchOutline fill='#FE66A7'/>
                        <span>Поиск</span>
                        <Icon12Chevron/>
                    </div>
                </div>
            </div>
        </React.Fragment>
    }

}

Services.defaultProps = {};

Services.propTypes = {
    t: PropTypes.object
};

export default Services;