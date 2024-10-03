import React from "react";

export default class Card extends React.PureComponent {
    render() {
        const {mode, children, onClick, style} = this.props;
        return <div
            className={`mCard mCard-${mode}`}
            style={style}
            onClick={onClick}
        >
            {children}
        </div>
    }
}