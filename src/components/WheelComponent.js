import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {ReactComponent as WheelSVG} from "../assets/img_wheel/wheel.svg";
import {ReactComponent as WheelPoly} from "../assets/img_wheel/wheel_poly.svg";

export class Wheel extends PureComponent {

    render() {
        return (
            <div className='centered' style={{position: 'relative'}}>
                <img
                    class={this.props.animation && 'Wheel-Rotate-Animation'}
                    src={this.props.anotherGifts ? require('../assets/img_wheel/wheel2.png') : require('../assets/img_wheel/wheel.png')}
                    alt='wheel'
                    style={{
                        width: 256, height: 256,
                        transition: 'all 400ms',
                        transform: !this.props.animation && 'rotate(0deg)'
                    }}
                />
                <WheelPoly style={{
                    opacity: !this.props.animation && 0
                }} class='Wheel-Poly'/>
            </div>
        )
    }
}

Wheel.defaultProps = {
    animation: false
};
Wheel.propTypes = {
    animation: PropTypes.bool,
    anotherGifts: PropTypes.bool
};

export default Wheel;