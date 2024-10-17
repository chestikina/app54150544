import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/BattleStat/HorizontalProgress.css';

export class HorizontalProgress extends PureComponent {

    render() {
        const {backgroundColor, valueColor, percent, width, height} = this.props;

        return (
            <div className='HorizontalProgress' style={{
                width: `${width}vw`,
                height: `${height}vh`,
                borderRadius: `${height}vh`,
                backgroundColor
            }}>
                <div style={{
                    width: `${percent}%`,
                    backgroundColor: valueColor
                }}/>
            </div>
        )
    }

}

HorizontalProgress.defaultProps = {
    percent: 0
};

HorizontalProgress.propTypes = {
    backgroundColor: PropTypes.string.isRequired,
    valueColor: PropTypes.string.isRequired,
    percent: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired
};

export default HorizontalProgress;