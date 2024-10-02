import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    PanelHeader,
    PanelHeaderBack, PromoBanner, ScreenSpinner
} from "@vkontakte/vkui";
import {
    convertMsToNormalTime,
    decOfNum,
    isPlatformDesktop, shortIntegers
} from "../../js/utils";
import bridge from "@vkontakte/vk-bridge";
import {
    Icon28ClockOutline,
    Icon28FilmStripOutline, Icon28GestureOutline, Icon28GifOutline, Icon28HourglassOutline,
    Icon28StorefrontOutline, Icon28TextOutline
} from "@vkontakte/icons";

const isDesktop = isPlatformDesktop();
let ticker;

export const defaultShopItems = [
    {
        icon: <Icon28TextOutline width={36} height={36}/>,
        title: 'Выбор из 5 слов',
        price: 3000,
        userAttr: 'shop_choice_5words',
        onboard: 'choice_5words',
        id: 1
    },
    {
        icon: <Icon28GifOutline width={36} height={36}/>,
        title: 'Рисунок в Анимацию',
        price: 1000,
        userAttr: 'shop_pic_to_gif',
        onboard: 'picture_gif',
        id: 2
    },
    {
        icon: <Icon28GestureOutline width={36} height={36}/>,
        title: 'Рисунок в Клип',
        price: 10000,
        userAttr: 'shop_pic_to_clip',
        onboard: 'picture_actions',
        id: 3
    },
    {
        icon: <Icon28HourglassOutline width={36} height={36}/>,
        title: 'Продлить хранение рисунка',
        price: 1000,
        userAttr: 'shop_pic_extend_time',
        onboard: 'picture_actions',
        id: 4
    },
];

