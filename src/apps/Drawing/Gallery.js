import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {Button, PanelHeader, PanelHeaderBack, ScreenSpinner, Spinner} from "@vkontakte/vkui";
import {
    ctxDrawImageWithRound,
    loadCrossOriginImage, sortUniqueObject,
    vkApiRequest
} from "../../js/utils";
import {getVKUsers} from "../../js/drawerapp/utils";
import {Icon24Back, Icon28DownloadCloudOutline, Icon28PictureOutline} from "@vkontakte/icons";
import {getToken} from "../../js/defaults/bridge_utils";
import {createCanvas} from "canvas";

export class Gallery extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            offset_default: props.t.state.gamesAsDrawer.length,
            limit: 50,
            canGetMore: true,
            prevY: 0,

            mode: 'default'
        };

        this.switchMode = this.switchMode.bind(this);
    }

    componentDidMount() {
        if (this.props.t.state.gamesAsDrawer.length === 0) return;
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
        if (this.props.t.state.scrollPosition) {
            console.log(`Scroll to ${this.props.t.state.scrollPosition}`);
            document.body.scrollTop = this.props.t.state.scrollPosition;
        }
        this.props.t.setState({gamesSaves: []});
    }

    async handleObserver(entities = [{boundingClientRect: {y: 0}}], observer) {
        const
            {y} = entities[0].boundingClientRect,
            {t} = this.props,
            {mode, prevY, limit, canGetMore} = this.state,
            offset = this.state[`offset_${mode}`] || 0
        ;
        if ((prevY === 0 || prevY > y) && canGetMore) {
            this.setState({spinner: true});
            if (mode === 'default') {
                t.socket.call('games.getByDrawerId', {id: t.state.vk_user.id, offset, limit}, async r => {
                    await getVKUsers(r.response.map(value => value.drawerId));
                    const gamesAsDrawer = [...t.state.gamesAsDrawer, ...r.response];
                    t.setState({gamesAsDrawer: sortUniqueObject(gamesAsDrawer)});
                    this.setState({canGetMore: r.response.length > 0, spinner: false});
                    this.forceUpdate();
                });
            } else if (mode === 'saves') {
                const token = await getToken('photos');
                if (token) {
                    const photos = await vkApiRequest('photos.get', {
                        access_token: token,
                        owner_id: t.state.vk_user.id,
                        album_id: t.state.user.albumSavesPictures,
                        offset, count: limit,
                        rev: 1
                    });
                    if (photos.items) {
                        const gamesSaves = [
                            ...t.state.gamesSaves.filter(value => value.drawerId === t.state.vk_user.id), ...await Promise.all(photos.items.map(async value => {
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
                                    ['Word.nom']: value.text.substring(value.text.indexOf(findWord) + findWord.length),
                                    drawerId: t.state.vk_user.id,
                                    savedGame: true,
                                    id: value.id
                                }
                            }))
                        ];
                        t.setState({gamesSaves: sortUniqueObject(gamesSaves)});
                    }
                }
            }
            this.setState({[`offset_${mode}`]: offset + limit});
        }
        this.setState({prevY: y});
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
            {spinner, mode} = this.state,
            currentListName = mode === 'default' ? 'gamesAsDrawer' : 'gamesSaves',
            currentList = t.state[currentListName]
        ;

        return <React.Fragment>
            <PanelHeader
                left={<PanelHeaderBack onClick={t.back}/>}
                separator={false}
            />
            <div className='Panel_Container_Card Panel_Container_Card-TwoCards'>
                <div>
                    <Icon28PictureOutline width={36} height={36}/>
                    <div className='Panel_Container_Card-Text'>
                        <h2>Галерея</h2>
                        <p>{currentList.length === 0 ? 'Тут пока что пусто, вернитесь на главную и вперёд рисовать!' : 'Всё ваше творчество собралось тут, осмотритесь вокруг'}</p>
                    </div>
                    <div className='Panel_Container_Card-Buttons'
                         style={{display: !(t.state.user.albumSavesPictures > -1) && 'none'}}>
                        <Button
                            stretched
                            size='m'
                            mode='gradient_blue'
                            before={mode === 'default' ? <Icon28DownloadCloudOutline width={16} height={16}/> :
                                <Icon24Back width={16} height={16}/>}
                            onClick={this.switchMode}
                        >
                            {mode === 'default' ? 'Сохранённые рисунки' : 'Вернуться к галерее'}
                        </Button>
                    </div>
                </div>
                <div style={currentList.length === 0 ? {display: 'none'} : {}}>
                    <div className='MiniCards'>
                        {
                            currentList.map((value, index) =>
                                <div
                                    className='MiniCard'
                                    key={`Card-${index}`}
                                    onClick={async () => {
                                        await t.setState({
                                            like_currentPictureSelected: index,
                                            like_method: 'games.getByDrawerId',
                                            like_param: currentListName,
                                            like_user_id: t.state.vk_user.id,
                                            scrollPosition: document.body.scrollTop
                                        });
                                        t.go('picture_info');
                                    }}
                                >
                                    <img alt='img' src={value['Picture.url']}/>
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
                </div>
            </div>
        </React.Fragment>
    }

}

Gallery.defaultProps = {};

Gallery.propTypes = {
    t: PropTypes.object
};

export default Gallery;