import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/slides/More.css';
import {ReactComponent as IconDev} from "../../../assets/clickerbattle/dev-24.svg";
import {ReactComponent as IconVK} from "../../../assets/clickerbattle/vk-24.svg";
import {ReactComponent as IconBubble} from "../../../assets/clickerbattle/bubble-24.svg";
import {ReactComponent as IconHistory} from "../../../assets/clickerbattle/history-24.svg";
import {ReactComponent as IconPalette} from "../../../assets/clickerbattle/palette_24.svg";
import {ReactComponent as IconTask} from "../../../assets/clickerbattle/task-24.svg";
import {ReactComponent as IconReferal} from "../../../assets/clickerbattle/referal-24.svg";
import {ReactComponent as IconCase} from "../../../assets/clickerbattle/case-24.svg";
import {openUrl} from "../../../js/utils";

export class More extends PureComponent {
    render() {
        const
            {props} = this,
            {t} = props
        ;

        return (
            <div className='More'>
                <div className='MoreList'>
                    <div onClick={() => t.setState({specificPanelOpened: 6})}>
                        <IconTask/>
                        <div>Задания</div>
                    </div>
                    <div onClick={() => t.setState({specificPanelOpened: 5})}>
                        <IconCase/>
                        <div>Кейсы</div>
                    </div>
                    <div onClick={() => t.setState({specificPanelOpened: 4})}>
                        <IconHistory/>
                        <div>История игр</div>
                    </div>
                    <div onClick={() => t.setState({specificPanelOpened: 3})}>
                        <IconPalette/>
                        <div>Кастомизация</div>
                    </div>
                    <div onClick={() => t.setState({specificPanelOpened: 2})}>
                        <IconReferal/>
                        <div>Рефералы</div>
                    </div>
                    <div onClick={() => t.setState({specificPanelOpened: 1})}>
                        <IconDev/>
                        <div>Разработчикам</div>
                    </div>
                    <div onClick={() => openUrl('https://vk.com/clickerbattle/')}>
                        <IconVK/>
                        <div>Сообщество</div>
                    </div>
                    <div onClick={() => openUrl('https://vk.me/join/U9CKM3k4dnx2o_N8Sfw2s_xVfZ3gj/y45zg=')}>
                        <IconBubble/>
                        <div>Беседа</div>
                    </div>
                </div>
            </div>
        )
    }
}

More.defaultProps = {};

More.propTypes = {
    t: PropTypes.object
};

export default More;