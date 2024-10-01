import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/slides/BattlePass.css';
import {ReactComponent as IconInfo} from "../../../assets/clickerbattle/info_28.svg";
import {ReactComponent as IconBack} from "../../../assets/clickerbattle/back_28.svg";
import {ReactComponent as AwardVector} from "../../../assets/clickerbattle/bp_award_vector.svg";
import {ReactComponent as AwardLock} from "../../../assets/clickerbattle/bp_award_lock.svg";
import Case from "../../../components/ClickerBattle/Case";
import {decOfNum, isPlatformIOS, openUrl} from "../../../js/utils";
import Button from "../../../components/ClickerBattle/Button";

export class BattlePass extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            more: false,
        };

        const items = [];
        for (let i = 1; i <= 100; i++) {
            if (i % 20 === 0)
                items.push('caseLeg');
            else if (i % 3 === 0)
                items.push('caseEpic');
            else
                items.push('caseStandart');
        }

        this.state.awards = items;
    }

    render() {
        const
            {props, state} = this,
            {t} = props,
            {more, awards} = state
        ;

        return (
            <div className='BattlePass'>
                <div style={{
                    display: more ? 'block' : 'none',
                    pointerEvents: !more && 'none'
                }}>
                    <div className='BattlePassTextContainer'>
                        <IconBack className='BPBackIcon'
                                  onClick={() => {
                                      this.setState({more: !more});
                                  }}/>
                        <div style={{marginLeft: 38}}>
                            <div className='SlideTitle'>
                                Боевой пропуск
                            </div>
                            <div className='SlideDescription'>
                                До окончания
                                осталось {decOfNum(Math.floor((new Date(2022, 11, 1).getTime() - Date.now()) / 1000 / 60 / 60 / 24), ['день', 'дня', 'дней'])}
                            </div>
                        </div>
                    </div>
                    <div style={{height: 18}}/>
                    <div className='BPFutures'>
                        {
                            [
                                {
                                    title: 'Увеличенный лимит переводов',
                                    description: 'до 500 000 кликов'
                                },
                                {
                                    title: 'Множители кликов в каждом бою',
                                },
                                {
                                    title: 'Награды за каждый новый уровень',
                                },
                                {
                                    title: 'Возможность получить скины, баннеры и курсоры',
                                },
                                {
                                    title: 'В два раза больше кликов за приглашение друзей',
                                },
                            ].map((value, i) =>
                                <div key={`bp_div_${i}`} className='BPFuture'>
                                    <img
                                        src={require(`../../../assets/clickerbattle/bp_futures/bp_future_${i + 1}.svg`)}/>
                                    <div className='BPFutureTitle'>
                                        {value.title}
                                    </div>
                                    {value.description &&
                                    <div className='BPFutureDescription'>
                                        {value.description}
                                    </div>}
                                </div>
                            )
                        }
                    </div>
                    {
                        !t.state.user.bp &&
                        <div className='BPButtonBuy'>
                            {isPlatformIOS() || true ?
                                <Button
                                    onClick={() => {
                                        /*
                                        try {
                                            await bridge.send('VKWebAppAllowMessagesFromGroup', {group_id: 173263813});
                                            await bridge.send('VKWebAppSendPayload', {
                                                group_id: 173263813,
                                                payload: {act: 'skin', data: {person: person_info.id, skin}}
                                            });
                                        } catch (e) {
                                        }
                                        openUrl('https://vk.me/clickerbattle');
                                        */
                                        //t.setState({market_data: {act: 'bp', data: {}}, activePanel: 'market_placeholder'});
                                        if (isPlatformIOS()) {
                                            t.setState({activePanel: 'market_placeholder'});
                                        } else {
                                            t.setState({activePanel: 'bp_placeholder'});
                                        }
                                    }}
                                    style={{margin: '0 22px'}}
                                >
                                    Подробнее
                                </Button>
                                :
                                <Button
                                    onClick={() => {
                                        t.client.emit('battlepass.buy', {}, data => {
                                            const {payUrl, comment} = data.response;
                                            t.setState({
                                                activeModal: require('../ClickerBattle').MODAL_CARD_PAYMENT,
                                                modalPaymentData: {payUrl, comment, price: 199}
                                            });
                                        });
                                    }}
                                    after={199} style={{margin: '0 22px'}}
                                >
                                    Купить
                                </Button>}
                        </div>
                    }
                </div>
                <div style={{
                    display: !more ? 'block' : 'none',
                    pointerEvents: more && 'none'
                }}>
                    <div className='BattlePassTextContainer'>
                        <IconInfo className='BPInfoIcon'
                                  onClick={() => {
                                      this.setState({more: !more});
                                  }}/>
                        <div className='SlideTitle'>
                            Боевой пропуск <span style={{
                            fontSize: 24,
                            opacity: .5
                        }}>{decOfNum(Math.floor((new Date(2022, 11, 1).getTime() - Date.now()) / 1000 / 60 / 60 / 24), ['день', 'дня', 'дней'])}</span>
                        </div>
                        <div className='SlideDescription'>
                            Ваш уровень: {t.state.user.bpLvl}
                        </div>
                    </div>
                    <div className='BPProgress'>
                        <div style={{width: `${t.state.user.bpXp}%`}}/>
                    </div>
                    <div style={{height: 18}}/>
                    <div className='BPAwards'>
                        {
                            awards.map((value, i_) => {
                                const
                                    i = i_ + 1,
                                    awardGet = (i_ + 1) <= t.state.user.bpLvl,
                                    award = <div className='AwardLVLText'>
                                        {
                                            !awardGet &&
                                            <div className='AwardLocked'>
                                                <AwardLock/>
                                            </div>
                                        }
                                        <Case style={{opacity: !awardGet && .25}} name={value} size={120}/>
                                        <div>Уровень {i_ + 1}</div>
                                    </div>
                                ;
                                return <div key={`bp_2_div_${i}`} className='BPAwardContainer' style={{
                                    float: i % 2 === 0 ? 'right' : 'left'
                                }}>
                                    {
                                        i % 2 === 0 ?
                                            <React.Fragment>
                                                {
                                                    i_ < awards.length - 1 &&
                                                    <AwardVector className='BPAwardVectorLeft'/>
                                                }
                                                {award}
                                            </React.Fragment>
                                            :
                                            <React.Fragment>
                                                {award}
                                                {
                                                    i_ < awards.length - 1 &&
                                                    <AwardVector className='BPAwardVectorRight'/>
                                                }
                                            </React.Fragment>

                                    }
                                </div>
                            })
                        }
                    </div>
                </div>
            </div>
        )
    }
}

BattlePass.defaultProps = {};

BattlePass.propTypes = {
    t: PropTypes.object
};

export default BattlePass;