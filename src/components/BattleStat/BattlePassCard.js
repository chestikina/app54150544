import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/BattleStat/BattlePassCard.css';

export class BattlePassCard extends PureComponent {

    constructor(props) {
        super(props);

        let bp_items = [];
        for (let i = 1; i <= 100; i++) {
            if (i === 100) {
                bp_items.push('Крипто');
            } else if (i % 25 === 0) {
                bp_items.push('Легендарный кейс');
            } else if (i % 15 === 0) {
                bp_items.push('Скин');
            } else if (i % 4 === 0) {
                bp_items.push('Эпический кейс');
            } else {
                bp_items.push('Обычный кейс');
            }
        }

        this.state = {
            bp_items
        }
    }

    render() {
        return (
            <div onClick={this.props.onClick} className='BattlePassCard' style={{
                background: `url(${(this.props.user.bp && this.props.user.bpLvl >= 100) ? require('../../assets/icons_battle_stat/bp-background-3.svg') : this.props.user.bp ? require('../../assets/icons_battle_stat/bp-background-2.svg') : ''}), var(--card_background)`,
                backgroundRepeat: 'no-repeat',
                backgroundPositionX: -19,
                backgroundPositionY: -43.41
            }}>
                <img className='BattlePassCard_Icon' src={require('../../assets/icons_battle_stat/bp.svg')} alt='bp' width={42}
                     height={38.25}/>
                <div className='BattlePassCard_Info'>
                    <div>
                        Боевой пропуск
                    </div>
                    <div>
                        {
                            this.props.user.bp ?
                                this.props.user.bpLvl >= 100 ?
                                    'Все награды получены!'
                                    :
                                    <span>Следующая награда: <span
                                        style={{color: '#FFFFFF'}}>{this.state.bp_items[this.props.user.bpLvl]}</span></span>
                                :
                                'Отсутствует'
                        }
                    </div>
                </div>
            </div>
        )
    }

}

BattlePassCard.defaultProps = {
    user: {
        bp: false
    },
    onClick: () => {
    }
};

BattlePassCard.propTypes = {
    user: PropTypes.object,
    onClick: PropTypes.func
};

export default BattlePassCard;