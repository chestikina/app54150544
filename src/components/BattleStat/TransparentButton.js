import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/BattleStat/TransparentButton.css';

export class TransparentButton extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {}
    }

    render() {
        const {onClick, after, children} = this.props;

        return (
            <div className='TransparentButton' onClick={onClick}>
                <div>{children}</div>
                <div className='TransparentButton_After'>{after}</div>
            </div>
        )
    }

}

TransparentButton.defaultProps = {
    onClick: () => {
    }
};

TransparentButton.propTypes = {
    onClick: PropTypes.func,
    after: PropTypes.object
};

export default TransparentButton;