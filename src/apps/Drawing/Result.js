import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    ActionSheet, ActionSheetItem,
    Button,
    IconButton,
    PanelHeader,
    ScreenSpinner,
    UsersStack
} from "@vkontakte/vkui";
import {
    Icon24Like,
    Icon28CancelOutline,
    Icon28LikeOutline,
    Icon28ReportOutline,
    Icon28ShareOutline,
    Icon28DownloadCloudOutline,
    Icon28StoryCircleFillViolet,
    Icon28BugOutline
} from "@vkontakte/icons";
import bridge from "@vkontakte/vk-bridge";
import {
    adAppApi,
    decOfNum,
    getUrlParams,
    isPlatformDesktop,
    loadCrossOriginImage, loadFonts, openUrl
} from "../../js/utils";
import {vk_local_users, getVKUsers} from "../../js/drawerapp/utils";
import {createCanvas} from "canvas";
import {shareAlbum, shareStory} from "./PictureInfo";

const isDesktop = isPlatformDesktop();

/*let tickInterval;*/

let pic_saved = false, warningShow = false;

export class Result extends PureComponent {

    constructor(props) {
        super(props);

        const {drawerId, winnerId, word, t} = props;

        this.state = {
            isDrawer: drawerId === t.state.vk_user.id,
            isWinner: winnerId === t.state.vk_user.id,
            winnerId: winnerId,
            drawerId: drawerId,
            word,

            playAgain: false,
            playAgainTick: 10
        };

        this.shareStory = this.shareStory.bind(this);
        this.back = this.back.bind(this);
        this.checkSavePic = this.checkSavePic.bind(this);
    }

    componentDidMount() {
        loadFonts(['TT Commons Demibold']);
        this.props.t.setState({chooseWords: []});
    }

    async shareStory() {
        this.props.t.setPopout(<ScreenSpinner/>);

        try {
            const
                {isDrawer, isWinner} = this.state,
                type = isDrawer ? 1 : isWinner ? 2 : 3,
                background = await loadCrossOriginImage(`https://photos.avocado.special.vk-apps.com/drawapp_search_images/stories/Story${type}.png`),
                canvas = createCanvas(background.width, background.height),
                ctx = canvas.getContext('2d'),
                {word} = this.state,
                title = word.nom.substring(0, 1).toUpperCase() + word.nom.substring(1)
            ;

            ctx.drawImage(background, 0, 0);

            if (type === 1) {
                ctx.font = '64px TT Commons Demibold';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#616161';
                ctx.fillText(title, 539, 708 + 13 + 489);
            }

            ctx.drawImage(this.imageRef, 198, 618, 683, 683);

            try {
                await bridge.send('VKWebAppShowStoryBox', {
                    background_type: 'image',
                    blob: canvas.toDataURL('image/png'),
                    attachment: {
                        url: 'https://vk.com/app' + getUrlParams().vk_app_id,
                        text: 'go_to',
                        type: 'url'
                    }
                });
                this.props.t.socket.call('games.share', {gameId: this.props.gameId});
                adAppApi('stats.shareStory');
            } catch (e) {
            }
            this.props.t.updateData();
        } catch (e) {
            console.error(e);
            this.props.t.setSnackbar('Произошла ошибка');
        }
        this.props.t.setPopout(null);
    }

    async back() {
        const
            {back, state, socket, setPopout, updateData} = this.props.t,
            {subGameInfo, api_manager, user} = state
        ;
        setPopout(<ScreenSpinner/>);
        try {
            updateData();
        } catch (e) {
        }
        if (api_manager === 1 && subGameInfo.owner_id === user.id) {
            socket.call('friends.leaveLobby', {owner_id: user.id});
        }
        setPopout(null);
        back();
    }

    checkSavePic(game, ref) {
        const {isDrawer, isWinner} = this.state;
        const {t} = this.props;
        const {user, api_manager} = t.state;
        if (pic_saved === false && warningShow === false && (isDrawer || (isWinner && api_manager === 2))) {
            if (t.state.warning_saves < 3) {
                t.setState({warning_saves: t.state.warning_saves + 1});
                t.setAlert(
                    'Вы кое-что забыли!',
                    `Если вы не сохраните рисунок, то он удалится через ${decOfNum(t.privilege ? 30 : 3, ['день', 'дня', 'дней'])}. Советуем Вам его сохранить.`,
                    [
                        {
                            title: 'Сохранить',
                            action: () => {
                                shareAlbum.bind(this)(game);
                                pic_saved = true;
                                if (typeof ref === 'function')
                                    ref();
                                else if (ref)
                                    ref.click();
                            },
                            autoclose: true
                        },
                        {
                            title: 'Не сохранять',
                            action: () => {
                                if (typeof ref === 'function')
                                    ref();
                                else if (ref)
                                    ref.click();
                            },
                            mode: 'cancel',
                            autoclose: true
                        }
                    ],
                    'horizontal'
                );
                warningShow = true;
                return false;
            }
        }
        return true;
    }

