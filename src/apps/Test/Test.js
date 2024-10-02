import React from 'react';
import {
    IconButton, ModalPage, ModalRoot,
    Panel, PanelHeader, Tappable, View,
    ModalPageHeader, PanelHeaderButton,
    Slider, Search, FormLayout, FormItem,
    Input, Button, Alert, ScreenSpinner,
    Avatar, PanelHeaderBack, Div, Textarea, List, File
} from '@vkontakte/vkui';
import {
    Icon12CancelOutline,
    Icon24Cancel,
    Icon24Dismiss,
    Icon24Pause,
    Icon24Play, Icon28AddSquareOutline,
    Icon28DownloadCheckOutline,
    Icon28ErrorCircleOutline,
    Icon28MusicOutline,
    Icon28OnOffOutline,
    Icon28Pause,
    Icon28Play,
    Icon28SkipNext,
    Icon28SkipPrevious,
    Icon28SongOutline, Icon28WarningTriangleOutline,
    Icon56LogoVk
} from '@vkontakte/icons';
import './Test.css';
import {
    adAppApi, ctxDrawImageWithRound,
    decOfNum,
    getBase64Image,
    getRandomInt,
    getSrcUrl,
    getUrlParams, loadCrossOriginImage,
    loadFonts, post,
    sleep
} from "../../js/utils";
import {createCanvas, loadImage} from "canvas";
import bridge from "@vkontakte/vk-bridge";
import {ReactComponent as Dice1} from "../../assets/test/dice_1.svg";
import Lottie from "lottie-react";
import {subscribeBridgeEvents} from "../../js/defaults/bridge_utils";
import {defaultViewProps, initializeNavigation} from "../../js/defaults/navigation";
import {roundPathCorners} from "../../js/rounding";

let all_history2 = [], all_history = [], check2 = false, check = false;

