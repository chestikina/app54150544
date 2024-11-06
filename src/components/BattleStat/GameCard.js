import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/BattleStat/GameCard.css';

export class GameCard extends PureComponent {

    render() {
        const {game, onClick} = this.props;
        const
            sec = Math.ceil((Date.now() - game.endTime) / 1000),
            min = Math.ceil(sec / 60),
            days = Math.ceil(min / 60 / 24)
        ;

        return (
            <div className='GameCard' onClick={onClick}>
                <div>
                    <div>
                        <img src={game.photo1} alt='avatar' className='Avatar'/>
                        <span>{game.clicks1}</span>
                    </div>
                    <div>
                        <img src={game.photo2} alt='avatar' className='Avatar'/>
                        <span>{game.clicks2}</span>
                    </div>
                </div>
                <div>
                    {
                        sec < 60 ?
                            `${sec} сек. назад`
                            :
                            min < 60 ?
                                `${min} мин. назад`
                                :
                                min >= 60 && min < 120 ?
                                    'час назад'
                                    :
                                    days <= 1 ?
                                        'сегодня'
                                        :
                                        days <= 7 ?
                                            'на этой неделе'
                                            :
                                            days <= 30 ?
                                                'в этом месяце'
                                                :
                                                'давно'
                    }
                </div>
            </div>
        )
    }

}

GameCard.defaultProps = {
    onClick: () => {
    },
    game: {}
};

GameCard.propTypes = {
    onClick: PropTypes.func,
    game: PropTypes.object
};

export default GameCard;