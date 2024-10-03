import React, {PureComponent} from 'react';
import bridge from '@vkontakte/vk-bridge';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/panels/Cases.css';
import Case from "../../../components/ClickerBattle/Case";
import {ReactComponent as IconChevron} from "../../../assets/clickerbattle/chevron_left_outline_24.svg";
import Button from "../../../components/ClickerBattle/Button";
import {decOfNum} from "../../../js/utils";

export class Cases extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            shown: false
        }
    }

    showCaseInfo(id) {
        return;
        const caseContainer = document.getElementById(id);
        if (caseContainer.style.minHeight === '160px') {
            caseContainer.style.minHeight = '0';
            document.getElementById(id + '_').remove();
        } else {
            caseContainer.style.minHeight = '160px';
            const info = document.createElement('div');
            info.className = 'CaseInfo';
            info.id = id + '_';
            document.getElementById(id).appendChild(info);
        }
    }

    render() {
        const
            {props, state} = this,
            {t} = props,
            {shown, popout, popoutHint} = state
        ;

        return (
            <div className='Cases'>
                {popout && <div className='CaseOpenPopout'>
                    {popout}
                    <div className='CaseOpenPopoutHint' style={{opacity: !popoutHint && 0}}>
                        Нажимайте, чтобы открыть
                    </div>
                </div>}
                <div className='SlideTitle'>
                    Кейсы
                </div>
                <div className='SlideDescription'>
                    Кейсы содержат в себе уникальные предметы.<br/><br/>
                    Каждый из них отличается шансом на получение редчайших предметов.
                </div>
                <div className='CaseList'>
                    {
                        [
                            ['caseStandart', 'Обычный кейс', 'Содержит клики, опыт, и в редком случае персонажа.'],
                            ['caseEpic', 'Эпический кейс', 'Содержит баннер и курсор.'],
                            ['caseLeg', 'Легендарный кейс', 'Кейс с огромным количеством предметов, по сравнению с эпическим.'],
                            ['caseMystic', 'Мистический кейс', 'Содержит как минимум одного персонажа.']
                        ].map((value, index) => {
                            const id = `case_item_${value[0]}`;
                            return <div key={'cases_' + index} id={id}
                                        style={{
                                            marginTop: index > 0 && 12,
                                            opacity: (shown !== false && shown !== index) && .15,
                                            minHeight: shown === index ? (t.state.user[value[0]] > 0 ? 140 : 90) : 0
                                        }}
                                        onClick={() => {
                                            if (shown === index)
                                                this.setState({shown: false});
                                            else
                                                this.setState({shown: index});

                                            this.showCaseInfo(id);
                                        }}>
                                <div className='CaseItem'>
                                    <div className='CaseIcon'>
                                        <Case name={value[0]} size={28}/>
                                    </div>
                                    <div className='CaseTitle'>
                                        {value[1]}
                                        {(t.state.user[value[0]] > 0 && (shown === false && shown !== index)) &&
                                        <span style={{
                                            color: 'rgba(135, 120, 103, 0.5)',
                                            marginLeft: 5
                                        }}>{t.state.user[value[0]]}шт</span>}
                                    </div>
                                    <IconChevron style={{
                                        transform: shown === index && 'rotate(-180deg)'
                                    }}/>
                                </div>
                                {
                                    shown === index &&
                                    <React.Fragment>
                                        <div className='CaseInfoText'>
                                            {value[2]}
                                            У Вас {decOfNum(t.state.user[value[0]], ['кейс', 'кейса', 'кейсов'])}.
                                        </div>
                                        {t.state.user[value[0]] > 0 &&
                                        <Button
                                            onClick={() => {
                                                t.client.emit('cases.open', {name: value[0]}, async data => {
                                                    console.log(data);
                                                    this.setState({
                                                        popoutHint: true,
                                                        popout:
                                                            <Case
                                                                t={t}
                                                                onOpened={() => {
                                                                    this.setState({popout: null, popoutHint: false});
                                                                    t.updateUserData();
                                                                    setTimeout(() => {
                                                                        this.forceUpdate();
                                                                    }, 100);
                                                                }}
                                                                onClick={() => {
                                                                    this.setState({popoutHint: false});
                                                                }}
                                                                size={125}
                                                                name={value[0]}
                                                                animation={true}
                                                                item={data.response}
                                                            />
                                                    })
                                                });
                                            }}
                                            className='ButtonOpen'
                                        >
                                            Открыть
                                        </Button>
                                        }
                                    </React.Fragment>
                                }
                            </div>
                        })
                    }
                </div>
            </div>
        )
    }
}

Cases.defaultProps = {};

Cases.propTypes = {
    t: PropTypes.object
};

export default Cases;