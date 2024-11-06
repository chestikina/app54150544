import React, {PureComponent} from 'react';
import bridge from '@vkontakte/vk-bridge';
import PropTypes from 'prop-types';
import {Avatar, SimpleCell, IS_PLATFORM_ANDROID, IS_PLATFORM_IOS, Placeholder, Tappable, Footer, Link} from "@vkontakte/vkui";
import '../css/TrackHistory.css';
import '../css/CustomPlaceholder.css';

import {
    Icon28NotificationDisableOutline,
    Icon28Notifications
} from '@vkontakte/icons';

import Icon72Box from '../assets/icons_track/Icon72Box.png';
import Icon72Truck from '../assets/icons_track/Icon72Truck.png';
import Icon72Message from '../assets/icons_track/Icon72Message.png';
import Icon72Airplane from '../assets/icons_track/Icon72Airplane.png';
import Icon72Customs from '../assets/icons_track/Icon72Customs.png';
import Icon72Building from '../assets/icons_track/Icon72Building.png';
import Icon72Customs2 from '../assets/icons_track/Icon72Customs2.png';
import Icon72Inbox from '../assets/icons_track/Icon72Inbox.png';
import Icon72Like from '../assets/icons_track/Icon72Like.png';
import Icon72Error from '../assets/icons_track/Icon72Error.png';
import Icon38Message from "../assets/icons_track/Icon72Message.png";

const status = [
    {
        icon: Icon72Box,
        text: [
            'Принято перевозчиком',
            'Принято',
            'Данные от торговой площадки получены',
            'Приём',
            'Импорт международной почты',
            'Покинуло место международного обмена'
        ]
    }, {
        icon: Icon72Truck,
        text: [
            'Покинуло склад',
            'Покинуло место приёма',
            'Покинуло сортировочный центр',
            'Экспорт международной почты',
            'Экспорт международной почты',
            'Выпущено таможней'
        ]
    }, {
        icon: Icon72Message,
        text: [
            'Погрузка в самолёт'
        ]
    }, {
        icon: Icon72Airplane,
        text: [
            'Отправлено в страну назначения'
        ]
    }, {
        icon: Icon72Customs,
        text: [
            'Передано таможне',
            'Принято на таможню'
        ]
    }, {
        icon: Icon72Building,
        text: [
            'Прибыло в сортировочный центр страны назначения',
            'Сортировка',
            'Прибыло в сортировочный центр страны назначения',
            'Прибыло в сортировочный центр страны назначения',
            'Прибыло в сортировочный центр'
        ]
    }, {
        icon: Icon72Customs2,
        text: [
            'Таможенное оформление',
            'Таможенное декларирование'
        ]
    }, {
        icon: Icon72Inbox,
        text: [
            'Вручение получателю',
            'Вручение отправителю',
            'Прибыло в место вручения',
            'Вручение адресату'
        ]
    }, {
        icon: Icon72Like,
        text: [
            'Выдано получателю',
        ]
    }, {
        icon: Icon72Error,
        text: [
            'Доставка не удалась'
        ]
    }, {
        icon: Icon72Error,
        text: [
            'Конфисковано таможней'
        ]
    }
];

export class TrackHistory extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            top: 0,
            left: 0,
            props: []
        }
    }

    findIconFromText(text) {
        for (let i = 0; i < status.length; i++) {
            let stat = status[i];
            if (stat.text.indexOf(text) >= 0) {
                return stat.icon;
            }
        }
        return status[3].icon;
    }

    render() {
        return (
            this.props.track.history.length > 0 ?
                <div>
                    <div className='thistory' style={{position: 'relative'}}>
                        <span className='vertical-line'/>
                        {
                            this.props.track.history.map((value, i) => {
                                return <SimpleCell
                                    key={'thistory-' + i}
                                    className={'thistory-' + (i === 0 ? i : 1)}
                                    disabled
                                    multiline
                                    style={{
                                        margin: i === 0 ? '26px 40px 0 20px' : ((i === 1 ? '21px' : '30px') + ' 31px 0 92px')
                                    }}

                                    before={
                                        i === 0 &&
                                        <Avatar id='thistory-avatar' size={80} shadow={false}>
                                            <img width={34} height={34} src={
                                                this.findIconFromText(value.operationAttributeOriginal)
                                            }/>
                                        </Avatar>
                                    }

                                    after={
                                        false &&
                                        i === 0 ?
                                            <Tappable style={{borderRadius: '50%', padding: '6px'}}
                                                      onClick={async () => {
                                                          try {
                                                              if (!this.props.track.notification) await bridge.sendPromise('VKWebAppAllowNotifications');
                                                              await this.props.this.get('change-notification-status/' + !this.props.track.notification, {packageNumber: this.props.track.packageNumber});
                                                              await this.props.this.updateData();
                                                          } catch (e) {
                                                              console.error(e);
                                                          }
                                                      }}>
                                                {
                                                    this.props.track.notification ?
                                                        <Icon28Notifications fill={'var(--accent_green)'}
                                                                             style={{padding: '10px'}}/>
                                                        :
                                                        <Icon28NotificationDisableOutline style={{padding: '10px'}}/>
                                                }
                                            </Tappable>
                                            :
                                            null
                                    }

                                    description={
                                        <span>
                                            {(value.operationPlaceName.length > 0 ? value.operationPlaceName + ' · ' : value.operationType.length > 0 ? value.operationType + ' · ' : '') +
                                            new Date(value.operationDateTime).toLocaleString('ru', {
                                                month: 'long',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: 'numeric'
                                            })}
                                            {
                                                value.operationType.length > 0 && value.operationType === 'Вероятно, посылка еще не отправлена.' && <React.Fragment>
                                                <br/>
                                                <Link
                                                    style={{color: 'var(--text_link)'}}
                                                    target='_blank'
                                                    href={`https://www.pochta.ru/tracking?barcode=${this.props.track.packageNumber}`}
                                                >
                                                    Нажмите здесь, чтобы отследить посылку через Почту России
                                                </Link>
                                                </React.Fragment>
                                            }
                                        </span>
                                    }>
                                    {
                                        value.operationAttributeOriginal
                                    }
                                </SimpleCell>
                            })
                        }
                    </div>
                    <Footer>Последнее обновление: {this.props.updated}</Footer>
                </div>
                :
                <Placeholder
                    className={'simple_placeholder'}
                    stretched
                    header='Нет информации'
                    icon={<Avatar shadow={false} size={90}><img src={Icon38Message}/></Avatar>}
                >
                    Возможно, Вы ввели неправильный трек-код.
                </Placeholder>
        )
    }
}

TrackHistory.defaultProps = {
    track: {},
    updated: '',
};

TrackHistory.propTypes = {
    track: PropTypes.object,
    updated: PropTypes.string,
    this: PropTypes.object,
};

export default TrackHistory;