export class Shop extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            items: []
        }
    }

    async componentDidMount() {
        const {socket} = this.props.t;
        ticker = setInterval(() => {
            this.forceUpdate();
        }, 1000);

        socket.call('shop.getList', {}, async r => {
            this.setState({items: r.response});
        });

        /*if (this.props.t.state.vk_user.id === 245481845 || this.props.t.state.vk_user.id === 246549084) {
            bridge.send('VKWebAppShowOrderBox', {type: 'item',item: 'test'})
        }*/

        /*let start = Date.now();
        await getVKUsers(new Array(100).fill(0).map((value, index) => index));
        console.log(`getVKUsers, ${Date.now() - start}ms`);
        start = Date.now();
        await getVKUsersBridge(new Array(100).fill(0).map((value, index) => index));
        console.log(`getVKUsers2, ${Date.now() - start}ms`);*/
    }

    componentWillUnmount() {
        clearInterval(ticker);
    }

    render() {
        const
            {t, watchedShopItems, boughtShopItems} = this.props,
            {notifications_allowed, user} = t.state,
            {items} = this.state,
            {socket} = t
        ;

        return (
            <React.Fragment>
                <PanelHeader
                    left={<PanelHeaderBack onClick={t.back}/>}
                    separator={false}
                />
                <div
                    className={`Panel_Container_Card Panel_Container_Card-${(items.length + defaultShopItems.length) > 0 ? 'ManyCards' : 'TwoCards'}`}>
                    <div>
                        <Icon28StorefrontOutline width={36} height={36}/>
                        <div className='Panel_Container_Card-Text'>
                            <h2>Магазин</h2>
                            <p>Ваш баланс: <span style={{color: 'var(--color_blue)'}}>
                                {shortIntegers(user.coins)}
                            </span> {decOfNum(user.coins, ['монета', 'монеты', 'монет'], false)}
                            </p>
                        </div>
                        {
                            (items.length === 0 || notifications_allowed === false) &&
                            <div className='Panel_Container_Card-Buttons'>
                                <Button
                                    stretched
                                    size='m'
                                    mode='gradient_pink'
                                    onClick={async () => {
                                        try {
                                            await bridge.send('VKWebAppAllowNotifications');
                                            socket.call('users.enableNotifications');
                                        } catch (e) {
                                        }
                                    }}
                                >
                                    Включить уведомления
                                </Button>
                            </div>
                        }
                    </div>
                    {
                        (items.length + defaultShopItems.length) > 0 ?
                            <React.Fragment>
                                {
                                    items.map(({
                                                   id, startTime, count, title, price,
                                                   img, needAdvert, singleBuy
                                               }, index) => {
                                        const {
                                            hours,
                                            minutes,
                                            seconds
                                        } = convertMsToNormalTime(startTime - Date.now()).str;
                                        return <div key={`Card-${index}`} onClick={() => {
                                            if (Date.now() < startTime || (watchedShopItems.indexOf(id) === -1 && needAdvert))
                                                return;

                                            if (singleBuy && boughtShopItems.indexOf(id) > -1) {
                                                t.setSnackbar('Вы уже купили этот товар');
                                            } else {
                                                t.setPopout(<ScreenSpinner/>);

                                                socket.call('shop.buy', {product_id: id, product_type: 0}, async r => {
                                                    if (r.response) {
                                                        if (singleBuy)
                                                            t.setState({boughtShopItems: [...boughtShopItems, id]});

                                                        t.setSnackbar('Вы успешно купили товар');
                                                        await t.updateData();
                                                        t.forceUpdate();
                                                    } else {
                                                        t.setSnackbar(r.message);
                                                    }
                                                    t.setPopout(null);
                                                });
                                            }
                                        }}>
                                            {
                                                Date.now() < startTime ?
                                                    <div className='TimeCounter'>
                                                        <Icon28ClockOutline/>
                                                        <span>{hours}:{minutes}:{seconds}</span>
                                                    </div>
                                                    : (watchedShopItems.indexOf(id) === -1 && needAdvert) &&
                                                    <div className='WatchAdvert' onClick={async () => {
                                                        t.setPopout(<ScreenSpinner/>);
                                                        try {
                                                            if (bridge.supports('VKWebAppShowNativeAds'))
                                                                await bridge.send('VKWebAppShowNativeAds', {ad_format: 'reward'});
                                                        } catch (e) {
                                                        }
                                                        t.setPopout(null);
                                                        t.setState({watchedShopItems: [...watchedShopItems, id]});
                                                    }}>
                                                        <Icon28FilmStripOutline/>
                                                        <span>Разблокировать содержимое</span>
                                                    </div>

                                            }
                                            <img alt='icon' src={img} className='ShopItemIcon'/>
                                            <div className='ShopItemText'>
                                                <span>{title}</span>
                                                <span>{decOfNum(price, ['монета', 'монеты', 'монет'])}</span>
                                            </div>
                                        </div>
                                    })
                                }
                                {
                                    defaultShopItems.map(({id, icon, title, price, userAttr, onboard}, index) =>
                                        <div
                                            key={`Card-${index}`}
                                            onClick={() => {
                                                t.setPopout(<ScreenSpinner/>);

                                                socket.call('shop.buy', {product_id: id, product_type: 1}, async r => {
                                                    if (r.response) {
                                                        user.coins -= price;
                                                        user[userAttr] += 1;
                                                        await t.setState({user});
                                                        this.forceUpdate();
                                                        t.setSnackbar('Вы успешно купили товар');
                                                        t.forceUpdate();
                                                        if (!t.state[`_shop_onboard_${id}`] && onboard) {
                                                            t.setState({[`_shop_onboard_${id}`]: true});
                                                            t.showOnboard(onboard);
                                                        }
                                                    } else {
                                                        t.setSnackbar(r.message);
                                                    }
                                                    t.setPopout(null);
                                                });
                                            }}
                                        >
                                            <div className='ShopItemIcon'>
                                                {icon}
                                            </div>
                                            <div className='ShopItemText'>
                                                <span>{title}</span>
                                                <span>{decOfNum(price, ['монета', 'монеты', 'монет'])}</span>
                                            </div>
                                            <div className='ShopItemCount'>
                                                {shortIntegers(user[userAttr])} шт.
                                            </div>
                                        </div>
                                    )
                                }
                            </React.Fragment>
                            :
                            <p className='Panel_Container_Card-Header Panel_Container_Card-Header-Center'>
                                На данный момент тут пусто.<br/>
                                {notifications_allowed ? 'мы оповестим ВАС когда тут что-то будет.' : 'Включите уведомления, мы оповестим когда тут что-то будет.'}
                            </p>
                    }
                </div>
            </React.Fragment>
        )
    }

}

Shop.defaultProps = {};

Shop.propTypes = {
    t: PropTypes.object,
    watchedShopItems: PropTypes.any,
    boughtShopItems: PropTypes.any
};

export default Shop;