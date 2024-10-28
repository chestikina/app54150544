import React from "react";
import {defaultViewProps, initializeNavigation} from "../../js/defaults/navigation";
import {
    View,
    Panel,
    Button,
    PanelHeader,
    PanelHeaderBack,
    Avatar
} from "@vkontakte/vkui";
import './css/Main.css';
import {Icon24HelpOutline, Icon28GiftOutline, Icon28StorefrontOutline, Icon28Users3Outline} from "@vkontakte/icons";
import {subscribeBridgeEvents} from "../../js/defaults/bridge_utils";

import bridge from "@vkontakte/vk-bridge";
import Board from "./components/Board";
import {isPlatformDesktop, shortIntegers} from "../../js/utils";
import Card from "./components/Card";
import Main from "./panels/Main";
import ButtonBack from "./components/ButtonBack";
import Game from "./panels/Game";

const isDesktop = isPlatformDesktop();

export default class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            vk_user: {}
        };

        initializeNavigation.bind(this)();
    }

    async componentDidMount() {
        subscribeBridgeEvents({}, 'bright_light');
        const vk_user = await bridge.send('VKWebAppGetUserInfo');
        await this.setState({vk_user});
        bridge.send('VKWebAppInit');
    }

    render() {
        const {vk_user} = this.state;
        return (
            <View
                {...defaultViewProps.bind(this)()}
            >
                <Panel id='main'>
                    <Main t={this} vk_user={vk_user}/>
                </Panel>
                <Panel id='game'>
                    <ButtonBack onClick={this.back} position='absolute'/>
                    <Game t={this}/>
                </Panel>
            </View>
        );
    }

}