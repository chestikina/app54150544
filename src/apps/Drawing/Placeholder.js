import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {Button, PanelHeader, PanelHeaderBack} from "@vkontakte/vkui";

export class Placeholder extends PureComponent {
    render() {
        const
            {t, icon, title, description, buttonText, buttonIcon, buttonOnClick, buttonMode, buttonBack, buttonBackOnClick, buttonBackText} = this.props
        ;

        return (
            <React.Fragment>
                {buttonBack && false &&
                    <PanelHeader
                        className='PanelHeader__Placeholder' separator={false}
                        left={<PanelHeaderBack onClick={() => t.back()}/>}
                    />
                }
                <div className='Placeholder_Clean'>
                    {React.cloneElement(icon, {className: 'Placeholder__Icon'})}
                    <div>
                        <h1>{title}</h1>
                        <p>{description}</p>
                        <div className={buttonBack ? 'TwoButtons' : 'OneButton'}>
                            {
                                buttonText &&
                                <Button
                                    after={buttonIcon}
                                    size='m' mode={buttonMode || 'gradient'}
                                    onClick={buttonOnClick}
                                >
                                    {buttonText}
                                </Button>
                            }
                            {
                                buttonBack &&
                                <Button
                                    size='m' mode='secondary'
                                    onClick={() => {
                                        if (buttonBackOnClick && typeof buttonBackOnClick === 'function') {
                                            buttonBackOnClick();
                                        } else {
                                            t.back()
                                        }
                                    }}
                                >
                                    {buttonBackText || 'Назад'}
                                </Button>
                            }
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

Placeholder.defaultProps = {};

Placeholder.propTypes = {
    icon: PropTypes.object.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    buttonText: PropTypes.string,
    buttonIcon: PropTypes.any,
    buttonOnClick: PropTypes.func,
    buttonMode: PropTypes.string,
    buttonBack: PropTypes.bool,
    buttonBackOnClick: PropTypes.func,
    buttonBackText: PropTypes.string
};

export default Placeholder;