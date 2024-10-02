import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {PanelHeader, PanelHeaderBack, Spinner} from "@vkontakte/vkui";
import {decOfNum} from "../../js/utils";
import {getVKUsers} from "../../js/drawerapp/utils";
import {Icon28PictureOutline} from "@vkontakte/icons";

export class GuessedPictures extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            offset: props.t.state.gamesAsWinner.length,
            limit: 50,
            canGetMore: true,
            prevY: 0
        };
    }

    async componentDidMount() {
        if (this.props.t.state.gamesAsWinner.length === 0) return;
        this.observer = new IntersectionObserver(
            this.handleObserver.bind(this),
            {
                root: null,
                rootMargin: '0px',
                threshold: 1.0
            }
        );
        this.observer.observe(this.loadingRef);
        this.handleObserver();
        if (this.props.t.state.scrollPosition) {
            console.log(`Scroll to ${this.props.t.state.scrollPosition}`);
            document.body.scrollTop = this.props.t.state.scrollPosition;
        }
    }

    handleObserver(entities = [{boundingClientRect: {y: 0}}], observer) {
        const
            {y} = entities[0].boundingClientRect,
            {t} = this.props,
            {prevY, offset, limit, canGetMore} = this.state
        ;
        if ((prevY === 0 || prevY > y) && canGetMore) {
            this.setState({spinner: true});
            t.socket.call('games.getByWinnerId', {id: t.state.vk_user.id, offset, limit}, async r => {
                await getVKUsers(r.response.map(value => value.drawerId));
                t.setState({gamesAsWinner: [...t.state.gamesAsWinner, ...r.response]});
                this.setState({canGetMore: r.response.length > 0, spinner: false});
                this.forceUpdate();
            });
            this.setState({offset: offset + limit});
        }
        this.setState({prevY: y});
    }

    render() {
        const
            {t} = this.props,
            {user, gamesAsWinner} = t.state,
            {guessedPictures} = user,
            {spinner} = this.state
        ;

        return <React.Fragment>
            <PanelHeader
                left={<PanelHeaderBack onClick={t.back}/>}
                separator={false}
            />
            <div className='Panel_Container_Card Panel_Container_Card-TwoCards'>
                <div>
                    <Icon28PictureOutline width={36} height={36}/>
                    <div className='Panel_Container_Card-Text'>
                        <h2>Отгаданные работы</h2>
                        <p>{guessedPictures > 0 ? `Вы отгадали${guessedPictures > 1 ? ' целых' : ''} ${decOfNum(guessedPictures, ['картину', 'картины', 'картин'])}! Так держать, Шерлок` : 'Вы ещё не угадали ни одну картину'}</p>
                    </div>
                </div>
                <div style={gamesAsWinner.length === 0 ? {display: 'none'} : {}}>
                    <div className='MiniCards'>
                        {
                            gamesAsWinner.map((value, index) =>
                                <div
                                    className='MiniCard'
                                    key={`Card-${index}`}
                                    onClick={async () => {
                                        await t.setState({
                                            like_currentPictureSelected_: index,
                                            like_currentPictureSelected: index,
                                            like_method: 'games.getByWinnerId',
                                            like_param: 'gamesAsWinner',
                                            like_user_id: t.state.vk_user.id,
                                            scrollPosition: document.body.scrollTop
                                        });
                                        t.go('picture_info');
                                    }}
                                >
                                    <img alt='img' src={value['Picture.url']}/>
                                </div>
                            )
                        }
                        {
                            spinner &&
                            <div className='MiniCard'>
                                <Spinner size='small'/>
                            </div>
                        }
                        <div ref={ref => this.loadingRef = ref} className='LoadingRef'/>
                    </div>
                </div>
            </div>
        </React.Fragment>
    }

}

GuessedPictures.defaultProps = {};

GuessedPictures.propTypes = {
    t: PropTypes.object
};

export default GuessedPictures;