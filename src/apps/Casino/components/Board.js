import React, {PureComponent} from 'react';
import PropTypes from "prop-types";
import {getRandomColor, getRandomInt, isPlatformDesktop} from "../../../js/utils";
import '../css/Board.css';

import {ReactComponent as SVG} from "./Board.svg";
import {ReactComponent as Chip} from "./Chip.svg";
import {Input, Tappable} from "@vkontakte/vkui";
import {Icon24ChevronLeft} from "@vkontakte/icons";
import ButtonBack from "./ButtonBack";

const horizontal = isPlatformDesktop();

export const numbers = '0 28 9 26 30 11 7 20 32 17 5 22 34 15 3 24 36 13 1 00 27 10 25 29 12 8 19 31 18 6 21 33 16 4 23 35 14 2'.split(' ');
export const getRandomNumber = () => {
    return numbers[getRandomInt(0, numbers.length - 1)];
}

export const colors = () => {
    const elements = numbers;
    let colors = [];
    let c = true;
    for (let i = 0; i < elements.length; i++) {
        colors[elements[i]] = (elements[i] === "0" || elements[i] === "00") ? "green" : (c ? "black" : "red");
        if (i !== 0 && colors[elements[i + 1]] !== "green") {
            c = !c;
        }
    }
    return colors;
}

