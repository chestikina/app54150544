import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/BattleStat/RoundProgress.css';

export class RoundProgress extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            circle_id: 'circle_' + (Math.round(Date.now() * Math.random())),
            circle_id_2: 'circle_' + (Math.round(Date.now() * Math.random()))
        }
    }

    componentDidMount() {
        this.update(400);
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.update(0);
    }

    update(timeout) {
        setTimeout(() => {
            const {type, percent, size} = this.props;
            if (!(type === 0 && percent === 100)) {
                try {
                    document.getElementById(this.state.circle_id).style.strokeDashoffset = `${(size / 2 - 4) * 2 * Math.PI - percent / 100 * (size / 2 - 4) * 2 * Math.PI}`;
                } catch (e) {
                }
            }
        }, timeout);
    }

    render() {
        const
            {type, percent, color, size, color_background, stroke_width, rotate, text} = this.props,
            stroke = stroke_width ? stroke_width : type === 0 ? 4 : 5
        ;
        return (
            <div className='RoundProgress' style={{
                width: size + stroke / 2,
                height: size + stroke / 2
            }}>
                {
                    type === 0 || text &&
                    <div className='RoundProgress_Percent' style={{
                        color,
                        fontSize: text ? Math.round(size / 2.6) : (percent === 100 && 28)
                    }}>
                        {text && text || percent && `${percent}%`}
                    </div>
                }
                {
                    !(type === 0 && percent === 100) &&
                    <svg style={{
                        transform: `rotate(${rotate}deg)`
                    }}>
                        <circle id={this.state.circle_id} style={{
                            strokeDashoffset: `${(size / 2 - 4) * 2 * Math.PI - 0 / 100 * (size / 2 - 4) * 2 * Math.PI}`,
                            strokeDasharray: `${((size / 2 - 4) * 2 * Math.PI) + ' ' + ((size / 2 - 4) * 2 * Math.PI)}`,
                            transition: '0.35s stroke-dashoffset',
                            transform: `translate(${stroke / 2}px, ${stroke / 2}px)`,
                            strokeWidth: stroke,
                        }} cx={size / 2 - 2} cy={size / 2 - 2} r={size / 2 - 4} stroke={color}>
                        </circle>
                        {
                            type === 1 &&
                            <circle id={this.state.circle_id_2} style={{
                                strokeDashoffset: `${(size / 2 - 4) * 2 * Math.PI - 100 / 100 * (size / 2 - 4) * 2 * Math.PI}`,
                                strokeDasharray: `${((size / 2 - 4) * 2 * Math.PI) + ' ' + ((size / 2 - 4) * 2 * Math.PI)}`,
                                transform: `translate(${stroke / 2}px, ${stroke / 2}px)`,
                                strokeWidth: stroke
                            }} cx={size / 2 - 2} cy={size / 2 - 2} r={size / 2 - 4} stroke={color_background}>
                            </circle>
                        }
                    </svg>
                }
            </div>
        )
    }

}

RoundProgress.defaultProps = {
    type: 0,
    percent: 0,
    color: '#FFFFFF',
    color_background: 'rgba(255, 255, 255, 0.15)',
    size: 100,
    rotate: 0
};

RoundProgress.propTypes = {
    text: PropTypes.string,
    type: PropTypes.number,
    percent: PropTypes.number,
    color: PropTypes.string,
    color_background: PropTypes.string,
    size: PropTypes.number,
    stroke_width: PropTypes.number,
    rotate: PropTypes.number
};

export default RoundProgress;