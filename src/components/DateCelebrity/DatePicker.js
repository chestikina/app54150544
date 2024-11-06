import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/DateCelebrity/DatePickerCustom.css';

import {CustomSelect, SimpleCell} from "@vkontakte/vkui";

export class DatePicker extends PureComponent {

    constructor(props) {
        super(props);

        this.state = props.defaultValue || this.defaultProps.defaultValue;
    }


    get day() {
        return new Array(31).fill(0).map((value, index) => ({
            label: index + 1,
            value: index + 1
        }));
    }

    get month() {
        const
            names = 'январь февраль март апрель май июнь июль август сентябрь октябрь ноябрь декабрь'
                .split(' ').map(value => `${value.substring(0, 1).toUpperCase()}${value.substring(1)}`)
        ;
        return new Array(12).fill(0).map((value, index) => ({
            label: names[index],
            value: index + 1
        }));
    }

    render() {
        const
            {className, style, onChange} = this.props,
            {day, month} = this.state
        ;
        return (
            <div className={`DatePickerCustom ${className}`} style={style}>
                <CustomSelect
                    value={day}
                    placeholder='день'
                    options={this.day}
                    onChange={e => {
                        const data = this.state;
                        data.day = parseInt(e.target.value);
                        this.setState({day: data.day});
                        onChange(data);
                    }}
                />
                <CustomSelect
                    value={month}
                    placeholder='месяц'
                    options={this.month}
                    onChange={e => {
                        const data = this.state;
                        data.month = parseInt(e.target.value);
                        this.setState({month: data.month});
                        onChange(data);
                    }}
                />
            </div>
        )
    }
}

DatePicker.defaultProps = {
    onChange: () => {
    },
    defaultValue: {day: 1, month: 1}
};

DatePicker.propTypes = {
    onChange: PropTypes.func,
    defaultValue: PropTypes.object
};

export default DatePicker;