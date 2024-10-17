import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../css/SimpleBanner.css';
import {Tappable} from "@vkontakte/vkui";

export class SimpleBanner extends PureComponent {

    render() {
        let {icon, text} = this.props;

        return (
            <div className='SimpleBanner'>
                {icon && <React.Fragment>
                    {icon}
                    <div style={{width: 10}}/>
                </React.Fragment>}
                <div className='SimpleBanner_Text'>{text}</div>
            </div>
        )
    }
}

SimpleBanner.defaultProps = {};

SimpleBanner.propTypes = {
    icon: PropTypes.object,
    text: PropTypes.string
};

export default SimpleBanner;