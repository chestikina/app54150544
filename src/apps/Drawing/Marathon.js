import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    PanelHeader,
    PanelHeaderBack,
} from "@vkontakte/vkui";
import {
    Icon28LightbulbOutline,
    Icon28ArticlesOutline,
    Icon28BugOutline, Icon28FavoriteOutline, Icon28NotebookCheckOutline, Icon28BillheadOutline
} from "@vkontakte/icons";
import {
    decOfNum,
    isPlatformDesktop, openUrl
} from "../../js/utils";
import {ReactComponent as IconCoin} from "../../assets/drawing/icons/icon_coin_32.svg";
import {ReactComponent as IconLabel} from "../../assets/drawing/icons/icon_label_32.svg";
import {ReactComponent as IconAvocado} from "../../assets/drawing/icons/icon_avocado_32.svg";
import {ReactComponent as IconLocked} from "../../assets/drawing/icons/icon_locked_32.svg";

export class Marathon extends PureComponent {

    render() {
        const
            {t} = this.props,
            {user} = t.state
        ;
        return <React.Fragment>
            <PanelHeader
                left={<PanelHeaderBack onClick={t.back}/>}
                separator={false}
            />
            <div className='Panel_Container_Card Panel_Container_Card-TwoCards'>
                <div>
                    <Icon28NotebookCheckOutline width={36} height={36}/>
                    <div className='Panel_Container_Card-Text'>
                        <h2>Марафон</h2>
                        <p>Выполняй задания и получай призы. Задания обновляются каждый день, не пропусти!</p>
                    </div>
                </div>
                <div>
                    <div className='marathon-task'>
                        <Icon28BillheadOutline/>
                        <div>
                            <span>Задание</span>
                            <span>Сыграйте в своём лобби три раза</span>
                        </div>
                    </div>
                    <div className='marathon-gifts'>
                        {
                            [
                                {
                                    title: 'Подарок',
                                    descr: 'Подписка avocado+ на час',
                                    icon: <IconAvocado/>,
                                    locked: false,
                                },
                                {
                                    title: 'Билет',
                                    descr: 'Розыгрыш стикеров',
                                    icon: <IconLabel/>,
                                    locked: false,
                                },
                                {
                                    title: 'Монеты',
                                    descr: '+ 10 000',
                                    icon: <IconCoin/>,
                                    locked: false,
                                },
                                {
                                    title: 'Подарок',
                                    descr: 'Подписка avocado+ на 12 часов',
                                    icon: <IconAvocado/>,
                                    locked: true,
                                },
                                {
                                    title: 'Монеты',
                                    descr: '+ 10 000',
                                    icon: <IconCoin/>,
                                    locked: true,
                                },
                                {
                                    title: 'Билет',
                                    descr: 'Розыгрыш капсулы мини',
                                    icon: <IconLabel/>,
                                    locked: true,
                                },
                                {
                                    title: 'Монеты',
                                    descr: '+ 20 000',
                                    icon: <IconCoin/>,
                                    locked: true,
                                },
                                {
                                    title: 'Билет',
                                    descr: 'Розыгрыш avocado+ на месяц',
                                    icon: <IconLabel/>,
                                    locked: true,
                                },
                                {
                                    title: 'Билет',
                                    descr: 'Розыгрыш VK Музыка на 3 месяца',
                                    icon: <IconLabel/>,
                                    locked: true,
                                },
                            ].map((value, index) =>
                                <div key={`gift-${index}`}>
                                    <div>
                                        {value.locked ? <IconLocked/> : value.icon}
                                    </div>
                                    <div>
                                        <span>{value.locked ? 'Подарок' : value.title}</span>
                                        <span>{value.locked ? 'Выполните задание' : value.descr}</span>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
        </React.Fragment>
    }
}

Marathon.defaultProps = {};

Marathon.propTypes = {
    t: PropTypes.object
};

export default Marathon;