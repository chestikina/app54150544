import React from "react";
import {Avatar} from "@vkontakte/vkui";
import Card from "../components/Card";
import {ReactComponent as Icon28Play} from "../icons/play_28.svg";
import {ReactComponent as Icon28Chip} from "../icons/chip_28.svg";
import {isPlatformDesktop, shortIntegers} from "../../../js/utils";
import {Icon24HelpOutline, Icon28GiftOutline, Icon28StorefrontOutline, Icon28Users3Outline} from "@vkontakte/icons";

const isDesktop = isPlatformDesktop();

export default class Main extends React.PureComponent {
    render() {
        const {vk_user, t} = this.props;
        return (
            <div className={`Main ${isDesktop ? 'Main-desktop' : 'Main-mobile'}`}>
                <Avatar size={100} shadow={false} src={vk_user.photo_100}/>
                <span className='UserName'>{vk_user.first_name}</span>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    marginTop: 32
                }}>
                    <Card
                        mode='horizontal' style={{width: isDesktop && 329}}
                        onClick={() => t.go('game')}
                    >
                        <Icon28Play/>
                        <span>Играть</span>
                    </Card>
                    <div style={{
                        display: 'flex',
                        gap: 12
                    }}>
                        <Card mode='vertical' style={{width: '50%'}}>
                            <Icon28Chip/>
                            <span className='mCard-Title'>
                                Баланс
                                <br/>
                                <span className='mCard-Subtitle'>
                                    {shortIntegers(1000000)}
                                </span>
                            </span>
                        </Card>
                        <Card mode='vertical' style={{width: '50%'}}>
                            <Icon28Users3Outline/>
                            <span>
                                Рейтинг игроков
                            </span>
                        </Card>
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: 12
                    }}>
                        <Card mode='vertical' style={{width: '50%'}}>
                            <Icon28StorefrontOutline/>
                            <span>
                                Магазин
                            </span>
                        </Card>
                        <Card mode='vertical' style={{width: '50%'}}>
                            <Icon28GiftOutline/>
                            <span>
                                Бонус
                            </span>
                        </Card>
                    </div>
                </div>
                <div className='HelpButton' style={{marginTop: 24}}>
                    <Icon24HelpOutline/>
                    <span>Как играть?</span>
                </div>
            </div>
        );
    }
}