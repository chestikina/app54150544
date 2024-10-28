import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import '../../css/Icon.css';

export class Icon28Clock extends PureComponent {

    render() {
        return (
            <svg className={this.props.active ? 'Icon-Active' : 'Icon-InActive'} width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 25.6666C20.4433 25.6666 25.6667 20.4433 25.6667 14C25.6667 7.55666 20.4433 2.33331 14 2.33331C7.55667 2.33331 2.33333 7.55666 2.33333 14C2.33333 20.4433 7.55667 25.6666 14 25.6666Z" stroke="var(--color)" stroke-width="2.33333" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 7V14L18.6667 16.3333" stroke="var(--color)" stroke-width="2.33333" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        )
    }
}

Icon28Clock.defaultProps = {
    active: true
};
Icon28Clock.propTypes = {
    active: PropTypes.bool
};

export default Icon28Clock;