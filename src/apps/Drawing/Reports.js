import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    PanelHeader,
    PanelHeaderBack, PanelSpinner, ScreenSpinner, Select,
} from "@vkontakte/vkui";
import {
    Icon28LightbulbOutline,
    Icon28ArticlesOutline,
    Icon28BugOutline, Icon28FavoriteOutline, Icon28ReportOutline, Icon12Chevron, Icon16Play
} from "@vkontakte/icons";
import {
    decOfNum, getMostRepeatingValue,
    isPlatformDesktop, openUrl
} from "../../js/utils";
import {defaultShopItems} from "./Shop";
import {forceStopAnimation, startAnimation} from "./PictureInfo";
import bridge from "@vkontakte/vk-bridge";

export class Reports extends PureComponent {

    render() {
        const
            {t} = this.props,
            {user} = t.state
        ;
        return <React.Fragment>
            <PanelHeader
                left={<PanelHeaderBack onClick={t.back}/>}
                separator={false}
            />
            <div className='Panel_Container_Card Panel_Container_Card-TwoCards'>
                <div>
                    <Icon28ReportOutline width={36} height={36}/>
                    <div className='Panel_Container_Card-Text'>
                        <h2>Репорты</h2>
                        <p>Вы можете просматривать жалобы на рисунки и наказывать нарушителей. <span
                            style={{color: 'var(--color_blue)'}}>
                                Рассматривая жалобы, вы подтверждаете, что вам исполнилось 18 лет и согласны с тем, что можете материал, нарушающий правила ВКонтакте и другие.
                            </span><br/>
                            За каждую рассмотренную жалобу вы получаете 5 монет. За каждый верный вердикт вы получаете
                            ещё 5 монет.
                        </p>
                    </div>
                    <div className='Panel_Container_Card-Buttons'>
                        <Button
                            stretched
                            size='m'
                            mode='outline'
                            onClick={() => t.showOnboard('reports')}
                        >
                            Подробнее
                        </Button>
                    </div>
                </div>
                <div>
                    <div className='Suggestions'>
                        <div className='SuggestionsCards'>
                            {
                                [
                                    [
                                        'reports_view',
                                        'Рассмотрено жалоб'
                                    ],
                                    [
                                        'reports_confirm',
                                        'Заблокировано картин'
                                    ]
                                ].map((value, index) =>
                                    <div key={`Card_${index}`}>
                                        <p>{user[value[0]]}</p>
                                        <p>{value[1]}</p>
                                    </div>
                                )
                            }
                        </div>
                        <div style={{display: 'flex', marginTop: 18}}>
                            <Button
                                stretched
                                size='m'
                                mode='gradient_blue'
                                after={<Icon12Chevron/>}
                                onClick={async () => {
                                    if (user.lvl < 10 && !user.admin) {
                                        t.setSnackbar('Вам пока что это недоступно.');
                                    } else {
                                        await t.setState({reports_mode: 'user'});
                                        t.go('report_view');
                                    }
                                }}
                            >
                                Посмотреть репорты
                            </Button>
                        </div>
                        {
                            user.admin &&
                            <div style={{display: 'flex', marginTop: 12}}>
                                <Button
                                    stretched
                                    size='m'
                                    mode='gradient_gray'
                                    after={<Icon12Chevron/>}
                                    onClick={async () => {
                                        await t.setState({reports_mode: 'admin'});
                                        t.go('report_view');
                                    }}
                                >
                                    Готовые вердикты
                                </Button>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </React.Fragment>
    }
}

Reports.defaultProps = {};

Reports.propTypes = {
    t: PropTypes.object
};

export class ReportView extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            games: [],
            limit: 10, offset: 0,

            current: 0,

