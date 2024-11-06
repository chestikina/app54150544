import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../css/ClickerBattle/ChampionBanner.css';
import {Avatar} from "@vkontakte/vkui";
import {ReactComponent as Stars} from "../../assets/clickerbattle/Stars.svg";
import {getVKUsers, shortIntegers} from "../../js/utils";

export class ChampionBanner extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
        };
        props.t.updateCustomizationData();
    }

    async componentDidMount() {
        const user = (await getVKUsers([this.props.user_id]))[0];
        this.setState({user})
    }

    bannerStandart(icon) {
        const
            {stats_type, t} = this.props,
            {user} = this.state,
            {bannersStat} = t.state,
            stat = bannersStat[bannersStat.findIndex(value => value.id === stats_type)],
            topChampionTitle = <svg width="161" height="18" viewBox="0 0 161 18" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                <path d="M18.3999 17.48L0.919922 0H160.08L142.6 17.48H18.3999Z" fill="white" fill-opacity="0.5"/>
                <path
                    d="M59.2815 4.3052V11.84H57.5473V9.3284C57.4038 9.40813 57.2483 9.47989 57.0809 9.54368C56.9374 9.59949 56.7659 9.64733 56.5666 9.6872C56.3673 9.72706 56.156 9.747 55.9327 9.747C55.5261 9.747 55.1553 9.68321 54.8204 9.55564C54.4935 9.42806 54.2105 9.24866 53.9713 9.01744C53.7401 8.77824 53.5607 8.49518 53.4331 8.16828C53.3055 7.8334 53.2417 7.46264 53.2417 7.056V4.3052H54.9759V6.9364C54.9759 7.7736 55.3945 8.1922 56.2317 8.1922C56.4151 8.1922 56.5825 8.17625 56.734 8.14436C56.8935 8.10449 57.033 8.06064 57.1526 8.0128C57.2962 7.96496 57.4277 7.90516 57.5473 7.8334V4.3052H59.2815ZM60.6478 4.3052H66.0298V5.9796H62.382V7.1756H65.7308V8.85H62.382V10.1656H66.1494V11.84H60.6478V4.3052ZM73.7269 4.3052H75.2817V11.84H73.5475V8.0726L71.8133 11.84H70.7369L69.0027 8.0726V11.84H67.2685V4.3052H68.8233L71.2751 9.6274L73.7269 4.3052ZM83.0442 4.3052V11.84H81.31V5.9796H78.3798V11.84H76.6456V4.3052H83.0442ZM86.1451 4.3052V8.7902L89.1949 4.3052H90.7497V11.84H89.0155V7.355L85.9657 11.84H84.4109V4.3052H86.1451ZM97.44 8.0726C97.44 7.76164 97.3882 7.4746 97.2845 7.21148C97.1809 6.94836 97.0373 6.72112 96.854 6.52976C96.6785 6.3384 96.4712 6.19089 96.232 6.08724C95.9928 5.97561 95.7377 5.9198 95.4666 5.9198C95.1955 5.9198 94.9404 5.97561 94.7012 6.08724C94.462 6.19089 94.2507 6.3384 94.0673 6.52976C93.8919 6.72112 93.7523 6.94836 93.6487 7.21148C93.545 7.4746 93.4932 7.76164 93.4932 8.0726C93.4932 8.38356 93.545 8.6706 93.6487 8.93372C93.7523 9.19684 93.8919 9.42408 94.0673 9.61544C94.2507 9.8068 94.462 9.95829 94.7012 10.0699C94.9404 10.1736 95.1955 10.2254 95.4666 10.2254C95.7377 10.2254 95.9928 10.1736 96.232 10.0699C96.4712 9.95829 96.6785 9.8068 96.854 9.61544C97.0373 9.42408 97.1809 9.19684 97.2845 8.93372C97.3882 8.6706 97.44 8.38356 97.44 8.0726ZM99.1742 8.0726C99.1742 8.61478 99.0745 9.1171 98.8752 9.57956C98.6838 10.042 98.4207 10.4486 98.0858 10.7995C97.751 11.1423 97.3563 11.4134 96.9018 11.6128C96.4553 11.8041 95.9769 11.8998 95.4666 11.8998C94.9563 11.8998 94.4739 11.8041 94.0194 11.6128C93.5729 11.4134 93.1822 11.1423 92.8474 10.7995C92.5125 10.4486 92.2454 10.042 92.046 9.57956C91.8547 9.1171 91.759 8.61478 91.759 8.0726C91.759 7.53838 91.8547 7.04005 92.046 6.5776C92.2454 6.10717 92.5125 5.70053 92.8474 5.35768C93.1822 5.00685 93.5729 4.73576 94.0194 4.5444C94.4739 4.34506 94.9563 4.2454 95.4666 4.2454C95.9769 4.2454 96.4553 4.34506 96.9018 4.5444C97.3563 4.73576 97.751 5.00685 98.0858 5.35768C98.4207 5.70053 98.6838 6.10717 98.8752 6.5776C99.0745 7.04005 99.1742 7.53838 99.1742 8.0726ZM106.514 4.3052V11.84H104.78V8.85H101.909V11.84H100.175V4.3052H101.909V7.1756H104.78V4.3052H106.514Z"
                    fill="white"/>
            </svg>
        ;

        return user && <React.Fragment>
            <div className='TopChampionTitle'>
                {topChampionTitle}
            </div>
            <div className='UserChampionContainer'>
                <Avatar src={user.photo_100} shadow={false} size={44}/>
                <div className='UserChampionText'>
                    <div>{user.first_name} {user.last_name}</div>
                    <div>{stat.text}: {shortIntegers(this.props.user[stat.key])}</div>
                </div>
            </div>
            <Stars className='ChampionStars'/>
            {icon && <div className='ChampionIconContainer'>
                <img src={icon}/>
            </div>}
        </React.Fragment>;
    }

    banners(type) {
        const
            banners = [
                (this.bannerStandart()),
                (this.bannerStandart(require('../../assets/clickerbattle/banners_icon/banner_1_icon.png'))),
                (this.bannerStandart(require('../../assets/clickerbattle/banners_icon/banner_2_icon.png'))),
                (this.bannerStandart(require('../../assets/clickerbattle/banners_icon/banner_3_icon.png'))),
                (this.bannerStandart(require('../../assets/clickerbattle/banners_icon/banner_4_icon.png'))),
                (this.bannerStandart(require('../../assets/clickerbattle/banners_icon/banner_5_icon.png'))),
                (this.bannerStandart(require('../../assets/clickerbattle/banners_icon/banner_6_icon.png'))),
                (this.bannerStandart(require('../../assets/clickerbattle/banners_icon/banner_7_icon.png'))),
            ];

        return banners[type];
    }

    render() {
        const
            {style, type, onClick, t} = this.props,
            {banners} = t.state,
            type_ = banners[banners.findIndex(value => value.id === type)].type
        ;

        return (
            <div
                className='ChampionBanner'
                style={style}
                type={type_}
                onClick={() => onClick()}
            >
                {this.banners(type_)}
            </div>
        )
    }
}

ChampionBanner.propTypes = {
    user_id: PropTypes.number.isRequired,
    user: PropTypes.object.isRequired,
    style: PropTypes.object,
    type: PropTypes.number.isRequired,
    stats_type: PropTypes.number.isRequired,
    onClick: PropTypes.func,
    t: PropTypes.object
};

export default ChampionBanner;