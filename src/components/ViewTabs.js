import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

let tab;
export class ViewTabs extends PureComponent {

    render() {
        return (
            this.props.children.find( function(obj) {
                return obj.props.id === this.props.activeTab
            }.bind(this))
        )
    }
}

ViewTabs.defaultProps = {
    activeTab: '',
};

ViewTabs.propTypes = {
    activeTab: PropTypes.string,
};

export default ViewTabs;