import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    PanelHeader,
    PanelHeaderBack,
    PromoBanner, ScreenSpinner,
    Spinner
} from "@vkontakte/vkui";
import {getUrlParams, isPlatformIOS, shortIntegers, sortUniqueObject} from "../../js/utils";
import {
    Icon28Cards2Outline,
    Icon28LikeOutline, Icon28MoreHorizontal, Icon28ReportOutline
} from "@vkontakte/icons";
import {getVKUsers, vk_local_users} from "../../js/drawerapp/utils";
import {pictureActions, startAnimation} from "./PictureInfo";
import {UserAvatar} from "./UserAvatarFrame";
import bridge from "@vkontakte/vk-bridge";
import {defaultShopItems} from "./Shop";

const isIos = isPlatformIOS();

let activeAnimation = [];

export class Feed extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            offset: props.t.state.picturesFeed.length,
            limit: 5,
            canGetMore: true,
            prevY: 0,
            fetchEnd: true,
            filter: 'n'
        };

        this.changeFilter = this.changeFilter.bind(this);
    }

    async componentDidMount() {
        this.observer = new IntersectionObserver(
            this.handleObserver.bind(this),
            {
                root: null,
                rootMargin: '0px',
                threshold: 1.0
            }
        );
        this.observer.observe(this.loadingRef);
        if (this.props.t.state.scrollPositionFeed) {
            console.log(`Scroll to ${this.props.t.state.scrollPositionFeed}`);
            setTimeout(() => document.body.scrollTop = this.props.t.state.scrollPositionFeed, 800);
        }
    }

    async handleObserver(entities = [{boundingClientRect: {y: 0}}], observer) {
        const
            {y} = entities[0].boundingClientRect,
            {t} = this.props,
            {fetchEnd, prevY, offset, limit, filter, canGetMore} = this.state
        ;
        if ((prevY === 0 || prevY > y) && canGetMore && fetchEnd !== false) {
            this.setState({spinner: true, fetchEnd: false});
            t.socket.call('pictures.getFeed', {offset, limit, filter}, async r => {
                await getVKUsers(r.response.map(value => value.drawerId));
                const picturesFeed = sortUniqueObject([...t.state.picturesFeed, ...r.response]);
                const canGetMore = r.response.length > 0;
                if (picturesFeed.length !== (t.state.picturesFeed.length + limit) && canGetMore) {
                    await this.setState({
                        canGetMore,
                        offset: offset + limit - (picturesFeed.length - t.state.picturesFeed.length),
                        fetchEnd: true
                    });
                    this.handleObserver();
                    return;
                }
                await t.setState({picturesFeed});
                await this.setState({canGetMore, spinner: false, offset: picturesFeed.length});
                this.forceUpdate();
                setTimeout(() => {
                    this.setState({fetchEnd: true});
                }, 1000);
            });
        }
        this.setState({prevY: y});
    }

    async changeFilter() {
        const {t} = this.props;
        let {filter} = this.state;
        if (filter === 'n') {
            const friend_ids = await t.getFriendsIds();
            if (friend_ids) {
                filter = friend_ids;
                await t.setState({picturesFeed: []});
                await this.setState({canGetMore: true, filter, offset: 0});
            }
        } else {
            filter = 'n';
            await t.setState({picturesFeed: []});
            await this.setState({canGetMore: true, filter, offset: 0});
            await this.forceUpdate();
        }
    }

    render() {
        const
            {t} = this.props,
            {state, socket} = t,
            {picturesFeed, user} = state,
            {spinner, filter} = this.state
        ;

        return <React.Fragment>
            <PanelHeader
                left={<PanelHeaderBack onClick={t.back}/>}
                separator={false}
            />
            <div className={'Panel_Container_Card Panel_Container_Card-ManyCards'}>
                <div>
                    <Icon28Cards2Outline width={36} height={36}/>
                    <div className='Panel_Container_Card-Text'>
                        <h2>Лента</h2>
                        <p>Осматривайте недавние картины прямо здесь. Только не забудьте оценить их</p>
                    </div>
                    <div className='Panel_Container_Card-Buttons'>
                        <Button
                            stretched
                            size='m'
                            mode='gradient_blue'
                            onClick={async () => {
                                await this.changeFilter();
                                this.handleObserver();
                            }}
                        >
                            {filter === 'n' ? 'Посмотреть рисунки друзей' : 'Вернуться ко всем рисункам'}
                        </Button>
                    </div>
                </div>
                {
                    picturesFeed.map((game, index) => {
                        const {
                            photo_100,
                            first_name,
                            last_name,
                            frame_type,
                            frame_color
                        } = vk_local_users[game.drawerId];
                        return <div key={`Card-${index}`}>
                            <div onClick={() => {
                                t.setPopout(<ScreenSpinner/>);
                                t.socket.call('users.getById', {id: game.drawerId}, async r1 => {
                                    t.socket.call('games.getByDrawerId', {id: game.drawerId}, async r2 => {
                                        await t.setState({
                                            author: {id: game.drawerId, ...r1.response || {}},
                                            author_works: r2.response,
                                            scrollPositionFeed: document.body.scrollTop
                                        });
                                        t.go('author');
                                        t.setPopout(null);
                                    });
                                });
                            }}>
                                <UserAvatar
                                    size={36}
                                    src={photo_100}
                                    frame={frame_type}
                                    color={frame_color}
                                    iosOptimize={isIos}
                                />
                                <div>
                                    <p>{first_name} {last_name}</p>
                                    <p>{game.Word.nom} · {Math.round((game.endTime - game.startTime) / 1000)}с.</p>
                                </div>
                            </div>
                            <div>
                                <img
                                    alt='picture'
                                    src={game.Picture.url}
                                    style={{
                                        display: activeAnimation.indexOf(index) > -1 && 'none'
                                    }}
                                    onClick={async () => {
                                        if (user[defaultShopItems[1].userAttr] > 0 || user.admin) {
                                            if (user[defaultShopItems[1].userAttr] > 0) {
                                                user[defaultShopItems[1].userAttr] -= 1;
                                                t.setState({user});
                                            }
                                            activeAnimation.push(index);
                                            this.forceUpdate();
                                            t.setPopout(<ScreenSpinner/>);
                                            await new Promise(res => t.socket.call('games.getHistory', {
                                                    id: game.id,
                                                    act: 'animation',
                                                    nfg: !!game.history
                                                }, r => {
                                                    console.log('getHistory', r.response);
                                                    console.log('nfg = ', !!game.history);
                                                    if (r.response) {
                                                        if (typeof r.response === 'object') {
                                                            console.log('setHistory', game);
                                                            game.history = r.response;
                                                            picturesFeed[index] = game;
                                                            t.setState({picturesFeed});
                                                        }
                                                    } else {
                                                        t.setSnackbar(r.error.message || 'Ошибка');
                                                    }
                                                    res(true);
                                                })
                                            )
                                            t.setPopout(null);

                                            await startAnimation(
                                                document.getElementById(`canvas${index}`),
                                                game,
                                                async () => {
                                                    activeAnimation.splice(activeAnimation.indexOf(index), 1);
                                                    this.forceUpdate();
                                                }
                                            );
                                        } else {
                                            t.setSnackbar('Чтобы воспользоваться этим, посетите магазин.', {
                                                buttonText: 'Перейти',
                                                buttonAction: () => t.go('shop')
                                            });
                                        }
                                    }}
                                />
                                <canvas
                                    style={{
                                        display: activeAnimation.indexOf(index) === -1 && 'none'
                                    }}
                                    width={319 * 2} height={319 * 2}
                                    id={`canvas${index}`}
                                />
                            </div>
                            <div>
                                <div
                                    style={{
                                        ...(game.isLiked ? {
                                            background: 'var(--gradient_pink)',
                                            color: 'var(--panel_container_card_background)'
                                        } : {})
                                    }}
                                    onClick={() => {
                                        t.setPopout(<ScreenSpinner/>);
                                        socket.call('pictures.like', {game_id: game.id}, async r => {
                                            if (r.response) {
                                                game.Picture.likes = r.response.likes;
                                                game.isLiked = r.response.isLiked;
                                                picturesFeed[index] = game;
                                                await t.setState({picturesFeed});
                                                this.forceUpdate();
                                            }
                                            t.setPopout(null);
                                        });
                                    }}
                                >
                                    <Icon28LikeOutline width={20} height={20}/>
                                    <span>{shortIntegers(game.Picture.likes)}</span>
                                </div>
                                <div
                                    onClick={() => pictureActions.bind(this)(false, game, this[`pictureActionsButton${index}`])}
                                    ref={(ref) => {
                                        this[`pictureActionsButton${index}`] = ref;
                                    }}
                                >
                                    <Icon28MoreHorizontal width={20} height={20}/>
                                </div>
                                <div onClick={() => {
                                    t.setPopout(<ScreenSpinner/>);
                                    if (t.state.user.admin) {
                                        t.socket.call('admin.removeReportedGame', {game: game.id}, r => {
                                            if (r.response) {
                                                t.setSnackbar('Игрок был наказан.');
                                            } else {
                                                t.setSnackbar('Произошла ошибка.');
                                            }
                                            this.setState({isReported: true});
                                            t.setPopout(null);
                                        });
                                    } else {
                                        t.socket.call('games.report', {game_id: game.id}, r => {
                                            if (r.response) {
                                                t.setSnackbar('Жалоба отправлена');
                                            } else {
                                                t.setSnackbar(r.error.message);
                                            }
                                            this.setState({isReported: true});
                                            t.setPopout(null);
                                        });
                                    }
                                }}>
                                    <Icon28ReportOutline width={20} height={20}/>
                                </div>
                            </div>
                        </div>
                    })
                }
                {
                    spinner &&
                    <div>
                        <Spinner size='small'/>
                    </div>
                }
                <div ref={ref => this.loadingRef = ref} className='LoadingRef'/>
            </div>
        </React.Fragment>
    }

}

Feed.defaultProps = {};

Feed.propTypes = {
    t: PropTypes.object
};

export default Feed;