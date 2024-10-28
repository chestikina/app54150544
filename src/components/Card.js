import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../css/Card.css';

import Icon16Chevron from '../assets/icons_track/Icon16Chevron.js';
import {SimpleCell} from "@vkontakte/vkui";

export class Card extends PureComponent {

    render() {
        return (
            <SimpleCell getRootRef={this.props.getRootRef} style={this.props.style} before={this.props.before} onClick={this.props.onClick}
                        after={this.props.expandable && <Icon16Chevron />} className='card-main'
                        description={this.props.description &&
                        <span className='card-description'>
                    {
                        this.props.description
                    }
                </span>
                        }>
                {
                    <span className='card-title'>
                        {
                            this.props.title
                        }
                    </span>
                }
            </SimpleCell>
        )
    }
}

Card.defaultProps = {
    onClick: () => {
    },
    getRootRef: () => {}
};

Card.propTypes = {
    onClick: PropTypes.func,
    title: PropTypes.string,
    description: PropTypes.string,
    expandable: PropTypes.bool,
    before: PropTypes.object,
    style: PropTypes.object,
    getRootRef: PropTypes.func
};

export default Card;