import React from "react";

export default class Header extends React.PureComponent {
    render() {
        return (
            <div className='mHeader'>
                {this.props.children}
            </div>
        );
    }
}