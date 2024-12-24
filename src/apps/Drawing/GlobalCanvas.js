import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    ActionSheet, ActionSheetItem,
    Alert,
    Avatar,
    Button, Div,PopoutWrapper,
    ScreenSpinner, Slider,
} from "@vkontakte/vkui";
import {
    convertMsToNormalTime,
    isPlatformDesktop,
    openUrl,
    shortIntegers,
    decOfNum,
    loadFonts,
    rgbToHex, uploadFile, sleep, isPlatformIOS, getFadeMiddleColor, getUrlParams
} from "../../js/utils";
import {getVKUsers, vk_local_users} from "../../js/drawerapp/utils";
import {
    Icon24ChevronLeft, Icon28ArrowUturnLeftOutline, Icon28BrushOutline,
    Icon28CompassOutline,
    Icon28Crop, Icon28DownloadCloudOutline, Icon28EraserOutline, Icon28HelpCircleOutline, Icon28ImageFilterOutline,
    Icon28MailOutline, Icon28MessageArrowRightOutline,
    Icon28PaletteOutline, Icon28PictureOutline, Icon28SlidersOutline,
    Icon28TargetOutline
} from "@vkontakte/icons";
import {ReactComponent as IconErase2} from "../../assets/drawing/icons/IconErase2.svg";
import {ReactComponent as IconStroke} from "../../assets/drawing/icons/IconStroke.svg";
import bridge from "@vkontakte/vk-bridge";
import {HexColorPicker} from "react-colorful";
import {MODAL_CARD_GLOBAL_CANVAS_ONBOARD, MODAL_PAGE_PALETTE} from "./Drawing";
import {createCanvas, loadImage} from "canvas";
import {shareAlbumPhoto} from "../../js/defaults/bridge_utils";

const
    current = {},
    currentTransform = {x: 0, y: 0},
    lastTransform = {x: 0, y: 0},
    isDesktop = isPlatformDesktop(),
    isIos = isPlatformIOS()
;

let
    area_intervals = [],
    emitLines = [],
    __emitLines = [],
    intervalUpdateFullPicture,

    lastColorIndex = 0, lastFadeColorIndex = 0,

    cropSettings = {}
;

export class GlobalCanvas extends PureComponent {

    constructor(props) {
        super(props);

        const {t} = props;
        this.state = {
            color: props.color,
            drawing: false,

            isCrop: false,
            isEraser: false,
            isStroke: false,
            isShowAreas: false,
            isCompassActive: true,
            isBrushActive: false,
            isFullCanvasShowed: false,

            canvasTransformX: 0,
            canvasTransformY: 0,
            canvasScale: 1,

            fullCanvasData: null,
            lineWidth: 2,

            areas: [],
            areas_time: {}
        };

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.throttle = this.throttle.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.drawLine = this.drawLine.bind(this);

        this.onStartCrop = this.onStartCrop.bind(this);
        this.onEndCrop = this.onEndCrop.bind(this);
        this.onCropMove = this.onCropMove.bind(this);

        t.socket.subscribe('draw', async r => {
            if (r.user_id != props.t.state.vk_user.id) {
                const lines = r.data;
                for (const line of lines) {
                    const {x0, y0, x1, y1, color, isEraser, lineWidth} = line;
                    this.drawLine(x0, y0, x1, y1, color, isEraser, lineWidth, false, false);
                }
            }
        });
        t.socket.subscribe('updateAreas', async r => {
            this.updateAreas(r.areas);
        });
    }

