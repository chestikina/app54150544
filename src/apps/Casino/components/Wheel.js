import React from "react";
import {ReactComponent as Polygon} from "../icons/wheel_poly.svg";
import {ReactComponent as WheelSVG} from "../icons/wheel_312.svg";
import {numbers} from "./Board";
import {getRandomInt, sleep} from "../../../js/utils";

export default class Wheel extends React.PureComponent {

    roll(number) {
        const first_deg = -4;
        const step_deg = 9.47368421;
        const random = 360 * getRandomInt(3, 20);
        const rotate = first_deg - step_deg * numbers.indexOf(number + '') - random;
        if (this.wheelComponent) this.wheelComponent.style.transform = `rotate(${rotate}deg)`;
        setTimeout(async () => {
            if (this.wheelComponent) {
                const lastTransition = this.wheelComponent.style.transition;
                this.wheelComponent.style.transition = 'none';
                this.wheelComponent.style.transform = `rotate(${rotate + random}deg)`;
                await sleep(1);
                this.wheelComponent.style.transition = lastTransition;
            }
        }, 7000);
    }

    componentDidMount() {

    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.element !== this.props.element) {
            this.roll(this.props.element);
        }
    }

    render() {
        const {tick} = this.props;

        return (
            <div className='Wheel'>
                <Polygon style={{zIndex: 1}}/>
                <WheelSVG style={{marginTop: -22}} ref={ref => this.wheelComponent = ref} className='WheelComponent'/>
                <div className='Inner'>
                    <span>
                        {
                            tick > 0 ? <React.Fragment>
                                Начало через
                                <br/>
                            </React.Fragment>
                                :
                                'В процессе...'
                        }
                        <span style={{display: tick === 0 && 'none'}}>{tick} сек</span>
                    </span>
                    <div className='mButton' onClick={() => this.props.t.go('board')} style={{display: 'none'}}>
                        Сделать ставку
                    </div>
                </div>
            </div>
        );
    }
}