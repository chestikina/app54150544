import React, {PureComponent} from 'react';
import bridge from '@vkontakte/vk-bridge';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/panels/GameResult.css';
import Background from "../../../components/ClickerBattle/Background";
import Person from "../../../assets/clickerbattle/persons/Person";
import {ReactComponent as IconEnergy} from "../../../assets/clickerbattle/energy-36.svg";
import {ReactComponent as IconStar} from "../../../assets/clickerbattle/star-36.svg";
import Button from "../../../components/ClickerBattle/Button";
import {
    decOfNum,
    getRandomInt,
    getSrcUrl,
    getUrlParams,
    loadFonts,
    viewportToPixels
} from "../../../js/utils";
import {
    getVKUsers
} from '../../../js/drawerapp/utils';
import Case from "../../../components/ClickerBattle/Case";
import vkQr from "@vkontakte/vk-qr";
import {ScreenSpinner} from "@vkontakte/vkui";

export class GameResult extends PureComponent {
    constructor(props) {
        super(props);
        const
            {state} = props.t,
            {user, persons, enemy, game_result} = props.t.state
        ;

        this.state = {
            isWinner: game_result.winner === user.id,
            playerNum: game_result.player1 === user.id ? '1' : '2',
            enemyNum: game_result.player1 === enemy.id ? '1' : '2',
            enemyPersonId: persons.find(value => value.id === enemy.activePerson).id,
            myPersonId: persons.find(value => value.id === user.activePerson).id,
            ids: []
        };

        this.state.enemyPersonName = persons[persons.findIndex(value => value.id === this.state.enemyPersonId)].file_name;
        this.state.enemyPersonSkin = enemy.activeSkins[this.state.enemyPersonId] !== undefined ? persons[persons.findIndex(value => value.id === this.state.enemyPersonId)].skins[enemy.activeSkins[this.state.enemyPersonId]] : 'standart';

        this.state.myPersonName = persons[persons.findIndex(value => value.id === this.state.myPersonId)].file_name;
        this.state.myPersonSkin = user.activeSkins[this.state.myPersonId] !== undefined ? persons[persons.findIndex(value => value.id === this.state.myPersonId)].skins[user.activeSkins[this.state.myPersonId]] : 'standart';

        if (this.state.isWinner && user.xp + game_result.xp >= 100) {
            setTimeout(async () => {
                await this.setState({placeholder: true});
                setTimeout(() => {
                    this.setState({placeholder: false});
                }, 2000);
            }, 400)
        }
    }

    async componentDidMount() {
        loadFonts(['TT Commons Bold', 'Manrope ExtraBold']);
        this.setState({ids: await getVKUsers([this.props.t.state.game_result.winner, this.props.t.state.game_result.loser])});
    }

