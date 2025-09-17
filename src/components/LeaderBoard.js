import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../css/LeaderBoard.css';
import {Avatar, Tabs, TabsItem} from "@vkontakte/vkui";

export class LeaderBoard extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            tab: 0
        }
    }


    render() {
        const
            {tabs, users, onClick} = this.props,
            {tab} = this.state
        ;

        return (
            <div className='LeaderBoard'>
                <Tabs id='tabs'>
                    {
                        tabs.map((value, i) =>
                            <TabsItem
                                key={'lb_tb_' + i}
                                onClick={() => this.setState({tab: i})}
                                selected={tab === i}
                            >
                                {value}
                            </TabsItem>
                        )
                    }
                </Tabs>
                {
                    users.map((value, i) => {
                        return i === tab &&
                            value.map((user, number) =>
                                <div className='LeaderBoard_User' onClick={() => onClick(i, user, number)}>
                                    <div className='LeaderBoard_Number'>{number + 1}</div>
                                    <Avatar src={user.photo_200} size={48}/>
                                    <div style={{width: '3.2vw'}}/>
                                    <div>
                                        <div className='LeaderBoard_UserName'>
                                            {user.first_name} {user.last_name}
                                        </div>
                                        <div className='LeaderBoard_UserScore'>
                                            {user.score}
                                        </div>
                                    </div>
                                </div>
                            )
                    })
                }
            </div>
        )
    }
}

LeaderBoard.defaultProps = {
    onClick: (tab, value, i) => {
    }
};

LeaderBoard.propTypes = {
    tabs: PropTypes.array,
    users: PropTypes.array,
    onClick: PropTypes.func
};

export default LeaderBoard;