import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/BattleStat/ProgressInfo.css';
import RoundProgress from "./RoundProgress";

export class ProgressInfo extends PureComponent {

    render() {
        const {title, description, percent} = this.props;

        return (
            <div className='ProgressInfo'>
                <RoundProgress type={1} size={29} percent={percent}/>
                <div>
                    <div>{title}</div>
                    <div>{description}</div>
                </div>
            </div>
        )
    }

}

ProgressInfo.defaultProps = {
    percent: 0
};

ProgressInfo.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    percent: PropTypes.number
};

export default ProgressInfo;