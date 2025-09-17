import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Button, CardGrid,
    PanelHeader,
    PanelHeaderBack, Spinner
} from "@vkontakte/vkui";
import {
    isPlatformDesktop
} from "../../js/utils";
import {ContentCard} from "@vkontakte/vkui";

const
    isDesktop = isPlatformDesktop()
;

export class SuggestionsList extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            offset: props.list.length,
            limit: 10,
            canGetMore: props.list.length > 0,
            prevY: 0
        };
    }

    componentDidMount() {
        this.observer = new IntersectionObserver(
            this.handleObserver.bind(this),
            {
                root: null,
                rootMargin: '0px',
                threshold: 1.0
            }
        );
        this.observer.observe(this.loadingRef);
    }

    handleObserver(entities, observer) {
        const
            {y} = entities[0].boundingClientRect,
            {t} = this.props,
            {prevY, offset, limit, canGetMore} = this.state
        ;
        if ((prevY === 0 || prevY > y) && canGetMore) {
            this.setState({spinner: true});
            t.socket.call('suggestions.getList', {type: this.props.type, offset, limit}, async r => {
                t.setState({suggestions_list: [...t.state.suggestions_list, ...r.response]});
                this.setState({canGetMore: r.response.length > 0, spinner: false});
                this.forceUpdate();
            });
            this.setState({offset: offset + limit});
        }
        this.setState({prevY: y});
    }

    actionButtons(id, index) {
        const {t} = this.props;

        return <div style={{display: 'flex', marginTop: 12}}>
            <Button
                mode='gradient_blue'
                onClick={() => {
                    t.socket.call('suggestions.approve', {id}, async r => {
                        if (r.response) {
                            const {suggestions_list} = t.state;
                            suggestions_list.splice(index, 1);
                            await t.setState({suggestions_list});
                            this.forceUpdate();
                        } else {
                            t.setSnackbar(r.error.message);
                            this.forceUpdate();
                        }
                    });
                }}
            >
                Одобрить
            </Button>
            <Button
                mode='gradient_'
                style={{marginLeft: 6}}
                onClick={() => {
                    t.socket.call('suggestions.decline', {id}, async r => {
                        if (r.response) {
                            const {suggestions_list} = t.state;
                            suggestions_list.splice(index, 1);
                            await t.setState({suggestions_list});
                            this.forceUpdate();
                        } else {
                            t.setSnackbar(r.error.message);
                            this.forceUpdate();
                        }
                    });
                }}
            >
                Отклонить
            </Button>
        </div>;
    }

    render() {
        const
            {t, list, type} = this.props,
            {spinner} = this.state
        ;

        return (
            <React.Fragment>
                <PanelHeader
                    left={<PanelHeaderBack onClick={t.back}/>}
                    separator={false}
                >
                    {
                        isDesktop && `Список ${type === 'idea' ? 'идей' : 'слов'}`
                    }
                </PanelHeader>
                <div className='SuggestionsList'>
                    {
                        !isDesktop &&
                        <h2 style={{textAlign: 'left'}}>{`Список ${type === 'idea' ? 'идей' : 'слов'}`}</h2>
                    }
                    <div className='SuggestionsList_Container'>
                        <CardGrid size="l">
                            {
                                list.map((value, index) =>
                                    type === 'idea' ?
                                        <ContentCard
                                            key={`Card_${index}`}
                                            header={value.title}
                                            caption={<React.Fragment>
                                                {value.description}
                                                {this.actionButtons(value.id, index)}
                                            </React.Fragment>}
                                        />
                                        :
                                        <ContentCard
                                            disabled={false}
                                            key={`Card_${index}`}
                                            header={value.title}
                                            caption={this.actionButtons(value.id, index)}
                                        />
                                )
                            }
                        </CardGrid>
                    </div>
                </div>
                {
                    spinner &&
                    <Spinner size='small' style={{margin: '20px 0'}}/>
                }
                <div ref={ref => this.loadingRef = ref}/>
            </React.Fragment>
        )
    }
}

SuggestionsList.defaultProps = {};

SuggestionsList.propTypes = {
    t: PropTypes.object,
    type: PropTypes.string,
    list: PropTypes.array
};

export default SuggestionsList;