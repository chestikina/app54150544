import React, {PureComponent} from 'react';
import bridge from '@vkontakte/vk-bridge';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/panels/Developers.css';
import '../../../css/ClickerBattle/panels/Energy.css';
import {Input, Snackbar} from "@vkontakte/vkui";
import {ReactComponent as IconEnergy1} from "../../../assets/clickerbattle/energy-36.svg";
import {ReactComponent as IconEnergy2} from "../../../assets/clickerbattle/energy2-36.svg";
import {ReactComponent as IconEnergy3} from "../../../assets/clickerbattle/energy3-36.svg";
import {decOfNum} from "../../../js/utils";
import RoundCheckApprove from "../../../components/ClickerBattle/RoundCheckApprove";
import {Icon16ErrorCircleFill} from "@vkontakte/icons";

export class Energy extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {}
    }

    render() {
        const
            {props, state} = this,
            {t} = props,
            {popout, snackbar} = state
        ;

        return (
            <React.Fragment>
                <div className='CustomPopoutContainer'>
                    {popout}
                </div>
                <div className='Energy'>
                    <div className='EnergyTextsContainer'>
                        <div className='SlideTitle'>
                            Энергия
                        </div>
                        <div className='SlideDescription'>
                            Накапливайте или покупайте энергию, чтобы не уставать в бою.
                        </div>
                    </div>
                    <div className='EnergyList'>
                        {
                            [
                                [10, 50, <IconEnergy1/>],
                                [20, 70, <IconEnergy2/>],
                                [30, 100, <IconEnergy3/>]
                            ].map((value, index) =>
                                <div
                                    onClick={() => {
                                        t.client.emit('energy.buy', {energy: value[0]}, data => {
                                            if (data.response) {
                                                if (popout !== undefined) return;
                                                this.setState({
                                                    popout: <RoundCheckApprove/>
                                                });
                                                setTimeout(() => {
                                                    this.setState({popout: undefined});
                                                }, 2000);
                                                t.setState({
                                                    user: {
                                                        ...t.state.user,
                                                        energy: t.state.user.energy + value[0],
                                                        clicks: t.state.user.clicks - value[1]
                                                    }
                                                });
                                                this.forceUpdate();
                                            } else {
                                                if (snackbar) return;
                                                this.setState({
                                                    snackbar: <Snackbar
                                                        onClose={() => this.setState({snackbar: null})}
                                                        before={<Icon16ErrorCircleFill width={20} height={20}/>}
                                                    >
                                                        {
                                                            t.state.user.energy >= 100 ?
                                                                'Вы не нуждаетесь в энергии'
                                                                :
                                                                'У Вас недостаточно кликов'
                                                        }
                                                    </Snackbar>
                                                });
                                            }
                                        })
                                    }}
                                    key={'energy-' + index}>
                                    <div>
                                        {value[2]}
                                    </div>
                                    <div>
                                        <div>{decOfNum(value[0], ['единица', 'единицы', 'единиц'])}</div>
                                        <div>{decOfNum(value[1], ['клик', 'клика', 'кликов'])}</div>
                                    </div>
                                </div>)
                        }
                    </div>
                </div>
                {snackbar}
            </React.Fragment>
        )
    }
}

Energy.defaultProps = {};

Energy.propTypes = {
    t: PropTypes.object
};

export default Energy;