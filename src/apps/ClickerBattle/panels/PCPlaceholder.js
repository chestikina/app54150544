import React, {PureComponent} from 'react';
import bridge from '@vkontakte/vk-bridge';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/panels/PCPlaceholder.css';
import {ReactComponent as IconPhone} from "../../../assets/clickerbattle/phone-22.svg";
import {ReactComponent as Background} from "../../../assets/clickerbattle/PCPlaceholderBG.svg";
import vkQr from "@vkontakte/vk-qr";
import {getUrlParams} from "../../../js/utils";
import Button from "../../../components/ClickerBattle/Button";

export class PCPlaceholder extends PureComponent {
    render() {
        return (
            <div className='PCPlaceholder'>
                <Background className='PlaceholderBackground'/>
                <Button
                    className='ButtonSendApp'
                    before={<IconPhone/>}
                    onClick={() => bridge.send('VKWebAppSendToClient')}
                >
                    Отправить на телефон
                </Button>
                <div className='APPCode'>
                    <div className='APPCodeContainer'>
                        <div className='APPText'>
                            Играйте на телефоне
                        </div>
                        <div className='APPQR' dangerouslySetInnerHTML={{
                            __html: vkQr.createQR(`vk.com/app${getUrlParams().vk_app_id}`, {
                                qrSize: 161,
                                isShowLogo: false,
                                foregroundColor: '#48312A'
                            })
                        }}/>
                    </div>
                </div>
            </div>
        )
    }
}

PCPlaceholder.defaultProps = {};

PCPlaceholder.propTypes = {};

export default PCPlaceholder;