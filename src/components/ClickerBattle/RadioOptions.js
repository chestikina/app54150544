import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/ClickerBattle/RadioOptions.css';

export class RadioOptions extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            activeElement: props.activeElement
        }
    }

    render() {
        const
            {props, state} = this,
            {onChange, options, style} = props,
            {activeElement} = state
        ;

        return (
            <div className='RadioOptions' style={style}>
                {
                    options.map((val, i) => {
                            const {value, locked} = val;

                            return <div style={{
                                opacity: locked && .25
                            }} onClick={() => {
                                if (!locked) {
                                    this.setState({activeElement: i});
                                    onChange(val);
                                }
                            }}>
                                <div>
                                    <div style={{
                                        background: i === activeElement && 'rgba(135, 120, 103, 0.5)'
                                    }}/>
                                </div>
                                <div>{value}</div>
                            </div>;
                        }
                    )
                }
            </div>
        )
    }
}

RadioOptions.defaultProps = {
    onChange: () => {
    },
    activeElement: -1
};

RadioOptions.propTypes = {
    onChange: PropTypes.func,
    options: PropTypes.array.isRequired,
    style: PropTypes.object,
    activeElement: PropTypes.number
};

export default RadioOptions;