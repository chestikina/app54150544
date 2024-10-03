import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/BattleStat/HorizontalCard.css';
import RoundProgress from "./RoundProgress";

export class HorizontalCard extends PureComponent {

    render() {
        const {style, type, buttonDisabled, title, icon, content, description, onCardClick, onButtonClick, buttonText, buttonIcon, buttonStretched, stretched} = this.props;
        return (
            <div style={{...style}} className='HorizontalCard' type={type} onClick={onCardClick} stretched={stretched+''}>
                {
                    icon &&
                    <div className='HorizontalCard_Icon'>
                        {icon}
                    </div>
                }
                <div className='HorizontalCard_Title'>
                    {title}
                </div>
                {
                    type === 2 &&
                    <div className='centered'>
                        <RoundProgress type={0} percent={content} color='#9CEC95'/>
                    </div>
                }
                {
                    description &&
                    <div className='HorizontalCard_Description'>
                        <html style={{color: 'rgba(255, 255, 255, 0.75)'}} dangerouslySetInnerHTML={{__html: description}}/>
                    </div>
                }
                {
                    !buttonDisabled &&
                    <div className='HorizontalCard_Button' stretched={buttonStretched+''} onClick={onButtonClick}>
                        <div>
                            {
                                buttonIcon &&
                                <div className='HorizontalCard_Button_Icon' style={{padding: type == 2 ? '5px 9px 6px 9px' : !buttonText ? 9 : '0 0 0 10px'}}>
                                    {buttonIcon}
                                </div>
                            }
                            {
                                buttonText &&
                                <div className='HorizontalCard_Button_Text'>
                                    {buttonText}
                                </div>
                            }
                        </div>
                    </div>
                }
            </div>
        )
    }

}

HorizontalCard.defaultProps = {
    type: 0,
    onCardClick: () => {
    },
    onButtonClick: () => {
    },
    buttonStretched: false,
    stretched: false
};

HorizontalCard.propTypes = {
    type: PropTypes.number,
    onCardClick: PropTypes.func,
    onButtonClick: PropTypes.func,
    title: PropTypes.any,
    description: PropTypes.string,
    content: PropTypes.any,
    buttonDisabled: PropTypes.bool,
    buttonText: PropTypes.any,
    buttonIcon: PropTypes.any,
    buttonStretched: PropTypes.bool,
    stretched: PropTypes.bool
};

export default HorizontalCard;