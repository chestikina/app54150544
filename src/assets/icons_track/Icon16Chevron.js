import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

export class Icon16Chevron extends PureComponent {

    render() {
        let scheme = 'bright_light';
        try{
            scheme  = document.body.attributes.getNamedItem('scheme').value;
        }catch (e) {}
        return (
            <svg width="13" height="16" viewBox="0 0 13 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.93934 8L4.46967 4.53033C4.17678 4.23744 4.17678 3.76256 4.46967 3.46967C4.76256 3.17678 5.23744 3.17678 5.53033 3.46967L9.53033 7.46967C9.82322 7.76256 9.82322 8.23744 9.53033 8.53033L5.53033 12.5303C5.23744 12.8232 4.76256 12.8232 4.46967 12.5303C4.17678 12.2374 4.17678 11.7626 4.46967 11.4697L7.93934 8Z" fill={scheme === 'bright_light' ? "#3F3D56" : "#717171"}/>
            </svg>
        )
    }
}

Icon16Chevron.defaultProps = {
    active: true
};
Icon16Chevron.propTypes = {
    active: PropTypes.bool
};

export default Icon16Chevron;