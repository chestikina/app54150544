import React, {PureComponent} from 'react';
import bridge from '@vkontakte/vk-bridge';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/panels/GameHistory.css';
import {Avatar} from "@vkontakte/vkui";
import Button from "../../../components/ClickerBattle/Button";
import {
    getVKUsers, vk_local_users
} from '../../../js/drawerapp/utils';

export class GameHistory extends PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            history: [],
            canGetHistory: true
        };

        this.t = props.t;
        this.updateHistory();
    }

    updateHistory() {
        this.t.client.emit('games.getHistory', {offset: this.state.history.length}, async response => {
            const ids = await new Promise(resolve => {
                const ret = [];
                for (const item of response.response) {
                    ret.push(item.player1);
                    ret.push(item.player2);
                }
                resolve(ret);
            });
            await getVKUsers(ids);
            this.setState({
                history: [...this.state.history, ...response.response],
                canGetHistory: response.response.length === 20
            });
        })
    }

    render() {
        const
            {props, state} = this,
            {t} = props,
            {history, canGetHistory} = state
        ;

        return (
            <div className='GameHistory'>
                <div className='SlideTitle'>
                    История игр
                </div>
                <div className='GameCards'>
                    {
                        history.map((value, index) =>
                            <div className='GameCard' key={'game_' + index}>
                                <div>
                                    <div>
                                        <Avatar shadow={false} size={40} src={vk_local_users[value.player1].photo_100}/>
                                        <div>{value.clicks1}</div>
                                    </div>
                                    <div>
                                        <Avatar shadow={false} size={40} src={vk_local_users[value.player2].photo_100}/>
                                        <div>{value.clicks2}</div>
                                    </div>
                                </div>
                                <div>
                                    {new Date(value.endTime).toLocaleString('ru', {
                                        day: 'numeric',
                                        month: 'long'
                                    })}
                                </div>
                            </div>
                        )
                    }
                </div>
                {
                    (history.length > 0 && canGetHistory) &&
                    <Button
                        onClick={() => this.updateHistory()}
                        style={{background: 'none', padding: '12px 0'}}>Посмотреть ещё</Button>
                }
            </div>
        )
    }
}

GameHistory.defaultProps = {};

GameHistory.propTypes = {
    t: PropTypes.object
};

export default GameHistory;