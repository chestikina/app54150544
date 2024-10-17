import React, {PureComponent} from 'react';
import bridge from '@vkontakte/vk-bridge';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/panels/Achievements.css';
import {Avatar} from "@vkontakte/vkui";
import Button from "../../../components/ClickerBattle/Button";
import {ReactComponent as IconTrophy} from "../../../assets/clickerbattle/achievements_icon/trophy-36.svg";
import {ReactComponent as IconPlay} from "../../../assets/clickerbattle/achievements_icon/play-36.svg";
import {ReactComponent as IconStar} from "../../../assets/clickerbattle/achievements_icon/star-36.svg";
import {ReactComponent as IconFast} from "../../../assets/clickerbattle/achievements_icon/fast-36.svg";
import {ReactComponent as IconAdd} from "../../../assets/clickerbattle/achievements_icon/add-36.svg";
import {ReactComponent as IconNotify} from "../../../assets/clickerbattle/achievements_icon/notify-36.svg";
import {ReactComponent as IconMessages} from "../../../assets/clickerbattle/achievements_icon/messages-36.svg";

import {ReactComponent as IconComplete} from "../../../assets/clickerbattle/achievements_icon/check-24.svg";
import {decOfNum, numToStr} from "../../../js/utils";

export class Achievements extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            serverAchievements: [],
            standartAchievements: [],
            completedAchievements: [],
            completedStandartAchievements: [],
        };

        props.t.client.emit('achievements.get', {}, response => {
            this.setState({serverAchievements: response.response});
        });

        props.t.client.emit('achievements.getStandart', {}, response => {
            this.setState({standartAchievements: response.response});
        });

        props.t.client.emit('achievements.getCompleted', {}, response => {
            this.setState({
                completedStandartAchievements: response.response.filter(value => value.is_standart).map(value => value.achievement_id),
                completedAchievements: response.response.filter(value => !value.is_standart).map(value => value.achievement_id)
            });
        });
    }

    achievements() {
        return [
            {
                icon: <IconTrophy/>,
                title: 'Победитель',
                description: 'Победить n',
                words: ['противника', 'противника', 'противников']
            },
            {
                icon: <IconPlay/>,
                title: 'Активный',
                description: 'Сыграй n за день',
                words: ['матч', 'матча', 'матчей']
            },
            {
                icon: <IconStar/>,
                title: 'Лидер',
                description: 'Займи n в сегодняшнем топе',
                word: 'место'
            },
            {
                icon: <IconFast/>,
                title: 'Скорострел',
                description: 'Закончи битву за n',
                words: ['секунду', 'секундны', 'секунд']
            },
            {
                title: 'Поддавки',
                description: 'Поддайся врагу n',
                words: ['раз', 'раза', 'раз']
            },
            {
                title: 'Игроман',
                description: 'Проведи сегодня на ринге n',
                words: ['минуту', 'минуты', 'минут']
            },
            {
                title: 'Быстрая рука',
                description: 'Сделай n за день',
                words: ['клик', 'клика', 'кликов']
            }
        ];
    }

    render() {
        const
            {props, state} = this,
            {t} = props,
            {serverAchievements, standartAchievements, completedAchievements, completedStandartAchievements} = state,
            remainingMinutes_ = Math.floor(
                Math.abs(
                    24 * 60 - (new Date().getMinutes() + new Date().getHours() * 60) + (12 * 60)
                )
            ),
            remainingMinutes = remainingMinutes_ > 24 * 60 ? remainingMinutes_ - 24 * 60 : remainingMinutes_,
            remainingHours = Math.floor(remainingMinutes / 60),
            isShowHours = remainingMinutes >= 60
        ;

        let achievementsSeparator = false;

        console.log({standartAchievements, completedStandartAchievements});

        return (
            <div className='Achievements'>
                <div className='SlideTitle'>
                    Задания
                </div>
                <div className='SlideDescription'>
                    Новые задания появятся
                    через {decOfNum(isShowHours ? remainingHours : remainingMinutes, isShowHours ? ['час', 'часа', 'часов'] : ['минуту', 'минуты', 'минут'])}.
                </div>
                <div className='AchievementList'>
                    {
                        [...serverAchievements, ...standartAchievements]
                            .map((value, index) => {
                                const
                                    isStandart = value.type === undefined,
                                    data = !isStandart ? this.achievements()[value.type] : value,
                                    {
                                        icon, title, description, words, word
                                    } = data,
                                    {
                                        award, act
                                    } = value,
                                    act_ = word ? `${numToStr(act)} ${word}` : decOfNum(act, words),
                                    achievementCompleted = (isStandart ? completedStandartAchievements : completedAchievements).indexOf(value.id) >= 0,
                                    needSeparator = isStandart && achievementsSeparator === false
                                ;
                                if (needSeparator)
                                    achievementsSeparator = true;

                                return <React.Fragment key={'achievements_' + index}>
                                    {
                                        needSeparator && <div className='Spacing'/>
                                    }
                                    <div className='Achievement' onClick={async () => {
                                        if (isStandart && achievementCompleted === false) {
                                            try {
                                                await bridge.send(value.vkBridgeMethod, value.vkBridgeParameters);
                                                await t.client.emit('achievements.completeStandart', {achievement_id: value.id}, response => {
                                                    if (response.response) {
                                                        this.setState({
                                                            completedStandartAchievements: [...completedStandartAchievements, value.id]
                                                        });
                                                    }
                                                });
                                            } catch (e) {
                                            }
                                        }
                                    }}>
                                        {icon && <div className='AchievementIcon'>
                                            {isStandart ?
                                                <img
                                                    src={require('../../../assets/clickerbattle/achievements_icon/' + icon)}/> : icon}
                                        </div>}
                                        <div className='AchievementText' style={{
                                            marginLeft: icon && 6
                                        }}>
                                            <div>
                                                <div className='AchievementTitle'>
                                                    {title}
                                                </div>
                                                {
                                                    description &&
                                                    <div className='AchievementDescription'>
                                                        {description.replace('n', act_)}
                                                    </div>
                                                }
                                            </div>
                                            <div style={achievementCompleted ? {
                                                minWidth: 44,
                                                minHeight: 44,
                                                maxWidth: 44,
                                                maxHeight: 44
                                            } : {}}>
                                                {
                                                    achievementCompleted ?
                                                        <IconComplete/>
                                                        :
                                                        `+${award}`
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </React.Fragment>
                            })
                    }
                </div>
            </div>
        )
    }
}

Achievements.defaultProps = {};

Achievements.propTypes = {
    t: PropTypes.object
};

export default Achievements;