class HorizontalBoard extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            chips: []
        }

        this.colors = colors();
        this.componentDidMount = this.componentDidMount.bind(this);
        this.onChange = this.onChange.bind(this);

        props.t.props.component(this);
    }

    get overlay() {
        const ints = new Array(36).fill(0).map((value, index) => index + 1);
        const sectors = [[], [], []];
        for (let i = 0; i < ints.length; i += 3) {
            for (let j = 0; j < 3; j++) {
                sectors[j].push(ints[i + j])
            }
        }
        sectors.reverse();
        return <div>
            <div className='TopBoard'>
                <div className='TopBoard-Zero'>
                    <div data-value='00'/>
                    <div data-value='spacing' data-payload='0 00'/>
                    <div data-value='0'/>
                </div>
                <div className='TopBoard-Int'>
                    <div>
                        <div data-value='3' data-heightlevel='1' data-widthlevel='1'/>
                        <div data-value='spacing-horizontal' data-payload='3 2' data-widthlevel='1'/>
                        <div data-value='2' data-heightlevel='2' data-widthlevel='1'/>
                        <div data-value='spacing-horizontal' data-payload='2 1' data-widthlevel='1'/>
                        <div data-value='1' data-heightlevel='3' data-widthlevel='1'/>
                        <div data-value='spacing-horizontal' data-payload='3 2 1' data-widthlevel='1'/>
                    </div>
                    <div>
                        <div data-value='spacing-vertical' data-payload='3 6' data-heightlevel='4'/>
                        <div data-value='spacing-vertical' data-payload='2 3 5 6' data-heightlevel='0'/>
                        <div data-value='spacing-vertical' data-payload='2 5' data-heightlevel='5'/>
                        <div data-value='spacing-vertical' data-payload='1 2 4 5' data-heightlevel='0'/>
                        <div data-value='spacing-vertical' data-payload='1 4' data-heightlevel='6'/>
                        <div data-value='spacing-vertical' data-payload='1 2 3 4 5 6' data-heightlevel='0'/>
                    </div>
                    {
                        new Array((ints.length - 3) / 3).fill(0)
                            .map((value, index) =>
                                ints.slice(3 * (index + 1), 3 * (index + 1) + 3).reverse()
                            )
                            .map((value, index, array) => {
                                const widthlevel = index === array.length - 1 ? 1 : 2;
                                return <React.Fragment key={`fragment-${index}`}>
                                    <div>
                                        <div data-value={value[0]} data-heightlevel='1' data-widthlevel={widthlevel}/>
                                        <div data-value='spacing-horizontal' data-payload={`${value[0]} ${value[1]}`}
                                             data-widthlevel={widthlevel}/>
                                        <div data-value={value[1]} data-heightlevel='2' data-widthlevel={widthlevel}/>
                                        <div data-value='spacing-horizontal' data-payload={`${value[1]} ${value[2]}`}
                                             data-widthlevel={widthlevel}/>
                                        <div data-value={value[2]} data-heightlevel='3' data-widthlevel={widthlevel}/>
                                        <div data-value='spacing-horizontal'
                                             data-payload={`${value[0]} ${value[1]} ${value[2]}`}
                                             data-widthlevel={widthlevel}/>
                                    </div>
                                    {
                                        index < array.length - 1 &&
                                        <div>
                                            <div data-value='spacing-vertical'
                                                 data-payload={`${value[0]} ${array[index + 1][0]}`}
                                                 data-heightlevel='4'/>
                                            <div data-value='spacing-vertical'
                                                 data-payload={`${value[1]} ${value[0]} ${array[index + 1][1]} ${array[index + 1][0]}`}
                                                 data-heightlevel='0'/>
                                            <div data-value='spacing-vertical'
                                                 data-payload={`${value[1]} ${array[index + 1][1]}`}
                                                 data-heightlevel='5'/>
                                            <div data-value='spacing-vertical'
                                                 data-payload={`${value[2]} ${value[1]} ${array[index + 1][2]} ${array[index + 1][1]}`}
                                                 data-heightlevel='0'/>
                                            <div data-value='spacing-vertical'
                                                 data-payload={`${value[2]} ${array[index + 1][2]}`}
                                                 data-heightlevel='6'/>
                                            <div data-value='spacing-vertical'
                                                 data-payload={`${value.join(' ')} ${array[index + 1].join(' ')}`}
                                                 data-heightlevel='0'/>
                                        </div>
                                    }
                                </React.Fragment>;
                            })
                    }
                </div>
                <div className='TopBoard-Row'>
                    {
                        new Array(3).fill(0).map((value, index) =>
                            <div key={`row-${index}`} data-value='multiple' data-payload={sectors[index].join(' ')}/>
                        )
                    }
                </div>
            </div>
            <div className='BottomBoard'>
                {
                    [
                        [
                            '1st 12',
                            '2nd 12',
                            '3rd 12'
                        ],
                        [
                            '1 to 18',
                            'even',
                            'red',
                            'black',
                            'odd',
                            '19 to 36'
                        ]
                    ].map((value, index) =>
                        <div key={`element1-${index}`}>
                            {
                                value.map((value2, index2) =>
                                    <div key={`element2-${index2}`} data-value='multiple' data-payload={
                                        value2.includes('12') ?
                                            ints.slice(12 * (parseInt(value2[0]) - 1), 12 * (parseInt(value2[0]) - 1) + 12).join(' ')
                                            :
                                            (
                                                value2.includes('to') ?
                                                    ints.slice(parseInt(value2.split(' ')[0]) - 1, value2.split(' ')[0] === '1' ? 18 : 36).join(' ')
                                                    :
                                                    (
                                                        value2 === 'even' ?
                                                            ints.filter(int => int % 2 === 0).join(' ')
                                                            :
                                                            (
                                                                value2 === 'odd' ?
                                                                    ints.filter(int => int % 2 !== 0).join(' ')
                                                                    :
                                                                    (
                                                                        (value2 === 'black' || value2 === 'red') &&
                                                                        ints.filter(int => this.colors[int] === value2).join(' ')
                                                                    )
                                                            )
                                                    )
                                            )

                                    }/>
                                )
                            }
                        </div>
                    )
                }
            </div>
        </div>
    }

    onChange(chips) {
        this.props.onChange(chips.map(({key, bet, id}) => ({
            key, bet, id
        })));
    }

    componentDidMount() {
        const targets = document.querySelectorAll('[data-value]');
        let id = 0;
        for (const target of targets) {
            let value = '' + target.dataset.value;
            if (value.includes('spacing') || value.includes('multiple')) value = target.dataset.payload;

            target.dataset.id = id;
            id++;

            const hoverElements = [...targets].filter(
                element => {
                    const data = element.dataset.value;
                    return !data.includes('spacing')
                        && !data.includes('multiple')
                        && !data.includes(' ')
                        && value.split(' ').indexOf(data) === -1;
                }
            ).map(value => document.getElementsByClassName(`board-${value.dataset.value}`));

            target.onmouseenter = () => {
                hoverElements.forEach(elements =>
                    [...elements].forEach(element => {
                        element.style.transition = 'all 100ms ease-in-out';
                        element.style.opacity = '.3';
                    })
                )
            }

            target.onmouseleave = () => {
                hoverElements.forEach(elements =>
                    [...elements].forEach(element => {
                        element.style.transition = 'all 100ms ease-in-out';
                        element.style.opacity = '1';
                    })
                )
            }

            target.onclick = (e) => {
                const {chips} = this.state;
                const {bet, min, max, maxBets} = this.props;
                const currentSum = chips.length > 0 ? chips.map(value => value.bet).reduce((a, b) => a + b) : 0;
                if (currentSum + bet >= min && currentSum + bet <= max && chips.length < maxBets) {
                    chips.push({
                        id: target.dataset.id,
                        key: value,
                        bet,
                        top: e.layerY,
                        left: e.layerX
                    });
                    this.setState({chips});
                    this.forceUpdate();
                    this.onChange(chips);
                }
            }

            target.oncontextmenu = (e) => {
                e.preventDefault();
                const {chips} = this.state;
                const chipIndex = chips.findIndex(val => val.key === value);
                if (chipIndex > -1) {
                    chips.splice(chipIndex, 1);
                    this.setState({chips});
                    this.forceUpdate();
                    this.onChange(chips);
                }
            }
        }
    }

    render() {
        const {chips} = this.state;
        return <div className='HorizontalBoard'>
            {this.overlay}
            {
                chips.map((value, index) =>
                    <Chip
                        key={`chip-${index}`}
                        style={{
                            left: value.left,
                            top: value.top
                        }}
                        className='BoardChip'
                    />
                )
            }
            <SVG/>
        </div>
    }

}

