import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../css/SimpleButton.css';
import {Tappable} from "@vkontakte/vkui";

export class SimpleButton extends PureComponent {

    render() {
        let {children, style, onClick} = this.props;
        style = {...SimpleButton.defaultProps.style, ...style};

        return (
            <Tappable style={{borderRadius: style.borderRadius || 0, width: style.width}}>
                <div className='SimpleButton' style={style} onClick={onClick}>
                    <div className='SimpleButton_Text'>
                        {children}
                    </div>
                </div>
            </Tappable>
        )
    }
}

SimpleButton.defaultProps = {
    style: {
        width: '100%',
        borderRadius: 21,
        background: 'var(--button_primary_background)',
        color: '#FFFFFF'
    }
};

SimpleButton.propTypes = {
    style: PropTypes.object,
    onClick: PropTypes.func
};

export default SimpleButton;