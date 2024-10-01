import React, {PureComponent} from 'react';
import bridge from '@vkontakte/vk-bridge';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/panels/Level.css';
import {Input} from "@vkontakte/vkui";
import {ReactComponent as IconStar} from "../../../assets/clickerbattle/star-34.svg";

export class Level extends PureComponent {
    render() {
        const
            {props} = this,
            {t} = props
        ;

        return (
            <div className='Level'>
                <IconStar/>
                <div className='PlayerLvl SlideTitle'>
                    Твой уровень: {t.state.user.lvl}
                </div>
                <div className='PlayerXP SlideSubtitle'>
                    XP до следующего уровня: {100 - t.state.user.xp}<div style={{height: 8}}/>
                    Ты можешь получать XP в результате боёв.<div style={{height: 8}}/>
                    Также за достижение нового уровня даётся кейс.
                </div>
            </div>
        )
    }
}

Level.defaultProps = {};

Level.propTypes = {
    t: PropTypes.object
};

export default Level;