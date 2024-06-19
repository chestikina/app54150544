import React from "react";
import {defaultViewProps, initializeNavigation} from "../../js/defaults/navigation";
import {
    View,
    Panel,
    Button,
    PanelHeader,
    PanelHeaderBack,
} from "@vkontakte/vkui";
import './css/Main.css';
import {} from "@vkontakte/icons";
import {subscribeBridgeEvents} from "../../js/defaults/bridge_utils";

import bridge from "@vkontakte/vk-bridge";

export default class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {

        };

        initializeNavigation.bind(this)();
    }

    async componentDidMount() {
        subscribeBridgeEvents({}, 'bright_light');
        bridge.send('VKWebAppInit');
    }

    render() {
        const {} = this.state;
        return (
            <View
                {...defaultViewProps.bind(this)()}
            >
                <Panel id='main'>

                </Panel>
            </View>
        );
    }

}