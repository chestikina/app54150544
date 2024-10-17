import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/panels/Onboard.css';
import Button from "../../../components/ClickerBattle/Button";
import Background from "../../../components/ClickerBattle/Background";
import {ReactComponent as IconPalette} from "../../../assets/clickerbattle/onboard_icons/palette_28.svg";
import {ReactComponent as IconLove} from "../../../assets/clickerbattle/onboard_icons/love_28.svg";
import {ReactComponent as IconTrophy} from "../../../assets/clickerbattle/onboard_icons/trophy_28.svg";
import {ReactComponent as IconPerson} from "../../../assets/clickerbattle/onboard_icons/person_28.svg";
import {ReactComponent as IconMore} from "../../../assets/clickerbattle/onboard_icons/more_28.svg";
import {openUrl} from "../../../js/utils";
import bridge from '@vkontakte/vk-bridge';

export class Onboard extends PureComponent {
    render() {
        const
            {t} = this.props
        ;

        return (
            <div className='Onboard'>
                <div className='HeaderBackground' style={{
                    height: '28vh'
                }}/>
                <div className='OnboardContainer'>
                    <div className='OnboardTitle'>
                        Добро Пожаловать
                    </div>
                    <div className='OnboardDescription'>
                        Мы обновили Битву Кликеров и добавили кое-что новенькое:
                    </div>
                    <div className='OnboardItems'>
                        {
                            [
                                [<IconPalette/>, 'Новый магазин'],
                                [<IconLove/>, 'Розыгрыши стикеров каждую неделю'],
                                [<IconTrophy/>, 'Четвёртый сезон Боевого Пропуска'],
                                [<IconPerson/>, 'Новый персонаж Леон'],
                                [<IconMore/>, 'Прочее'],
                            ].map((value, index) =>
                                <div key={'onboard_' + index} style={{marginTop: index > 0 && '2.96vh'}}>
                                    {value[0]} <span>{value[1]}</span>
                                </div>
                            )
                        }
                    </div>
                    <Button
                        onClick={() => {
                            bridge.send('VKWebAppStorageSet', {key: 'onboard_season4', value: '1'});
                            t.setState({isShowOnboard: false});
                        }}
                        className='ButtonNext'
                    >
                        Продолжить
                    </Button>
                    <Button
                        onClick={() => {
                            bridge.send('VKWebAppStorageSet', {key: 'onboard_season4', value: '1'});
                            t.setState({isShowOnboard: false});
                            openUrl('https://vk.com/@clickerbattle-season-3');
                        }}
                        style={{background: 'none', marginTop: 12}}
                        className='ButtonNext'
                    >
                        Прочитать статью
                    </Button>
                </div>
                <Background arenaOpacity={.06} fogOpacity={.35}/>
            </div>
        )
    }
}

Onboard.defaultProps = {};

Onboard.propTypes = {
    t: PropTypes.object
};

export default Onboard;