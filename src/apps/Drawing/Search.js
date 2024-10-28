import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    PanelHeader,
    PanelHeaderBack, SegmentedControl, Input, ScreenSpinner, Spinner
} from "@vkontakte/vkui";

import {
    Icon28SearchOutline,
} from "@vkontakte/icons";
import {decOfNum, getUrlParams, sleep, sortUniqueObject} from "../../js/utils";
import bridge from "@vkontakte/vk-bridge";
import {getVKUsers, vk_local_users} from "../../js/drawerapp/utils";
import {UserAvatar} from "./UserAvatarFrame";

let timeoutInput;

export class Search extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            result: [],
            type: 'author',
            offset: 0,
            limit: 50,
            canGetMore: true,
            prevY: 0,
            fetchEnd: true,
        }

        this.searchAction = this.searchAction.bind(this);
    }

    componentWillUnmount() {
        clearTimeout(timeoutInput);
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
        if (this.props.t.state.scrollPositionSearch) {
            console.log(`Scroll to ${this.props.t.state.scrollPositionSearch}`);
            setTimeout(() => document.body.scrollTop = this.props.t.state.scrollPositionSearch, 800);
        }
    }

    async handleObserver(entities = [{boundingClientRect: {y: 0}}], observer) {
        const
            {y} = typeof entities === 'object' ? entities[0].boundingClientRect : {y: 0},
            {t} = this.props,
            {type, result, fetchEnd, prevY, offset, limit, canGetMore, input} = this.state
        ;
        if (type === 'picture' && input && input.length > 0 && ((entities === 1) || ((prevY === 0 || prevY > y) && canGetMore)) && fetchEnd !== false) {
            await this.setState({spinner: true, fetchEnd: false});
            t.socket.call('pictures.search', {offset, limit, q: input.toLowerCase()}, async r => {
                await getVKUsers(r.response.map(value => value.drawerId));
                const pictures = sortUniqueObject([...result, ...r.response]);
                const canGetMore = r.response.length > 0;
                if (result.length !== 0 && pictures.length !== (result.length + limit) && canGetMore) {
                    await this.setState({
                        canGetMore,
                        offset: offset + limit - (pictures.length - result.length),
                        fetchEnd: true
                    });
                    this.handleObserver();
                    return;
                }
                await this.setState({result: pictures});
                await this.setState({canGetMore, spinner: false, offset: pictures.length});
                this.forceUpdate();
                setTimeout(() => {
                    this.setState({fetchEnd: true});
                    if (this.state.needObserve) {
                        this.observer.observe(this.loadingRef);
                    }
                }, 1000);
            });
        }
        this.setState({prevY: y});
    }

    searchAction() {
        clearTimeout(timeoutInput);
        timeoutInput = setTimeout(async () => {
            const {t} = this.props;
            const {type, input} = this.state;
            if (input && input.length > 0) {
                t.setPopout(<ScreenSpinner/>);

                if (type === 'author') {
                    try {
                        const
                            access_token = (await bridge.send('VKWebAppGetAuthToken', {
                                app_id: parseInt(getUrlParams().vk_app_id),
                                scope: ''
                            })).access_token,
                            users = (await bridge.send('VKWebAppCallAPIMethod', {
                                method: 'users.search',
                                params: {q: input, count: 100, access_token, v: '5.131'}
                            })).response,
                            user_ids = users.items.map(value => value.id),
                            app_users = await new Promise(res => {
                                t.socket.call('users.getById', {ids: user_ids}, async r => {
                                    const ids = r.response.map(value => value.id);
                                    await getVKUsers(ids);
                                    res(ids);
                                })
                            })
                        ;
                        this.setState({result: app_users});
                    } catch (e) {
                        t.setSnackbar('Без доступа мы не можем найти людей :(');
                    }
                } else if (type === 'picture') {
                    this.setState({offset: 0, result: []});
                    await this.handleObserver(1);
                }

                t.setPopout(null);
                this.inputRef.focus();
            } else {
                clearTimeout(timeoutInput);
            }
        }, 800);
    }

    render() {
        const
            {t} = this.props,
            {type, input, result, spinner} = this.state
        ;
        return <React.Fragment>
            <PanelHeader
                left={<PanelHeaderBack onClick={t.back}/>}
                separator={false}
            />
            <div className='Panel_Container_Card Panel_Container_Card-TwoCards'>
                <div>
                    <Icon28SearchOutline width={36} height={36}/>
                    <div className='Panel_Container_Card-Text'>
                        <h2>Поиск</h2>
                    </div>
                    <SegmentedControl
                        value={type}
                        onChange={type1 => {
                            this.setState({type: type1, result: [], offset: 0});
                            if (type !== type1) {
                                if (type1 === 'author') {
                                    this.observer.disconnect();
                                    this.setState({needObserve: false});
                                } else if (type1 === 'picture') {
                                    this.setState({needObserve: true});
                                }
                            }
                            this.searchAction();
                        }}
                        options={[
                            {
                                label: 'Автор',
                                value: 'author'
                            },
                            {
                                label: 'Рисунок',
                                value: 'picture'
                            }
                        ]}
                    />
                    <div>
                        <div className='Span'>
                            Введите {type === 'author' ? 'имя и фамилию' : 'слово'}
                        </div>
                        <Input
                            getRef={ref => this.inputRef = ref}
                            style={{marginTop: 8}}
                            placeholder={type === 'author' ? 'Ольга Коршикова' : 'Банан'}
                            value={input}
                            onChange={e => {
                                const value = e.currentTarget.value;
                                console.log('Input (search), value = ', value);
                                console.log('Math (search) = ', value.match(/^[а-яА-Я-a-zA-Z ]+$/));
                                if ((value.match(/^[а-яА-Я-a-zA-Z ]+$/) || value === '') && value.length <= 200) {
                                    this.setState({input: value});
                                    this.searchAction();
                                }
                            }}
                        />
                    </div>
                </div>
                <div style={{
                    display: !result && 'none',
                    paddingBottom: 12
                }}>
                    <p className='Panel_Container_Card-Header'>
                        {result && decOfNum(result.length, type === 'author' ? ['человек', 'человека', 'людей'] : ['рисунок', 'рисунка', 'рисунков'])}
                    </p>
                    {
                        type === 'author' ?
                            <div className='MiniCards MiniCardsPeople'>
                                {
                                    result && result.map((value, index) => {
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
                            :
                            <div className='MiniCards MiniCardsPicture'>
                                {
                                    result && result.map((value, index) =>
                                        <div
                                            className='MiniCard'
                                            key={`Card-${index}`}
                                            onClick={async () => {
                                                await t.setState({
                                                    games_: result,
                                                    like_currentPictureSelected: index,
                                                    like_method: false,
                                                    like_param: 'games_',
                                                    scrollPositionSearch: document.body.scrollTop
                                                });
                                                t.go('picture_info');
                                            }}
                                        >
                                            <img alt='img' src={value['Picture.url'] || value.Picture.url}/>
                                        </div>
                                    )
                                }
                                {
                                    spinner &&
                                    <div className='MiniCard'>
                                        <Spinner size='small'/>
                                    </div>
                                }
                                <div ref={ref => this.loadingRef = ref} className='LoadingRef'/>
                            </div>
                    }
                </div>
            </div>
        </React.Fragment>
    }
}

Search.defaultProps = {};

Search.propTypes = {
    t: PropTypes.object
};

export default Search;