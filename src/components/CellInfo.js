import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {Title} from "@vkontakte/vkui";

export class CellInfo extends PureComponent {

    render() {
        return (
            <div style={{
                display: this.props.before && 'flex',
                ...this.props.style
            }}>
                {
                    this.props.before
                }
                <Title style={{
                    marginLeft: this.props.before && 25
                }} level={3} weight='regular'>{this.props.children}</Title>
            </div>
        )
    }
}

CellInfo.defaultProps = {
  style: {}
};

CellInfo.propTypes = {
    before: PropTypes.object,
    style: PropTypes.object
};

export default CellInfo;