export class RMRPCasino extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            history_count: 1,
            history0: [],
            tick: 1000,
            chances: {},
            chance_red: 0,
            chance_black: 0,
            chance_green: 0
        };

        const elements = this.roulette_items;
        const colors = {};
        this.colors = colors;
        let c = true;
        for (let i = 0; i < elements.length; i++) {
            colors[elements[i]] = (elements[i] === "0" || elements[i] === "00") ? "green" : (c ? "black" : "red");
            if (i !== 0 && colors[elements[i + 1]] !== "green") {
                c = !c;
            }
        }

        this.start = this.start.bind(this);
    }

    get roulette_items() {
        return [
            "0", "28", "9", "26", "30", "11", "7", "20", "32", "17",
            "5", "22", "34", "15", "3", "24", "36", "13", "1", "00",
            "27", "10", "25", "29", "12", "8", "19", "31", "18", "6",
            "21", "33", "16", "4", "23", "35", "14", "2"
        ];
    }

    componentDidMount() {

    }

    calculate_chance(arr, value) {
        const filtered = arr.filter(val => val === value);
        return 100 / arr.length * filtered.length;
    }

    async start() {
        const maxHistory = 7;

        for (let j = 0; j < this.state.history_count; j++) {
            setTimeout(async () => {
                const history = [], colors_history = [];
                for (let i = 0; i < 1; i++) {
                    const randomItem = this.roulette_items[getRandomInt(0, this.roulette_items.length - 1)];
                    if (history.length === maxHistory) history.splice(0, 1);
                    history.push(randomItem);
                    colors_history.push(this.colors[randomItem]);
                    this.setState({[`history${j}`]: history});

                    if (check) {
                        check = false;
                        all_history.push(randomItem);
                    }

                    if (check2) {
                        check2 = false;
                        console.log({next: this.colors[randomItem]})
                        all_history2.push(this.colors[randomItem]);
                        for (const color of ['red', 'black', 'green']) {
                            this.setState({
                                [`chance_${color}`]: Math.floor(this.calculate_chance(all_history2, color))
                            });
                        }
                    }

                    let history_compare = history.join();
                    let find_compare = this.state.findArr.join();
                    if (history_compare.indexOf(find_compare) > -1) {
                        history.splice(0, history.indexOf(this.state.findArr[this.state.findArr.length - 1]) + 1);
                        check = true;
                    }

                    let colors_compare = colors_history.join();
                    let find_colors_compare = this.state.findArr.map(value => this.colors[value]).join();
                    if (colors_compare.indexOf(find_colors_compare) > -1) {
                        console.log(colors_compare);
                        console.log(find_colors_compare);
                        colors_history.splice(0, colors_history.indexOf(this.colors[this.state.findArr[this.state.findArr.length - 1]]) + 1);
                        check2 = true;
                    }

                    i--;
                    await sleep(this.state.tick);
                }
            });
        }
    }

    render() {
        return (
            <Panel>
                <Div style={{width: '90vw'}}>
                    <div className='RouletteItems'>
                        {
                            this.roulette_items.map((value, index) =>
                                <div key={`div_${index}`} className={this.colors[value]}>
                                    {value}
                                </div>
                            )
                        }
                    </div>
                    <div style={{display: 'flex', gap: 12, marginTop: 24}}>
                        <Input placeholder='Что ищем'
                               onChange={e => this.setState({findArr: e.currentTarget.value.split(" ")})}/>
                        <Input placeholder='Интервал'
                               onChange={e => this.setState({tick: parseInt(e.currentTarget.value)})}/>
                        <Input placeholder='Кол-во столов'
                               onChange={e => this.setState({history_count: parseInt(e.currentTarget.value)})}/>
                    </div>
                    <Button size='l' style={{marginTop: 12}} onClick={this.start}>Start</Button>
                    <div className='Chances' style={{marginTop: 12}}>
                        <div className='RouletteItems'>
                            <div className='red'/>
                            <div>
                                {this.state.chance_red}%
                            </div>
                        </div>
                        <div className='RouletteItems'>
                            <div className='black'/>
                            <div>
                                {this.state.chance_black}%
                            </div>
                        </div>
                        <div className='RouletteItems'>
                            <div className='green'/>
                            <div>
                                {this.state.chance_green}%
                            </div>
                        </div>
                    </div>
                    {
                        new Array(this.state.history_count).fill(0).map((val, ind) =>
                            <div className='RouletteItems' style={{marginTop: 12}} key={`div_${ind}`}>
                                {
                                    this.state[`history${ind}`] && this.state[`history${ind}`].map((value, index) =>
                                        <div key={`div_${index}`} className={this.colors[value]}>
                                            {value}
                                        </div>
                                    )
                                }
                            </div>
                        )
                    }
                </Div>
            </Panel>
        )
    }

}

export class InputMinimalist extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            value: ''
        }
        this.onChange = this.onChange.bind(this);
    }

    onChange(e) {
        const value = e.target.value.toUpperCase();
        this.setState({value});
        if (this.props.onChange && typeof this.props.onChange === 'function')
            this.props.onChange(value);
    }

    render() {
        const
            {value} = this.state,
            {placeholder, defaultValue, maxLength} = this.props
        ;
        return <Input
            value={value}
            onChange={this.onChange}
            placeholder={placeholder}
            defaultValue={defaultValue}
            maxLength={maxLength}
        />
    }

}

