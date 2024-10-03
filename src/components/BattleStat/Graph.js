import React, {PureComponent} from 'react';
import {roundPathCorners} from '../../js/rounding';
import PropTypes from "prop-types";

export class Graph extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            path: roundPathCorners('M2 95 L39 60 L64 84 L109 41 L142 71 L197 19 L236 85 L267 1 L280 54 L314 28 L334 14 L399 25 V190 H2 V95 Z', 15)
        }
    }

    componentDidMount() {
        this.round();
    }

    round() {
        const {data} = this.props;

        let
            minPoint = 100, maxPoint = 20, pointZone = minPoint - maxPoint,
            maxValue = Math.max(...data),
            path = 'M2 95 L39 60 L64 84 L109 41 L142 71 L197 19 L236 85 L267 1 L280 54 L314 28 L334 14 L1000 25 V190 H2 V95 Z',
            path_ = path.split(' '),
            nextPos = false,
            pos = path_.map((value, index) => {
                if (nextPos) {
                    nextPos = !nextPos;
                    return index;
                } else {
                    nextPos = value.startsWith('L');
                }
            }).filter(value => value && value)
        ;

        if (maxValue === 0) maxValue = 1;

        for (const i in pos) {
            const p = pos[i];
            path_[p] = minPoint - pointZone * (data[i] / maxValue);
        }

        setTimeout(() => this.setState({path: roundPathCorners(path_.join(' '), 15)}), 400);
    }

    render() {
        return (
            <div className='Graph'>
                <svg width="100vw" height="192" viewBox="" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path style={{transition: this.props.transition + 'ms'}} d={this.state.path}
                          fill="url(#paint0_linear)"
                          stroke="white" stroke-width="3"/>
                    <defs>
                        <linearGradient id="paint0_linear" x1="192.042" y1="-12" x2="192.042" y2="147.422"
                                        gradientUnits="userSpaceOnUse">
                            <stop stop-color="white" stop-opacity="0.15"/>
                            <stop offset="1" stop-color="white" stop-opacity="0"/>
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        )
    }

}

Graph.defaultProps = {
    data: [],
    transition: 750
};

Graph.propTypes = {
    data: PropTypes.array,
    transition: PropTypes.number
};

export default Graph;