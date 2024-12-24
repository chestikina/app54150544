import React, {PureComponent} from 'react';
import bridge from '@vkontakte/vk-bridge';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/panels/Developers.css';
import {Input} from "@vkontakte/vkui";
import {ReactComponent as IconEyeHide} from "../../../assets/clickerbattle/eye-24-hide.svg";
import {ReactComponent as IconEyeShow} from "../../../assets/clickerbattle/eye-24-show.svg";
import {ReactComponent as IconCopy} from "../../../assets/clickerbattle/copy-24.svg";
import RoundCheckApprove from "../../../components/ClickerBattle/RoundCheckApprove";

export class Developers extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            hidden: true,
            key: props.t.state.user.apiToken
        };

        this.state.value = new Array(this.state.key.length).fill('*').join('')
    }

    render() {
        const
            {props, state} = this,
            {t} = props,
            {hidden, key, value, popout} = state,

            onHideClick = () => {
                this.setState({
                    value: hidden ? key : new Array(key.length).fill('*').join(''),
                    hidden: !hidden
                })
            }
        ;

        return (
            <React.Fragment>
                <div className='CustomPopoutContainer'>
                    {popout}
                </div>
                <div className='Developers'>
                    <div className='SlideTitle'>
                        Разработчикам
                    </div>
                    <div className='SlideDescription'>
                        Не передавайте этот ключ третьим лицам.<br/><br/>
                        С его помощью можно будет управлять Вашим игровым аккаунтом, в том числе совершать переводы.
                    </div>
                    <Input readOnly className='DeveloperKeyInput' value={value} after={
                        <div style={{display: 'flex'}}>
                            {
                                hidden ?
                                    <IconEyeHide onClick={onHideClick}/>
                                    :
                                    <IconEyeShow onClick={onHideClick}/>
                            }
                            <div style={{width: 12}}/>
                            <IconCopy onClick={() => {
                                if (popout !== undefined) return;
                                this.setState({
                                    popout: <RoundCheckApprove/>
                                });
                                setTimeout(() => {
                                    this.setState({popout: undefined});
                                }, 2000);
                                bridge.send('VKWebAppCopyText', {text: key});
                            }}/>
                        </div>}/>
                </div>
            </React.Fragment>
        )
    }
}

Developers.defaultProps = {};

Developers.propTypes = {
    t: PropTypes.object
};

export default Developers;