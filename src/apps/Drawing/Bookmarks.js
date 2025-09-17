import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    PanelHeader,
    PanelHeaderBack, ScreenSpinner, Spinner
} from "@vkontakte/vkui";
import {
    decOfNum,isPlatformIOS
} from "../../js/utils";
import {getVKUsers, vk_local_users} from "../../js/drawerapp/utils";
import {
    Icon28BookmarkOutline
} from "@vkontakte/icons";
import {UserAvatar} from "./UserAvatarFrame";

const isIos = isPlatformIOS();


export class Bookmarks extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            bookmarks: [...props.t.state.bookmarks].reverse(),
            bookmarks_count: props.t.state.bookmarks.length,
            offset: 0,

            users: [],
            games: []
        };
    }

    componentDidMount() {
        this.observer = new IntersectionObserver(
            this.handleObserver.bind(this),
            {
                root: null,
                rootMargin: '0px',
                threshold: 1.0
            }
        );
        this.observer.observe(this.loadingRef);
        this.handleObserver();
        if (this.props.t.state.scrollPositionBookmarks) {
            console.log(`Scroll to ${this.props.t.state.scrollPositionBookmarks}`);
            setTimeout(() => document.body.scrollTop = this.props.t.state.scrollPositionBookmarks, 800);
        }
    }

    async handleObserver(entities = [{boundingClientRect: {y: 0}}], observer) {
        let
            {offset, users, games} = this.state
        ;
        const
            {y} = entities[0].boundingClientRect,
            {t} = this.props,
            {prevY, bookmarks} = this.state,
            canGetMore = offset < bookmarks.length
        ;
        if ((prevY === 0 || prevY > y) && canGetMore) {
            this.setState({spinner: true});
            const currentBookmarks = bookmarks.slice(offset, offset + 10);
            console.log({currentBookmarks});
            let users_ = currentBookmarks.filter(value => value.startsWith('0_')).map(value => parseInt(value.split('_')[1]));
            let users__ = [];
            const games_ = currentBookmarks.filter(value => value.startsWith('1_')).map(value => parseInt(value.split('_')[1]));
            offset += 10;

            if (games_.length > 0) {
                await new Promise(res =>
                    t.socket.call('games.getById', {ids: games_}, async r => {
                        await getVKUsers(r.response.map(value => value.drawerId));
                        for (const game of r.response) {
                            games[game.id + ''] = game;
                            users__.push(game.drawerId);
                        }
                        res(true);
                    })
                );
            }

            users_ = [...new Set(users_.concat(users__))].filter(value => !users[value.id]);
            if (users_.length > 0) {
                await new Promise(res =>
                    t.socket.call('users.getById', {ids: users_}, async r => {
                        await getVKUsers(users_);
                        for (const user of r.response) {
                            users[user.id + ''] = user;
                        }
                        res(true);
                    })
                );
            }

            console.log({offset, users, games});
            this.setState({offset, users, games, spinner: false});
            this.forceUpdate();
        }
        this.setState({prevY: y});
    }

    render() {
        const
            {t} = this.props,
            {users, games, bookmarks, spinner} = this.state
        ;
        return <React.Fragment>
            <PanelHeader
                left={<PanelHeaderBack onClick={t.back}/>}
                separator={false}
            />
            <div className='Panel_Container_Card Panel_Container_Card-ManyCards'>
                <div>
                    <Icon28BookmarkOutline width={36} height={36}/>
                    <div className='Panel_Container_Card-Text'>
                        <h2>Избранные</h2>
                        <p>Сохраняйте рисунки и профили художников, чтобы не потерять</p>
                    </div>
                </div>
                {
                    bookmarks.length > 0 ?
                        bookmarks.map((value, index) => {
                            try {
                                const v = value.split('_');
                                const type = parseInt(v[0]);
                                const object = v[1];
                                const game = games[object];
                                const user = users[object] || users[game.drawerId];
                                const vk_user = user ? vk_local_users[user.id] : vk_local_users[game.drawerId];
                                return <div
                                    key={`bookmark-${index}`}
                                >
                                    <div onClick={() => {
                                        t.setPopout(<ScreenSpinner/>);
                                        t.socket.call('games.getByDrawerId', {id: user.id}, async r2 => {
                                            await t.setState({
                                                author: user,
                                                author_works: r2.response
                                            });
                                            t.go('author');
                                            t.setPopout(null);
                                        });
                                    }}>
                                        <UserAvatar
                                            size={36}
                                            src={vk_user.photo_100}
                                            frame={vk_user.frame_type}
                                            color={vk_user.frame_color}
                                            iosOptimize={isIos}
                                        />
                                        <div>
                                            <p>{vk_user.first_name} {vk_user.last_name}</p>
                                            {
                                                type === 0 ?
                                                    <p>{decOfNum(user.pictures, ['рисунок', 'рисунка', 'рисунков'])}</p>
                                                    :
                                                    <p>{game['Word.nom'] || game.Word.nom} · {Math.round((game.endTime - game.startTime) / 1000)}с.</p>
                                            }
                                        </div>
                                    </div>
                                    {
                                        type === 1 && <React.Fragment>
                                            <div>
                                                <img
                                                    alt='picture'
                                                    src={game['Picture.url'] || game.Picture.url}
                                                    style={{
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={async () => {
                                                        const games_ = Object.keys(games).map(id => games[id]);
                                                        await t.setState({
                                                            games_,
                                                            like_currentPictureSelected: games_.findIndex(value => value.id === game.id),
                                                            like_method: false,
                                                            like_param: 'games_',
                                                            scrollPositionBookmarks: document.body.scrollTop
                                                        });
                                                        t.go('picture_info');
                                                    }}
                                                />
                                            </div>
                                        </React.Fragment>
                                    }
                                </div>;
                            } catch (e) {
                                //console.error(e);
                                return;
                            }
                        })
                        :
                        <div>
                            <p className='Panel_Container_Card-Header Panel_Container_Card-Header-Center'>
                                Вы ещё ничего не сохранили в избранные :(
                            </p>
                        </div>
                }
                {
                    spinner &&
                    <div className='MiniCard'>
                        <Spinner size='small'/>
                    </div>
                }
                <div ref={ref => this.loadingRef = ref} className='LoadingRef'/>
            </div>
        </React.Fragment>
    }
}

Bookmarks.defaultProps = {};

Bookmarks.propTypes = {
    t: PropTypes.object
};

export default Bookmarks;