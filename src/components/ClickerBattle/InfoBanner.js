import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/ClickerBattle/InfoBanner.css';
import Button from "./Button";

export class InfoBanner extends PureComponent {

    render() {
        const
            {before, children, style, action, onActionClick} = this.props
        ;

        return (
            <div className='InfoBanner' style={style}>
                <div className='BannerTitle'>
                {before && React.cloneElement(before, {style: {...before.props.style, paddingRight: 12}})}
                {children}
                </div>
                {
                    action &&
                    <Button className='BannerAction' onClick={() => onActionClick()}>
                        {action}
                    </Button>
                }
            </div>
        )
    }
}

InfoBanner.propTypes = {
    before: PropTypes.object,
    action: PropTypes.any,
    onActionClick: PropTypes.func,
    style: PropTypes.object
};

export default InfoBanner;