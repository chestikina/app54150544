import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Banner,
    Button, Div,
    Input,
    PanelHeader,
    PanelHeaderBack,
    ScreenSpinner, SegmentedControl, SimpleCell,
    Switch
} from "@vkontakte/vkui";
import {
    isPlatformDesktop
} from "../../js/utils";

const
    isDesktop = isPlatformDesktop()
;

export class FriendLobbySettings extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            friend_lobby: {...props.friend_lobby}
        };
    }

    render() {
        const
            {t} = this.props,
            {socket} = t,
            {user} = t.state,
            {friend_lobby} = this.state
        ;

        return (
            <React.Fragment>
                <PanelHeader
                    left={<PanelHeaderBack onClick={t.back}/>}
                    separator={false}
                >
                    {
                        isDesktop && 'Настройки лобби'
                    }
                </PanelHeader>
                <div className='FriendLobbySettings'>
                    {
                        !isDesktop && <h2 style={{textAlign: 'left', marginLeft: 28}}>Настройки лобби</h2>
                    }
                    <Banner
                        header='Информация'
                        subheader='Если вы вводите своё слово для игры, то сохранить рисунок не получится. Так же, если вы задаёте своё слово, то вы автоматически становитесь художником в игре.'
                    />
                    <Div style={{paddingBottom: 24}}>
                        <div className='Span'>
                            Видимость лобби
                        </div>
                        <SegmentedControl
                            style={{marginTop: 8}}
                            value={friend_lobby.friendsOnly ? 'private' : 'public'}
                            onChange={value => {
                                console.log(value);
                                friend_lobby.friendsOnly = value === 'private';
                                this.setState({friend_lobby});
                                this.forceUpdate();
                            }}
                            options={[{label: 'Для всех', value: 'public'},
                                {label: 'Для друзей', value: 'private'}]}
                        />
                        <div className='Span' style={{marginTop: 8}}>
                            Таймаут игры
                        </div>
                        <SegmentedControl
                            style={{marginTop: 8}}
                            value={friend_lobby.timeout}
                            onChange={value => {
                                friend_lobby.timeout = value;
                                this.setState({friend_lobby});
                                this.forceUpdate();
                            }}
                            options={[{label: '90 сек', value: 90},
                                {label: '10 мин', value: 600}]}
                        />
                        <SimpleCell
                            style={{marginTop: 8}}
                            Component='label'
                            after={<Switch
                                getRef={ref => this.saveGame = ref}
                                checked={friend_lobby.saveGame}
                                onChange={e => {
                                    friend_lobby.saveGame = e.currentTarget.checked;
                                    if (friend_lobby.saveGame) {
                                        friend_lobby.setCustomWord = false;
                                        this.setCustomWord.checked = false;
                                    }

                                    this.setState({friend_lobby});
                                    this.forceUpdate();
                                }}
                            />}
                        >
                            Сохранить рисунок
                        </SimpleCell>
                        <SimpleCell
                            Component='label'
                            after={<Switch
                                getRef={ref => this.setCustomWord = ref}
                                checked={friend_lobby.setCustomWord}
                                onChange={e => {
                                    friend_lobby.setCustomWord = e.currentTarget.checked;
                                    if (friend_lobby.setCustomWord) {
                                        friend_lobby.saveGame = false;
                                        this.saveGame.checked = false;
                                    }

                                    this.setState({friend_lobby});
                                    this.forceUpdate();
                                }}
                            />}
                        >
                            Задать своё слово
                        </SimpleCell>
                        {
                            friend_lobby.setCustomWord &&
                            <React.Fragment>
                                <div className='Span' style={{marginTop: 8}}>
                                    Слово
                                </div>
                                <Input
                                    style={{marginTop: 8}}
                                    placeholder='Крокодил'
                                    defaultValue={friend_lobby.customWord || ''}
                                    onChange={e => {
                                        friend_lobby.customWord = e.currentTarget.value;
                                        this.setState({friend_lobby});
                                    }}
                                />
                            </React.Fragment>
                        }
                        {
                            (user.premium || user.admin) &&
                            <React.Fragment>
                                <div className='Span' style={{marginTop: 8}}>
                                    Максимальное кол-во игроков
                                </div>
                                <Input
                                    style={{marginTop: 8}}
                                    placeholder='Число (макс 500)' type='number' min={2} max={500}
                                    defaultValue={friend_lobby.maxPlayers || 20}
                                    onChange={e => {
                                        friend_lobby.maxPlayers = parseInt(e.currentTarget.value);
                                        this.setState({friend_lobby});
                                    }}/>
                            </React.Fragment>
                        }
                        <Button
                            style={{
                                marginTop: 18, width: '100%'
                            }}
                            size='m' mode='gradient_blue' stretched
                            onClick={async () => {
                                this.props.t.setPopout(<ScreenSpinner/>);
                                const
                                    {
                                        friendsOnly,
                                        timeout,
                                        saveGame,
                                        setCustomWord,
                                        customWord,
                                        maxPlayers
                                    } = friend_lobby
                                ;
                                socket.call('friends.saveSettings', {
                                    friendsOnly,
                                    timeout,
                                    saveGame,
                                    setCustomWord,
                                    customWord,
                                    maxPlayers
                                }, r => {
                                    if (r.response) {
                                        t.setState({friend_lobby: r.response});
                                    }
                                    t.setPopout(null);
                                    t.back();
                                });
                            }}
                        >
                            Сохранить
                        </Button>
                    </Div>
                </div>
            </React.Fragment>
        )
    }
}

FriendLobbySettings.defaultProps = {};

FriendLobbySettings.propTypes = {
    t: PropTypes.object,
    friend_lobby: PropTypes.object
};

export default FriendLobbySettings;