export class Test extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null,
            history: ['main'],
            activePanel: 'canvas'
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.back = this.back.bind(this);
        this.go = this.go.bind(this);
        this.getDiceValue = this.getDiceValue.bind(this);
    }

    async componentDidMount() {
        bridge.send('VKWebAppInit');
        window.addEventListener('popstate', e => {
            e.preventDefault();
            this.back(e);
        });
        bridge.subscribe(async ({detail: {type, data}}) => {
            if (type !== undefined) console.log(type, data);
            if (type === 'VKWebAppUpdateConfig') {
                const schemeAttribute = document.createAttribute('scheme');
                schemeAttribute.value = data.scheme ? data.scheme === 'client_light' ? 'bright_light' : data.scheme : 'bright_light';
                document.body.attributes.setNamedItem(schemeAttribute);
                const isDarkTheme = schemeAttribute.value !== 'bright_light';
                this.setState({isDarkTheme});
                if (bridge.supports('VKWebAppSetViewSettings')) {
                    bridge.send('VKWebAppSetViewSettings', {
                        status_bar_style: isDarkTheme ? 'light' : 'dark',
                        action_bar_color: isDarkTheme ? '#242424' : '#F9F9F9',
                        navigation_bar_color: isDarkTheme ? '#242424' : '#F9F9F9'
                    });
                }
            }
        });

        /*this.setPopout(
            this.fullscreenAlert(
                <Icon28ErrorCircleOutline fill='#FF3F52'/>,
                'Предупреждение',
                'Если вы будете бездействовать, вы автоматически проиграете!',
                [
                    {
                        title: 'Окей',
                        onClick: () => this.setPopout(null)
                    }
                ]
            )
        );

        this.setPopout(
            this.fullscreenAlert(
                <Icon28WarningTriangleOutline fill='#FFFFFF'/>,
                'Подтвердите',
                'Вы уверены, что хотите сдаться?',
                [
                    {
                        title: 'Да',
                        mode: 'Negative',
                        onClick: () => this.setPopout(null)
                    },
                    {
                        title: 'Нет',
                        mode: 'Secondary',
                        onClick: () => this.setPopout(null)
                    }
                ]
            )
        );*/
    }

    back() {
        if (this.state.popout !== null) {
            this.setState({popout: null});
            window.history.pushState({pop: 'popout'}, 'Title');
            return;
        }

        if (this.state.activeModal !== null) {
            this.setState({activeModal: null});
            window.history.pushState({modal: 'modal'}, 'Title');
            return;
        }

        let {history} = this.state;
        if (history.length > 1) {
            history.pop();
            this.setState({activePanel: history[history.length - 1], history, snackbar: null});
        }
    };

    go(panel) {
        let {history} = this.state;
        if (history[history.length - 1] !== panel) {
            history.push(panel);
            window.history.pushState({activePanel: panel}, 'Title');
            this.setState({activePanel: panel, history, snackbar: null, activeModal: null});
        }
    }

    setPopout(popout) {
        this.setState({popout});
    }

    setActivePanel(activePanel) {
        this.setState({activePanel, history: [activePanel]});
    }

    getDiceValue() {
        this.setState({dice_value: getRandomInt(1, 6)});
    }

    fullscreenAlert(icon, title, message, buttons) {
        // buttons mode = undefined | 'Secondary' | 'Negative'
        return (
            <div className='FullScreen_Alert'>
                <div className='FullScreen_Alert_Icon'>
                    {icon}
                </div>
                <div className='FullScreen_Alert_Text_Container'>
                    <p className='FullScreen_Alert_Title'>
                        {title}
                    </p>
                    <p className='FullScreen_Alert_Description'>
                        {message}
                    </p>
                </div>
                <div className='FullScreen_Alert_Buttons_Container'>
                    {
                        buttons.map(({title, mode, onClick}, index) =>
                            <Tappable className={`mButton${mode ? ` mButton--${mode}` : ''}`} onClick={onClick}>
                                <p>{title}</p>
                            </Tappable>
                        )
                    }
                </div>
            </div>
        );
    }

    render() {
        const
            {state, go, back} = this,
            {activePanel, history, isDarkTheme, dice_value, popout} = state
        ;

        return (
            <View
                activePanel={activePanel}
                onSwipeBack={back}
                history={history}
                popout={popout}
            >
                <Panel id='game'>
                    <div className='Game_Container'>
                        <div className='Game_Players_Container'>
                            <div className='Game_Player'>
                                <Avatar shadow={false} size={48}/>
                                <p>4</p>
                            </div>
                            <p>vs</p>
                            <div className='Game_Player'>
                                <p>0</p>
                                <Avatar shadow={false} size={48}/>
                            </div>
                        </div>
                        <div className='Game_Zone'>
                            <div className='Game_Zone_Inner'>
                                {
                                    new Array(12).fill(0).map((v1, x) =>
                                        <div key={`Column-x-${x}`}>
                                            {
                                                new Array(12).fill(0).map((v2, y) =>
                                                    <div key={`Point-x-${x}-y-${y}`}/>
                                                )
                                            }
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                        <div className='Game_Turn'>
                            <p>Твой ход</p>
                            <p style={{opacity: .2}}>Ход противника</p>
                        </div>
                        <div
                            className='Game_Dice'
                            onClick={this.getDiceValue}
                        >
                            {
                                dice_value ?
                                    <Lottie
                                        animationData={require(`../../assets/test/dice_${dice_value}.json`)}
                                        loop={false}
                                        style={{
                                            transform: 'scale(1.93)',
                                            marginTop: -20
                                        }}
                                    />
                                    :
                                    <Dice1/>
                            }
                        </div>
                        <Tappable className='mButton mButton--Negative'>
                            <p>Сдаться</p>
                        </Tappable>
                    </div>
                </Panel>
                <Panel id='train4'>
                    <div className='Train_Container Train_Container--Centered'>
                        <div className='Train_TextContainer'>
                            <p className='Train_Title'>
                                Обучение
                            </p>
                            <div className='Train_DescriptionList'>
                                {
                                    [
                                        'Начать захват можно только с угла',
                                        'Все клетки должны быть соеденены между собой',
                                        'Если не можешь закрасить зону, пропускаешь ход',
                                        'Побеждает тот, чья зона получилась больше'
                                    ].map((value, index) =>
                                        <p key={`text-${index}`} className='Train_Description'>
                                            <div/>
                                            {value}
                                        </p>
                                    )
                                }
                            </div>
                        </div>
                        <div className='Train_ActionsContainer'>
                            <Tappable className='mButton'>
                                <p>Начать играть</p>
                            </Tappable>
                            <Tappable className='mButton mButton--Secondary'>
                                <p>Назад</p>
                            </Tappable>
                        </div>
                    </div>
                </Panel>
                <Panel id='train1'>
                    <div className='Train_Container'>
                        <div className='Train_TextContainer'>
                            <p className='Train_Title'>
                                Обучение
                            </p>
                            <p className='Train_Description'>
                                Размер игрового поля 12x12 клеток
                            </p>
                        </div>
                        <div className='Train_ActionsContainer'>
                            <Tappable className='mButton'>
                                <p>Дальше</p>
                            </Tappable>
                            <Tappable className='mButton mButton--Secondary'>
                                <p>Пропустить</p>
                            </Tappable>
                        </div>
                    </div>
                    <img className='Train_Phone' alt='iphone'
                         src={require(`../../assets/test/train_1${isDarkTheme ? '_dark' : ''}.png`)}/>
                </Panel>
                <Panel id='placeholder'>
                    <div className='Popout_Placeholder'>
                        <p className='Popout_Placeholder_Title'>
                            Упс
                        </p>
                        <p className='Popout_Placeholder_Description'>
                            Отсутствует интернет-соединение
                        </p>
                        <Tappable className='mButton'>
                            <p>Повторить</p>
                        </Tappable>
                    </div>
                </Panel>
                <Panel id='miniapp-native-test'>
                    <div style={{
                        height: 366,
                        width: 1100,
                        background: 'url(https://sun2.beeline-yaroslavl.userapi.com/s/v1/ig2/kn3ZCztncMJEvx1mfAz1jVDbhuMceO9aNPfF_qVhb9HEihXmTdg3mhEzkWRb0Womv7b1CL1EauLGvw5zeHPBRcfx.jpg?size=200x200&quality=95&crop=0,0,600,600&ava=1)',
                        '-webkit-filter': 'blur(75px)',
                        filter: 'blur(75px)'
                    }}>

                    </div>
                </Panel>
                <Panel id='canvas'>
                    <canvas
                        style={{
                            width: 800
                        }}
                        ref={ref => this.canvas = ref} width={500} height={500}
                        onClick={async () => {
                            /*
                            * await loadFonts(['Inter ExtraBold', 'Inter Black', 'SF Pro Rounded Heavy', 'SF Pro Rounded Bold', 'SF Pro Rounded Black']);
                            await sleep(500);

                            const type = getRandomInt(0, 5);
                            const rndBackground = getRandomInt(1, 13);
                            const secondaryColor = rndBackground > 7 ? '#696969' : '#FFFFFF';
                            const titles = [
                                'Оцени рисунок\nот 1 до 10',
                                'Какой рисунок\nсамый красивый?',
                                'Оцени художника\nот 1 до 10',
                                'Кто лучше нарисовал\n«%слово%»?',
                                'Лучший рисунок\nза сегодня',
                                'Лучшие рисунки\nза неделю'
                            ].map(value => value.split('\n'));

                            const ctx = this.canvas.getContext('2d');
                            const background = await loadCrossOriginImage(getSrcUrl(require(`../../assets/drawing/backend/${rndBackground}.png`)));
                            this.canvas.width = background.width;
                            this.canvas.height = background.height;
                            ctx.drawImage(background, 0, 0);

                            const pxData = ctx.getImageData(115, 152, 1, 1);
                            const primaryColor = `rgb(${pxData.data[0]}, ${pxData.data[1]}, ${pxData.data[2]})`;

                            const word = 'утка';
                            const picture_url = 'https://photos.avocado.special.vk-apps.com/game_1288.webp';
                            const author_photo = 'https://sun9-65.userapi.com/s/v1/ig2/Xypaf-WeuFD4AM8gMkaJ5d4xPyQkWG-BLP3hgV4Kk8PrQTsihP_xTPWTSHEex8RCf3v5xSPF8TiuPTMkReLD6NK8.jpg?size=100x100&quality=95&crop=68,391,555,555&ava=1';
                            const author_name = 'Настя Кобелева';

                            const title = titles[type];
                            const titleX = 212, titleY = 145 + 36;
                            ctx.font = '40px Inter ExtraBold';
                            ctx.textAlign = 'left';
                            ctx.fillStyle = primaryColor;
                            for (const i in title) {
                                if (type === 3) title[i] = title[i].replace('%слово%', word.substring(0, 1).toUpperCase() + word.substring(1));
                                ctx.fillText(title[i], titleX, titleY + i * 43.4); // 43.4 = line-height
                            }

                            if (type === 0 || type === 4) {
                                ctx.font = '96px Inter Black';
                                ctx.textAlign = 'left';
                                ctx.fillStyle = primaryColor;
                                ctx.fillText(word.substring(0, 1).toUpperCase() + word.substring(1), 100, 254 + 93);

                                ctx.fillStyle = '#FFFFFF';
                                ctx.beginPath();
                                ctx.roundRect(90, 426, 900, 900, 129);
                                ctx.fill();
                                ctx.closePath();

                                const image = await loadCrossOriginImage(picture_url);
                                ctxDrawImageWithRound(ctx, image, 129, null, {
                                    x: 90,
                                    y: 426,
                                    width: 900,
                                    height: 900
                                });

                                ctx.font = '56px SF Pro Rounded Heavy';
                                ctx.textAlign = 'left';
                                ctx.fillStyle = secondaryColor;
                                const text_params = ctx.measureText(author_name);
                                let avatar_size = 100;
                                const all_width = text_params.width + 12 + avatar_size;
                                const first_x = Math.floor((background.width - all_width) / 2);

                                const avatar = await loadCrossOriginImage(author_photo);
                                ctxDrawImageWithRound(ctx, avatar, avatar_size / 2, null, {
                                    x: first_x,
                                    y: 1361,
                                    width: avatar_size,
                                    height: avatar_size
                                });
                                ctx.fillText(author_name, first_x + avatar_size + 12, 1377.5 + 51.5);
                            } else if (type === 1 || type === 2 || type === 3 || type === 5) {
                                const firstCoords = {x: 100, y: 310};

                                for (let i = 0; i < 2; i++) {
                                    for (let j = 0; j < 2; j++) {
                                        let gapX = 40;
                                        let gapY = type === 1 || type === 5 ? 187 : (type === 2 ? 131 : 158);
                                        let size = 420;
                                        const picCords = {
                                            x: firstCoords.x + gapX * i + size * i,
                                            y: firstCoords.y + gapY * j + size * j
                                        };
                                        ctx.fillStyle = '#FFFFFF';
                                        ctx.beginPath();
                                        ctx.roundRect(picCords.x, picCords.y, size, size, 60);
                                        ctx.fill();
                                        ctx.closePath();
                                        const image = await loadCrossOriginImage(picture_url);
                                        ctxDrawImageWithRound(ctx, image, 60, null, {
                                            x: picCords.x, y: picCords.y, width: size, height: size
                                        });

                                        let textY = picCords.y + size + 16 + 61;
                                        ctx.fillStyle = secondaryColor;
                                        ctx.textAlign = 'left';
                                        if (type !== 3) {
                                            ctx.font = '64px SF Pro Rounded Black';
                                            ctx.fillText(word.substring(0, 1).toUpperCase() + word.substring(1), picCords.x, textY);
                                        }

                                        if (type === 1 || type === 3 || type === 5) {
                                            if (type === 3) textY -= 82;
                                            const avatar = await loadCrossOriginImage(author_photo);
                                            ctxDrawImageWithRound(ctx, avatar, 25, null, {
                                                x: picCords.x, y: textY + 21,
                                                width: 50,
                                                height: 50
                                            });
                                            ctx.font = '32px SF Pro Rounded Bold';
                                            ctx.fillText(author_name, picCords.x + 50 + 12, textY + 27 + 30);
                                        }
                                    }
                                }

                                if (type === 2) {
                                    ctx.font = '32px SF Pro Rounded Bold';
                                    ctx.textAlign = 'left';
                                    ctx.fillStyle = secondaryColor;
                                    const text_params = ctx.measureText(author_name);
                                    let avatar_size = 50;
                                    const all_width = text_params.width + 12 + avatar_size;
                                    const first_x = Math.floor((background.width - all_width) / 2);

                                    const avatar = await loadCrossOriginImage(author_photo);
                                    ctxDrawImageWithRound(ctx, avatar, avatar_size / 2, null, {
                                        x: first_x,
                                        y: 1436,
                                        width: avatar_size,
                                        height: avatar_size
                                    });
                                    ctx.fillText(author_name, first_x + avatar_size + 12, 1442 + 30);
                                }
                            }*/
                        }}
                    />
                </Panel>
            </View>
        );
    }
}

export class BridgeText extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            json_keys_: [],
            json_keys: {},
            json_data: {},
            json_counter: 0
        };

        initializeNavigation.bind(this)();

        this.onChange = this.onChange.bind(this);
        this.execute = this.execute.bind(this);
    }

    componentDidMount() {
        window.addEventListener('popstate', e => {
            e.preventDefault();
            this.back(e);
        });
        bridge.subscribe(async ({detail: {type, data}}) => {
            if (type !== undefined) console.log(type, data);
            if (type === 'VKWebAppUpdateConfig') {
                const schemeAttribute = document.createAttribute('scheme');
                schemeAttribute.value = data.scheme ? data.scheme === 'client_light' ? 'bright_light' : data.scheme : 'bright_light';
                document.body.attributes.setNamedItem(schemeAttribute);
                const isDarkTheme = schemeAttribute.value !== 'bright_light';
                this.setState({isDarkTheme});
                if (bridge.supports('VKWebAppSetViewSettings')) {
                    bridge.send('VKWebAppSetViewSettings', {
                        status_bar_style: isDarkTheme ? 'light' : 'dark',
                        action_bar_color: isDarkTheme ? '#242424' : '#F9F9F9',
                        navigation_bar_color: isDarkTheme ? '#242424' : '#F9F9F9'
                    });
                }
            }
        });
        bridge.send('VKWebAppInit');
    }

    onChange(e) {
        const {name, value} = e.currentTarget;
        this.setState({[name]: value});
    }

    async execute() {
        let {method, json_keys, json_data} = this.state;
        this.setPopout(<ScreenSpinner/>);
        try {
            let json = {};
            for (const key_ of Object.keys(json_keys)) {
                const key = json_keys[key_];
                const value = json_data[key_];
                const value_int = parseInt(value);
                const value_json = value.startsWith('{') ? JSON.parse(value) : value;
                json[key] = value_json ? value_json : (isNaN(value_int) ? value : value_int);
            }
            const result = await bridge.send(method, json);
            this.setAlert('Результат', JSON.stringify(result));
        } catch (e) {
            console.error(e);
            this.setAlert('Ошибка', e.error_data.error_reason);
        }
    }

    render() {
        let {method, json_keys_, json_keys, json_data, json_counter} = this.state;

        return (
            <View
                {...defaultViewProps.bind(this)()}
            >
                <Panel id='main'>
                    <FormLayout style={{marginTop: 'var(--safe-area-inset-top)'}}>
                        <FormItem
                            top='method'
                        >
                            <Input name='method' value={method} onChange={this.onChange}/>
                        </FormItem>
                        <FormItem
                            top='json'
                        >
                            <List>
                                {json_keys_.map(
                                    (value, index) =>
                                        <div
                                            key={`element-${value}`}
                                            style={{
                                                display: 'flex',
                                                gap: 8,
                                                marginTop: 6
                                            }}
                                            className='stretched'
                                        >
                                            <Input
                                                getRef={ref => this[`inputJson${value}`] = ref}
                                                onChange={e => {
                                                    json_keys[value] = e.currentTarget.value;
                                                    this.setState({json_keys});
                                                }}
                                                value={json_keys[value]}
                                            />
                                            <Input
                                                onChange={e => {
                                                    json_data[value] = e.currentTarget.value;
                                                    this.setState({json_data});
                                                }}
                                                value={json_data[value]}
                                            />
                                            <IconButton
                                                onClick={() => {
                                                    json_keys_.splice(index, 1);
                                                    delete json_keys[value];
                                                    delete json_data[value];
                                                    this.setState({json_keys_, json_keys, json_data});
                                                }}
                                            >
                                                <Icon12CancelOutline/>
                                            </IconButton>
                                        </div>
                                )}
                                <Input
                                    style={{marginTop: 6}}
                                    placeholder='Add param'
                                    onClick={async () => {
                                        json_counter++;
                                        json_keys_.push(json_counter);
                                        json_keys[json_counter] = '';
                                        await this.setState({json_counter, json_keys_, json_keys});
                                        this[`inputJson${json_counter}`].focus();
                                    }}
                                />
                            </List>
                        </FormItem>
                        <FormItem>
                            <Button size="l" stretched onClick={this.execute}>
                                Execute
                            </Button>
                        </FormItem>
                    </FormLayout>
                </Panel>
            </View>
        )
    }

}

