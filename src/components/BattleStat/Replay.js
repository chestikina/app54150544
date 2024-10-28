import React from 'react';
import PropTypes from 'prop-types';
import '../../css/BattleStat/Replay.css';
import {SliderSwitch} from "@vkontakte/vkui";
import {Icon24ChevronDown, Icon24Pause, Icon24Play} from "@vkontakte/icons";

let boxes = [];

class Replay extends React.Component {

    constructor(props) {
        super(props);

        const {game} = this.props,
            clicks = game.historyClicks1.map((v, i) => {
                return {
                    coords: game.coords1[i],
                    time: v - game.historyClicks1[0]
                }
            });

        this.state = {
            speed_values: [0.5, 1, 2],
            paused: true,
            speed: 1,
            show: true,
            selectedView: '1',

            out_time: 0,

            cps1: game.kps1, cps2: game.kps2,
            clicks,
            out_time1: clicks[clicks.length - 1].time
        }
    }

    componentDidMount() {
        const clicks = document.createElement('div');
        clicks.id = 'clicks_container';
        document.body.appendChild(clicks);
    }

    componentWillUnmount() {
        document.getElementById('clicks_container').remove();
    }

    hide() {
        let show = !this.state.show;
        this.setState({show});
        if (show) {
            document.getElementsByClassName('Replay_Hide')[0].classList.remove('Replay_Hide-exit');
            document.getElementsByClassName('Replay_Hide')[0].classList.add('Replay_Hide-enter');
            document.getElementsByClassName('Replay_Settings')[0].classList.remove('Replay_Settings-exit');
            document.getElementsByClassName('Replay_Settings')[0].classList.add('Replay_Settings-enter');
        } else {
            document.getElementsByClassName('Replay_Hide')[0].classList.remove('Replay_Hide-enter');
            document.getElementsByClassName('Replay_Hide')[0].classList.add('Replay_Hide-exit');
            document.getElementsByClassName('Replay_Settings')[0].classList.remove('Replay_Settings-enter');
            document.getElementsByClassName('Replay_Settings')[0].classList.add('Replay_Settings-exit');
        }
    }

    async startWatch() {
        this.removeBoxes();
        const
            {clicks} = this.state,
            speed = this.state.speed_values[this.state.speed_values.length - this.state.speed - 1];

        boxes = [];

        for (const click of clicks) {
            setTimeout(() => {
                let box = document.createElement('div'),
                    style = {
                        top: 100 / 812 * (click.coords.y - 5) + 'vh',
                        left: 100 / 375 * (click.coords.x - 5) + 'vw',
                        backgroundColor: '#' + Math.floor(Math.random() * 16777215).toString(16)
                    };
                for (let param of Object.keys(style)) {
                    box.style[param] = style[param];
                }
                box.className = 'replay_click';

                if (boxes.length > 0)
                    boxes[boxes.length - 1].style.opacity = '0.2';

                boxes.push(box);
                document.getElementById('clicks_container').appendChild(box);
            }, click.time * speed);
        }

        let inTime = 0,
            interval = setInterval(async () => {
                await this.setState({['out_time' + this.state.selectedView]: clicks[clicks.length - 1].time - Math.min(inTime, clicks[clicks.length - 1].time)});
                inTime += 10;
                if (this.state['out_time' + this.state.selectedView] <= 0)
                    clearInterval(interval);

            }, 10 * speed);

        setTimeout(() => {
            this.removeBoxes();
            this.setState({
                paused: true,
                watch: false,
                ['out_time' + this.state.selectedView]: clicks[clicks.length - 1].time
            });
        }, clicks[clicks.length - 1].time * speed + 3000);
    }

    removeBoxes() {
        for (let box of boxes) {
            box.remove();
        }
    }

    switchPause() {
        if (!this.state.watch) {
            this.setState({paused: !this.state.paused, watch: !this.state.watch});
            this.startWatch();
        } else {
            const killId = setTimeout(() => {
                for (let i = killId + 200; i > 0; i--) clearInterval(i);
                this.setState({paused: !this.state.paused, watch: !this.state.watch});
            }, 100);
        }
    }

    async switchView(value) {
        if (this.state.paused) {
            const {game} = this.props;
            const clicks = game['historyClicks' + value].map((v, i) => {
                return {
                    coords: game['coords' + value][i],
                    time: v - game['historyClicks' + value][0]
                }
            });
            this.setState({
                selectedView: value,
                clicks,
                ['out_time' + value]: clicks[clicks.length - 1].time
            });
        }
    }

    render() {
        return (
            <div className='Replay'>
                <div className='Replay_Hide' onClick={() => this.hide()}>
                    <Icon24ChevronDown
                        style={{transform: !this.state.show && 'rotate(180deg)', transition: 'all 400ms'}}/>
                </div>
                <div className='Replay_Settings'>
                    <div className='Replay_Pause' onClick={() => this.switchPause()}>
                        {
                            this.state.paused ?
                                <Icon24Play/>
                                :
                                <Icon24Pause/>
                        }
                    </div>
                    <SliderSwitch
                        className='Replay_Slider'
                        activeValue={this.state.selectedView}
                        onSwitch={value => this.switchView(value)}
                        options={[
                            {
                                name: 'Вы',
                                value: '1',
                            },
                            {
                                name: 'Противник',
                                value: '2',
                            },
                        ]}
                    />
                    <div className='Replay_Speed' onClick={() => {
                        if (this.state.paused) {
                            this.setState({speed: this.state.speed === this.state.speed_values.length - 1 ? 0 : this.state.speed + 1});
                        }
                    }}>
                        <div>{this.state.speed_values[this.state.speed]}x</div>
                    </div>
                </div>
                <div className='Replay_Footer'>
                    <span>{(this.state['out_time' + this.state.selectedView] / 1000).toFixed(2).replace('.', ',')} сек</span>
                    <span>{this.state['cps' + this.state.selectedView]} кликов в секунду</span>
                </div>
            </div>
        )
    }

}

Replay.defaultProps = {
    game: {}
};

Replay.propTypes = {
    game: PropTypes.object
};

export default Replay;