    async componentDidMount() {
        bridge.send('VKWebAppDisableSwipeBack');
        this.props.t.setPopout(<ScreenSpinner/>);
        loadFonts(['Manrope Semibold', 'Manrope Bold']);
        setTimeout(() => {
            if (this.props.t.state.isShowGlobalCanvasOnboard) {
                this.props.t.setActiveModal(MODAL_CARD_GLOBAL_CANVAS_ONBOARD);
            }
        }, 500);

        const
            {canvas, canvas_, onMouseDown, onMouseUp, throttle, onMouseMove, onStartCrop, onEndCrop, onCropMove} = this
        ;
        this.canvasContext = canvas.getContext('2d');

        const
            areas = await new Promise((resolve) =>
                this.props.t.socket.call('canvas.getAreas', {}, async r => {
                    resolve(r.response);
                })
            )
        ;
        await new Promise((resolve) =>
            this.props.t.socket.call('canvas.join', {}, async r => {
                try {
                    const image = new Image();
                    image.onload = () => {
                        this.props.t.setPopout(null);
                        this.canvasContext.drawImage(image, 0, 0);
                        for (const line of r.lines) {
                            const {x0, y0, x1, y1, color, isEraser, lineWidth} = line;
                            this.drawLine(x0, y0, x1, y1, color, isEraser, lineWidth, false, false);
                        }
                    }
                    image.src = r.canvasData;
                } catch (e) {
                    console.error(e);
                }
                resolve(true);
            })
        )
        await this.updateAreas(areas);

        this.lastScheme = document.body.attributes.getNamedItem('scheme').value;
        this.clientHeight = this.props.t.clientHeight;
        this.clientWidth = this.props.t.clientWidth;

        canvas.addEventListener('mousedown', onMouseDown, false);
        canvas.addEventListener('mouseup', onMouseUp, false);
        canvas.addEventListener('mouseout', onMouseUp, false);
        canvas.addEventListener('mousemove', e =>
                this.state.isCompassActive ? onMouseMove(e) : throttle(onMouseMove(e), 10)
            , false);

        //Touch support for mobile devices
        canvas.addEventListener('touchstart', onMouseDown, false);
        canvas.addEventListener('touchend', onMouseUp, false);
        canvas.addEventListener('touchcancel', onMouseUp, false);
        canvas.addEventListener('touchmove', e =>
                this.state.isCompassActive ? onMouseMove(e) : throttle(onMouseMove(e), 10)
            , false);

        canvas_.addEventListener('mousedown', onStartCrop, false);
        canvas_.addEventListener('mouseup', onEndCrop, false);
        canvas_.addEventListener('mouseout', onEndCrop, false);
        canvas_.addEventListener('mousemove', onCropMove, false);

        //Touch support for mobile devices
        canvas_.addEventListener('touchstart', onStartCrop, false);
        canvas_.addEventListener('touchend', onEndCrop, false);
        canvas_.addEventListener('touchcancel', onEndCrop, false);
        canvas_.addEventListener('touchmove', onCropMove, false);

        /*Draw area square*/
        /*const cords = this.areas_coords;
        const colors = new Array(25).fill(0).map(value => '#' + Math.floor(Math.random() * 16777215).toString(16));
        console.log(colors);
        let i = 0;
        for (const line of cords) {
            for (const area of line) {
                this.drawLine(area[0], area[1], area[2], area[3], colors[i], false, 2, false);
                i++;
            }
        }*/
    }

    async componentWillUnmount() {
        bridge.send('VKWebAppEnableSwipeBack');
        this.props.t.socket.call('canvas.leave', {});
        document.body.setAttribute('scheme', this.lastScheme);
        for (const interval of area_intervals) {
            clearInterval(interval);
        }
        area_intervals = [];
        clearInterval(intervalUpdateFullPicture);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const curScheme = document.body.attributes.getNamedItem('scheme').value;
        if (curScheme !== 'bright_light') {
            setTimeout(() => document.body.setAttribute('scheme', 'bright_light'), 500);
        }

        if (prevProps.color !== this.props.color) {
            if (this.props.color === 'pipette') {
                this.setState({isPipette: true});
            } else {
                this.setState({color: this.props.color});
            }
        }
    }

    async updateAreas(areas) {
        area_intervals = [];
        const areas_time = {}, owner_ids = [];
        for (const i in areas) {
            if (areas[i].owner_id > 0)
                owner_ids.push(areas[i].owner_id);

            area_intervals.push(
                setInterval(() => {
                    if (areas[i].owner_id > 0) {
                        const {hours, minutes, seconds} = convertMsToNormalTime(areas[i].time - Date.now()).str;
                        areas_time[i] = `${hours}:${minutes}:${seconds}`;
                        this.setState({areas_time});
                        if (!this.state.drawing) {
                            this.forceUpdate();
                        }

                        if (areas[i].time <= Date.now()) {
                            areas[i] = {owner_id: 0, time: 0};
                        }
                    }
                }, 1000)
            )
        }
        await getVKUsers(owner_ids);
        this.setState({areas: areas.sort((a, b) => a.id - b.id), areas_time});
    }

    onMouseDown(e) {
        console.log('onMouseDown');
        try {
            this.setState({drawing: true});
            current.x = e.clientX || e.touches[0].clientX;
            current.y = e.clientY || e.touches[0].clientY;
            emitLines = [];
        } catch (e) {
            console.log('Error onMouseDown');
            console.error(e);
        }
    }

