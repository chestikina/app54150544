import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import bridge from '@vkontakte/vk-bridge';
import '../../css/ClickerBattle/panels/ReferalInvite.css';
import {Avatar, Input} from "@vkontakte/vkui";
import Button from "./Button";
import Background from "./Background";

export class SimplePlaceholder extends PureComponent {

    render() {
        const
            {icon, title, description, buttonText, onClick, subButtonText, subOnClick, t} = this.props
        ;

        return (
            <div className='ReferalInvite'>
                <div className='HeaderBackground' style={{
                    height: '28vh'
                }}/>
                <div className='ReferalInviteContainer'>
                    <Avatar style={{background: '#FFFFFF'}} size={80} shadow={false}>
                        <img width={49} height={49} src={icon} style={{borderRadius: '50%'}}/>
                    </Avatar>
                    <div className='ReferalInviteTitle'>
                        {title}
                    </div>
                    <div className='ReferalInviteText'>
                        {description}
                    </div>
                    <Button
                        onClick={async () => {
                            if (onClick) {
                                onClick();
                            } else {
                                t.setState({slideBarIndex: 0, activePanel: 'main'});
                            }
                        }}
                        className='ReferalInviteButton'
                    >
                        {buttonText || 'Назад'}
                    </Button>
                    {subButtonText &&
                    <Button
                        onClick={subOnClick}
                        className='ReferalInviteSubButton'
                    >
                        {subButtonText}
                    </Button>}
                </div>
                <Background arenaOpacity={.06} fogOpacity={.5}/>
            </div>
        );
    }

}

SimplePlaceholder.propTypes = {
    t: PropTypes.object,
    icon: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    buttonText: PropTypes.string,
    onClick: PropTypes.func,
    subButtonText: PropTypes.string,
    subOnClick: PropTypes.func
};

export default SimplePlaceholder;