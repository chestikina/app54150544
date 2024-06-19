import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/BattleStat/GameInfo.css';
import {shortIntegers} from "../../js/utils";
import {Button} from "@vkontakte/vkui";
import {Icon24Play} from "@vkontakte/icons";

export class GameInfo extends PureComponent {

    render() {
        const
            {game, onWatchClick} = this.props,
            {player1, photo1, player2, photo2, clicks1, clicks2, name1, name2, kps1, kps2, endTime, startTime, id} = game
        ;

        return (
            <div className='GameInfo'>
                <div className='GameInfo_Top'>
                    <a target='_blank' href={'https://vk.com/id' + player1}>
                        <img width={78} height={78} className='Avatar' src={photo1} alt='avatar'/>
                    </a>
                    <span>{clicks1} - {clicks2}</span>
                    <a target='_blank' href={'https://vk.com/id' + player2}>
                        <img width={78} height={78} className='Avatar' src={photo2} alt='avatar'/>
                    </a>
                </div>
                <div className='GameInfo_Bottom'>
                    <div>
                        <div>{name1.split(' ')[0]}</div>
                        <div>
                            <div style={{height: 12}}/>
                            <div>{kps1} кпс</div>
                            <div style={{height: 5}}/>
                            <div>Время игры:</div>
                            <div style={{height: 5}}/>
                            <div>ID:</div>
                        </div>
                    </div>
                    <div>
                        <div>{name2.split(' ')[0]}</div>
                        <div>
                            <div style={{height: 12}}/>
                            <div>{kps2} кпс</div>
                            <div style={{height: 5}}/>
                            <div>{shortIntegers(endTime - startTime)} мс</div>
                            <div style={{height: 5}}/>
                            <div>{shortIntegers(id)}</div>
                        </div>
                    </div>
                </div>
                <div style={{height: 42}}/>
                <Button onClick={onWatchClick} stretched mode='secondary' size='l' before={<Icon24Play/>}>Посмотреть игру</Button>
            </div>
        )
    }

}

GameInfo.defaultProps = {
    game: {},
    onWatchClick: () => {
    }
};

GameInfo.propTypes = {
    game: PropTypes.object,
    onWatchClick: PropTypes.func
};

export default GameInfo;