    onMouseUp(e) {
        console.log('onMouseUp');
        try {
            const {drawing, color, isEraser, lineWidth, isPipette} = this.state;
            if (!drawing) {
                return;
            }
            this.setState({drawing: false});
            if (isPipette) {
                this.setState({isPipette: false});
                return;
            }
            try {
                const
                    {canvas} = this,
                    canvasRect = canvas.getBoundingClientRect()
                ;

                try {
                    this.drawLine(current.x - canvasRect.left, current.y - canvasRect.top, (e.clientX || e.touches[0].clientX) - canvasRect.left, (e.clientY || e.touches[0].clientY) - canvasRect.top, color, isEraser, lineWidth);
                } catch (e) {

                }

                console.log(`Lines to send: ${emitLines.length}`);
                if (emitLines.length > 0) {
                    this.props.t.socket.call('canvas.draw', {data: emitLines, user_id: this.props.t.state.vk_user.id});
                    emitLines = [];
                }
            } catch (er) {
                console.log('Error onMouseUp2');
                console.log(e);
                console.error(er);
            }

            const
                transform_ = this.canvas_container.style.transform,
                transform = transform_.substring(transform_.indexOf('(') + 1, transform_.indexOf(')')).split(',')
            ;
            lastTransform.x = parseInt(transform[0]);
            lastTransform.y = parseInt(transform[1]);
            if (isNaN(lastTransform.x) || isNaN(lastTransform.y)) {
                lastTransform.x = 0;
                lastTransform.y = 0;
            }
        } catch (e) {
            console.log('Error onMouseUp1');
            console.error(e);
        }
    }

    onMouseMove(e) {
        try {
            const {drawing, color, isEraser, lineWidth, canvasScale} = this.state;
            if (!drawing) {
                return;
            }

            const
                {canvas, canvasContext} = this,
                canvasRect = canvas.getBoundingClientRect()
            ;

            if (this.state.isPipette) {
                const
                    pxData = canvasContext.getImageData(
                        ((e.clientX || e.touches[0].clientX) - canvasRect.left) / canvasScale,
                        ((e.clientY || e.touches[0].clientY) - canvasRect.top) / canvasScale,
                        1, 1),
                    color = rgbToHex(pxData.data[0], pxData.data[1], pxData.data[2])
                ;
                this.setState({color});
                this.props.t.setState({pickedColor: color});
                return;
            }

            if (this.state.isCompassActive) {
                try {
                    const
                        curMousePosition = {
                            x: e.clientX || e.touches[0].clientX,
                            y: e.clientY || e.touches[0].clientY
                        },
                        move = {
                            x: (curMousePosition.x - current.x) / canvasScale,
                            y: (curMousePosition.y - current.y) / canvasScale
                        },
                        translateX = Math.max(Math.min(this.clientWidth - 200, lastTransform.x + currentTransform.x + move.x), -this.canvas.width + 200),
                        translateY = Math.max(Math.min(this.clientHeight - 200, lastTransform.y + currentTransform.y + move.y), -this.canvas.height + 200)
                    ;
                    //console.log(translateX, translateY, this.clientWidth, this.clientHeight);
                    //console.log(lastTransform, currentTransform, move);
                    this.setState({canvasTransformX: translateX, canvasTransformY: translateY});

                    //this.canvas_container.style.transform = `translate(${translateX}px, ${translateY}px)`;
                } catch (e) {
                    console.log(e);
                }
                return;
            }

            try {
                this.drawLine(
                    current.x - canvasRect.left,
                    current.y - canvasRect.top,
                    (e.clientX || e.touches[0].clientX) - canvasRect.left,
                    (e.clientY || e.touches[0].clientY) - canvasRect.top,
                    color, isEraser, lineWidth);
                current.x = e.clientX || e.touches[0].clientX;
                current.y = e.clientY || e.touches[0].clientY;
            } catch (e) {
                console.log('Error onMouseMove2');
                console.error(e);
            }
        } catch (e) {
            console.log('Error onMouseMove1');
            console.error(e);
        }
        return false;
    }

