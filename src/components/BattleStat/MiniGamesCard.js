import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/BattleStat/MiniGamesCard.css';
import {Icon16Play} from "@vkontakte/icons";
import {Gallery} from "@vkontakte/vkui";

export class MiniGamesCard extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {index: 0}
    }

    render() {
        const {games, slideIndex, onChange} = this.props;

        return (
            <div className='MiniGamesCard'>
                <div className='MiniGamesCard_Subtitle'>
                    Мини-игры
                </div>
                <Gallery
                    slideWidth='100%'
                    style={{height: 235}}
                    bullets='light'
                    slideIndex={slideIndex}
                    onChange={onChange}
                >
                    {
                        games.map(value =>
                            <div>
                                <img className='MiniGamesCard_Icon' src={value.icon}/>
                                <div className='MiniGamesCard_Title'>
                                    {value.title}
                                </div>
                                <div className='MiniGamesCard_Description'>
                                    {value.description}
                                </div>
                                <div className='MiniGamesCard_Button' onClick={() => value.onClick()}>
                                    <Icon16Play/>
                                    <div>
                                        Играть
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </Gallery>
            </div>
        )
    }

}

MiniGamesCard.defaultProps = {
    games: [],
    slideIndex: 0,
    onChange: (slideIndex) => MiniGamesCard.defaultProps.slideIndex = slideIndex
};

MiniGamesCard.propTypes = {
    games: PropTypes.array.isRequired,
    slideIndex: PropTypes.number,
    onChange: PropTypes.func
};

export default MiniGamesCard;