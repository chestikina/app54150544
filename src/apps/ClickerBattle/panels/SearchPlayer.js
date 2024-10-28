import React, {PureComponent} from 'react';
import bridge from '@vkontakte/vk-bridge';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/panels/SearchPlayer.css';
import Background from "../../../components/ClickerBattle/Background";
import Person from "../../../assets/clickerbattle/persons/Person";
import {ReactComponent as Terra} from "../../../assets/clickerbattle/Terra.svg";
import Button from "../../../components/ClickerBattle/Button";
import Header from "../../../components/ClickerBattle/Header";

let counterInterval;

export class SearchPlayer extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            counter: 0
        };

        const {t} = props;
        t.client.emit('persons.get', {}, persons => {
            t.setState({persons: persons.response});
        });
    }

    componentDidMount() {
        counterInterval = setInterval(() =>
                this.setState({counter: this.state.counter < 3 ? this.state.counter + 1 : 0})
            , 500);
    }

    componentWillUnmount() {
        clearInterval(counterInterval);
    }

    render() {
        const
            {props} = this,
            {t} = props
        ;

        return (
            <div className='SearchPlayer'>
                <Header style={{height: '15.76vh', width: '100vw'}}/>
                <div className='PlayerContainer'>
                    <div className='SearchTitle'>
                        Подбираем соперника{new Array(this.state.counter).fill('.').join('')}
                    </div>
                    <div className='SearchDescription'>
                        {new Date().toLocaleString('ru', {hour: 'numeric', minute: 'numeric'})} · Онлайн: 3 игрока
                    </div>
                    <Person name={t.state.persons[t.state.user.activePerson].file_name}/>
                    <Terra className='Terra'/>
                </div>
                <Button style={{
                    height: '7.88vh', margin: '0 21px',
                    position: 'absolute',
                    bottom: '4.8vh',
                    pointerEvents: 'painted'
                }} onClick={() => {
                    t.client.emit('games.search', {}, action => {
                        if (action.response === 0) {
                            t.setState({activePanel: 'main'});
                        }
                    });
                }}>Отменить</Button>
                <Background arenaOpacity={.06} fogOpacity={.15}/>
            </div>
        )
    }
}

SearchPlayer.defaultProps = {};

SearchPlayer.propTypes = {
    t: PropTypes.object
};

export default SearchPlayer;