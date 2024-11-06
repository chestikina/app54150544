import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Button, Input,
    PanelHeader,
    PanelHeaderBack, ScreenSpinner
} from "@vkontakte/vkui";
import {
    decOfNum,
    isPlatformDesktop, openUrl
} from "../../js/utils";
import {Icon28ArticlesOutline, Icon28BugOutline, Icon28FavoriteOutline, Icon28LightbulbOutline} from "@vkontakte/icons";

const
    isDesktop = isPlatformDesktop()
;

export class SuggestionsWord extends PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            input: ''
        };
    }

    render() {
        const
            {t} = this.props,
            {input} = this.state
        ;

        return (
            <React.Fragment>
                <PanelHeader
                    left={<PanelHeaderBack onClick={t.back}/>}
                    separator={false}
                />
                <div className='Panel_Container_Card Panel_Container_Card-TwoCards'>
                    <div>
                        <Icon28ArticlesOutline width={36} height={36}/>
                        <div className='Panel_Container_Card-Text'>
                            <h2>Новое слово</h2>
                            <p>Постарайтесь написать слово без ошибок. И самое главное, чтобы большинству игроков было понятно, как его изобразить, и отгадать рисунок.</p>
                        </div>
                    </div>
                    <div>
                        <div className='SuggestionsWord'>
                            <div className='SuggestionsWord_Container'>
                                <div className='Span'>
                                    Напишите слово
                                </div>
                                <Input
                                    style={{marginTop: 8}}
                                    placeholder='Морковь'
                                    getRef={ref => this.inputWord = ref}
                                    value={input}
                                    onChange={e => {
                                        const value = e.currentTarget.value;
                                        console.log('Input (word), value = ', value);
                                        console.log('Math (word) = ', value.match(/^[а-яА-Я- ]+$/));
                                        if ((value.match(/^[а-яА-Я- ]+$/) || value === '') && value.length <= 33) {
                                            this.setState({input: value});
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                style={{marginTop: 12, width: '100%'}}
                                size='m' mode='gradient_blue' stretched
                                onClick={async () => {
                                    const title = this.inputWord.value;
                                    if (title.length === 0) {
                                        t.setSnackbar('Вы не ввели слово.');
                                        return;
                                    }
                                    if (title.length > 33) {
                                        t.setSnackbar('Слишком длинное слово.');
                                        return;
                                    }
                                    t.setPopout(<ScreenSpinner/>);
                                    t.socket.call('suggestions.add', {
                                        type: 'word', title
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
                                        t.socket.call('suggestions.getList', {type: 'word'}, async r => {
                                            await t.setState({
                                                suggestions_type: 'word',
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

SuggestionsWord.defaultProps = {};

SuggestionsWord.propTypes = {
    t: PropTypes.object
};

export default SuggestionsWord;