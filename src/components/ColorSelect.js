import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {Tappable} from "@vkontakte/vkui";

export class ColorSelect extends PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            selected: this.props.defaultValue !== null ? this.props.defaultValue : 0
        };

        this.props.onChange(this.state.selected);
    }

    render() {
        return (
            <div style={{
                display: 'flex',
                ...this.props.style
            }}>
                {
                    this.props.items.map((value, i) =>
                        <Tappable
                            key={'color-' + i}
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 25,
                                marginLeft: i > 0 && 10,
                                marginRight: i === this.props.items.length && 10,
                                marginTop: 12,
                                marginBottom: 12,
                                cursor: 'pointer'
                            }}
                            onClick={() => {
                                this.setState({selected: i});
                                this.props.onChange(i);
                            }}
                        >
                            <div
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 25,
                                    border: `2px solid ${this.state.selected === i ? value : '#FFFFFF00'}`,
                                    boxSizing: 'border-box',
                                }}>
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '25%',
                                        bottom: '25%',
                                        left: '25%',
                                        right: '25%',
                                        borderRadius: '50%',
                                        backgroundColor: value
                                    }}
                                />
                            </div>
                        </Tappable>
                    )
                }
            </div>
        )
    }
}

ColorSelect.defaultProps = {
    style: {},
    items: [],
    defaultValue: 0,
    onChange: () => {
    }
};

ColorSelect.propTypes = {
    style: PropTypes.object,
    items: PropTypes.array,
    defaultValue: PropTypes.number,
    onChange: PropTypes.func
};

export default ColorSelect;