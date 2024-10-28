import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {PanelHeader, PanelHeaderBack} from "@vkontakte/vkui";
import {
    Icon24Flash
} from "@vkontakte/icons";

export class UserLvlHelp extends PureComponent {
    constructor(props) {
        super(props);
    }

    render() {
        const {t} = this.props;
        const {user} = t.state;
        const palette_percent = Math.min(user.lvl * 10, 100);

        return <React.Fragment>
            <PanelHeader
                left={<PanelHeaderBack onClick={t.back}/>}
                separator={false}
            />
            <div className='Panel_Container_Card Panel_Container_Card-TwoCards'>
                <div>
                    <Icon24Flash width={36} height={36}/>
                    <div className='Panel_Container_Card-Text'>
                        <h2>Уровень</h2>
                        <p>Получайте опыт, рисуя и угадывая картины. С каждым новым уровнем вы разблокируете +10%
                            цветовой палитры.</p>
                    </div>
                    <div className='UserLvl'>
                        <div className='UserLvlProgress'>
                            <div>
                                <div style={{width: 100 / (user.lvl * 100) * user.xp + '%'}}/>
                            </div>
                            <div>
                                <span>{user.xp}XP <span>/</span> {user.lvl * 100}XP</span>
                                <span>LVL {user.lvl}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <p className='Panel_Container_Card-Header'>
                        Сейчас тебе доступно {palette_percent}%
                    </p>
                    <div className='UserLvlTemp'>
                        <div className='Opacity' style={{
                            left: palette_percent + '%'
                        }}/>
                    </div>
                </div>
            </div>
        </React.Fragment>
    }

}

UserLvlHelp.defaultProps = {};

UserLvlHelp.propTypes = {
    t: PropTypes.object
};

export default UserLvlHelp;