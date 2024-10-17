import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import '../../css/Icon.css';

export class Icon28Truck extends PureComponent {

    render() {
        return (
            <svg className={this.props.active ? 'Icon-Active' : 'Icon-InActive'} width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.6667 3.5H1.16666V18.6667H18.6667V3.5Z" stroke="var(--color)" stroke-width="2.33333" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.6667 9.33334H23.3333L26.8333 12.8333V18.6667H18.6667V9.33334Z" stroke="var(--color)" stroke-width="2.33333" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6.41667 24.5C8.0275 24.5 9.33333 23.1942 9.33333 21.5833C9.33333 19.9725 8.0275 18.6667 6.41667 18.6667C4.80584 18.6667 3.5 19.9725 3.5 21.5833C3.5 23.1942 4.80584 24.5 6.41667 24.5Z" stroke="var(--color)" stroke-width="2.33333" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21.5833 24.5C23.1942 24.5 24.5 23.1942 24.5 21.5833C24.5 19.9725 23.1942 18.6667 21.5833 18.6667C19.9725 18.6667 18.6667 19.9725 18.6667 21.5833C18.6667 23.1942 19.9725 24.5 21.5833 24.5Z" stroke="var(--color)" stroke-width="2.33333" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        )
    }
}

Icon28Truck.defaultProps = {
    active: true
};
Icon28Truck.propTypes = {
    active: PropTypes.bool
};

export default Icon28Truck;