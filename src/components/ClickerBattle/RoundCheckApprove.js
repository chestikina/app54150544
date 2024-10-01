import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/ClickerBattle/RoundCheckApprove.css';
import {isPlatformIOS} from "../../js/utils";

export class RoundCheckApprove extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            component:
                <div className="circle_progress_main">
                    <svg className="circle_progress_containter" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle className="circle_progress" cx="50" cy="50" r="30"/>
                        <path className="check_mark"
                              d="M12.8572 19.8614L3.78365 10.7878C3.11418 10.1183 2.02875 10.1183 1.35928 10.7878C0.68981 11.4573 0.68981 12.5427 1.35928 13.2122L11.645 23.4979C12.3145 24.1674 13.3999 24.1674 14.0694 23.4979L34.6408 2.92647C35.3103 2.257 35.3103 1.17157 34.6408 0.502103C33.9713 -0.167368 32.8859 -0.167368 32.2164 0.502103L12.8572 19.8614Z"
                              fill="#818C99"/>
                    </svg>
                </div>
        }
    }

    render() {
        const
            {component} = this.state
        ;
        return component;
    }

}

RoundCheckApprove.defaultProps = {};

RoundCheckApprove.propTypes = {};

export default RoundCheckApprove;