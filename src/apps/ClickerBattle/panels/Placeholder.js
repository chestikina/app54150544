import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/panels/Placeholder.css';
import Button from "../../../components/ClickerBattle/Button";
import Background from "../../../components/ClickerBattle/Background";
import {Panel} from "@vkontakte/vkui";

export class Placeholder extends PureComponent {
    render() {
        const
            {icon, title, subtitle, actions} = this.props
        ;

        return (
            <div className='Placeholder'>
                <div className='HeaderBackground' style={{
                    height: '28vh'
                }}/>
                <div className='PlaceholderMain'>
                    {
                        icon && <React.Fragment>
                            {icon}
                            <div style={{height: '4.56vh'}}/>
                        </React.Fragment>
                    }
                    <div className='PlaceholderTitle'>
                        {title}
                    </div>
                    {
                        subtitle && <div className='PlaceholderSubtitle'>
                            {subtitle}
                        </div>
                    }
                </div>
                {
                    actions && <div className='PlaceholderActions'>
                        {
                            actions.filter(value => value !== undefined).map((value, index) =>
                                React.cloneElement(value, {
                                    key: 'placeholder_' + index,
                                    style: {
                                        ...value.props && value.props.style,
                                        marginTop: index > 0 && 12
                                    }
                                }))
                        }
                    </div>
                }
                <Background arenaOpacity={.06} fogOpacity={.5}/>
            </div>
        )
    }
}

Placeholder.defaultProps = {};

Placeholder.propTypes = {
    icon: PropTypes.object,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    actions: PropTypes.array
};

export default Placeholder;