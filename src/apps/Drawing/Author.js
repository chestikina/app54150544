import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    PanelHeader,
    PanelHeaderBack,
    ActionSheet,
    ActionSheetItem, Spinner, ScreenSpinner
} from "@vkontakte/vkui";
import {
    ctxDrawImageWithRound,
    loadCrossOriginImage, openUrl, sortUniqueObject,
    vkApiRequest
} from "../../js/utils";
import {vk_local_users} from "../../js/drawerapp/utils";
import {
    Icon24Back, Icon28Bookmark, Icon28BookmarkOutline, Icon28DownloadCloudOutline,
    Icon28HistoryBackwardOutline,
    Icon28HistoryForwardOutline,
    Icon28SortOutline
} from "@vkontakte/icons";
import {UserAvatar} from "./UserAvatarFrame";
import {getToken} from "../../js/defaults/bridge_utils";
import {createCanvas} from "canvas";

export class Author extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            offset: props.t.state.author_works.length,
            limit: 50,
            canGetMore: true,
            prevY: 0,

            sort: 'DESC',

            mode: 'default'
        };

        this.onChangeSort = this.onChangeSort.bind(this);
        this.switchMode = this.switchMode.bind(this);

        this.state.inBookmarks = !!(props.t.bookmarkAction('f', 0, props.t.state.author.id));
        console.log({inBookmarks: this.state.inBookmarks});
    }

    componentDidMount() {
        console.log({author: this.props.t.state.author});
        this.observer = new IntersectionObserver(
            this.handleObserver.bind(this),
            {
                root: null,
                rootMargin: '0px',
                threshold: 1.0
            }
        );
        this.observer.observe(this.loadingRef);
        const {scrollPositionAuthor} = this.props.t.state;
        if (scrollPositionAuthor) {
            console.log(`Scroll to ${scrollPositionAuthor}`);
            setTimeout(() => document.body.scrollTop = scrollPositionAuthor, 800);
        }
        this.props.t.setState({gamesSaves: []});
    }

    async handleObserver(entities = [{boundingClientRect: {y: 0}}], observer) {
        const
            {y} = entities[0].boundingClientRect,
            {t} = this.props,
            {mode, prevY, limit, canGetMore, sort} = this.state,
            offset = this.state[`offset_${mode}`] || 0
        ;
        if ((prevY === 0 || prevY > y) && canGetMore) {
            this.setState({spinner: true});
            if (mode === 'default') {
                t.socket.call('games.getByDrawerId', {id: t.state.author.id, offset, limit, sort}, async r => {
                    const author_works = [...t.state.author_works, ...r.response];
                    t.setState({author_works: sortUniqueObject(author_works)});
                    this.setState({canGetMore: r.response.length > 0, spinner: false});
                    this.forceUpdate();
                });
            } else if (mode === 'saves') {
                const token = await getToken('photos');
                if (token) {
                    try {
                        const photos = await vkApiRequest('photos.get', {
                            access_token: token,
                            owner_id: t.state.author.id,
                            album_id: t.state.author.albumSavesPictures,
                            offset, count: limit,
                            rev: 1
                        });
                        if (photos.items) {
                            const gamesSaves = [
                                ...t.state.gamesSaves.filter(value => value.drawerId === t.state.author.id), ...await Promise.all(photos.items.map(async value => {
                                    const findWord = 'Слово: ';
                                    const img = await loadCrossOriginImage(value.sizes.find(v => v.width === 1080).url);
                                    const canvas = await createCanvas(899, 899);
                                    const ctx = canvas.getContext('2d');
                                    ctxDrawImageWithRound(
                                        ctx, img,
                                        130,
                                        {x: -90, y: -672, width: img.width, height: img.height},
                                        {x: 0, y: 0, width: canvas.width, height: canvas.height}
                                    );
                                    return {
                                        ['Picture.url']: canvas.toDataURL('image/png'),
                                        ['Word.nom']: value.text.includes(findWord) && value.text.substring(value.text.indexOf(findWord) + findWord.length),
                                        drawerId: t.state.author.id,
                                        savedGame: true,
                                        //allowShow: img.width === 1080,
                                        id: value.id
                                    }
                                }))
                            ];
                            t.setState({gamesSaves: sortUniqueObject(gamesSaves)});
                        }
                    } catch (e) {
                        if ([200, 30].indexOf(e.error_data.error_code) > -1) {
                            t.setSnackbar('Автор скрыл свои работы :(');
                            this.switchMode();
                        }
                    }
                }
            }
            this.setState({[`offset_${mode}`]: offset + limit});
        }
        this.setState({prevY: y});
    }

    async onChangeSort(e) {
        const
            {t} = this.props
        ;
        await this.setState({
            spinner: true,
            sort: e.target.value,
            offset: 0,
            prevY: 0,
            canGetMore: true
        })
        await t.setState({author_works: []});
        this.forceUpdate();
        this.handleObserver();
    }

    switchMode() {
        const {t} = this.props;
        const curMode = this.state.mode;
        const mode = curMode === 'saves' ? 'default' : 'saves';
        t.setPopout(<ScreenSpinner/>);
        if (mode === 'saves') {
            this.setState({mode, canGetMore: true});
            this.handleObserver();
        } else if (mode === 'default') {
            this.setState({mode, canGetMore: true});
            this.handleObserver();
        }
        t.setPopout(null);
    }

    render() {
        const
            {t} = this.props,
            {state, _tags} = t,
            {author} = state,
            vk_user = vk_local_users[author.id],
            {sort, spinner, mode, inBookmarks} = this.state,
            currentListName = mode === 'default' ? 'author_works' : 'gamesSaves',
            currentList = t.state[currentListName],
            sortClick = () => {
                t.setPopout(
                    <ActionSheet
                        onClose={() => t.setPopout(null)}
                        iosCloseItem={
                            <ActionSheetItem autoclose mode='cancel'>
                                Отменить
                            </ActionSheetItem>
                        }
                        toggleRef={this.buttonSort}
                    >
                        <ActionSheetItem
                            autoclose
                            before={<Icon28HistoryForwardOutline/>}
                            onChange={this.onChangeSort}
                            name='sort'
                            value='DESC'
                            checked={sort === 'DESC'}
                            selectable
                        >
                            Сначала новые
                        </ActionSheetItem>
                        <ActionSheetItem
                            autoclose
                            before={<Icon28HistoryBackwardOutline/>}
                            onChange={this.onChangeSort}
                            name='sort'
                            value='ASC'
                            checked={sort === 'ASC'}
                            selectable
                        >
                            Сначала старые
                        </ActionSheetItem>
                    </ActionSheet>
                );
            }
        ;

        return <React.Fragment>
            <PanelHeader
                left={<PanelHeaderBack onClick={t.back}/>}
                separator={false}
            />
            <div className='Profile Author'>
                <div className='UserAvatarCover'>
                    <img alt='cover' src={vk_user.photo_max_orig}/>
                </div>
                <div className='UserInfoContainer'>
                    <UserAvatar
                        size={100}
                        src={vk_user.photo_100}
                        frame={vk_user.frame_type}
                        color={vk_user.frame_color}
                        badge={true}
                        badgeValue={author.online}
                        onClick={() => openUrl(`https://vk.com/id${vk_user.id}`)}
                    />
                    <div className='UserNameTags'>
                        <div className='AuthorName'>
                            <h1>{vk_user.first_name} {vk_user.last_name}</h1>
                        </div>
                        <div className='UserTags'>
                            {
                                (author.active_tags || []).map((value, index) => {
                                    const tag = _tags().find(v => v[0] === value);
                                    return React.cloneElement(tag[1], {
                                        key: `tag${index}`,
                                        onClick: () => t.setActiveModal(tag[0])
                                    });
                                })
                            }
                        </div>
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <div
                            className='Panel_Container_Card-Buttons'
                            style={{
                                width: 'calc(100% - 36px * 2)',
                                marginTop: 24
                            }}
                        >
                            <div
                                className='CustomIconButton'
                                ref={ref => this.buttonSort = ref}
                                onClick={sortClick}
                                style={{
                                    display: mode === 'saves' && 'none'
                                }}
                            >
                                <Icon28SortOutline width={22} height={22}/>
                            </div>
                            <Button
                                stretched
                                size='m'
                                mode='gradient_blue'
                                before={mode === 'default' ? <Icon28DownloadCloudOutline width={16} height={16}/> :
                                    <Icon24Back width={16} height={16}/>}
                                onClick={this.switchMode}
                                style={{
                                    display: !(t.state.author.albumSavesPictures > -1) && 'none'
                                }}
                            >
                                {mode === 'default' ? 'Сохранённые рисунки' : 'Вернуться к галерее'}
                            </Button>
                            <div
                                className='CustomIconButton'
                                onClick={async () => {
                                    t.bookmarkAction(inBookmarks ? 'r' : 'a', 0, author.id);
                                    this.setState({inBookmarks: !inBookmarks});
                                }}
                            >
                                {
                                    !inBookmarks ?
                                        <Icon28BookmarkOutline width={22} height={22}/>
                                        :
                                        <Icon28Bookmark width={22} height={22}/>
                                }
                            </div>
                        </div>
                        <div className='AuthorWorks'>
                            {
                                currentList.map((value, index) =>
                                    <div key={`Image_${index}`} onClick={async () => {
                                        await t.setState({
                                            like_currentPictureSelected: index,
                                            like_method: 'games.getByDrawerId',
                                            like_param: currentListName,
                                            like_user_id: author.id,
                                            scrollPositionAuthor: document.body.scrollTop
                                        });
                                        const {history} = t.state;
                                        if (history[history.length - 1] === 'picture_info') {
                                            t.back();
                                        } else {
                                            t.go('picture_info');
                                        }
                                    }}>
                                        <img alt='img' src={value['Picture.url']}/>
                                    </div>
                                )
                            }
                            {
                                spinner &&
                                <Spinner size='small'/>
                            }
                            <div ref={ref => this.loadingRef = ref} className='LoadingRef'/>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    }
}

Author.defaultProps = {};

Author.propTypes = {
    t: PropTypes.object
};

export default Author;