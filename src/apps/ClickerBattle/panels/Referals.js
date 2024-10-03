import React, {PureComponent} from 'react';
import bridge from '@vkontakte/vk-bridge';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/panels/Referals.css';
import {Avatar, Input} from "@vkontakte/vkui";
import {ReactComponent as IconCopy} from "../../../assets/clickerbattle/copy-24.svg";
import RoundCheckApprove from "../../../components/ClickerBattle/RoundCheckApprove";
import {getUrlParams} from "../../../js/utils";
import {
    getVKUsers, vk_local_users
} from '../../../js/drawerapp/utils';
import Button from "../../../components/ClickerBattle/Button";

export class Referals extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            owner: null,
            referals: [],
            canGetReferals: true
        };

        this.t = props.t;
        props.t.client.emit('referal.getOwner', {}, async response => {
            if (response.response === null) return;
            await getVKUsers([response.response.owner]);
            this.setState({owner: response.response.owner});
        });

        this.updateReferals();
    }

    updateReferals() {
        this.t.client.emit('referal.getList', {offset: this.state.referals.length}, async response => {
            const referal_ids = response.response.map(value => value.id);
            await getVKUsers(referal_ids);
            this.setState({
                referals: [...this.state.referals, ...response.response],
                canGetReferals: response.response.length === 20
            });
        })
    }

    render() {
        const
            {props, state} = this,
            {t} = props,
            {popout, owner, referals, canGetReferals} = state,
            refLink = `vk.com/app${getUrlParams().vk_app_id}#ref${t.state.user.id}`
        ;

        return (
            <React.Fragment>
                <div className='CustomPopoutContainer'>
                    {popout}
                </div>
                <div className='Referals'>
                    <div className='SlideTitle'>
                        Реферальные ссылки
                    </div>
                    <div className='SlideDescription'>
                        Приглашай других игроков, чтобы получать приятные бонусы. <br/>При переходе по Вашей ссылке, игроку будет предложено стать Вашим рефералом.
                    </div>
                    {
                        owner !== null &&
                        <div className='Referal'>
                            <Avatar shadow={false} size={50} src={vk_local_users[owner].photo_100}/>
                            <div>
                                <div>{vk_local_users[owner].first_name} {vk_local_users[owner].last_name}</div>
                                <div>Пригласил тебя</div>
                            </div>
                        </div>
                    }
                    <div className='SlideSubtitle'>
                        Твоя ссылка:
                    </div>
                    <Input readOnly value={refLink} after={
                        <IconCopy onClick={() => {
                            if (popout !== undefined) return;
                            this.setState({
                                popout: <RoundCheckApprove/>
                            });
                            setTimeout(() => {
                                this.setState({popout: undefined});
                            }, 2000);
                            bridge.send('VKWebAppCopyText', {text: refLink});
                        }}/>}/>
                    {
                        referals.length > 0 &&
                        <React.Fragment>
                            <div className='SlideSubtitle'>
                                Ты пригласил в игру:
                            </div>
                            {
                                referals.map((value, index) =>
                                    <div className='Referal' key={'referals_' + index}
                                         style={{marginTop: index > 0 && 0}}>
                                        <Avatar shadow={false} size={50} src={vk_local_users[value.id].photo_100}/>
                                        <div>
                                            <div>{vk_local_users[value.id].first_name} {vk_local_users[value.id].last_name}</div>
                                            <div>{new Date(value.createdAt).toLocaleString('ru', {
                                                day: 'numeric',
                                                month: 'long'
                                            })}</div>
                                        </div>
                                    </div>)
                            }
                            {
                                (referals.length > 0 && canGetReferals) &&
                                <Button
                                    onClick={() => this.updateReferals()}
                                    style={{background: 'none', padding: '12px 0'}}>Посмотреть ещё</Button>
                            }
                        </React.Fragment>
                    }
                </div>
            </React.Fragment>
        )
    }
}

Referals.defaultProps = {};

Referals.propTypes = {
    t: PropTypes.object
};

export default Referals;