            mode: 'default',
            report_reasons: [],
            report_mode: props.t.state.reports_mode
        }


        this.componentDidMount = this.componentDidMount.bind(this);
        this.updateReports = this.updateReports.bind(this);
    }

    async componentDidMount() {
        const {socket} = this.props.t;
        await new Promise(res => socket.call('reports.getReportReasons', {}, async r => {
            await this.setState({report_reasons: r.response});
            res();
        }));
        await this.updateReports();
    }

    async updateReports() {
        const {t} = this.props;
        const {socket} = t;
        const {limit, offset, report_mode} = this.state;
        await new Promise(res => socket.call('reports.getList', {limit, offset, mode: report_mode}, async r => {
            if (r.response.length === 0) {
                t.setPopout(null);
                t.back();
                t.setSnackbar('На данный момент репортов нет.');
                res();
                return;
            }
            let report_reason = undefined;
            if (report_mode === 'admin') {
                report_reason = getMostRepeatingValue(r.response[0].report_reasons) + '';
                console.log({
                    report_reason,
                    r: r.response[0].report_reasons,
                    r1: getMostRepeatingValue(r.response[0].report_reasons)
                });
            }
            await this.setState({games: r.response, offset: offset + r.response.length, current: 0, report_reason});
            res();
        }));
    }

    render() {
        const
            {t} = this.props,
            {games, current, mode, report_reason, report_reasons, report_mode} = this.state,
            game = games[current]
        ;
        return <React.Fragment>
            <PanelHeader
                left={<PanelHeaderBack onClick={t.back}/>}
                separator={false}
            />
            {
                game ?
                    <div className='PictureInfo'>
                        <div className='PictureInfo-Word-Time'>
                            <span>
                                {(game['Word.nom'] || game.Word.nom) && ((game['Word.nom'] || game.Word.nom).substring(0, 1).toUpperCase() + (game['Word.nom'] || game.Word.nom).substring(1))}
                            </span>
                        </div>
                        <div className='PictureInfo-CanvasContainer'>
                            <img
                                crossOrigin='anonymous'
                                alt='im' src={game['Picture.url'] || game.Picture.url}
                                ref={ref => this.imageRef = ref}
                                style={{display: mode !== 'default' && 'none'}}
                            />
                            <canvas
                                style={{
                                    width: 220, height: 220,
                                    display: mode !== 'animation' && 'none'
                                }}
                                width={319 * 2} height={319 * 2}
                                ref={ref => this.canvas = ref}
                            />
                        </div>
                        <div style={{width: 220, display: 'flex', marginTop: 24}}>
                            <Button
                                stretched
                                size='m'
                                mode='gradient_light_gray'
                                before={<Icon16Play/>}
                                disabled={mode !== 'default'}
                                onClick={async () => {
                                    await this.setState({mode: 'animation'});
                                    startAnimation(this.canvas, game, () => {
                                        this.setState({mode: 'default'});
                                    });
                                }}
                            >
                                Воспроизвести
                            </Button>
                        </div>
                        <div style={{
                            position: 'fixed',
                            bottom: 'calc(var(--safe-area-inset-bottom) + 14px)',
                            left: 28,
                            right: 28
                        }}>
                            <p>
                                Эту жалобу проверили {decOfNum(game.users_view_report.length, ['человек', 'человека', 'человек'])}
                            </p>
                            <Select
                                style={{
                                    marginTop: 12
                                }}
                                placeholder='Есть нарушения?'
                                options={report_reasons.map((value, index) => ({
                                    label: value,
                                    value: index + ''
                                }))}
                                value={report_reason}
                                onChange={e => {
                                    const value = e.target.value;
                                    this.setState({report_reason: value});
                                }}
                            />
                            <div style={{display: 'flex', marginTop: 12}}>
                                <Button
                                    stretched
                                    size='m'
                                    mode='gradient_blue'
                                    disabled={!report_reason}
                                    onClick={async () => {
                                        t.setPopout(<ScreenSpinner/>);
                                        await new Promise(res =>
                                            t.socket.call('reports.submitReason', {
                                                report_id: game.report_id,
                                                reason_id: parseInt(report_reason)
                                            }, async r => {
                                                console.log({report_response: r});
                                                const cur = current + 1 >= games.length ? 0 : current + 1;
                                                forceStopAnimation();
                                                await this.setState({
                                                    current: cur,
                                                    report_reason: report_mode === 'admin' ? getMostRepeatingValue(games[cur].report_reasons) + '' : ''
                                                });
                                                if (current + 1 >= games.length) {
                                                    await this.updateReports();
                                                }
                                                res();
                                            })
                                        );
                                        t.setPopout(null);
                                    }}
                                >
                                    Подтвердить
                                </Button>
                            </div>
                        </div>
                    </div>
                    :
                    <PanelSpinner/>
            }
        </React.Fragment>
    }
}

ReportView.defaultProps = {};

ReportView.propTypes = {
    t: PropTypes.object
};

export default Reports;