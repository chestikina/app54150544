import React, {PureComponent} from 'react';
import '../../css/BattleStat/GamesHistory.css';

export class GamesHistory extends PureComponent {

    render() {
        return (
            <div className='GamesHistory'>
                {this.props.children}
            </div>
        )
    }

}

export default GamesHistory;