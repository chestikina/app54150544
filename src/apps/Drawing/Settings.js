import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    PanelHeader,
    PanelHeaderBack
} from "@vkontakte/vkui";
import bridge from "@vkontakte/vk-bridge";
import {
    Icon28DonateOutline, Icon28HelpCircleOutline,
    Icon28SettingsOutline,
    Icon28TextOutline, Icon28UserBackgroundOutline
} from "@vkontakte/icons";
import {app_version, MODAL_CARD_OUTDATED_VERSION} from "./Drawing";
import eruda from "eruda";

export class Settings extends PureComponent {

    constructor(props) {
        super(props);
    }

    async componentDidMount() {

    }

    render() {
        const {t} = this.props;

        return (
            <React.Fragment>
                <PanelHeader
                    left={<PanelHeaderBack onClick={t.back}/>}
                    separator={false}
                />
                <div
                    className={`Panel_Container_Card Panel_Container_Card-ManyCards`}>
                    <div>
                        <Icon28SettingsOutline width={36} height={36}/>
                        <div className='Panel_Container_Card-Text'>
                            <h2>Настройки</h2>
                        </div>
                    </div>
                    <div
                        onClick={() => t.go('avatar_frames')}
                    >
                        <Icon28UserBackgroundOutline width={32} height={32}/>
                        <h3>Редактировать аватар</h3>
                    </div>
                    {
                        false && <div>
                            <Icon28TextOutline width={32} height={32}/>
                            <h3>Изменить имя</h3>
                        </div>
                    }
                    <div
                        onClick={() => t.go('tags')}
                    >
                        <Icon28DonateOutline width={32} height={32}/>
                        <h3>Выбрать метки</h3>
                    </div>
                    <div
                        onClick={() => t.showOnboard('welcome')}
                    >
                        <Icon28HelpCircleOutline width={32} height={32}/>
                        <h3>Показать обучение</h3>
                    </div>
                    <div
                        onClick={async () => {
                            if (t.state.app_version !== app_version) {
                                t.setActiveModal(MODAL_CARD_OUTDATED_VERSION);
                            }
                            await t.setState({__v_clicks: t.state.__v_clicks === 4 ? 4 : (t.state.__v_clicks + 1)});
                            this.forceUpdate();
                            if (t.state.__v_clicks === 3) {
                                eruda.scale(1);
                            }
                        }}
                    >
                        <p>v{app_version}</p>
                        <p>ulyanov <img alt='emoji' src='https://vk.com/images/emoji/2764_2x.png' height={12}/> avocado
                        </p>
                    </div>
                </div>
            </React.Fragment>
        )
    }

}

Settings.defaultProps = {};

Settings.propTypes = {
    t: PropTypes.object
};

export default Settings;