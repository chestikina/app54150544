import React, {PureComponent} from 'react';
import bridge from '@vkontakte/vk-bridge';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/slides/Transfers.css';
import {ReactComponent as IconSend} from "../../../assets/clickerbattle/send-36.svg";
import {ReactComponent as IconScan} from "../../../assets/clickerbattle/scan-36.svg";
import {ReactComponent as IconShare} from "../../../assets/clickerbattle/share-36.svg";
import {ReactComponent as IconArrowLeft} from "../../../assets/clickerbattle/arrowleft-24.svg";
import {ReactComponent as IconArrowRight} from "../../../assets/clickerbattle/arrowright-24.svg";
import vkQr from '@vkontakte/vk-qr';
import {
    decOfNum,
    getUrlParams, shortIntegers,
    getUrlLocation, getSrcUrl
} from '../../../js/utils';
import {
    getVKUsers, vk_local_users
} from '../../../js/drawerapp/utils';
import Button from "../../../components/ClickerBattle/Button";
import {ReactComponent as IconBack} from "../../../assets/clickerbattle/back_28.svg";
import {Input, ScreenSpinner, Snackbar} from "@vkontakte/vkui";
import {Icon16ErrorCircleFill} from "@vkontakte/icons";
import html2canvas from "html2canvas";

