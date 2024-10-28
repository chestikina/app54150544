import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/BattleStat/RankCard.css';
import {Icon20GiftOutline, Icon20StoryOutline} from "@vkontakte/icons";
import {decOfNum} from "../../js/utils";

export class RankCard extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {}
    }

    render() {
        const {emoji, rank, onButtonClick} = this.props;

        return (
            <div className='RankCard'>
                <div>
                    Ваш уровень в игре:
                </div>
                <div className='RankCard_Rank'>
                    {emoji}
                    <div>{rank}</div>
                </div>
                <div className='RankCard_Description'>
                    <Icon20GiftOutline/>
                    <span>Поделитесь этим фактом, чтобы получить бойца <span style={{color: '#FFFFFF'}}>«Крипто»</span></span>
                </div>
                <div onClick={onButtonClick}>
                    <Icon20StoryOutline width={16} height={16}/>
                    <div>Поделиться</div>
                </div>
            </div>
        )
    }

}

RankCard.defaultProps = {
    onButtonClick: () => {
    }
};

RankCard.propTypes = {
    emoji: PropTypes.object.isRequired,
    rank: PropTypes.string.isRequired,
    onButtonClick: PropTypes.func
};

export default RankCard;