    drawLine(x0, y0, x1, y1, color, isEraser, lineWidth, checkisAllow = true, needEmit = true) {
        try {
            if (this.state.isCompassActive && checkisAllow) {
                return;
            }

            if (needEmit) {
                const {canvasScale} = this.state;
                x0 = x0 / canvasScale;
                x1 = x1 / canvasScale;
                y0 = y0 / canvasScale;
                y1 = y1 / canvasScale;
            }

            if (checkisAllow && !this.isAllowToDraw(x0, y0, x1, y1)) {
                return;
            }

            if (typeof color === 'object') {
                let firstColor = color[lastColorIndex] || color[0];
                let nextColor = color[lastColorIndex + 1] || color[0];
                color = getFadeMiddleColor(firstColor, nextColor, lastFadeColorIndex, color.length);
                lastFadeColorIndex += (color.length) === lastFadeColorIndex ? -lastFadeColorIndex : 1;
                if (lastFadeColorIndex === 0) {
                    lastColorIndex += color.length === lastColorIndex ? -lastColorIndex : 1;
                }
                /*color = color[lastColorIndex];
                lastColorIndex += (color.length -1) === lastColorIndex ? -lastColorIndex : 1;*/
            }

            try {
                const {canvasContext} = this;
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

                if (needEmit) {
                    emitLines.push({x0, y0, x1, y1, color, isEraser, lineWidth});
                    if (emitLines.length > 800) {
                        console.log(`Lines to send: ${emitLines.length}`);
                        this.props.t.socket.call('canvas.draw', {
                            data: emitLines,
                            user_id: this.props.t.state.vk_user.id
                        });
                        emitLines = [];
                    }
                }
            } catch (e) {
            }
        } catch (e) {
            console.log('Error drawLine');
            console.error(e);
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

    onStartCrop(e) {
        const {isCrop} = this.state;
        if (!isCrop) {
            return;
        }
        current.x = e.clientX || e.touches[0].clientX;
        current.y = e.clientY || e.touches[0].clientY;
        console.log('start crop', current);
        this.setState({crop_process: true});
    }

    onEndCrop(e) {
        const {crop_process, isCrop} = this.state;
        if (!crop_process || !isCrop) {
            return;
        }
        console.log('end crop');
        this.setState({crop_process: false});
    }

    onCropMove(e) {
        const {crop_process, isCrop} = this.state;
        if (!crop_process || !isCrop) {
            return;
        }

        const {canvas_, canvasContext_} = this;
        const {canvasScale} = this.state;
        const canvasRect = canvas_.getBoundingClientRect()

        canvasContext_.clearRect(0, 0, canvas_.width, canvas_.height);
        canvasContext_.drawImage(this.canvas, 0, 0);

        const newMouseX = (e.clientX || e.touches[0].clientX) - canvasRect.left;
        const newMouseY = (e.clientY || e.touches[0].clientY) - canvasRect.top;
        const rectWidht = newMouseX - (current.x - canvasRect.left);
        const rectHeight = newMouseY - (current.y - canvasRect.top);

        cropSettings = {
            x: (current.x - canvasRect.left) / canvasScale,
            y: (current.y - canvasRect.top) / canvasScale,
            width: rectWidht / canvasScale,
            height: rectHeight / canvasScale
        }

        canvasContext_.strokeRect(cropSettings.x, cropSettings.y, cropSettings.width, cropSettings.height);
    }

    get navbar_items() {
        const
            {state, props} = this,
            {t} = props,
            {isCompassActive, isEraser, isFullCanvasShowed, isStroke} = state
        ;
        return [
            ...(t.state.user.admin ? [{
                icon: <Icon28PictureOutline width={21} height={21}/>,
                onClick: () => {
                    t.setPopout(this.alert_load_picture);
                }
            }] : []),
            {
                icon: <Icon28CompassOutline width={21} height={21}/>,
                onClick: () => {
                    this.setState({
                        isCompassActive: !isCompassActive,
                        isEraser: false,
                        isFullCanvasShowed: false,
                        isStroke: false
                    });
                },
                selected: isCompassActive
            },
            {
                icon: <Icon28PaletteOutline width={21} height={21}/>,
                onClick: () => {
                    t.setPopout(this.alert_color);
                }
            },
            {
                icon: <IconErase2/>,
                onClick: () => {
                    this.setState({isEraser: !isEraser, isCompassActive: false, isFullCanvasShowed: false});
                },
                selected: isEraser
            },
            {
                icon: <IconStroke/>,
                onClick: () => {
                    this.setState({isStroke: !isStroke, isCompassActive: false, isFullCanvasShowed: false});
                },
                selected: isStroke
            },
            {
                icon: <Icon28Crop width={21} height={21}/>,
                onClick: async () => {
                    if (!isFullCanvasShowed) {
                        const canvasData = this.canvas.toDataURL('image/png');
                        this.setState({fullCanvasData: canvasData});
                        clearInterval(intervalUpdateFullPicture);
                        intervalUpdateFullPicture = setInterval(() => {
                            const canvasData = this.canvas.toDataURL('image/png');
                            this.setState({fullCanvasData: canvasData});
                        }, 500);
                    } else {
                        this.setState({fullCanvasData: null});
                    }
                    this.setState({
                        isFullCanvasShowed: !isFullCanvasShowed,
                        isEraser: false,
                        isCompassActive: false,
                        isStroke: false
                    });
                },
                selected: isFullCanvasShowed
            },
            {
                icon: <Icon28MailOutline width={21} height={21}/>,
                onClick: () => {
                    openUrl('https://vk.me/join/DFIbwK_w537NhbqDIWPd8JjoW/qfkWn5tzk=');
                }
            },
            {
                icon: <Icon28HelpCircleOutline width={21} height={21}/>,
                onClick: () => {
                    this.componentWillUnmount();
                    t.go('global_canvas_info');
                }
            },
        ];
    }

    get canvas_actions() {
        const {isCompassActive, isBrushActive, isEraser, isShowAreas} = this.state;
        const {t} = this.props;
        return [
            [
                <Icon28PaletteOutline/>,
                () => {
                    t.setActiveModal(MODAL_PAGE_PALETTE);
                }
            ],
            0,
            [
                <Icon28CompassOutline/>,
                () => {
                    this.setState({
                        isCompassActive: true,
                        isShowAreas: isCompassActive ? !isShowAreas : false,
                        isBrushActive: false,
                        isEraser: false
                    });
                },
                isCompassActive
            ],
            [
                <Icon28BrushOutline/>,
                () => {
                    this.setState({isCompassActive: false, isShowAreas: false, isBrushActive: true, isEraser: false});
                },
                isBrushActive
            ],
            [
                <Icon28EraserOutline/>,
                () => {
                    this.setState({isCompassActive: false, isShowAreas: false, isBrushActive: false, isEraser: true});
                },
                isEraser
            ],
            0,
            [
                <Icon28SlidersOutline/>,
                () => {
                    t.setPopout(<ActionSheet
                        onClose={() => t.setPopout(null)}
                        iosCloseItem={<ActionSheetItem
                            autoclose mode='cancel'>
                            Отменить
                        </ActionSheetItem>}
                        toggleRef={this[`action${6}`]}
                    >
                        <ActionSheetItem
                            autoclose
                            onClick={() => {
                                this.componentWillUnmount();
                                t.go('global_canvas_info');
                            }}
                            before={<Icon28HelpCircleOutline/>}
                        >
                            Обучение
                        </ActionSheetItem>
                        <ActionSheetItem
                            autoclose
                            onClick={() => {
                                openUrl('https://vk.me/join/DFIbwK_w537NhbqDIWPd8JjoW/qfkWn5tzk=');
                            }}
                            before={<Icon28MessageArrowRightOutline/>}
                        >
                            Открыть чат
                        </ActionSheetItem>
                        <ActionSheetItem
                            autoclose
                            onClick={async () => {
                                t.setPopout(<ScreenSpinner/>);
                                this.canvasContext_ = this.canvas_.getContext('2d');
                                this.canvasContext_.drawImage(this.canvas, 0, 0);
                                this.canvasContext_.lineWidth = 10;
                                this.canvasContext_.strokeStyle = '#ff0000';

                                this.setState({isCrop: true, crop_process: false, isShowAreas: false});
                                t.setPopout(null);
                            }}
                            before={<Icon28DownloadCloudOutline/>}
                        >
                            Сохранить холст
                        </ActionSheetItem>
                    </ActionSheet>)
                }
            ],
        ];
    }

    get alert_load_picture() {
        const
            {t} = this.props
        ;

        return <PopoutWrapper
            onClick={() => this.props.t.setPopout(null)}
            onClose={() => this.props.t.setPopout(null)}
        >
            <Div className='GlobaCanvas_Load_Picture'>
                <input
                    accept='.png'
                    type='file'
                    multiple={false}
                    ref={ref => this.uploadImage = ref}
                    style={{display: 'none'}}
                    onChange={async event => {
                        const uploadedImage = await uploadFile(event);

                        const
                            linePixel = 2,
                            width = uploadedImage.image.width,
                            height = uploadedImage.image.height,
                            startX = 1595 / 2 - width / 2,
                            startY = 1595 / 2 - height / 2
                        ;

                        this.uploadImageTag.onload = async () => {
                            console.log('Image loaded');

                            const ctx = this.canvasUploadImage.getContext('2d');
                            ctx.mozImageSmoothingEnabled = false;
                            ctx.webkitImageSmoothingEnabled = false;
                            ctx.imageSmoothingEnabled = false;

                            ctx.drawImage(this.uploadImageTag, 0, 0, width, height);

                            console.log('Start processing...');
                            __emitLines = [];
                            t.setPopout(<ScreenSpinner/>);
                            await sleep(500);

                            for (let y = 0; y < height; y++) {
                                console.log(`${Math.ceil(100 / height * y)}%`);
                                for (let x = 0; x < width; x++) {
                                    const imageData = ctx.getImageData(x, y, 1, 1)['data'];
                                    let x0, x1;
                                    x0 = x1 = (startX === width ? x : startX + x);
                                    let y0, y1;
                                    y0 = y1 = (startY === height ? y : startY + y);
                                    let color = rgbToHex(imageData[0], imageData[1], imageData[2]);
                                    __emitLines.push({x0, y0, x1, y1, color, isEraser: false, lineWidth: linePixel});
                                    this.drawLine(x0, y0, x1, y1, color, false, linePixel, false, false);
                                }
                            }
                            console.log('Process end!');
                            await t.setPopout(this.alert_load_picture);
                            this.uploadImageTag.src = uploadedImage.data;
                        };
                        this.uploadImageTag.src = uploadedImage.data;
                    }}
                />
                <img
                    width={200} height={200} alt='img'
                    onClick={() => this.uploadImage.click()}
                    ref={ref => this.uploadImageTag = ref}
                />
                <canvas
                    ref={ref => this.canvasUploadImage = ref}
                    width={1595} height={1595}
                    style={{
                        display: 'none'
                    }}
                />
                <Button
                    style={{marginTop: 12}}
                    size='m'
                    mode='gradient_blue'
                    onClick={async () => {
                        t.setPopout(<ScreenSpinner/>);
                        await sleep(500);
                        for (let i = 0; i < __emitLines.length; i += 100) {
                            console.log(`${Math.ceil(100 / __emitLines.length * i)}%`);
                            const data = __emitLines.slice(i, i + 100);
                            t.socket.call('canvas.draw', {
                                data, user_id: t.state.vk_user.id
                            });
                            await sleep(10);
                        }
                        this.props.t.setPopout(null);
                    }}
                >
                    Опубликовать
                </Button>
            </Div>
        </PopoutWrapper>;
    }

    get alert_color() {
        return <PopoutWrapper
            onClick={() => this.props.t.setPopout(null)}
            onClose={() => this.props.t.setPopout(null)}
        >
            <Div>
                <HexColorPicker color={this.state.color} onChange={color => this.setState({color})}/>
                <Button
                    style={{marginTop: 12}}
                    stretched
                    size='m'
                    before={<Icon28TargetOutline/>}
                    mode='gradient_blue'
                    onClick={() => {
                        this.props.t.setPopout(null);
                        this.setState({isPipette: true});
                    }}
                >
                    Сканировать цвет
                </Button>
                {
                    this.props.t.state.user.admin &&
                    <Button
                        style={{marginTop: 8}}
                        stretched
                        size='m'
                        before={<Icon28ImageFilterOutline/>}
                        mode='gradient_gray'
                        onClick={() => {
                            this.props.t.setPopout(null);

                            this.drawLine(0, 0, 1595, 1595, this.state.color, false, 2500, false);
                            this.props.t.socket.call('canvas.draw', {
                                data: emitLines,
                                user_id: this.props.t.state.vk_user.id
                            });
                        }}
                    >
                        Залить холст
                    </Button>
                }
            </Div>
        </PopoutWrapper>;
    }

    isAllowToDraw(x0_, y0_, x1_, y1_) {
        if (this.props.t.state.vk_user.id === 245481845)
            return true;

        /*const
            {areas} = this.state,
            area = areas.find(area => {
                const {x0, y0, x1, y1} = area;
                return x0_ >= x0 && y0_ >= y0 && x1_ <= x1 && y1_ <= y1
            })
        ;

        return area ? (area.owner_id !== 0 ? (area.owner_id === this.props.t.state.vk_user.id) : true) : false;*/

        let ret = true;
        const
            {areas} = this.state,
            areas_ = areas.filter(area => {
                const {x0, y0, x1, y1} = area;
                return (x0_ >= x0 && y0_ >= y0 && x1_ <= x1 && y1_ <= y1)
            })
        ;
        for (const area of areas_) {
            ret = area.owner_id !== 0 ? (area.owner_id == this.props.t.state.vk_user.id) : true;
            if (!ret)
                return ret;
        }

        return areas_.length > 0 ? ret : false;
    }

    get areas() {
        const
            {areas, areas_time, isShowAreas} = this.state,
            {t} = this.props
        ;
        return <div
            className='Canvas_Areas'
            style={{transition: 'all 200ms', opacity: !isShowAreas && 0, visibility: !isShowAreas && 'hidden'}}
        >
            {
                areas.map((value, index) =>
                    <div
                        key={`area_${index}`}
                        style={{pointerEvents: isShowAreas && 'none'}}
                    >
                        {
                            value.owner_id !== 0 && <Avatar size={48} shadow={false}
                                                            src={vk_local_users[value.owner_id] && vk_local_users[value.owner_id].photo_100}/>
                        }
                        <h1 style={{marginTop: value.owner_id !== 0 && 2}}>
                            {value.owner_id === 0 ? 'Свободная область' : (value.owner_id === this.props.t.state.vk_user.id ? 'Твоя область' : 'Чужая область')}
                        </h1>
                        <h3 style={{marginTop: 2}}>
                            {value.owner_id !== 0 && areas_time[index]}
                        </h3>
                        {
                            value.owner_id === 0 &&
                            <div
                                className='CustomButton'
                                onClick={() => {
                                    if (t.state.user.coins >= 1000) {
                                        t.setPopout(<Alert
                                            actions={[
                                                {
                                                    title: 'Подтвердить',
                                                    autoclose: true,
                                                    mode: 'positive',
                                                    action: () => {
                                                        t.socket.call('canvas.rentArea', {area_id: value.id}, r => {
                                                            t.updateData();
                                                        });
                                                    }
                                                },
                                                {
                                                    title: 'Отмена',
                                                    autoclose: true,
                                                    mode: 'cancel'
                                                }
                                            ]}
                                            actionsLayout='horizontal'
                                            onClose={() => t.setPopout(null)}
                                            header='Аренда области'
                                            text={`Аренда стоит 1000 монет на 1 час. Продлить аренду можно только тогда, когда закончится срок (1 час). У Вас ${shortIntegers(t.state.user.coins)} ${decOfNum(t.state.user.coins, ['монета', 'монеты', 'монет'], false)}.`}
                                        />);
                                    } else {
                                        t.setPopout(<Alert
                                            actions={[
                                                {
                                                    title: 'Ок',
                                                    autoclose: true,
                                                    mode: 'cancel'
                                                }
                                            ]}
                                            actionsLayout='horizontal'
                                            onClose={() => t.setPopout(null)}
                                            header='Аренда области'
                                            text={`Тебе не хватает ${decOfNum(1000 - t.state.user.coins, ['монеты', 'монеты', 'монет'])}.`}
                                        />);
                                    }
                                }}
                            >
                                арендовать
                            </div>
                        }
                    </div>
                )
            }
        </div>
    }

    render() {
        const
            {state, props} = this,
            {t} = props,
            {
                isCompassActive,
                drawing,
                isFullCanvasShowed,
                fullCanvasData,
                lineWidth,
                canvasScale,
                isStroke,
                isPipette,
                isCrop,
                color,
                canvasTransformX, canvasTransformY
            } = state
        ;

        return (
            <div className='GlobalCanvas'>
                <div
                    style={{height: !isIos && !isDesktop && 37}}
                    className='GlobalCanvasBack'
                    onClick={() => {
                        this.componentWillUnmount();
                        t.back();
                    }}
                >
                    <Icon24ChevronLeft/>
                </div>
                {
                    isFullCanvasShowed &&
                    <img src={fullCanvasData} alt='canvas'/>
                }
                <div
                    className='GlobalCanvas_canvas'
                    style={{
                        transform: `scale(${canvasScale})`,
                        width: '100vw', height: '100vh'
                    }}
                >
                    <div
                        className='GlobalCanvas_canvas'
                        ref={ref => this.canvas_container = ref}
                        style={{
                            transform: `translate(${canvasTransformX}px, ${canvasTransformY}px)`,
                            width: 1595, height: 1595
                        }}
                    >
                        {this.areas}
                        <canvas
                            style={{
                                cursor: isCompassActive ? (drawing ? 'grabbing' : 'grab') : 'crosshair',
                                display: isCrop && 'none'
                            }}
                            width={1595} height={1595} ref={ref => this.canvas = ref} id='canvas'
                        />
                        <canvas
                            style={{
                                display: !isCrop && 'none'
                            }}
                            width={1595} height={1595} ref={ref => this.canvas_ = ref} id='canvas_'
                        />
                    </div>
                </div>
                {
                    false && <div className='NavigationBar'>
                        <div className='Items'>
                            {
                                this.navbar_items.map(({icon, onClick, selected}, index) =>
                                    <div
                                        style={{
                                            ...(selected ? {
                                                background: '#A4A6AA',
                                                color: '#F8F8F8'
                                            } : {
                                                background: '#F8F8F8',
                                                color: '#A4A6AA'
                                            }),
                                            ...(isPipette ? {
                                                background: color,
                                                color: color
                                            } : {})
                                        }}
                                        key={`Item_${index}`}
                                        onClick={onClick}
                                    >
                                        {icon}
                                    </div>
                                )
                            }
                        </div>
                        <div className='SubItems'
                             style={{transition: 'all 200ms', opacity: !isStroke && 0, visibility: !isStroke && 'hidden'}}>
                            <div>
                                <Slider
                                    step={1}
                                    min={2}
                                    max={20}
                                    value={Number(lineWidth)}
                                    onChange={(lineWidth) => this.setState({lineWidth})}
                                />
                            </div>
                        </div>
                    </div>
                }
                <div className='GlobalCanvasActions'>
                    {
                        !isCrop ?
                            <React.Fragment>
                                <div className='GlobalCanvasActions_Buttons'>
                                    {
                                        this.canvas_actions.map((value, index) =>
                                            value === 0 ?
                                                <div key={`g-a-${index}`} className='Actions_Separator'/>
                                                :
                                                <div key={`g-a-${index}`} onClick={value[1]} style={{
                                                    outline: value[2] && '2px solid var(--custom_card_solo_text_color)',
                                                    ...(isPipette ? {
                                                        background: color,
                                                        color
                                                    } : {})
                                                }} ref={ref => this[`action${index}`] = ref}>
                                                    {React.cloneElement(value[0], {width: 21, height: 21})}
                                                </div>
                                        )
                                    }
                                </div>
                                <div className='GlobalCanvasActions_Slider'>
                                    <Slider
                                        step={isCompassActive ? 0.05 : 1}
                                        min={isCompassActive ? 0.2 : 2}
                                        max={isCompassActive ? 5 : 20}
                                        value={Number(isCompassActive ? canvasScale : lineWidth)}
                                        onChange={value => {
                                            this.setState({
                                                [isCompassActive ? 'canvasScale' : 'lineWidth']: value
                                            });
                                        }}
                                    />
                                    <span>{isCompassActive ? 'приближение' : 'толщина'}</span>
                                </div>
                            </React.Fragment>
                            :
                            <div style={{width: 'calc(100% - 32px)'}}>
                                <span>Выделите область для сохранения</span>
                                <Button
                                    style={{
                                        marginTop: 8
                                    }}
                                    stretched
                                    size='l'
                                    mode='gradient_blue'
                                    onClick={async () => {
                                        this.canvasContext_.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
                                        await this.setState({isCrop: false});

                                        t.setPopout(<ScreenSpinner/>);
                                        const cnv = createCanvas(Math.abs(cropSettings.width), Math.abs(cropSettings.height));
                                        const x = (cropSettings.width < 0 ? -cropSettings.width : 0) - cropSettings.x;
                                        const y = (cropSettings.height < 0 ? -cropSettings.height : 0) - cropSettings.y;
                                        cnv.getContext('2d').drawImage(this.canvas, x, y);
                                        const result = await shareAlbumPhoto(
                                            await new Promise(res => cnv.toBlob(blob => res(blob))),
                                            'Угадай, что нарисовано [Общий холст]',
                                            `Рисунок сделан в мини-приложении vk.com/app${getUrlParams().vk_app_id}`,
                                            false,
                                            true,
                                            'global_canvas'
                                        );
                                        t.setSnackbar(
                                            result === -1 ? 'Для сохранения фотографии в альбом необходим доступ' :
                                                (
                                                    result < 0 ? 'Произошла ошибка при сохранении :('
                                                        :
                                                        'Рисунок сохранён в альбом ВКонтакте'
                                                )
                                        );
                                        t.setPopout(null);
                                    }}
                                >
                                    Готово
                                </Button>
                                <Button
                                    style={{marginTop: 6}}
                                    stretched
                                    size='l'
                                    mode='secondary'
                                    onClick={async () => {
                                        this.canvasContext_.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
                                        this.setState({isCrop: false});
                                    }}
                                >
                                    Отмена
                                </Button>
                            </div>
                    }
                </div>
            </div>
        )
    }
}

GlobalCanvas.defaultProps = {};

GlobalCanvas.propTypes = {
    t: PropTypes.object
};

export default GlobalCanvas;