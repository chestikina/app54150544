import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/slides/Persons.css';
import {ReactComponent as Terra} from "../../../assets/clickerbattle/Terra.svg";
import Button from "../../../components/ClickerBattle/Button";
import Person from "../../../assets/clickerbattle/persons/Person";
import {Gallery, Snackbar} from "@vkontakte/vkui";
import {ReactComponent as IconSkins} from "../../../assets/clickerbattle/skins_28.svg";
import {ReactComponent as IconBack} from "../../../assets/clickerbattle/back_28.svg";
import {decOfNum, isPlatformIOS, openUrl} from "../../../js/utils";
import {Icon16ErrorCircleFill} from "@vkontakte/icons";
import bridge from "@vkontakte/vk-bridge";

export class Persons extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            more: false,
            person: 0,
            skin: 0,
            persons: []
        };

        props.t.client.emit('persons.get', {}, async response =>
            this.setState({
                persons: response.response
            })
        );
    }

    render() {
        const
            {state, props} = this,
            {t} = props,
            {more, person_info, persons, person, skin, snackbar} = state,
            isIos = isPlatformIOS()
        ;

        return (
            <div className='Persons'>
                {
                    more ?
                        <div className='MoreContainer'>
                            <div className='PersonText'>
                                <div className='PersonMTextWithIcon'>
                                    <IconBack className='PersonSkinsIcon' onClick={async () => {
                                        this.setState({more: false});
                                    }}/>
                                    <div className='PersonTitle'>
                                        {person_info.name}
                                    </div>
                                    <div className='PersonPrice'>
                                        {decOfNum(person_info.skins.length, ['скин', 'скина', 'скинов'])}
                                    </div>
                                </div>
                            </div>
                            <div className='PersonContainer'>
                                <Gallery
                                    align="center"
                                    slideIndex={skin}
                                    onChange={skin => this.setState({skin})}
                                >
                                    {
                                        persons[person].skins.map((value, i) =>
                                            <Person width={238} height={276}
                                                    name={persons[person].file_name}
                                                    skin={value}/>)
                                            .map((value, i) =>
                                                <div key={`persons_2_div_${i}`} className='centered'>{value}</div>)
                                    }
                                </Gallery>
                                <Terra className='Terra'/>
                            </div>
                            <Button style={{
                                width: '49vw',
                                opacity: (
                                    (t.state.user.activeSkins[person_info.id] === skin)
                                    ||
                                    (t.state.user.skins[person_info.id] === undefined && skin === 0)
                                    ||
                                    (Object.keys(t.state.user.activeSkins).length === 0 && skin === 0)
                                ) && .5
                            }} className='ButtonBuy' after={
                                (
                                    (
                                        (t.state.user.skins[person_info.id] === undefined && skin !== 0)
                                        ||
                                        (t.state.user.skins[person_info.id] !== undefined && t.state.user.skins[person_info.id].indexOf(skin) === -1 && skin !== 0)
                                    )
                                )
                                &&
                                isIos === false
                                && false && 29
                            } onClick={async () => {
                                if (t.state.user.skins[person_info.id] && t.state.user.skins[person_info.id].indexOf(skin) > -1 || skin === 0) {
                                    t.client.emit('persons.selectSkin', {
                                        person: person_info.id, skin
                                    }, async response => {
                                        if (response.response) {
                                            t.setState({
                                                user: {
                                                    ...t.state.user,
                                                    activeSkins: {
                                                        ...t.state.user.activeSkins,
                                                        [person_info.id]: skin
                                                    }
                                                }
                                            });
                                            this.forceUpdate();
                                        }
                                    });
                                } else {
                                    t.setState({
                                        activePanel: 'skins_placeholder'
                                    });
                                    return;
                                    if (isIos) {
                                        /*
                                        try {
                                            await bridge.send('VKWebAppAllowMessagesFromGroup', {group_id: 173263813});
                                            await bridge.send('VKWebAppSendPayload', {
                                                group_id: 173263813,
                                                payload: {act: 'skin', data: {person: person_info.id, skin}}
                                            });
                                        } catch (e) {
                                        }
                                        openUrl('https://vk.me/clickerbattle');
                                        */
                                        t.setState({
                                            market_data: {act: 'skin', data: {person: person_info.id, skin}},
                                            activePanel: 'market_placeholder'
                                        });
                                    } else {
                                        t.client.emit('persons.unlockSkin', {person: person_info.id, skin}, data => {
                                            const {payUrl, comment} = data.response;
                                            t.setState({
                                                activeModal: require('../ClickerBattle').MODAL_CARD_PAYMENT,
                                                modalPaymentData: {payUrl, comment, price: 29}
                                            });
                                        });
                                    }
                                }
                            }}>
                                {
                                    t.state.user.skins[person_info.id] !== undefined ?
                                        (
                                            t.state.user.skins[person_info.id].indexOf(skin) > -1 ?
                                                (
                                                    t.state.user.activeSkins[person_info.id] === skin ?
                                                        'Выбран'
                                                        :
                                                        'Выбрать'
                                                )
                                                :
                                                skin === 0 ? (
                                                        Object.keys(t.state.user.activeSkins).length === 0 ?
                                                            'Выбран'
                                                            :
                                                            t.state.user.activeSkins[person_info.id] === skin ?
                                                                'Выбран'
                                                                :
                                                                'Выбрать')
                                                    :
                                                    (
                                                        isIos ? 'Подробнее' : (false ? 'Купить' : 'Подробнее')
                                                    )
                                        )
                                        :
                                        (
                                            skin === 0 ?
                                                'Выбран'
                                                :
                                                isIos ? 'Подробнее' : (false ? 'Купить' : 'Подробнее')
                                        )
                                }
                            </Button>
                        </div>
                        :
                        persons.length > 0 ?
                            <Gallery
                                slideWidth="90%"
                                align="center"
                                slideIndex={person}
                                onChange={person => this.setState({person})}
                            >
                                {persons.map((value, i) =>
                                    <div key={`persons_div_${i}`}>
                                        <div className='PersonText'>
                                            <div className='PersonMTextWithIcon'>
                                                <IconSkins className='PersonSkinsIcon'
                                                           onClick={async () => {
                                                               await this.setState({more: true, person_info: value});
                                                           }}/>
                                                <div className='PersonTitle'>
                                                    {value.name}
                                                </div>
                                                <div className='PersonPrice'>
                                                    {value.price < 0 ? 'Не продаётся'
                                                        : value.price === 0 ? 'Бесплатно'
                                                            : decOfNum(value.price, ['клик', 'клика', 'кликов'])}
                                                </div>
                                            </div>
                                        </div>
                                        <div className='PersonContainer'>
                                            <Person width={238} height={276}
                                                    name={value.file_name}
                                                    skin={t.state.user.activeSkins[value.id] !== undefined && value.skins[t.state.user.activeSkins[value.id]]}/>
                                            <Terra className='Terra'/>
                                        </div>
                                        {
                                            t.state.user.persons.indexOf(value.id) < 0 ?
                                                <Button
                                                    style={{
                                                        opacity: value.price < 0 && .5,
                                                        pointerEvents: value.price < 0 && 'none'
                                                    }}
                                                    onClick={() => {
                                                        if (t.state.user.clicks >= value.price) {
                                                            t.client.emit('persons.unlock', {person: value.id}, data => {
                                                                t.setState({
                                                                    user: {
                                                                        ...t.state.user,
                                                                        persons: [...t.state.user.persons, value.id]
                                                                    }
                                                                });
                                                                this.forceUpdate();
                                                            });
                                                        } else {
                                                            if (snackbar) return;
                                                            this.setState({
                                                                snackbar: <Snackbar
                                                                    onClose={() => this.setState({snackbar: null})}
                                                                    before={<Icon16ErrorCircleFill width={20}
                                                                                                   height={20}/>}
                                                                >
                                                                    У Вас недостаточно кликов
                                                                </Snackbar>
                                                            });
                                                        }
                                                    }}
                                                    className='ButtonBuy'>Разблокировать</Button>
                                                :
                                                t.state.user.activePerson !== value.id &&
                                                <Button onClick={() => {
                                                    t.client.emit('persons.select', {person: value.id}, data => {
                                                        t.setState({
                                                            user: {
                                                                ...t.state.user,
                                                                activePerson: value.id
                                                            }
                                                        });
                                                        this.forceUpdate();
                                                    })
                                                }} className='ButtonBuy'>Выбрать</Button>
                                        }
                                    </div>
                                )}
                            </Gallery>
                            :
                            <Button className='ItemsNull' style={{
                                background: 'none'
                            }}>Пусто</Button>
                }
                {snackbar}
            </div>
        )
    }
}

Persons.defaultProps = {};

Persons.propTypes = {
    t: PropTypes.object
};

export default Persons;