import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    PanelHeader,
    PanelHeaderBack,
    ScreenSpinner
} from "@vkontakte/vkui";
import {
    ctxDrawImageWithRound,
    getSrcUrl,
    loadCrossOriginImage, recordElement
} from "../../js/utils";
import {startAnimation} from "./PictureInfo";
import {createCanvas} from "canvas";
import {getVKUsers} from "../../js/drawerapp/utils";

export class ExportClip extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            isExportClip: props.t.state.export_
        };

        this.componentDidMount = this.componentDidMount.bind(this);
        this.startExport = this.startExport.bind(this);
    }

    async componentDidMount() {
        const {t} = this.props;
        t.setPopout(<ScreenSpinner/>);

        const {game_, export_, game_export_} = t.state;
        const final_game_export_ = game_export_ && [...game_export_];
        const isExportClip = export_ === 'clip';

        if (game_export_) {
            console.log('multiple export');
            for (const _game of game_export_) {
                console.log({_game});
                t.setPopout(<ScreenSpinner/>);

                const game_id = parseInt(_game.split('_')[0])
                const isExportClip = _game.split('_')[1] === 'clip';
                this.setState({isExportClip});

                const game = await new Promise(res => t.socket.call('games.getById', {id: game_id}, r => {
                        if (r.response) {
                            res(r.response);
                        } else {
                            this.setAlert(
                                'Ошибка',
                                r.error.message,
                                [{
                                    title: 'Ок',
                                    mode: 'cancel',
                                    autoclose: true
                                }]
                            );
                            res(false);
                        }
                    })
                );
                console.log({game});
                if (game === false) {
                    break;
                }
                await new Promise(res => t.socket.call('games.getHistory', {id: game.id, act: 'clip'}, r => {
                        if (r.response) {
                            game.history = r.response;
                            res(true);
                        } else {
                            this.setAlert(
                                'Ошибка',
                                r.error.message,
                                [{
                                    title: 'Ок',
                                    mode: 'cancel',
                                    autoclose: true
                                }]
                            );
                            res(false);
                        }
                    })
                );
                console.log({game});
                if (game.history === false) {
                    break;
                }

                t.setPopout(null);

                await this.startExport(game.drawerId, game, isExportClip, false);
                final_game_export_.splice(final_game_export_.indexOf(`${game.id}_${_game.split('_')[1]}`));
                t.setState({game_export_: final_game_export_});
            }
            t.setPopout(null);
            t.back();
        } else {
            t.setPopout(null);
            this.startExport(game_.drawerId, game_, isExportClip);
        }
    }

    async startExport(drawerId, game_, isExportClip, needGoBack = true) {
        const {t} = this.props;
        t.setPopout(<ScreenSpinner/>);

        const {history} = game_;

        const canvCtx = this.canvas.getContext('2d');
        canvCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const resultCtx = this.canvasResult.getContext('2d');
        resultCtx.clearRect(0, 0, this.canvasResult.width, this.canvasResult.height);

        const lines = history.map(value => value.length).reduce((a, b) => a + b);
        const timeMs = Math.floor(1000 / 60 * lines);
        const maxTime = 15 * 1000;
        const speed = timeMs > maxTime ? timeMs / maxTime : 1;

        const user = (await getVKUsers([drawerId]))[0];
        const avatar =
            user.photo_max_orig === 'https://vk.com/images/camera_400.png' ?
                await loadCrossOriginImage(getSrcUrl(require(`../../assets/drawing/icons/camera_400.png`)))
                :
                await loadCrossOriginImage(user.photo_max_orig)
        ;
        const background_img = await loadCrossOriginImage(getSrcUrl(require(`../../assets/drawing/backgrounds/${isExportClip ? 'clip_background.webp' : 'video_background.webp'}`)));
        const background = createCanvas(background_img.width, background_img.height);
        const backgroundCtx = background.getContext('2d');
        backgroundCtx.drawImage(background_img, 0, 0);
        const avatarSize = isExportClip ? 72 : 96;
        ctxDrawImageWithRound(backgroundCtx, avatar, avatarSize / 2, null, {
            x: isExportClip ? 61 : 111,
            y: isExportClip ? 238 : 153.78,
            width: avatarSize,
            height: avatarSize
        });
        backgroundCtx.font = `${isExportClip ? 40 : 48}px Manrope Semibold`;
        backgroundCtx.textAlign = 'left';
        backgroundCtx.fillStyle = '#1E2A56';
        backgroundCtx.fillText(`${user.first_name} ${user.last_name}`, isExportClip ? (276 + 5) : (376 + 10), isExportClip ? (246.5 + 43) : (168.78 + 51));

        console.log('Start record animation');
        await new Promise(res => {
            const rec = recordElement(this.canvasResult, {
                filename: isExportClip ? 'clip.mp4' : 'video.mp4',
                onError: (msg) => {
                    t.setPopout(null);
                    t.back();
                    t.setSnackbar(msg);
                },
                onStop: (url) => {
                    t.setPopout(null);
                    if (needGoBack) {
                        t.back();
                    }
                    res(true);
                }
            });
            console.log('Start animation');
            startAnimation(this.canvas, game_, () => {
                console.log('Animation END');
                rec.stop();
            }, {
                speed,
                onRender: async () => {
                    resultCtx.drawImage(background, 0, 0, background.width, background.height);
                    resultCtx.drawImage(this.canvas, isExportClip ? 61 : 1053, isExportClip ? 388 : 193, isExportClip ? 957 : 695, isExportClip ? 957 : 695);
                }
            });
        })
    }

    render() {
        const {isExportClip} = this.state;

        return <div className='Game'>
            <canvas
                style={{
                    width: (isExportClip ? 957 : 695) / 2, height: (isExportClip ? 957 : 695) / 2
                }}
                width={319 * 2} height={319 * 2}
                ref={ref => this.canvas = ref}
            />
            <canvas
                style={{
                    width: (isExportClip ? 1080 : 1920) / 2, height: (isExportClip ? 1920 : 1080) / 2,
                    opacity: 0
                }}
                width={isExportClip ? 1080 : 1920} height={isExportClip ? 1920 : 1080}
                ref={ref => this.canvasResult = ref}
            />
        </div>
    }

}

ExportClip.defaultProps = {};

ExportClip.propTypes = {
    t: PropTypes.object
};

export default ExportClip;