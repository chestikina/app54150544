import React from 'react';
import PropTypes from 'prop-types';
import {PopoutWrapper} from "@vkontakte/vkui";
import item_clicks from "../../assets/clickerbattle/case_items/ic_click.png";
import item_xp from "../../assets/clickerbattle/case_items/ic_xp.png";
import item_caseLeg from "../../assets/clickerbattle/case_items/ic_case_leg.png";
import item_banner from "../../assets/clickerbattle/case_items/ic_banner.png";
import item_banner_stat from "../../assets/clickerbattle/case_items/ic_banner_stat.png";
import item_cursor from "../../assets/clickerbattle/case_items/ic_cursor.png";

import '../../css/ClickerBattle/Case.css';
import {getRandomInt, shortIntegers, decOfNum} from "../../js/utils";
import Person from "../../assets/clickerbattle/persons/Person";

const cases = {
    caseStandart:
        <svg viewBox="0 0 1060 1086" fill="none"
             xmlns="http://www.w3.org/2000/svg">
            <rect y="23.9338" width="1060" height="1062.07" rx="201" fill="#505050"/>
            <rect width="1060" height="1059.82" rx="201" fill="#616161"/>
            <path d="M455.568 1086V370.975H604.432V1086H455.568Z" fill="#535353"/>
            <rect width="1060" height="430.062" rx="200" fill="#535353"/>
            <rect x="55.3564" width="949.287" height="370.975" rx="156" fill="#3E3E3E"/>
            <g className="open_case_per">
                <g id='open_case' className="open_case">
                    <rect width="1060" height="370.975" rx="185.488" fill="#8F8F8F"/>
                    <ellipse cx="530.748" cy="322.733" rx="34.0367" ry="34.031" fill="#3E3E3E"/>
                </g>
            </g>
            <g id='lock' className="lock">
                <path
                    d="M467.304 406.472C458.241 408.922 452.88 418.255 455.331 427.319L476.603 505.986C479.053 515.049 488.387 520.41 497.451 517.96L595.335 491.501C604.399 489.051 609.759 479.718 607.309 470.654L586.037 391.987C583.586 382.924 574.252 377.563 565.189 380.013L555.603 382.604L476.89 403.881L467.304 406.472Z"
                    fill="#323232"/>
                <path
                    d="M476.89 403.881C476.89 403.881 471.591 390.256 470.903 381.072C470.62 377.286 470.529 370.975 470.529 370.975M476.89 403.881L467.304 406.472C458.241 408.922 452.88 418.255 455.331 427.319L476.603 505.986C479.053 515.049 488.387 520.41 497.451 517.96L595.335 491.501C604.399 489.051 609.759 479.718 607.309 470.654L586.037 391.987C583.586 382.924 574.252 377.563 565.189 380.013L555.603 382.604L476.89 403.881Z"
                    stroke="#323232" strokeWidth="25"/>
                <g id='lock_break' className="lock_break">
                    <path d="M553.938 373.967L549.45 359.008C544.587 343.302 528.431 322.363 499.33 330.213"
                          stroke="#323232" strokeWidth="25"/>
                </g>
            </g>
        </svg>,

    caseEpic:
        <svg viewBox="0 0 1060 1086" fill="none"
             xmlns="http://www.w3.org/2000/svg">
            <rect y="23.9338" width="1060" height="1062.07" rx="201" fill="#643499"/>
            <rect width="1060" height="1059.82" rx="201" fill="#8C51CC"/>
            <path d="M455.568 1086V370.975H604.432V1086H455.568Z" fill="#611DAC"/>
            <rect width="1060" height="430.062" rx="200" fill="#611DAC"/>
            <rect x="55.3564" width="949.287" height="370.975" rx="156" fill="#412866"/>
            <g className="open_case_per">
                <g id='open_case' className="open_case">
                    <rect width="1060" height="370.975" rx="185.488" fill="#B991F2"/>
                    <ellipse cx="530.748" cy="322.733" rx="34.0367" ry="34.031" fill="#412866"/>
                </g>
            </g>
            <g id='lock' className="lock">
                <path
                    d="M467.305 406.472C458.241 408.922 452.88 418.255 455.331 427.319L476.603 505.986C479.053 515.049 488.388 520.41 497.451 517.96L595.335 491.501C604.399 489.051 609.759 479.718 607.309 470.654L586.037 391.987C583.586 382.924 574.252 377.563 565.189 380.013L555.603 382.604L476.89 403.881L467.305 406.472Z"
                    fill="#E8DAFF"/>
                <path
                    d="M476.89 403.881C476.89 403.881 471.591 390.256 470.903 381.072C470.62 377.286 470.529 370.975 470.529 370.975M476.89 403.881L467.305 406.472C458.241 408.922 452.88 418.255 455.331 427.319L476.603 505.986C479.053 515.049 488.388 520.41 497.451 517.96L595.335 491.501C604.399 489.051 609.759 479.718 607.309 470.654L586.037 391.987C583.586 382.924 574.252 377.563 565.189 380.013L555.603 382.604L476.89 403.881Z"
                    stroke="#E8DAFF" strokeWidth="25"/>
                <g id='lock_break' className="lock_break">
                    <path d="M553.938 373.967L549.45 359.008C544.587 343.302 528.431 322.363 499.33 330.213"
                          stroke="#E8DAFF" strokeWidth="25"/>
                </g>
            </g>
        </svg>,

    caseLeg:
        <svg viewBox="0 0 1060 1086" fill="none"
             xmlns="http://www.w3.org/2000/svg">
            <rect y="23.9338" width="1060" height="1062.07" rx="201" fill="#FFAA5E"/>
            <rect width="1060" height="1059.82" rx="201" fill="#FFD4A3"/>
            <path d="M455.568 1086V370.975H604.432V1086H455.568Z" fill="#D08159"/>
            <rect width="1060" height="430.062" rx="200" fill="#D08159"/>
            <rect x="55.3564" width="949.287" height="370.975" rx="156" fill="#7B3816"/>
            <g className="open_case_per">
                <g id='open_case' className="open_case">
                    <rect width="1060" height="370.975" rx="185.488" fill="#FFE2C1"/>
                    <ellipse cx="530.748" cy="322.733" rx="34.0367" ry="34.031" fill="#7B3816"/>
                </g>
            </g>
            <g id='lock' className="lock">
                <path
                    d="M467.304 406.472C458.241 408.922 452.88 418.255 455.331 427.319L476.603 505.986C479.053 515.049 488.387 520.41 497.451 517.96L595.335 491.501C604.399 489.051 609.759 479.718 607.309 470.654L586.037 391.987C583.586 382.924 574.252 377.563 565.189 380.013L555.603 382.604L476.89 403.881L467.304 406.472Z"
                    fill="#7A1A1A"/>
                <path
                    d="M476.89 403.881C476.89 403.881 471.591 390.256 470.903 381.072C470.62 377.286 470.529 370.975 470.529 370.975M476.89 403.881L467.304 406.472C458.241 408.922 452.88 418.255 455.331 427.319L476.603 505.986C479.053 515.049 488.387 520.41 497.451 517.96L595.335 491.501C604.399 489.051 609.759 479.718 607.309 470.654L586.037 391.987C583.586 382.924 574.252 377.563 565.189 380.013L555.603 382.604L476.89 403.881Z"
                    stroke="#7A1A1A" strokeWidth="25"/>
                <g id='lock_break' className="lock_break">
                    <path d="M553.938 373.967L549.45 359.008C544.587 343.302 528.431 322.363 499.33 330.213"
                          stroke="#7A1A1A" strokeWidth="25"/>
                </g>
            </g>
        </svg>,

    caseMystic:
        <svg viewBox="0 0 1060 1086" fill="none"
             xmlns="http://www.w3.org/2000/svg">
            <rect y="23.9338" width="1060" height="1062.07" rx="201" fill="#CC5250"/>
            <rect width="1060" height="1059.82" rx="201" fill="#FF6866"/>
            <path d="M455.568 1086V370.975H604.432V1086H455.568Z" fill="#D83843"/>
            <rect width="1060" height="430.062" rx="200" fill="#D83843"/>
            <rect x="55.3564" width="949.287" height="370.975" rx="156" fill="#872A38"/>
            <g className="open_case_per">
                <g id='open_case' className="open_case">
                    <rect width="1060" height="370.975" rx="185.488" fill="#FFA7A5"/>
                    <ellipse cx="530.748" cy="322.733" rx="34.0367" ry="34.031" fill="#872A38"/>
                </g>
            </g>
            <g id='lock' className="lock">
                <path
                    d="M467.304 406.472C458.241 408.922 452.88 418.255 455.331 427.319L476.602 505.986C479.053 515.049 488.387 520.41 497.451 517.96L595.335 491.501C604.399 489.051 609.759 479.718 607.309 470.654L586.037 391.987C583.586 382.924 574.252 377.563 565.188 380.013L555.603 382.604L476.89 403.881L467.304 406.472Z"
                    fill="#FFE7D6"/>
                <path
                    d="M476.89 403.881C476.89 403.881 471.59 390.256 470.903 381.072C470.62 377.286 470.529 370.975 470.529 370.975M476.89 403.881L467.304 406.472C458.241 408.922 452.88 418.255 455.331 427.319L476.602 505.986C479.053 515.049 488.387 520.41 497.451 517.96L595.335 491.501C604.399 489.051 609.759 479.718 607.309 470.654L586.037 391.987C583.586 382.924 574.252 377.563 565.188 380.013L555.603 382.604L476.89 403.881Z"
                    stroke="#FFE7D6" strokeWidth="25"/>
                <g id='lock_break' className="lock_break">
                    <path d="M553.938 373.967L549.45 359.008C544.587 343.302 528.431 322.363 499.33 330.213"
                          stroke="#FFE7D6" strokeWidth="25"/>
                </g>
            </g>
        </svg>
};

