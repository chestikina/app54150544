import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    PanelHeader,
    PanelHeaderBack,
} from "@vkontakte/vkui";
import {
    Icon28LightbulbOutline,
    Icon28ArticlesOutline,
    Icon28BugOutline, Icon28FavoriteOutline
} from "@vkontakte/icons";
import {
    decOfNum,
    isPlatformDesktop, openUrl
} from "../../js/utils";

export class Suggestions extends PureComponent {

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
                    <Icon28FavoriteOutline width={36} height={36}/>
                    <div className='Panel_Container_Card-Text'>
                        <h2>Предложения</h2>
                        <p>Мы готовы принимать предложения от нашей любимой аудитории, так что вперёд!</p>
                    </div>
                </div>
                <div>
                    <div className='Suggestions'>
                        <div className='SuggestionsCards'>
                            {
                                [
                                    [
                                        'suggestions_idea',
                                        ['Идея', 'Идеи', 'Идей'],
                                        'реализовано'
                                    ],
                                    [
                                        'suggestions_word',
                                        ['Слово', 'Слова', 'Слов'],
                                        'опубликовано'
                                    ]
                                ].map((value, index) =>
                                    <div key={`Card_${index}`}>
                                        <p>{user[value[0]]}</p>
                                        <p>{decOfNum(user[value[0]], value[1], false)} {value[2]}</p>
                                    </div>
                                )
                            }
                        </div>
                        <div className='SuggestionsVariants'>
                            {
                                [
                                    {
                                        icon: <Icon28LightbulbOutline/>,
                                        text: 'Предложить идею',
                                        onClick: () => t.go('suggestions_idea')
                                    },
                                    {
                                        icon: <Icon28ArticlesOutline/>,
                                        text: 'Предложить новое слово',
                                        onClick: () => t.go('suggestions_word')
                                    },
                                    {
                                        icon: <Icon28BugOutline/>,
                                        text: 'Сообщить о проблеме',
                                        onClick: () => openUrl('https://vk.com/@draw_app-bug')
                                    }
                                ].map(({icon, text, onClick}, index) =>
                                    <div
                                        key={`Variant_${index}`}
                                        className={`Variant_${index}`}
                                        onClick={onClick}
                                    >
                                        {icon}
                                        <span>{text}</span>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    }
}

Suggestions.defaultProps = {};

Suggestions.propTypes = {
    t: PropTypes.object
};

export default Suggestions;