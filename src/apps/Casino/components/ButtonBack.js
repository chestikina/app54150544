import React from "react";
import {Icon24ChevronLeft} from "@vkontakte/icons";
import {Tappable} from "@vkontakte/vkui";

export default class ButtonBack extends React.PureComponent {
    render() {
        return (
            <Tappable
                style={{
                    position: this.props.position,
                    padding: 6,
                    width: 24, height: 24,
                    background: 'rgba(255, 255, 255, 0.1)',
                    marginTop: 48,
                    marginLeft: 48,
                    borderRadius: 36,
                    color: '#FFFFFF'
                }}
                onClick={this.props.onClick}
            >
                <Icon24ChevronLeft/>
            </Tappable>
        );
    }
}