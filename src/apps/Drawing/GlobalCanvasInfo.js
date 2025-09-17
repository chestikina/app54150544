import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    PanelHeader,
    PanelHeaderBack
} from "@vkontakte/vkui";
import {
    isPlatformDesktop
} from "../../js/utils";
import {
    Icon28BrushOutline,
    Icon28CompassOutline,Icon28EraserOutline,
    Icon28PaletteOutline
} from "@vkontakte/icons";

const isDesktop = isPlatformDesktop();

export class GlobalCanvasInfo extends PureComponent {

    render() {
        const {t} = this.props;

        return (
            <React.Fragment>
                <PanelHeader
                    left={<PanelHeaderBack onClick={t.back}/>}
                    separator={false}
                >
                    {
                        isDesktop && 'Общий холст'
                    }
                </PanelHeader>
                <div className='GlobalCanvasInfo' style={{paddingBottom: 24}}>
                    {
                        !isDesktop && <h2 style={{textAlign: 'left'}}>Общий холст</h2>
                    }
                    <p style={{margin: !isDesktop && '8px 0 0 0'}}>
                        На общем холсте могут рисовать все игроки. Рисовать можно на определённой области. Всего таких
                        областей 25.
                    </p>
                    <div className='GlobalCanvas_Items__List'>
                        {
                            [
                                [
                                    <Icon28PaletteOutline/>, 'Меню палитры'
                                ],
                                [
                                    <Icon28CompassOutline/>, 'Режим перемещения', 'Повторное нажатие покажет области для аренды'
                                ],
                                [
                                    <Icon28BrushOutline/>, 'Режим рисования'
                                ],
                                [
                                    <Icon28EraserOutline/>, 'Режим ластика'
                                ]
                            ].map((value, index) =>
                                <div key={`item_${index}`}>
                                    {React.cloneElement(value[0], {width: 20, height: 20})}
                                    <div>
                                        <span>{value[1]}</span>
                                        {value[2] && <span>{value[2]}</span>}
                                    </div>
                                </div>
                            )
                        }
                    </div>
                    <p style={{margin: '18px 0 0 0'}}>
                        Свободную область можно арендовать (1000 монет на час). На арендованной области может рисовать
                        только владелец. Продлить аренду невозможно — можно только купить её снова по окончанию срока.
                    </p>
                </div>
            </React.Fragment>
        )
    }
}

GlobalCanvasInfo.defaultProps = {};

GlobalCanvasInfo.propTypes = {
    t: PropTypes.object
};

export default GlobalCanvasInfo;