import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Button, Input,
    PanelHeader,
    PanelHeaderBack, ScreenSpinner, Textarea
} from "@vkontakte/vkui";
import {
    isPlatformDesktop
} from "../../js/utils";
import {Icon28ArticlesOutline, Icon28LightbulbOutline} from "@vkontakte/icons";

const
    isDesktop = isPlatformDesktop()
;

export class SuggestionsIdea extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            input1: '',
            input2: ''
        };
    }

    componentDidMount() {

    }

    render() {
        const
            {t} = this.props,
            {input1, input2} = this.state
        ;

        return (
            <React.Fragment>
                <PanelHeader
                    left={<PanelHeaderBack onClick={t.back}/>}
                    separator={false}
                />
                <div className='Panel_Container_Card Panel_Container_Card-TwoCards'>
                    <div>
                        <Icon28LightbulbOutline width={36} height={36}/>
                        <div className='Panel_Container_Card-Text'>
                            <h2>Новая идея</h2>
                            <p>Мы обязательно прислушаемся к вашей идее, но придётся подождать, так как предложений очень много</p>
                        </div>
                    </div>
                    <div>
                        <div className='SuggestionsIdea'>
                            <div className='SuggestionsIdea_Container'>
                                <div className='Span'>
                                    Кратко опишите идею
                                </div>
                                <Input
                                    style={{marginTop: 8}}
                                    placeholder='Новая метка'
                                    getRef={ref => this.inputIdeaTitle = ref}
                                    value={input1}
                                    onChange={e => {
                                        const value = e.currentTarget.value;
                                        console.log('Input (title), value = ', value);
                                        console.log('Math (title) = ', value.match(/^[0-9a-zA-Zа-яА-Я ,.:-]+$/));
                                        if ((value.match(/^[0-9a-zA-Zа-яА-Я ,.:-]+$/) || value === '') && value.length <= 200) {
                                            this.setState({input1: value});
                                        }
                                    }}
                                />
                                <div className='Span' style={{marginTop: 8}}>
                                    Максимально подробно опишите свою идею
                                </div>
                                <Textarea
                                    style={{marginTop: 8}}
                                    placeholder='Добавить новую метку Клипер. Эту метку можно выдавать игрокам, которые снимают клипы по игре.'
                                    getRef={ref => this.inputIdeaDescription = ref}
                                    value={input2}
                                    onChange={e => {
                                        const value = e.currentTarget.value;
                                        console.log('Input (desc), value = ', value);
                                        console.log('Math (desc) = ', value.match(/^[0-9a-zA-Zа-яА-Я ,.:-]+$/));
                                        if ((value.match(/^[0-9a-zA-Zа-яА-Я ,.:-]+$/) || value === '') && value.length <= 600) {
                                            this.setState({input2: value});
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                style={{marginTop: 12, width: '100%'}}
                                size='m' mode='gradient_blue' stretched
                                onClick={async () => {
                                    const title = this.inputIdeaTitle.value;
                                    const description = this.inputIdeaDescription.value;
                                    if (title.length === 0 || description.length === 0) {
                                        t.setSnackbar('Заполните все поля.');
                                        return;
                                    }
                                    if (description.split(' ').length < 3) {
                                        t.setSnackbar('Слишком короткое предложение.');
                                        return;
                                    }
                                    if (title.replace(/^[0-9 ,.:-]+$/, '').length === 0 || description.replace(/^[0-9 ,.:-]+$/, '').length === 0) {
                                        t.setSnackbar('Некорректное предложение.');
                                        return;
                                    }
                                    if (title.length > 200 || description.length > 600) {
                                        t.setSnackbar('Слишком длинное предложение.');
                                        return;
                                    }
                                    if (title.length < 5 || description.length < 5) {
                                        t.setSnackbar('Слишком короткое предложение.');
                                        return;
                                    }
                                    t.setPopout(<ScreenSpinner/>);
                                    t.socket.call('suggestions.add', {
                                        type: 'idea',
                                        title, description
                                    }, response => {
                                        t.setPopout(null);
                                        if (response.response) {
                                            t.go('suggestions_done');
                                        } else {
                                            t.setSnackbar(response.error.message);
                                        }
                                    });

                                }}
                            >
                                Предложить
                            </Button>
                            {
                                t.state.user.admin &&
                                <Button
                                    style={{marginTop: 6, width: '100%'}}
                                    size='m' mode='gradient_gray' stretched
                                    onClick={async () => {
                                        t.socket.call('suggestions.getList', {type: 'idea'}, async r => {
                                            await t.setState({
                                                suggestions_type: 'idea',
                                                suggestions_list: r.response
                                            });

                                            t.go('suggestions_list');
                                        });
                                    }}
                                >
                                    Список
                                </Button>
                            }
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

SuggestionsIdea.defaultProps = {};

SuggestionsIdea.propTypes = {
    t: PropTypes.object
};

export default SuggestionsIdea;