export class Board extends PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            bet: 10
        }
    }

    render() {
        const {bet} = this.state;
        const {t, block, onChange, min, max} = this.props;
        const maxBets = 4;
        return horizontal && <React.Fragment>
            <div className='BoardCenter' style={block ? {
                    pointerEvents: 'none',
                    opacity: .5
                }
                : {}}>
                <HorizontalBoard
                    min={min}
                    max={max}
                    maxBets={maxBets}
                    bet={bet}
                    onChange={onChange}
                    t={this}
                />
                <div className='BoardBetContainer'>
                    <div>
                        <div onClick={() => this.setState({bet: Math.max(min, bet - 100)})}>
                            -100
                        </div>
                        <div onClick={() => this.setState({bet: Math.max(min, bet - 10)})}>
                            -10
                        </div>
                        <Input
                            type='number'
                            onChange={e => {
                                let bet = parseInt(e.currentTarget.value);
                                this.setState({bet: bet > max ? max : (bet < min ? min : bet)})
                            }}
                            value={bet}
                        />
                        <div onClick={() => this.setState({bet: Math.min(max, bet + 10)})}>
                            +10
                        </div>
                        <div onClick={() => this.setState({bet: Math.min(max, bet + 100)})}>
                            +100
                        </div>
                    </div>
                    <div style={{display: 'none'}}>
                        Подтвердить
                    </div>
                </div>
            </div>
        </React.Fragment>
            ;
    }

}

Board.defaultProps = {}

Board.propTypes = {}

export default Board;