export class Transfers extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            history: [],
            canGetHistory: true,
            isSendMenu: false,
            trHash: props.t.state.transfer_to_id
        };

        this.t = props.t;
        if (this.state.trHash) {
            this.state.isSendMenu = true;
            this.state.toId = this.state.trHash;
            props.t.setState({transfer_to_id: undefined});
        }
    }

    updateHistory() {
        this.t.client.emit('transfers.getHistory', {offset: this.state.history.length}, async response => {
            const ids = await new Promise(resolve => {
                const ret = [];
                for (const item of response.response) {
                    ret.push(item.fromId);
                    ret.push(item.toId);
                }
                resolve(ret);
            });
            await getVKUsers(ids);
            this.setState({
                history: [...this.state.history, ...response.response],
                canGetHistory: response.response.length === 20
            });
        });
    }

    async componentWillReceiveProps(nextProps, nextContext) {
        if (nextProps !== this.props) {
            await this.setState({history: []});
            this.updateHistory();
        }
    }

    render() {
        const
            {props, state} = this,
            {t} = props,
            {history, canGetHistory, isSendMenu, amount, toId, error, snackbar} = state
        ;

        return (
            <div className='Transfers'>
                <div style={{
                    display: isSendMenu ? 'block' : 'none',
                    pointerEvents: !isSendMenu && 'none'
                }}>
                    <div className='BattlePassTextContainer'>
                        <IconBack className='BPBackIcon'
                                  onClick={() => {
                                      this.setState({isSendMenu: !isSendMenu});
                                  }}/>
                        <div style={{marginLeft: 44}} className='SlideTitle'>
                            Перевести
                        </div>
                    </div>
                    <div className='TransferInputTitle'>
                        Сумма:
                    </div>
                    <Input
                        value={amount}
                        onChange={e => this.setState({amount: e.currentTarget.value})}
                        after='кликов' type='number'/>
                    <div className='TransferInputTitle'>
                        Кому:
                    </div>
                    <Input
                        value={toId}
                        onChange={e => this.setState({toId: e.currentTarget.value.toLowerCase()})}
                        placeholder='ulyanov'/>
                    <Button
                        onClick={async () => {
                            if (!toId) {
                                if (snackbar) return;
                                this.setState({
                                    snackbar: <Snackbar
                                        onClose={() => this.setState({snackbar: null})}
                                        before={<Icon16ErrorCircleFill width={20} height={20}/>}
                                    >
                                        Получатель не найден
                                    </Snackbar>
                                });
                                return;
                            }
                            try {
                                const toId_ = await getVKUsers([toId]);
                                t.client.emit('transfers.send', {
                                    toId: toId_[0].id,
                                    amount: parseInt(amount)
                                }, response => {
                                    if (response.error) {
                                        if (snackbar) return;
                                        this.setState({
                                            snackbar: <Snackbar
                                                onClose={() => this.setState({snackbar: null})}
                                                before={<Icon16ErrorCircleFill width={20} height={20}/>}
                                            >
                                                {response.error.message}
                                            </Snackbar>
                                        });
                                    } else {
                                        t.setState({
                                            user: {
                                                ...t.state.user,
                                                clicks: t.state.user.clicks - parseInt(amount)
                                            }
                                        });
                                        this.setState({
                                            history: [response.response, ...this.state.history],
                                            isSendMenu: false
                                        });
                                    }
                                });
                            } catch (e) {
                                if (snackbar) return;
                                this.setState({
                                    snackbar: <Snackbar
                                        onClose={() => this.setState({snackbar: null})}
                                        before={<Icon16ErrorCircleFill width={20} height={20}/>}
                                    >
                                        Получатель не найден
                                    </Snackbar>
                                });
                            }
                        }}
                        className='ButtonSendClicks'>Перевести</Button>
                </div>

                <div style={{
                    display: !isSendMenu ? 'block' : 'none',
                    pointerEvents: isSendMenu && 'none'
                }}>
                    <div className='TransfersQR'>
                        <div dangerouslySetInnerHTML={{
                            __html: vkQr.createQR(`vk.com/app${getUrlParams().vk_app_id}#tr${t.state.user.id}`, {
                                qrSize: 161,
                                isShowLogo: false,
                                foregroundColor: '#48312A'
                            })
                        }}/>
                        <div>
                            {shortIntegers(t.state.user.clicks)} {decOfNum(t.state.user.clicks, ['клик', 'клика', 'кликов'], false)}
                        </div>
                    </div>
                    <div className='TransferButtons'>
                        <div onClick={() => this.setState({isSendMenu: !isSendMenu})}>
                            <IconSend/>
                            <div>Перевести</div>
                        </div>
                        <div onClick={() => {
                            bridge.send('VKWebAppOpenCodeReader', {}).then(result => {
                                if (result.code_data.startsWith('vk.com/app')) {
                                    const toId = parseInt(result.code_data.split('#tr')[1]);
                                    if (toId > 0) {
                                        this.setState({isSendMenu: !isSendMenu, toId});
                                    } else {
                                        if (snackbar) return;
                                        this.setState({
                                            snackbar: <Snackbar
                                                onClose={() => this.setState({snackbar: null})}
                                                before={<Icon16ErrorCircleFill width={20} height={20}/>}
                                            >
                                                Получатель не найден
                                            </Snackbar>
                                        });
                                    }
                                }
                            });
                        }}>
                            <IconScan/>
                            <div>Сканировать</div>
                        </div>
                        <div onClick={() => {
                            t.setState({popout: <ScreenSpinner/>});
                            const
                                {createCanvas, loadImage} = require('canvas'),
                                qr = document.createElement('img'),
                                xml = vkQr.createQR(`vk.com/app${getUrlParams().vk_app_id}#tr${t.state.user.id}`, {
                                    qrSize: 410,
                                    isShowLogo: true,
                                    foregroundColor: '#FFFFFF'
                                })
                            ;

                            qr.onload = () => {
                                loadImage(getSrcUrl(require('../../../assets/clickerbattle/stories/ShareQR.png'))).then(async background => {
                                    const
                                        canvas = createCanvas(background.width, background.height),
                                        ctx = canvas.getContext('2d')
                                    ;
                                    ctx.drawImage(background, 0, 0);
                                    ctx.drawImage(qr, 335, 670);
                                    bridge.send('VKWebAppShowStoryBox', {
                                        background_type: 'image',
                                        blob: canvas.toDataURL('image/png'),
                                        attachment: {
                                            url: 'https://vk.com/app' + getUrlParams().vk_app_id,
                                            text: 'go_to',
                                            type: 'url'
                                        }
                                    });
                                    t.setState({popout: null});
                                });
                            };

                            qr.src = 'data:image/svg+xml;base64,' + btoa(xml);
                        }}>
                            <IconShare/>
                            <div>Поделиться</div>
                        </div>
                    </div>
                    <div className='TransferHistory'>
                        {
                            history.map((value, i) => <div key={`transfers_div_${i}`}
                                                           className='TransferHistoryItem'>
                                <div>{value.toId === t.state.user.id ? <IconArrowRight/> :
                                    <IconArrowLeft/>}</div>
                                <div>
                                    <div>{value.toId === t.state.user.id ? '+' : '-'}{value.amount}</div>
                                    <div>{vk_local_users[value.toId === t.state.user.id ? value.fromId : value.toId].first_name} {vk_local_users[value.toId === t.state.user.id ? value.fromId : value.toId].last_name}</div>
                                </div>
                            </div>)
                        }
                        {
                            (history.length > 0 && canGetHistory) &&
                            <Button
                                onClick={() => this.updateHistory()}
                                style={{background: 'none', padding: '12px 0'}}>Посмотреть ещё</Button>
                        }
                    </div>
                </div>
                {snackbar}
            </div>
        )
    }
}

Transfers.defaultProps = {};

Transfers.propTypes = {
    t: PropTypes.object
};

export default Transfers;