    render() {
        const
            {props, state} = this,
            {t} = props,
            {user, persons, enemy, game_result} = t.state,
            {isWinner, enemyPersonId, placeholder, enemyPersonName, enemyPersonSkin, myPersonName, myPersonSkin, ids, playerNum, enemyNum} = state
        ;

        return (
            <div className='GameResult'>
                <div className='GameGiftContainer' style={{opacity: placeholder ? 1 : 0}}>
                    <div>
                        <div>
                            Получена награда
                        </div>
                        <div>
                            {
                                user.lvl === 100 ?
                                    <React.Fragment>
                                        <Case name='caseMystic' size={120}/>
                                        <div>
                                            Мистический кейс
                                        </div>
                                    </React.Fragment>
                                    :
                                    <React.Fragment>
                                        <Case name='caseStandart' size={120}/>
                                        <div>
                                            Обычный кейс
                                        </div>
                                    </React.Fragment>
                            }
                        </div>
                    </div>
                </div>
                <div className='HeaderBackground' style={{
                    height: '12vh'
                }}/>
                <div className='PlayerContainer'>
                    <Person
                        name={enemyPersonName}
                        skin={enemyPersonSkin}
                        height={viewportToPixels('33.87vh')}
                    />
                </div>
                <div className='GameResultTitle'>
                    {isWinner ? 'Вы выиграли' : 'Вы проиграли'}
                </div>
                <div className='GameResultItemsContainer'>
                    <div>
                        <IconEnergy/>
                        <div>
                            -{game_result.energy}
                        </div>
                    </div>
                    <div>
                        <IconStar/>
                        <div>
                            {isWinner ? '+' : '-'}{game_result.xp}
                        </div>
                    </div>
                </div>
                <Button
                    className='NextButton'
                    onClick={async () => {
                        await t.updateUserData();
                        if (getRandomInt(1, 2) === 2) {
                            try {
                                await bridge.send('VKWebAppShowNativeAds', {ad_format: 'preloader'});
                            } catch (e) {
                            }
                        }
                        t.setState({activePanel: 'main', slideBarIndex: 0});
                    }}
                >
                    Продолжить
                </Button>
                <Button
                    onClick={() => {
                        t.setState({popout: <ScreenSpinner/>});

                        const
                            {createCanvas, loadImage} = require('canvas'),
                            personWinner = document.createElement('img'),
                            personLoser = document.createElement('img')
                        ;

                        personWinner.onload = () => {
                            loadImage(getSrcUrl(require('../../../assets/clickerbattle/stories/Winner.png'))).then(async background => {
                                const
                                    canvas = createCanvas(background.width, background.height),
                                    ctx = canvas.getContext('2d'),
                                    clicksWinner = game_result['clicks' + (isWinner ? playerNum : enemyNum)],
                                    clicksLoser = game_result['clicks' + (isWinner === false ? playerNum : enemyNum)]
                                ;
                                ctx.drawImage(background, 0, 0);

                                ctx.textAlign = 'center';
                                ctx.fillStyle = '#FFFFFF';

                                ctx.font = '144px TT Commons Bold';
                                ctx.fillText(isWinner ? 'Я победил' : 'Я проиграл', 540.5, 236 + 30);
                                ctx.fillText(isWinner ? ids[1].first_name_acc : ids[0].first_name_dat, 540.5, 388 + 30);

                                ctx.drawImage(personWinner, 624, 541, 496, 576);

                                personLoser.onload = async () => {
                                    ctx.drawImage(personLoser, 123, 721, 496, 576);

                                    ctx.font = '42px Manrope ExtraBold';
                                    ctx.fillText(decOfNum(clicksWinner, ['клик', 'клика', 'кликов']), 871, 515.5 + 16);
                                    ctx.fillText(decOfNum(clicksLoser, ['клик', 'клика', 'кликов']), 370, 695.5 + 16);

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

                                        t.client.emit('games.share', {game_id: game_result.id}, async response => {
                                            await t.updateUserData();
                                            t.setState({activePanel: 'main', slideBarIndex: 0});
                                            t.setState({popout: null});
                                        });
                                    } catch (e) {
                                        t.setState({popout: null});
                                    }
                                };

                                personLoser.src = require(`../../../assets/clickerbattle/persons/${!isWinner ? myPersonName : enemyPersonName}_${!isWinner ? myPersonSkin : enemyPersonSkin}.svg`);
                            });
                        };

                        personWinner.src = require(`../../../assets/clickerbattle/persons/${isWinner ? myPersonName : enemyPersonName}_${isWinner ? myPersonSkin : enemyPersonSkin}.svg`);
                    }}
                    className='ShareButton'
                    after={`+${decOfNum(game_result.energy, ['энергия', 'энергии', 'энергии'])}`}
                >
                    Поделиться
                </Button>
                <Background arenaOpacity={.06} fogOpacity={.35}/>
            </div>
        )
    }
}

GameResult.defaultProps = {
    t: {}
};

GameResult.propTypes = {
    t: PropTypes.object
};

export default GameResult;