    render() {
        let
            {t, gameId} = this.props,
            {vk_user, user, isNotApp, api_manager} = t.state,
            {isDrawer, isWinner, winnerId, drawerId, word, isLiked, playAgain, playAgainTick} = this.state,
            time = Math.round((t.state.gameEnd - t.state.gameStart) / 1000),

            text_data = api_manager === 2 ? (
                [isWinner ? `Ты победил${vk_user.sex === 1 ? 'а' : ''}!` : 'Увы и ах!', `Большинство проголосовало за рисунок ${vk_local_users[winnerId].first_name_gen}`]
            ) : (
                isDrawer ?
                    (
                        winnerId !== 0 ?
                            ['Ты молодец!', `Твою картину угадали за ${decOfNum(time || 0, ['секунду', 'секунды', 'секунд'])}`]
                            :
                            ['Время вышло', 'Никто не угадал, что ты нарисовал']
                    )
                    :
                    (
                        winnerId !== 0 ?
                            (
                                isWinner ?
                                    ['Ты молодец!', `Ты перв${vk_user.sex === 1 ? 'ая' : 'ый'} угадал${vk_user.sex === 1 ? 'а' : ''}, что нарисовал${vk_local_users[drawerId].sex === 1 ? 'а' : ''} ${vk_local_users[drawerId].first_name}`]
                                    :
                                    ['Игра окончена', `${vk_local_users[winnerId].first_name} был${vk_local_users[winnerId].sex === 1 ? 'а' : ''} перв${vk_local_users[winnerId].sex === 1 ? 'ой' : 'ым'}, кто угадал, что изображено на холсте`]
                            )
                            :
                            ['Время вышло', 'Никто не угадал, что художник пытался изобразить']
                    )
            ),
            game = {Word: this.state.word, id: this.props.gameId, ['Picture.url']: t.state.canvas_},
            needShowGameActions = (t.state.subGameInfo && t.state.subGameInfo.data) ? (t.state.subGameInfo.data.saveGame) : true
        ;

        return (
            <React.Fragment>
                {
                    isDesktop ?
                        <IconButton
                            style={{
                                position: 'fixed', top: 49, left: 96, ...(playAgain ? {
                                    visibility: 'hidden',
                                    pointerEvents: 'none'
                                } : {})
                            }}
                            onClick={() => {
                                if (!this.checkSavePic(game, this.back)) return;
                                this.back();
                            }}
                        >
                            <Icon28CancelOutline fill='#F15F8A'/>
                        </IconButton>
                        :
                        <PanelHeader separator={false} left={
                            <IconButton
                                style={playAgain ? {visibility: 'hidden', pointerEvents: 'none'} : {}}
                                onClick={() => {
                                    if (!this.checkSavePic(game, this.back)) return;
                                    this.back()
                                }}
                            >
                                <Icon28CancelOutline fill='#F15F8A'/>
                            </IconButton>}
                        />
                }
                <div className='Result_New'>
                    {
                        (word && word.nom) &&
                        <h2>{word.nom.substring(0, 1).toUpperCase() + word.nom.substring(1)}</h2>
                    }
                    <div className='Canvas_Container'>
                        <img alt='canvas' src={t.state.canvas_} ref={ref => this.imageRef = ref}/>
                    </div>
                    <h1>{text_data[0]}</h1>
                    <p>{text_data[1]}</p>
                    {
                        !playAgain ?
                            <React.Fragment>
                                <Button
                                    style={{marginTop: '6.89655172vh'}}
                                    stretched size='l' mode='gradient_pink'
                                    getRef={ref => this.playAgainButton = ref}
                                    onClick={async () => {
                                        if (!this.checkSavePic(game, this.playAgainButton)) return;

                                        const {socket, state} = this.props.t, {subGameInfo} = state;
                                        await t.actionAfterGame(true);
                                        t.updateData();
                                        if (api_manager === 1) {
                                            t.setPopout(<ScreenSpinner/>);
                                            socket.call('friends.joinLobby', {owner_id: subGameInfo.owner_id}, async r => {
                                                if (r.response) {
                                                    await getVKUsers(r.response.members);
                                                    await t.setState({friend_lobby: r.response});
                                                    if (t.vkChatIntegration || t.isFromCatalogChat) {
                                                        t.setActivePanel('friend_lobby', ['main']);
                                                    } else {
                                                        t.setActivePanel('friend_lobby', ['main', 'friends']);
                                                    }
                                                } else {
                                                    if (t.vkChatIntegration || t.isFromCatalogChat) {
                                                        t.setActivePanel('main');
                                                    } else {
                                                        t.setActivePanel('friends', ['main']);
                                                    }
                                                }
                                                t.showNewAd();
                                                t.setPopout(null);
                                            });
                                        } else {
                                            t.setActivePanel('search_game', ['main']);
                                            t.showNewAd();
                                        }
                                    }}
                                >
                                    Играть ещё раз
                                </Button>
                                <div style={{
                                    display: 'flex',
                                    gap: 8,
                                    marginTop: 8,
                                    width: '100%'
                                }}>
                                    <Button
                                        stretched size='l' mode='pink_secondary'
                                        before={<Icon28ShareOutline width={16} height={16}/>}
                                        getRef={ref => this.shareButton = ref}
                                        onClick={() => {
                                            t.setPopout(
                                                <ActionSheet
                                                    onClose={() => t.setPopout(null)}
                                                    iosCloseItem={
                                                        <ActionSheetItem autoclose mode='cancel'>
                                                            Отменить
                                                        </ActionSheetItem>
                                                    }
                                                    toggleRef={this.shareButton}
                                                >
                                                    <ActionSheetItem
                                                        autoclose
                                                        before={<Icon28StoryCircleFillViolet/>}
                                                        onClick={() => {
                                                            shareStory.bind(this)(game);
                                                        }}
                                                    >
                                                        Поделиться в истории
                                                    </ActionSheetItem>
                                                    <ActionSheetItem
                                                        autoclose
                                                        before={<Icon28BugOutline/>}
                                                        onClick={() => {
                                                            const logs = JSON.stringify(t.state.game_logs);
                                                            bridge.send('VKWebAppCopyText', {text: logs});
                                                            t.setSnackbar(
                                                                'Логи скопированы', {
                                                                    buttonText: 'Отправить',
                                                                    buttonAction: () => openUrl('https://vk.com/write-208964042')
                                                                }
                                                            );
                                                        }}
                                                    >
                                                        Скопировать логи
                                                    </ActionSheetItem>
                                                </ActionSheet>
                                            );
                                        }}
                                    >
                                        Поделиться
                                    </Button>
                                    {
                                        (isDrawer || (isWinner && api_manager === 2)) &&
                                        <Button
                                            stretched size='l' mode='pink_secondary'
                                            before={<Icon28DownloadCloudOutline width={16} height={16}/>}
                                            onClick={() => {
                                                shareAlbum.bind(this)(game);
                                                pic_saved = true;
                                            }}
                                        >
                                            Сохранить
                                        </Button>
                                    }
                                </div>
                            </React.Fragment>
                            :
                            <React.Fragment>
                                <Button
                                    style={{marginTop: '6.89655172vh'}}
                                    stretched size='l' mode='pink_secondary'
                                    onClick={() => {

                                    }}
                                >
                                    <div style={{opacity: .5, display: 'flex', flexDirection: 'column'}}>
                                        <span>Ждём остальных</span>
                                        <span style={{fontSize: 11, marginTop: -4}}>{playAgainTick} с.</span>
                                    </div>
                                </Button>
                                <UsersStack
                                    style={{marginTop: 12}}
                                    photos={[
                                        vk_user.photo_100
                                    ]}
                                    size='m'
                                    visibleCount={5}
                                />
                            </React.Fragment>
                    }
                    <div className='Actions_Container'>
                        {
                            needShowGameActions &&
                            <IconButton
                                onClick={() => {
                                    t.setPopout(<ScreenSpinner/>);
                                    t.socket.call('pictures.like', {game_id: gameId}, r => {
                                        if (r.response) {
                                            this.setState({isLiked: r.response.isLiked});
                                        } else {
                                            t.setSnackbar(r.error.message);
                                        }
                                        t.setPopout(null);
                                    });
                                }}
                            >
                                {
                                    isLiked ?
                                        <Icon24Like fill='#F16384' width={28} height={28}/>
                                        :
                                        <Icon28LikeOutline fill='var(--color_secondary)'/>
                                }
                            </IconButton>
                        }
                        {
                            (!isDrawer && (api_manager === 2 ? !isWinner : true)) && needShowGameActions &&
                            <IconButton
                                onClick={() => {
                                    t.setPopout(<ScreenSpinner/>);
                                    t.socket.call('games.report', {game_id: gameId}, r => {
                                        if (r.response) {
                                            t.setSnackbar('Жалоба отправлена');
                                        } else {
                                            t.setSnackbar('Жалоба уже отправлена');
                                        }
                                        t.setPopout(null);
                                    });
                                }}
                            >
                                <Icon28ReportOutline fill='var(--color_secondary)'/>
                            </IconButton>
                        }
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

Result.defaultProps = {};

Result.propTypes = {
    t: PropTypes.object,
    drawerId: PropTypes.number,
    winnerId: PropTypes.number,
    word: PropTypes.object,
    gameId: PropTypes.number
};

export default Result;