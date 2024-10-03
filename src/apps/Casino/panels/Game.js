import React from "react";
import Wheel from "../components/Wheel";
import {getRandomInt, isPlatformDesktop, shortIntegers} from "../../../js/utils";
import Header from "../components/Header";
import {Avatar} from "@vkontakte/vkui";
import Board, {colors, getRandomNumber} from "../components/Board";
import {ReactComponent as Icon28Chip} from "../icons/chip_28.svg";
import {
    Icon28ArrowUpCircleOutline,
    Icon28ArrowUpOutline,
    Icon28ArticleOutline,
    Icon28ChevronRightCircleOutline
} from "@vkontakte/icons";

let intervalTick;
const maxTick = 30;
const isDesktop = isPlatformDesktop();
const c = colors();

export default class Game extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            tick: maxTick,
            allowTick: true,
            history: [],
            balance: 1000,
            currentBet: 0,
            allBet: 0,
            allWin: 0
        }

        this.componentDidMount = this.componentDidMount.bind(this);
    }

    componentDidMount() {
        let element, lastElement = 0;
        intervalTick = setInterval(async () => {
            if (this.state.allowTick) {
                let tick = this.state.tick - 1;
                if (element !== lastElement) {
                    element = getRandomNumber();
                    lastElement = element;
                    window.data = {element};
                }
                if (tick <= 0) {
                    lastElement = 0;
                    // Крутим колесо
                    let {history, allBet, currentBet, bets, balance, allWin} = this.state;
                    balance -= currentBet;
                    allBet += currentBet;
                    this.setState({allowTick: false, element, balance, allBet});
                    setTimeout(() => {
                        // Выпало число
                        this.board.setState({chips: []});
                        history.push(element);
                        if (history.length > 8) history.splice(0, 1);
                        tick = maxTick;
                        let plus = 0;
                        for (const bet of bets) {
                            const elements = bet.key.split(' ');
                            if (elements.indexOf(element) > -1) {
                                const multiplier = 36 / elements.length;
                                plus += bet.bet * multiplier;
                            }
                        }
                        balance += plus;
                        allWin += plus;
                        this.setState({
                            balance,
                            allowTick: true,
                            tick, history,
                            allBet,
                            currentBet: 0,
                            allWin
                        });
                    }, 7000);
                }
                this.setState({tick})
            }
        }, 1000);
    }

    componentWillUnmount() {
        clearInterval(intervalTick);
    }

    render() {
        const {
            element, history, tick, allowTick,
            balance, currentBet, allBet, allWin
        } = this.state;

        return (
            <React.Fragment>
                <div className='Game'>
                    <Wheel
                        t={this.props.t}
                        element={element}
                        tick={tick}
                    />
                    <div className='Game-Right'>
                        <div className={`WheelHistory WheelHistory-${isDesktop ? 'desktop' : 'mobile'}`}>
                            {
                                history.map((value, index) =>
                                    <div key={`number_${index}`} className={c[value]}>
                                        {value}
                                    </div>
                                )
                            }
                        </div>
                        <Board
                            component={ref => {
                                this.board = ref;
                            }}
                            t={this.props.t}
                            block={!allowTick}
                            min={10}
                            max={Math.min(balance, 100000)}
                            onChange={arr => {
                                // {bet, id, key}
                                console.log(arr);
                                this.setState({
                                    bets: arr,
                                    currentBet: arr.length === 0 ? 0 : arr.map(value => value.bet).reduce((a, b) => a + b)
                                });
                            }}
                        />
                    </div>
                </div>
                <div className='Game-Stats'>
                    {
                        [
                            [
                                <Icon28Chip/>,
                                'Баланс',
                                shortIntegers(balance)
                            ],
                            [
                                <Icon28ChevronRightCircleOutline/>,
                                'Текущая ставка',
                                shortIntegers(currentBet)
                            ],
                            [
                                <Icon28ArticleOutline/>,
                                'Все ставки',
                                shortIntegers(allBet)
                            ],
                            [
                                <Icon28ArrowUpCircleOutline/>,
                                'Общий выигрыш',
                                shortIntegers(allWin)
                            ],
                        ].map((value, index) =>
                            <div key={`stats-${index}`}>
                                {value[0]}
                                <div>
                                    <span>{value[1]}</span>
                                    <br/>
                                    <span>{value[2]}</span>
                                </div>
                            </div>
                        )
                    }
                </div>
            </React.Fragment>
        );
    }

}