class Case extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            case_: {
                clicks: 0,
                animation_shape_started_end: false,
                animation_shape_started: false,
                animation_final_end: false
            }
        };

        this.clickCase = this.clickCase.bind(this);
    }

    clickCase() {
        let {clicks, animation_shape_started_end, animation_shape_started, pred_click, final_click, animation_final_end} = this.state.case_;

        this.props.onClick();
        if (clicks >= final_click && animation_final_end) {
            this.props.onOpened();
        }

        if (!animation_shape_started && !animation_shape_started_end) {
            clicks++;
            animation_shape_started = true;
            this.setState({
                case_: {
                    clicks,
                    animation_shape_started_end,
                    animation_shape_started,
                    pred_click,
                    final_click
                }
            });

            if (clicks !== final_click) {
                document.getElementById('chest_shape').className = 'chest_shape_animation';
                if (clicks % 2 === 0) {
                    document.getElementById('chest_shapes').className = 'chest_shapes2';
                } else {
                    document.getElementById('chest_shapes').className = 'chest_shapes';
                }
                //document.getElementById('chest_icon').className = 'chest_icon_animation';
                setTimeout(() => {
                    try {
                        document.getElementById('chest_shape').className = 'null';
                    } catch (e) {
                    }
                    //document.getElementById('chest_icon').className = 'chest_icon';
                }, 400);
                setTimeout(() => {
                    animation_shape_started = false;
                    this.setState({
                        case_: {
                            clicks,
                            animation_shape_started_end,
                            animation_shape_started,
                            pred_click,
                            final_click
                        }
                    });
                    try {
                        document.getElementById('chest_shapes').className = 'null';
                    } catch (e) {
                    }
                }, 500);
            }

            if (clicks === final_click) {
                animation_shape_started_end = true;
                this.setState({
                    case_: {
                        clicks,
                        animation_shape_started_end,
                        animation_shape_started,
                        pred_click,
                        final_click
                    }
                });

                let animated = document.getElementById('animated_case');
                animated.getElementsByClassName('lock_break')[0].className.baseVal += ' lock_break_invisible';
                setTimeout(() => {
                    animated.getElementsByClassName('lock')[0].className.baseVal += ' lock_down';
                    setTimeout(() => {
                        animated.getElementsByClassName('open_case')[0].className.baseVal += ' open_case_up';

                        setTimeout(() => {
                            document.getElementById('flash').className = 'flash2';
                            setTimeout(() => {
                                try {
                                    document.getElementById('flash').className = 'null';
                                } catch (e) {
                                }
                                try {
                                    document.getElementById('drop_text').className = 'drop_text';
                                } catch (e) {
                                }
                                animation_shape_started_end = false;
                                animation_final_end = true;
                                this.setState({
                                    case_: {
                                        clicks,
                                        animation_shape_started_end,
                                        animation_shape_started,
                                        pred_click,
                                        final_click,
                                        animation_final_end
                                    }
                                });
                            }, 1000);
                            setTimeout(() => {
                                document.getElementById('chest_icon').className = 'invisible';
                                document.getElementById('chest_icon_drop').className = 'chest_drop';
                            }, 750);
                        }, 800);
                    }, 100);
                }, 100);
            } else if (clicks === pred_click) {
                document.getElementById('flash').className = 'flash';
                setTimeout(() => {
                    try {
                        document.getElementById('flash').className = 'null';
                    } catch (e) {
                    }
                }, 250);
            }
        }
    }

    componentDidMount() {
        let {animation} = this.props;

        if (animation) {
            let clicks = 0;
            let animation_shape_started_end = false;
            let animation_shape_started = false;
            let final_click = getRandomInt(3, 6);
            let pred_click = getRandomInt(2, (final_click - 1));
            this.setState({
                case_: {clicks, animation_shape_started_end, animation_shape_started, pred_click, final_click}
            });
        }
    }

    render() {
        const
            {t, name, size, animation, item} = this.props
        ;

        if (animation) {
            const
                defaultItemProps = {
                    alt: 'image__',
                    width: '125',
                    id: 'chest_icon_drop',
                    className: 'invisible',
                },
                {place} = item,
                icon =
                    place === 'xp' ?
                        <img
                            {...defaultItemProps}
                            src={item_xp}
                        />
                        :
                        place === 'clicks' ?
                            <img
                                {...defaultItemProps}
                                src={item_clicks}
                            />
                            :
                            place === 'persons' ?
                                <div
                                    {...defaultItemProps}
                                >
                                    <Person
                                        width={125} height={146}
                                        name={t.state.persons.find(value => value.id === item[place]).file_name}
                                    />
                                </div>
                                :
                                place === 'skins' ?
                                    <div
                                        {...defaultItemProps}
                                    >
                                        <Person
                                            width={125} height={146}
                                            name={t.state.persons.find(value => value.id === parseInt(item[place].split('_')[0])).file_name}
                                            skin={t.state.persons.find(value => value.id === parseInt(item[place].split('_')[0])).skins[parseInt(item[place].split('_')[1])]}
                                        />
                                    </div>
                                    :
                                    place === 'banners' ?
                                        <img
                                            {...defaultItemProps}
                                            src={item_banner}
                                        />
                                        :
                                        place === 'bannersStat' ?
                                            <img
                                                {...defaultItemProps}
                                                src={item_banner_stat}
                                            />
                                            :
                                            place === 'cursors' ?
                                                <img
                                                    {...defaultItemProps}
                                                    src={item_cursor}
                                                />
                                                :
                                                place === 'caseLeg' &&
                                                <img
                                                    {...defaultItemProps}
                                                    src={item_caseLeg}
                                                />,
                case_icon =
                    <div style={{width: size + 48, height: size + 48}} id='animated_case'>
                        {React.cloneElement(cases[name], {width: size, height: size})}
                    </div>,
                description =
                    place === 'xp' ?
                        `Опыт: ${shortIntegers(item[place])} ед.`
                        :
                        place === 'clicks' ?
                            `${shortIntegers(item[place])} ${decOfNum(item[place], ['клик', 'клика', 'кликов'], false)}`
                            :
                            place === 'persons' ?
                                t.state.persons.find(value => value.id === item[place]).name
                                :
                                place === 'skins' ?
                                    `Скин на персонажа`
                                    :
                                    place === 'banners' ?
                                        `Баннер #${item[place]}`
                                        :
                                        place === 'bannersStat' ?
                                            `Элемент статистики: ${t.state.bannersStat.find(value => value.id === item[place]).text}`
                                            :
                                            place === 'cursors' ?
                                                `Курсор #${item[place]}`
                                                :
                                                place === 'caseLeg' &&
                                                `Легендарный кейс`
            ;

            return <div id='open_chest_container' onClick={this.clickCase}>
                <div id='chest_shapes'></div>
                <img alt='image__' width='200' id='chest_shape' src='https://i.ibb.co/x2hV82J/hex.png'/>
                <div id='chest_icon' className='chest_icon'>
                    {case_icon}
                </div>
                {React.cloneElement(icon, {
                    width: 125,
                    style: {width: 125},
                    className: 'invisible'
                })}
                <p
                    id='drop_text'
                    className='invisible'
                >
                    {description}
                </p>
                <div id='flash'></div>
            </div>;
        } else {
            return <div style={{width: size, height: size, ...this.props.style}}>{cases[name]}</div>;
        }
    }

}

Case.propTypes = {
    animation: PropTypes.bool,
    name: PropTypes.string.isRequired,
    size: PropTypes.number,
    item: PropTypes.object,
    t: PropTypes.object,
    onOpened: PropTypes.func,
    onClick: PropTypes.func
};

Case.defaultProps = {
    size: 720,
    onOpened: () => {
    },
    onClick: () => {
    }
};

export default Case;