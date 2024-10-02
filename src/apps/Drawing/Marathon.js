import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    HorizontalScroll,
    PanelHeader,
    PanelHeaderBack,
} from "@vkontakte/vkui";
import {
    Icon28LightbulbOutline,
    Icon28ArticlesOutline,
    Icon28BugOutline, Icon28FavoriteOutline, Icon28NotebookCheckOutline, Icon28BillheadOutline, Icon28CheckCircleOutline
} from "@vkontakte/icons";
import {
    decOfNum, getSrcUrl,
    isPlatformDesktop, openUrl
} from "../../js/utils";
import {ReactComponent as IconCoin} from "../../assets/drawing/icons/icon_coin_32.svg";
import {ReactComponent as IconLabel} from "../../assets/drawing/icons/icon_label_32.svg";
import {ReactComponent as IconAvocado} from "../../assets/drawing/icons/icon_avocado_32.svg";
import {ReactComponent as IconLocked} from "../../assets/drawing/icons/icon_locked_32.svg";

export class Marathon extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            data: []
        }
    }

    componentDidMount() {
        const {socket} = this.props.t;
        socket.call('marathon.getData', {}, async r => {
            this.setState({data: r.response});
        });
    }

    render() {
        const
            {t} = this.props,
            {user} = t.state,
            {data} = this.state,
            currentTask = data[user.marathon_next_task_time > Date.now() ? (user.marathon_active_task - 2) : (user.marathon_active_task - 1)]
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
                        <p>Выполняй задания, открывай фрагменты обложки и получай призы. Задания обновляются каждый день, не пропусти!</p>
                    </div>
                    <div className='Panel_Container_Card-Buttons'>
                        <Button
                            stretched
                            size='m'
                            mode='outline'
                            onClick={() => openUrl('https://vk.com/@draw_app-marathon-2024')}
                        >
                            Подробнее
                        </Button>
                    </div>
                </div>
                <div>
                    <div className='marathon-task'>
                        {
                            currentTask ?
                                <React.Fragment>
                                    {
                                        currentTask.completed ?
                                            <Icon28CheckCircleOutline/> : <Icon28BillheadOutline/>
                                    }
                                    <div>
                                        <span>Задание{currentTask.completed ? ' выполнено' : ''}</span>
                                        <span>{currentTask.completed ? `Новое задание будет ${new Date(user.marathon_next_task_time).toLocaleDateString('ru', {
                                            day: 'numeric',
                                            month: 'long',
                                            hour: 'numeric',
                                            minute: 'numeric'
                                        })}` : currentTask.text}</span>
                                    </div>
                                </React.Fragment>
                                :
                                <React.Fragment>
                                    <Icon28CheckCircleOutline/>
                                    <div>
                                        <span>Ты молодец!</span>
                                        <span>Все задания выполнены, ожидайте подведения итогов</span>
                                    </div>
                                </React.Fragment>
                        }
                    </div>
                    <HorizontalScroll
                        showArrows
                        getScrollToLeft={(i) => i - 64}
                        getScrollToRight={(i) => i + 64}
                    >
                        <div className='marathon-gifts'>
                            {
                                data.map((value, index) =>
                                    <div key={`gift-${index}`}>
                                        <div>
                                            {value.completed ? (value.type === 'gift' ?
                                                    <IconAvocado/> : (value.type === 'ticket' ? <IconLabel/> :
                                                        <IconCoin/>)) :
                                                <IconLocked/>}
                                        </div>
                                        <div>
                                        <span>{value.completed ? (value.type === 'gift' ?
                                            'Подарок' : (value.type === 'ticket' ? 'Билет' : 'Монеты')) : 'Закрыто'}</span>
                                            <span>{value.completed ? value.reward : 'Выполните задание'}</span>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    </HorizontalScroll>
                    <div className='marathon-art'>
                        {
                            new Array(9).fill(0).map((v, i) =>
                                <img
                                    alt='art'
                                    key={`art-${i}`}
                                    className={(data[i] && data[i].completed) ? '' : 'locked'}
                                    src={getSrcUrl(require(`../../assets/drawing/marathon/marathon_art-${i + 1}.webp`))}
                                />
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