export class Converter extends React.Component {

    constructor(props) {
        super(props);

        this.state = {};

        initializeNavigation.bind(this)();

        this.uploadMediacontent = this.uploadMediacontent.bind(this);
    }

    componentDidMount() {
        window.addEventListener('popstate', e => {
            e.preventDefault();
            this.back(e);
        });

        bridge.send('VKWebAppInit');
    }

    async uploadMediacontent(evt) {
        let
            tgt = evt.target || window.event.srcElement,
            files = tgt.files
        ;

        if (FileReader && files && files.length) {
            for (let file of files) {
                let fr = new FileReader();
                fr.onload = async () => {
                    this.setPopout(<ScreenSpinner/>);
                    const data = fr.result;
                    console.log(data);
                    const image = await loadImage(data);
                    const canvas = createCanvas(image.width, image.height);
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(image, 0, 0, image.width, image.height);
                    await new Promise(res =>
                        canvas.toBlob(blob => {
                            const f = new Blob([blob], {type: file.type});
                            const
                                a = document.createElement('a'),
                                url = URL.createObjectURL(f)
                            ;
                            a.href = url;
                            a.download = file.name.split('.')[0] + '.webp';
                            document.body.appendChild(a);
                            a.click();
                            setTimeout(() => {
                                document.body.removeChild(a);
                                window.URL.revokeObjectURL(url);
                            }, 0);
                            res(true);
                        }, 'image/webp', 100)
                    )
                    this.setPopout(null);
                };
                await fr.readAsDataURL(file);
            }
        }
        // Not supported
        else {
            // fallback -- perhaps submit the input to an iframe and temporarily store
            // them on the server until the user's session ends.
        }
    }

