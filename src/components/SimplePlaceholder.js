import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../css/SimplePlaceholder.css';

export class SimplePlaceholder extends PureComponent {

    render() {
        const {icon, title, subtitle, action} = this.props;

        return (
            <div className='SimplePlaceholder'>
                {icon &&
                <React.Fragment>
                    {icon}
                    <div style={{height: '1.97vh'}}/>
                </React.Fragment>}
                <div className='SimplePlaceholder_Title'>{title}</div>
                <div style={{height: '0.74vh'}}/>
                <div className='SimplePlaceholder_SubTitle'>{subtitle}</div>
                {action &&
                <React.Fragment>
                    <div style={{height: '3.94vh'}}/>
                    {action}
                </React.Fragment>}
            </div>
        )
    }
}

SimplePlaceholder.defaultProps = {
    title: '',
    subtitle: ''
};

SimplePlaceholder.propTypes = {
    icon: PropTypes.object,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    action: PropTypes.object
};

export default SimplePlaceholder;