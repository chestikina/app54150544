import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/BattleStat/VerticalCard.css';

export class VerticalCard extends PureComponent {

    render() {
        const {title, description, icon} = this.props;

        return (
            <div className='VerticalCard'>
                <div>
                    <div>{title}</div>
                    <div>{description}</div>
                </div>
                {icon}
            </div>
        )
    }

}

VerticalCard.defaultProps = {
    onClick: () => {
    }
};

VerticalCard.propTypes = {
    title: PropTypes.any,
    description: PropTypes.any,
    icon: PropTypes.element,
    onClick: PropTypes.func
};

export default VerticalCard;