    render() {
        return (<View
                {...defaultViewProps.bind(this)()}
            >
                <Panel id='main'>
                    <PanelHeader>
                        Img to Webp
                    </PanelHeader>
                    <FormLayout>
                        <FormItem top='File'>
                            <File
                                align='center'
                                before={<Icon28AddSquareOutline/>}
                                onChange={this.uploadMediacontent}
                                multiple
                                size='m'
                                stretched
                            >
                                Upload
                            </File>
                        </FormItem>
                    </FormLayout>
                </Panel>
            </View>
        );
    }

}

export class GraphAuto extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            colorPrimary: 'black'
        }
    }

    componentDidMount() {
        this.initializeGraph();
    }

    initializeGraph() {
        const data = [500, 1000, 5000, 10000, 50000, 200000, 150000, 200000, 250000];
        const pointsSettings = {
            minWidth: 40, maxWidth: 370,
            minHeight: 145, maxHeight: 30
        };
        const zone = pointsSettings.minHeight - pointsSettings.maxHeight;
        const step = pointsSettings.maxWidth / data.length;
        const maxValue = Math.max(...data, 1);
        const points = new Array(data.length).fill(0).map((value, index) => ([
            pointsSettings.minHeight - zone * (data[index] / maxValue),
            Math.min((pointsSettings.minWidth + step * index), pointsSettings.maxWidth)
        ]))

        const getPath = points => `M2 ${points.map(value => `${value[0]} L${value[1]}`).join(' ')} 25 V190 H2 V95 Z`;
        this.setState({path: roundPathCorners(getPath(points), 15)});
    }

    render() {
        const {path, colorPrimary} = this.state;
        return (
            <div style={{
                background: '#FFFFFF',
                borderRadius: 21,
                width: 339,
                height: 131,
                border: '3px solid #F5F5F5',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div style={{
                    position: 'absolute',
                    zIndex: 0,
                    bottom: -40,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'calc(100% + 32px)'
                }}>
                    <svg width="100%" height="192" viewBox="" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path style={{transition: '400ms'}} d={path}
                              fill="url(#paint0_linear)"
                              stroke={colorPrimary} stroke-width="3"/>
                        <defs>
                            <linearGradient id="paint0_linear" x1="192.042" y1="-12" x2="192.042" y2="147.422"
                                            gradientUnits="userSpaceOnUse">
                                <stop stop-color={colorPrimary} stop-opacity="0.15"/>
                                <stop offset="1" stop-color={colorPrimary} stop-opacity="0"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            </div>
        );
    }

}

export default Test