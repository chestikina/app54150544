import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/slides/Shop.css';
import {ReactComponent as Terra} from "../../../assets/clickerbattle/Terra.svg";
import Button from "../../../components/ClickerBattle/Button";
import Person from "../../../assets/clickerbattle/persons/Person";
import {Gallery, Snackbar} from "@vkontakte/vkui";
import {ReactComponent as IconInfo} from "../../../assets/clickerbattle/info_28.svg";
import {ReactComponent as IconBack} from "../../../assets/clickerbattle/back_28.svg";
import {decOfNum, isPlatformIOS, openUrl} from "../../../js/utils";
import {Icon16ErrorCircleFill} from "@vkontakte/icons";
import bridge from "@vkontakte/vk-bridge";
import Case from "../../../components/ClickerBattle/Case";
import RoundCheckApprove from "../../../components/ClickerBattle/RoundCheckApprove";

export class Shop extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            more: false,
            item: 0
        };

        this.componentDidMount = this.componentDidMount.bind(this);
    }

    async componentDidMount() {
        const
            {props, state} = this,
            {t} = props,
            {more, item} = state
        ;

        t.client.emit('stock.getItems', {}, async stocks => {
            t.client.emit('shop.getItems', {}, async products => {
                const
                    array1 = stocks.response.map((value, i) => {
                        return <div key={`shop_div_${i}`}>
                            <div className='ShopItemText'>
                                <div className='ShopMTextWithIcon'>
                                    <IconInfo
                                        className='ShopInfoIcon'
                                        onClick={async () => {
                                            await this.setState({more: true, value, item: i});
                                            this.componentDidMount();
                                        }}/>
                                    <div className='ShopItemTitle'>
                                        {value.title}
                                    </div>
                                    {value.limited && <div className='ShopItemCount'>
                                        осталось {value.count} шт.
                                    </div>}
                                </div>
                                {value.limited && <div className='ShopItemSubTitle'>
                                    Ограниченная коллекция
                                </div>}
                            </div>
                            <div className='ShopItemContainer'>
                                {
                                    value.persons.length > 0 ?
                                        <Person width={238} height={276}
                                                name={t.state.persons[t.state.persons.findIndex(val => val.id === value.persons[0])].file_name}/>
                                        :
                                        value.skins.length > 0 &&
                                        <Person width={238} height={276}
                                                name={t.state.persons[t.state.persons.findIndex(val => val.id === value.skins[0].split('_')[0])].file_name}
                                                skin={t.state.persons[t.state.persons.findIndex(val => val.id === value.skins[0].split('_')[0])].skins[value.skins[0].split('_')[1]]}/>

                                }
                                <Terra className='Terra'/>
                            </div>
                            {isPlatformIOS() ?
                                <Button
                                    onClick={async () => {
                                        t.setState({
                                            market_data: {act: 'stock', data: {stock_id: value.id}},
                                            activePanel: 'market_placeholder'
                                        });
                                    }}
                                    style={{width: '49vw'}} className='ButtonBuy'
                                >
                                    Подробнее
                                </Button>
                                :
                                <Button
                                    onClick={() => {
                                        t.client.emit('stock.buy', {stock_id: value.id}, data => {
                                            if (data.response.payUrl) {
                                                const {payUrl, comment} = data.response;
                                                t.setState({
                                                    activeModal: require('../ClickerBattle').MODAL_CARD_PAYMENT,
                                                    modalPaymentData: {payUrl, comment, price: value.price}
                                                });
                                            } else {
                                                if (this.state.snackbar) return;
                                                this.setState({
                                                    snackbar: <Snackbar
                                                        onClose={() => this.setState({snackbar: null})}
                                                        before={<Icon16ErrorCircleFill width={20} height={20}/>}
                                                    >
                                                        {data.response}
                                                    </Snackbar>
                                                });
                                            }
                                        });
                                    }}
                                    style={{width: '49vw'}} className='ButtonBuy' after={value.price}
                                >
                                    Купить
                                </Button>}
                        </div>
                    }).concat(
                        products.response.map((value, i) => {
                            return <div key={`shop1_div_${i}`}>
                                <div className='ShopItemText'>
                                    <div className='ShopMTextWithIcon'>
                                        <div className='ShopItemTitle'>
                                            {value.title}
                                        </div>
                                    </div>
                                </div>
                                <div className='ShopItemContainer'>
                                    {
                                        value.place.startsWith('case') &&
                                        <Case name={value.place} size={192}/>
                                    }
                                </div>
                                {value.isRub && isPlatformIOS() ?
                                    <Button
                                        onClick={async () => {
                                            t.setState({
                                                market_data: {act: 'product', data: {product_id: value.id}},
                                                activePanel: 'market_placeholder'
                                            });
                                        }}
                                        style={{width: '49vw'}} className='ButtonBuy'
                                    >
                                        Подробнее
                                    </Button>
                                    :
                                    <Button
                                        onClick={() => {
                                            if (this.state.popout !== undefined) return;

                                            t.client.emit('shop.buy', {product_id: value.id}, data => {
                                                if (value.isRub && data.response.payUrl) {
                                                    const {payUrl, comment} = data.response;
                                                    t.setState({
                                                        activeModal: require('../ClickerBattle').MODAL_CARD_PAYMENT,
                                                        modalPaymentData: {payUrl, comment, price: value.price}
                                                    });
                                                } else {
                                                    if (data.response === true) {
                                                        t.updateUserData();
                                                        this.setState({
                                                            popout: <RoundCheckApprove/>
                                                        });
                                                        setTimeout(() => {
                                                            this.setState({popout: undefined});
                                                        }, 2000);
                                                    } else {
                                                        if (this.state.snackbar) return;
                                                        this.setState({
                                                            snackbar: <Snackbar
                                                                onClose={() => this.setState({snackbar: null})}
                                                                before={<Icon16ErrorCircleFill width={20} height={20}/>}
                                                            >
                                                                {data.response}
                                                            </Snackbar>
                                                        });
                                                    }
                                                }
                                            });
                                        }}
                                        style={{width: '49vw', bottom: '24vh'}} className='ButtonBuy' after={value.price}
                                    >
                                        Купить
                                    </Button>}
                            </div>
                        })
                    ),
                    stockObject = <Gallery
                        slideWidth="90%"
                        align="center"
                    >
                        {array1}
                    </Gallery>,
                    array2 = more && await new Promise(resolve => {
                        const
                            ret = [],
                            stock = stocks.response[item],
                            show = ['persons', 'skins', 'shop', 'banners']
                        ;
                        let elementsCount = 0;
                        for (const key of show) {
                            elementsCount += stock[key].length;
                            if (stock[key].length > 0) {
                                for (const element of stock[key]) {
                                    if (key === 'persons') {
                                        ret.push(
                                            <Person width={238} height={276}
                                                    name={t.state.persons[t.state.persons.findIndex(val => val.id === element)].file_name}/>
                                        );
                                    } else if (key === 'skins') {
                                        const params = element.split('_');
                                        ret.push(
                                            <Person width={238} height={276}
                                                    name={t.state.persons[t.state.persons.findIndex(val => val.id == params[0])].file_name}
                                                    skin={t.state.persons[t.state.persons.findIndex(val => val.id == params[0])].skins[params[1]]}/>
                                        );
                                    } else {
                                        // Сделать для товаров из Shop и Banners
                                    }
                                }
                            }
                        }

                        this.setState({elementsCount});
                        resolve(ret);
                    }),
                    moreObject = more && <Gallery
                        slideWidth="30%"
                        align="center"
                    >
                        {array2.map((value, i) => <div key={`shop_2_div_${i}`} className='centered'>{value}</div>)}
                    </Gallery>
                ;

                this.setState({
                    array1, array2, stockObject, moreObject
                });
            });
        });
    }

    render() {
        const {more, value, elementsCount, moreObject, stockObject, snackbar, popout} = this.state;

        return (
            <React.Fragment>
                <div className='CustomPopoutContainer'>
                    {popout}
                </div>
                <div className='Shop'>
                    {
                        more ?
                            <div className='MoreContainer'>
                                <div className='ShopItemText'>
                                    <div className='ShopMTextWithIcon'>
                                        <IconBack className='ShopInfoIcon' onClick={async () => {
                                            this.setState({more: false});
                                            this.componentDidMount();
                                        }}/>
                                        <div className='ShopItemTitle'>
                                            {value.title}
                                        </div>
                                        <div className='ShopItemCount'>
                                            {decOfNum(elementsCount, ['предмет', 'предмета', 'предметов'])}
                                        </div>
                                    </div>
                                </div>
                                <div className='ShopItemContainer'>
                                    {moreObject}
                                    <Terra className='Terra'/>
                                </div>
                            </div>
                            :
                            stockObject && stockObject.props.children.length > 0 ?
                                stockObject
                                :
                                <Button className='ItemsNull' style={{
                                    background: 'none'
                                }}>Пусто</Button>
                    }
                    {snackbar}
                </div>
            </React.Fragment>
        )
    }
}

Shop.defaultProps = {};

Shop.propTypes = {
    t: PropTypes.object
};

export default Shop;