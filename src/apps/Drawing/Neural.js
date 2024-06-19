import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    IconButton,
    Input,
    Slider,
    ScreenSpinner
} from "@vkontakte/vkui";
import {
    getFadeMiddleColor,
    isPlatformDesktop, isPlatformIOS
} from "../../js/utils";
import {ReactComponent as IconErase2} from "../../assets/drawing/icons/IconErase2.svg";
import {
    Icon28ArrowUturnLeftOutline, Icon28PaletteOutline
} from "@vkontakte/icons";
import bridge from "@vkontakte/vk-bridge";
import {MODAL_PAGE_PALETTE} from "./Drawing";

import * as tf from "@tensorflow/tfjs";
import * as knnClassifier from "@tensorflow-models/knn-classifier";
import * as mobilenet from "@tensorflow-models/mobilenet";

const current = {};
let lastColorIndex = 0, lastFadeColorIndex = 0, emitLines = [], historyLines = [];

let classifier, network;

export class Neural extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            drawing: false,
            isEraser: false,
            lineWidth: 6
        };

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.throttle = this.throttle.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.drawLine = this.drawLine.bind(this);
        this.undoDraw = this.undoDraw.bind(this);
        this.clear = this.clear.bind(this);
        this.train = this.train.bind(this);
        this.predict = this.predict.bind(this);

        this.canvasSize = 319;
    }

    componentWillUnmount() {
        bridge.send('VKWebAppEnableSwipeBack');
    }

    async componentDidMount() {
        historyLines = [];
        bridge.send('VKWebAppDisableSwipeBack');

        const
            {canvas, onMouseDown, onMouseUp, throttle, onMouseMove, props} = this,
            {t} = props
        ;
        this.canvasContext = canvas.getContext('2d');
        t.setState({
            pickedColor: '#000000', color_gradient: undefined, color_percent: 0
        });

        canvas.addEventListener('mousedown', onMouseDown, false);
        canvas.addEventListener('mouseup', onMouseUp, false);
        canvas.addEventListener('mouseout', onMouseUp, false);
        canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

        //Touch support for mobile devices
        canvas.addEventListener('touchstart', onMouseDown, false);
        canvas.addEventListener('touchend', onMouseUp, false);
        canvas.addEventListener('touchcancel', onMouseUp, false);
        canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);

        t.setPopout(<ScreenSpinner/>);
        classifier = knnClassifier.create();
        network = await mobilenet.load();
        t.setPopout(null);
    }

    onMouseDown(e) {
        this.setState({drawing: true});
        current.x = e.clientX || e.touches[0].clientX;
        current.y = e.clientY || e.touches[0].clientY;
        emitLines = [];
    }

    onMouseUp(e) {
        const {drawing, isEraser, lineWidth} = this.state;
        if (!drawing) {
            return;
        }
        this.setState({drawing: false});
        try {
            const
                {canvas} = this,
                canvasRect = canvas.getBoundingClientRect()
            ;
            try {
                this.drawLine(current.x - canvasRect.left, current.y - canvasRect.top, (e.clientX || e.touches[0].clientX) - canvasRect.left, (e.clientY || e.touches[0].clientY) - canvasRect.top, this.props.color, isEraser, lineWidth);
            } catch (e) {
            }

            console.log(`Lines: ${emitLines.length}`);
            if (emitLines.length > 0) {
                historyLines.push(emitLines);
                emitLines = [];
            }
        } catch (er) {
            console.log(er);
        }
    }

    onMouseMove(e) {
        const {drawing, isEraser, lineWidth} = this.state;
        if (!drawing) return;
        try {
            const
                {canvas} = this,
                canvasRect = canvas.getBoundingClientRect()
            ;
            this.drawLine(current.x - canvasRect.left, current.y - canvasRect.top, (e.clientX || e.touches[0].clientX) - canvasRect.left, (e.clientY || e.touches[0].clientY) - canvasRect.top, this.props.color, isEraser, lineWidth);
            current.x = e.clientX || e.touches[0].clientX;
            current.y = e.clientY || e.touches[0].clientY;
        } catch (er) {
            console.log(er);
        }
        return false;
    }

    drawLine(x0, y0, x1, y1, color, isEraser, lineWidth, addToHistory = true, canvas) {
        try {
            const
                {t} = this.props,
                canvasContext = canvas ? canvas.getContext('2d') : this.canvasContext
            ;

            if (typeof color === 'object') {
                let firstColor = color[lastColorIndex] || color[0];
                let nextColor = color[lastColorIndex + 1] || color[0];
                color = getFadeMiddleColor(firstColor, nextColor, lastFadeColorIndex, color.length);
                lastFadeColorIndex += (color.length) === lastFadeColorIndex ? -lastFadeColorIndex : 1;
                if (lastFadeColorIndex === 0) {
                    lastColorIndex += color.length === lastColorIndex ? -lastColorIndex : 1;
                }
            }

            canvasContext.beginPath();

            if (isEraser) {
                canvasContext.globalCompositeOperation = 'destination-out';
                canvasContext.arc(x0 * 2, y0 * 2, lineWidth * 1.2, 0, Math.PI * 2, false);
                canvasContext.fill();
            } else {
                canvasContext.globalCompositeOperation = 'source-over';
                canvasContext.moveTo(x0 * 2, y0 * 2);
                canvasContext.lineTo(x1 * 2, y1 * 2);
                canvasContext.strokeStyle = color;
                canvasContext.fill();
                canvasContext.lineWidth = lineWidth;
                canvasContext.lineCap = canvasContext.lineJoin = 'round';
                canvasContext.stroke();
            }

            canvasContext.closePath();
            if (addToHistory)
                emitLines.push({x0, y0, x1, y1, color, isEraser, lineWidth});
        } catch (e) {
        }
    }

    throttle(callback, delay) {
        var previousCall = new Date().getTime();
        return function () {
            const time = new Date().getTime();

            if ((time - previousCall) >= delay) {
                previousCall = time;
                callback.apply(null, arguments);
            }
        };
    }

    undoDraw() {
        const {canvasContext} = this;
        historyLines.splice(historyLines.length - 1, 1);
        canvasContext.clearRect(0, 0, 319 * 2, 319 * 2);
        if (historyLines.length > 0) {
            historyLines.forEach(history => {
                history.forEach(({x0, y0, x1, y1, color, isEraser, lineWidth}) => {
                    canvasContext.beginPath();
                    if (isEraser) {
                        canvasContext.globalCompositeOperation = 'destination-out';
                        canvasContext.arc(x0 * 2, y0 * 2, lineWidth * 1.2, 0, Math.PI * 2, false);
                        canvasContext.fill();
                    } else {
                        canvasContext.globalCompositeOperation = 'source-over';
                        canvasContext.moveTo(x0 * 2, y0 * 2);
                        canvasContext.lineTo(x1 * 2, y1 * 2);
                        canvasContext.strokeStyle = color;
                        canvasContext.fill();
                        canvasContext.lineWidth = lineWidth;
                        canvasContext.lineCap = canvasContext.lineJoin = 'round';
                        canvasContext.stroke();
                    }
                })
            })
            canvasContext.closePath();
        }

    }

    clear() {
        historyLines = [];
        this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    train() {
        const {t} = this.props;
        const {trainLabel} = this.state;

        t.setPopout(<ScreenSpinner/>);

        const image = tf.browser.fromPixels(this.canvas);
        const feature = network.infer(image, true);
        classifier.addExample(feature, trainLabel);

        this.clear();

        image.dispose();

        t.setPopout(null);
    }

    async predict() {
        const {t} = this.props;

        t.setPopout(<ScreenSpinner/>);

        const image = tf.browser.fromPixels(this.canvas);
        const feature = network.infer(image, true);
        const result = await classifier.predictClass(feature);
        console.log(result);

        t.setAlert('Predict',
            result.label,
            [
                {
                    title: 'True',
                    autoclose: true
                },
                {
                    title: 'False',
                    mode: 'cancel',
                    action: this.train,
                    autoclose: true
                },
            ],
            'horizontal'
        );
    }

    render() {
        let
            {t} = this.props,
            {isEraser, lineWidth, trainLabel} = this.state,
            isDesktop = isPlatformDesktop(),
            buttonExitGameOnClick = () => t.setActivePanel('main')
        ;

        return (
            <div className='Game'>
                {!isDesktop && <div
                    className='NativeButtonMiniAppTop'
                    onClick={buttonExitGameOnClick}
                    style={{height: !isPlatformIOS() && 37}}
                >
                    Выйти
                </div>}
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
                                step={1}
                                min={4}
                                max={30}
                                value={Number(lineWidth)}
                                onChange={(lineWidth) => this.setState({lineWidth})}
                            />
                            <div className='Canvas_SubItems_Container'>
                                <IconButton
                                    hasHover={false} onClick={() => {
                                    t.setActiveModal(MODAL_PAGE_PALETTE);
                                }}>
                                    <Icon28PaletteOutline width={21} height={21}/>
                                </IconButton>
                                <IconButton
                                    style={{
                                        border: isEraser && '2px solid var(--color_secondary)'
                                    }}
                                    hasHover={false} onClick={() => {
                                    this.setState({isEraser: !isEraser});
                                }}>
                                    <IconErase2/>
                                </IconButton>
                                <IconButton
                                    hasHover={false} onClick={() => {
                                    if (historyLines.length > 0) {
                                        this.undoDraw();
                                    }
                                }}>
                                    <Icon28ArrowUturnLeftOutline width={21} height={21}/>
                                </IconButton>
                            </div>
                        </div>
                        {isDesktop &&
                            <Button
                                style={{marginTop: 28}}
                                stretched size='l' mode='secondary'
                                onClick={buttonExitGameOnClick}
                            >
                                Выйти
                            </Button>
                        }
                    </div>
                    <div className='TrainActions'>
                        <Input
                            style={{marginTop: 24}}
                            value={trainLabel}
                            onChange={e => this.setState({trainLabel: e.currentTarget.value})}
                            placeholder='Что нарисовано?'
                        />
                        <Button
                            style={{marginTop: 12}}
                            stretched size='l' mode='secondary'
                            disabled={!trainLabel || trainLabel.length === 0}
                            onClick={this.train}
                        >
                            Научить
                        </Button>
                        <Button
                            style={{marginTop: 24}}
                            stretched size='l' mode='secondary'
                            onClick={this.predict}
                        >
                            Распознать
                        </Button>
                    </div>
                </div>
            </div>
        )
    }
}

Neural.defaultProps = {};

Neural.propTypes = {
    t: PropTypes.object
};

export default Neural;