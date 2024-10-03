import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    IconButton, Input,
    PanelHeader,
    PanelHeaderBack,
    PromoBanner,
    ScreenSpinner,
    Slider,
    Spinner
} from "@vkontakte/vkui";
import {
    ctxDrawImageWithRound,
    getBase64Image,
    getSrcUrl,
    getUrlParams,
    isPlatformDesktop,
    loadCrossOriginImage, sleep, sortUniqueObject,
    vkApiRequest
} from "../../js/utils";

const isDesktop = isPlatformDesktop();

export class GameHistoryWatch extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            draw_speed: 1
        };

        this.canvasSize = (!this.state.isDrawer && !isDesktop && props.t.clientHeight <= 700) ? (319 / 1.5) : 319;
        this.canvasMultiplier = 2;
        if (!isDesktop && props.t.clientWidth >= 600) {
            this.canvasMultiplier /= 1.41065831;
            this.canvasSize = 450;
        }

        this.componentDidMount = this.componentDidMount.bind(this);
    }

    componentDidMount() {
        this.canvasContext = this.canvas.getContext('2d');
        const {t} = this.props;
        const {game_history} = t.state;

        const actionsDraw = [];
        let currentActionDraw = 0;
        game_history.forEach(lines => {
            lines.forEach(({x0, y0, x1, y1, color, isEraser, lineWidth, multiplier}) => {
                actionsDraw.push(async () => {
                    if (!lineWidth) lineWidth = 2;
                    if (!multiplier) multiplier = 2;

                    this.canvasContext.beginPath();
                    if (isEraser) {
                        this.canvasContext.globalCompositeOperation = 'destination-out';
                        this.canvasContext.arc(x0 * multiplier, y0 * multiplier, lineWidth * 1.2, 0, Math.PI * 2, false);
                        this.canvasContext.fill();
                    } else {
                        this.canvasContext.globalCompositeOperation = 'source-over';
                        this.canvasContext.moveTo(x0 * multiplier, y0 * multiplier);
                        this.canvasContext.lineTo(x1 * multiplier, y1 * multiplier);
                        this.canvasContext.strokeStyle = color;
                        this.canvasContext.fill();
                        this.canvasContext.lineWidth = lineWidth;
                        this.canvasContext.lineCap = this.canvasContext.lineJoin = 'round';
                        this.canvasContext.stroke();
                    }

                    currentActionDraw++;
                    if (currentActionDraw < actionsDraw.length) {
                        await sleep(1000 / 60 / this.state.draw_speed);
                        window.requestAnimationFrame(actionsDraw[currentActionDraw]);
                    } else {
                        // end
                    }
                });
            })
        });

        window.requestAnimationFrame(actionsDraw[currentActionDraw]);
    }

    render() {
        const {t} = this.props;
        const {draw_speed} = this.state;
        return <div className='Game'>
            <PanelHeader
                left={<PanelHeaderBack onClick={async () => {
                    t.back();
                }}/>}
                separator={false}
            />
            <div style={{display: isDesktop && 'flex'}}>
                <div className='Canvas__'>
                    <div
                        className='Canvas_Container_Clear'
                        style={{width: this.canvasSize, height: this.canvasSize}}
                    >
                        <canvas
                            style={{width: this.canvasSize, height: this.canvasSize}}
                            width={319 * 2} height={319 * 2}
                            ref={ref => this.canvas = ref} id='canvas'
                        />
                    </div>
                    <div className='Canvas_Items_Container'>
                        <Slider
                            step={0.1}
                            min={0.1}
                            max={5}
                            value={Number(draw_speed)}
                            onChange={(draw_speed) => this.setState({draw_speed})}
                        />
                    </div>
                </div>
            </div>
        </div>
    }

}

GameHistoryWatch.defaultProps = {};

GameHistoryWatch.propTypes = {
    t: PropTypes.object
};

export default GameHistoryWatch;