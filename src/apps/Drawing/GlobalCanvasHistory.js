import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    PanelHeader, PanelHeaderBack
} from "@vkontakte/vkui";
import {
    isPlatformDesktop, sleep
} from "../../js/utils";
import {
    Icon24ChevronLeft
} from "@vkontakte/icons";

const
    isDesktop = isPlatformDesktop()
;
let intervalUpdateFullPicture;

export class GlobalCanvasHistory extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            isFullCanvasShowed: true,
            fullCanvasData: null
        };

        this.drawLine = this.drawLine.bind(this);
    }

    async componentDidMount() {
        this.lastScheme = document.body.attributes.getNamedItem('scheme').value;
        this.clientHeight = this.props.t.clientHeight;
        this.clientWidth = this.props.t.clientWidth;

        const
            {canvas, props} = this,
            {socket} = props.t
        ;
        this.canvasContext = canvas.getContext('2d');

        this.componentDidUpdate();

        intervalUpdateFullPicture = setInterval(() => {
            const canvasData = this.canvas.toDataURL('image/png');
            this.setState({fullCanvasData: canvasData});
        }, 200);

        let
            limit = 1, offset = 0, j = 0, stop = false, sleepTime = 300
        ;
        const allData = [];

        setTimeout(async () => {
            for (let i = 0; i < 1; i++) {
                const data = await new Promise(res => socket.call('canvas.getHistory', {limit, offset}, r => {
                    res(r);
                }));
                if (data.response.length > 0) {
                    allData.push(data.response);
                    console.log({allData: allData.length});

                    offset += limit;
                    i--;

                    if (allData.length - j > 2) {
                        sleepTime -= 10;
                    } else {
                        sleepTime += 10;
                    }
                } else {
                    stop = true;
                }
            }
        }, 100);

        for (let i = 0; i < 1; i++) {
            if (!stop) {
                const data = allData[j];
                i--;

                if (data) {
                    console.log({currentData: j});
                    j++;
                    const ctx = this.canvasContext;
                    for (const history of data) {
                        for (const line of history.lines) {
                            const
                                {
                                    x0, y0,
                                    x1, y1,
                                    color,
                                    isEraser,
                                    lineWidth
                                } = line || {}
                            ;
                            ctx.beginPath();
                            if (isEraser) {
                                ctx.globalCompositeOperation = 'destination-out';
                                ctx.arc(x0, y0, lineWidth, 0, Math.PI * 2, false);
                                ctx.fill();
                            } else {
                                ctx.globalCompositeOperation = 'source-over';
                                ctx.moveTo(x0, y0);
                                ctx.lineTo(x1, y1);
                                ctx.strokeStyle = color;
                                ctx.fill();
                                ctx.lineWidth = lineWidth;
                                ctx.lineCap = ctx.lineJoin = 'round';
                                ctx.stroke();
                            }
                            ctx.closePath();
                        }
                        await sleep(sleepTime);
                    }
                } else {
                    await sleep(100);
                }
            }
        }
    }

    async componentWillUnmount() {
        document.body.setAttribute('scheme', this.lastScheme);
        clearInterval(intervalUpdateFullPicture);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const curScheme = document.body.attributes.getNamedItem('scheme').value;
        if (curScheme !== 'bright_light') {
            setTimeout(() => document.body.setAttribute('scheme', 'bright_light'), 500);
        }
    }

    drawLine(x0, y0, x1, y1, color, isEraser, lineWidth) {
        try {
            try {
                const
                    {canvasContext} = this
                ;
                canvasContext.beginPath();

                if (isEraser) {
                    canvasContext.globalCompositeOperation = 'destination-out';
                    canvasContext.arc(x0, y0, lineWidth, 0, Math.PI * 2, false);
                    canvasContext.fill();
                } else {
                    canvasContext.globalCompositeOperation = 'source-over';
                    canvasContext.moveTo(x0, y0);
                    canvasContext.lineTo(x1, y1);
                    canvasContext.strokeStyle = color;
                    canvasContext.fill();
                    canvasContext.lineWidth = lineWidth;
                    canvasContext.lineCap = canvasContext.lineJoin = 'round';
                    canvasContext.stroke();
                }

                canvasContext.closePath();
            } catch (e) {
            }
        } catch (e) {
            console.log('Error drawLine');
            console.error(e);
        }
    }

    render() {
        const
            {state, props} = this,
            {t} = props,
            {
                isFullCanvasShowed,
                fullCanvasData
            } = state
        ;

        return (
            <div className='GlobalCanvas'>
                {
                    !isDesktop ?
                        <PanelHeader
                            left={<PanelHeaderBack onClick={() => {
                                this.componentWillUnmount();
                                t.back();
                            }}/>}
                            separator={false}
                        />
                        :
                        <div className='CircleButtonBack' onClick={() => {
                            this.componentWillUnmount();
                            t.back();
                        }}>
                            <Icon24ChevronLeft/>
                        </div>
                }
                {
                    isFullCanvasShowed &&
                    <img src={fullCanvasData} alt='canvas'/>
                }
                <div className='GlobalCanvas_canvas' ref={ref => this.canvas_container = ref}>
                    <canvas
                        style={{
                            display: isFullCanvasShowed && 'none'
                        }}
                        width={1595} height={1595} ref={ref => this.canvas = ref} id='canvas'
                    />
                </div>
            </div>
        )
    }
}

GlobalCanvasHistory.defaultProps = {};

GlobalCanvasHistory.propTypes = {
    t: PropTypes.object
};

export default GlobalCanvasHistory;