import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/BattleStat/GraphicCard.css';
import {Icon12Chevron, Icon20StoryOutline} from "@vkontakte/icons";
import Graph from "./Graph";

export class GraphicCard extends PureComponent {

    render() {
        const {title, description, onCardClick, onButtonClick, data} = this.props;

        return (
            <div className='GraphicCard'>
                <div className='GraphicCard_Top'>
                    <div>{title}</div>
                    <div>{description}</div>
                </div>
                <div className='GraphicCard_Bottom'>
                    <div onClick={onCardClick} style={{visibility: !onCardClick && 'hidden'}}>
                        <div>
                            Подробнее
                        </div>
                        <Icon12Chevron/>
                    </div>
                    <div onClick={onButtonClick}>
                        <Icon20StoryOutline width={16} height={16}/>
                    </div>
                </div>
                <Graph data={data}/>
            </div>
        )
    }

}

GraphicCard.defaultProps = {
    data: [],
    onButtonClick: () => {
    }
};

GraphicCard.propTypes = {
    data: PropTypes.array,
    title: PropTypes.any,
    description: PropTypes.any,
    onCardClick: PropTypes.func,
    onButtonClick: PropTypes.func
};

export default GraphicCard;