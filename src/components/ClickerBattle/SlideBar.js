import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/ClickerBattle/SlideBar.css';
import {ReactComponent as IconChevron} from "../../assets/clickerbattle/chevron-12.svg";

export class SlideBar extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            previousTab: 0,
            activeTab: 0
        }
    }

    render() {
        const
            {props, state} = this,
            {tabs, onChange} = props,
            {previousTab, activeTab} = state
        ;

        return (
            <div className='SlideBar HiddenScrollBar'>
                {
                    tabs.map((tab, i) =>
                        <div key={`slidebar_div_${i}`} ref={ref => props.t[`SlideButton${i}`] = ref}
                             className='SlideTab' style={{
                            background: activeTab === i ? 'rgba(255, 255, 255, 0.9)' : 'rgba(117, 99, 91, 0.8)',
                            color: activeTab === i ? '#574039' : '#FFFFFF'
                        }} onClick={async () => {
                            const double = activeTab === i;
                            if (tab.isContext && activeTab === i) {
                                const can = await onChange(i, previousTab, tab.isContext, double) !== false;
                                if (can) this.setState({
                                    previousTab: i,
                                    activeTab: previousTab
                                });
                            } else {
                                const can = await onChange(activeTab, i, tab.isContext, double) !== false;
                                if (can) this.setState({previousTab: activeTab, activeTab: i});
                            }
                        }

                        }>
                            {tab.icon}
                            {tab.icon && <div style={{width: 10}}/>}
                            {tab.text}
                            {tab.isContext && <div style={{width: 10}}/>}
                            {tab.isContext &&
                            <IconChevron style={{transform: activeTab === i && 'rotate(180deg)'}}/>}
                        </div>
                    )
                }
            </div>
        )
    }
}

SlideBar.defaultProps = {
    tabs: []
};

SlideBar.propTypes = {
    tabs: PropTypes.array,
    onChange: PropTypes.func
};

export default SlideBar;