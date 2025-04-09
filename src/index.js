import 'core-js/features/map';
import 'core-js/features/set';
import React from 'react';
import ReactDOM from 'react-dom';
import '@vkontakte/vkui/dist/vkui.css';
import '@vkontakte/vkui/dist/unstable.css'
import {
    AdaptivityProvider,
    ConfigProvider,
    AppRoot,
    WebviewType, useAppearance,
} from "@vkontakte/vkui";

//import './css/Fonts.css';
import './css/Error.css';
import './css/Utils.css';
import bridge from "@vkontakte/vk-bridge";

//import App from './apps/Tracker';
//import App from './apps/MedicalCard';

//import App from './apps/Wheel';
//import App from './apps/AskMe';
//import App from './apps/LoveAnalysis';
//import App from './apps/IQTest';
//import App from './apps/MvsW';
//import App from './apps/DeathDate';
//import App from './apps/Slaves';
//import App from './apps/LikesStat';
//import App from './apps/DateCelebrity';
//import App from './apps/NameInCountry';
//import App from './apps/AccKarma';
//import App from './apps/Free1000Stickers';

//import App from './apps/YearTest';
//import App from './apps/MarryMe';
//import App from './apps/VKAccPrice';
//import App from './apps/VKTime';
//import App from './apps/DeathDate';
//import App from './apps/DeathDate2';
//import App from './apps/CatStickers';
//import App from './apps/CatStickersDocument';
//import App from './apps/CatStoriesAdvert';
//import App from './apps/CatWallPostsStats';
//import App from './apps/PhotoToAnimeAI';
//import App from './apps/RedFlagFromTG';
//import App from './apps/VKFilm';
//import App from './apps/VKAnalizator';
import App from './apps/VKIdScan';

//import App from './apps/BattleStat';
//import App from './apps/BattleStatCatalog';

//import App from './apps/AdvertisementApp';
//import App from './apps/AdvertisementAppSite';

//import App from './apps/ClickerBattle/ClickerBattle';

//import App from './apps/Drawing/Drawing';
//import App from './apps/Drawing/Global';

//import App from './apps/RandomCooking';

//import App from './apps/VK-Audio/Test'

//import App from './apps/Casino/Casino';

//import App from './apps/Test/Test';
//import {GraphAuto} from './apps/Test/Test';

class MiniApp extends React.Component {

    constructor(props) {
        super(props);

        this.state = {}
    }

    componentDidMount() {
        bridge.subscribe(({detail: {type, data}}) => {
            if (type === 'VKWebAppUpdateConfig') {
                this.setState({appearance: data.appearance});
                // data.scheme - vkcom_light, vkcom_dark, bright_light, space_gray
            }
        });
    }

    render() {
        return (
            <ConfigProvider
                webviewType={WebviewType.INTERNAL}
                appearance={this.state.appearance}
            >
                <AdaptivityProvider>
                    <AppRoot>
                        <App/>
                    </AppRoot>
                </AdaptivityProvider>
            </ConfigProvider>
        );
    }

}

ReactDOM.render(<MiniApp/>, document.getElementById('root'));

/*ReactDOM.render(
    false ?
        <App/>
        :
        <ConfigProvider
            webviewType={WebviewType.INTERNAL}
            appearance={appearance}
            onDetectAppearanceByBridge={e => console.log(e)}
        >
            <AdaptivityProvider>
                <AppRoot>
                    <App/>
                </AppRoot>
            </AdaptivityProvider>
        </ConfigProvider>, document.getElementById('root')
);
*/