import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/ClickerBattle/Button.css';

export class Button extends PureComponent {

    render() {
        const
            {before, after, children, style, onClick, className, disabled} = this.props,
            afterStyle = {
                paddingLeft: 6,
                color: 'rgba(87, 64, 57, 0.6)'
            }
        ;

        return (
            <div
                className={'CustomButton' + (className ? ` ${className}` : '')}
                style={{
                    ...(style ? style : {}),
                    ...(disabled ? {pointerEvents: 'none', opacity: .5} : {})
                }}
                onClick={onClick}
            >
                {before && React.cloneElement(before, {style: {...before.props.style, paddingRight: 10}})}
                <span>{children}</span>
                {after && (typeof after === 'object' ? React.cloneElement(after, {
                    style: afterStyle
                }) : <span style={afterStyle}>{after}</span>)}
            </div>
        )
    }
}

Button.propTypes = {
    disabled: PropTypes.bool,
    before: PropTypes.any,
    after: PropTypes.any,
    style: PropTypes.object,
    onClick: PropTypes.func,
    className: PropTypes.string
};

export default Button;