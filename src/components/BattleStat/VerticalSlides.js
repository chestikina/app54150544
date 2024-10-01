import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/BattleStat/VerticalSlides.css';
import bridge from "@vkontakte/vk-bridge";
import {rgbToHex} from "../../js/utils";
import {Icon28ChevronDownOutline} from "@vkontakte/icons";

export class VerticalSlides extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            index: 0,
            curMouseCords: {},
            moveY: 0
        }
    }

    componentWillUnmount() {
        const element = document.getElementsByClassName('VerticalSlides')[0];
        element.removeEventListener('touchstart', (e) => this.touchStart(e));
        element.removeEventListener('touchend', () => this.touchEnd());
        element.removeEventListener('touchcancel', () => this.touchEnd());
        element.removeEventListener('touchmove', (e) => this.touchMove(e));
    }

    componentDidMount() {
        this.changeStatusBarColor(this.state.index);
        this.changeColor(this.state.index);

        if (this.props.index) {
            this.slide(this.props.index);
        }

        const element = document.getElementsByClassName('VerticalSlides')[0];
        element.addEventListener('touchstart', (e) => this.touchStart(e));
        element.addEventListener('touchend', () => this.touchEnd());
        element.addEventListener('touchcancel', () => this.touchEnd());
        element.addEventListener('touchmove', (e) => this.touchMove(e));
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if (nextProps !== this.props) {
            const {index} = nextProps;
            if (index) {
                this.slide(index);
            }
        }
    }

    touchStart(e) {
        this.setState({moveY: 0, curMouseCords: {x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY}});
    }

    async touchEnd() {
        let
            element = document.getElementsByClassName('VerticalSlides')[0],
            {index, moveY} = this.state,
            offsetTop = await this.offsetTop(),
            {children} = this.props
        ;

        element.style.transition = 'all 0.24s cubic-bezier(.1, 0, .25, 1)';

        if (-moveY >= 50 && index !== children.length - 1)
            this.slide(index + 1);
        else if (moveY >= 50 && index !== 0)
            this.slide(index - 1);
        else
            element.style.transform = `translateY(${-offsetTop}px)`;
    }

    async slide(index) {
        if (index === this.state.index) return;
        const
            index_ = this.state.index,
            slideBottom = index > index_,
            {onChange} = this.props
        ;

        for (let i = index_; slideBottom ? i < index : i > index; slideBottom ? i++ : i--) {
            const
                element = this.element(),
                offsetTop = await this.offsetTop(),
                prevSlide = this.previousSlide(),
                curSlide = this.currentSlide()
            ;

            if (slideBottom)
                element.style.transform = `translateY(${-offsetTop + -curSlide.offsetHeight}px)`;
            else
                element.style.transform = `translateY(-${offsetTop - prevSlide.offsetHeight}px)`;
            await this.setState({index: slideBottom ? i + 1 : i - 1});
        }

        this.changeColor(index);
        setTimeout(() => this.changeStatusBarColor(index), 200);
        onChange(index);
    }

    element() {
        return document.getElementsByClassName('VerticalSlides')[0];
    }

    previousSlide() {
        return document.getElementById('Slide_' + (this.state.index - 1));
    }

    currentSlide() {
        return document.getElementById('Slide_' + this.state.index);
    }

    offsetTop() {
        return new Promise(resolve => {
            let offset = 0;
            for (let i = 0; i < this.state.index; i++) {
                offset += document.getElementById('Slide_' + i).offsetHeight;
            }
            resolve(offset);
        })
    }

    async touchMove(e) {
        const
            element = document.getElementsByClassName('VerticalSlides')[0],
            {index, curMouseCords} = this.state,
            touch = e.targetTouches[0],
            mouseY = touch.clientY,
            offsetTop = await new Promise(resolve => {
                let offset = 0;
                for (let i = 0; i < index; i++) {
                    offset += document.getElementById('Slide_' + i).offsetHeight;
                }
                resolve(offset);
            })
        ;

        let moveY = mouseY - curMouseCords.y;
        element.style.transform = `translateY(${-offsetTop + moveY}px)`;
        element.style.transition = 'none';
        this.setState({moveY});
    }

    getColor(index) {
        return getComputedStyle(document.getElementById('Slide_' + index).children[0], null).getPropertyValue('background-color');
    }

    changeStatusBarColor(index) {
        if (bridge.supports('VKWebAppSetViewSettings')) {
            const
                color = this.getColor(index),
                colorRgb = color.substring(color.indexOf('(') + 1, color.indexOf(')')).split(',').map(value => parseInt(value)),
                colorHex = rgbToHex(...colorRgb)
            ;
            bridge.send('VKWebAppSetViewSettings', {
                status_bar_style: 'light',
                action_bar_color: colorHex
            });
        }
    }

    changeColor(index) {
        const color = this.getColor(index);
        try {
            document.getElementsByClassName('Panel__in')[0].style.background = color;
        } catch (e) {
        }
    }

    render() {
        const
            {children, isShowArrowUp} = this.props,
            {index} = this.state
        ;

        return (
            <div>
                <div className='SlideArrowUp' onClick={() => this.slide(index - 1)}
                     style={{
                         top: isShowArrowUp && index !== 0 ? 'calc(var(--safe-area-inset-top) + 8vh)' : '-100vh'
                     }}>
                    <Icon28ChevronDownOutline
                        width={20} height={20}
                        style={{
                            transform: 'rotate(180deg)',
                            color: '#000000'
                        }}/>
                </div>
                <div className='VerticalSlides'>
                    {children.map((value, index) => <div key={index} id={'Slide_' + index}>{value}</div>)}
                </div>
            </div>
        )
    }

}

VerticalSlides.defaultProps = {
    onChange: () => {
    }
};

VerticalSlides.propTypes = {
    onChange: PropTypes.func,
    index: PropTypes.number,
    isShowArrowUp: PropTypes.bool
};

export default VerticalSlides;