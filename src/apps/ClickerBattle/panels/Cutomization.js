import React, {PureComponent} from 'react';
import bridge from '@vkontakte/vk-bridge';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/panels/Customization.css';
import {CustomSelect, CustomSelectOption} from "@vkontakte/vkui";
import {ReactComponent as Lock} from "../../../assets/clickerbattle/bp_award_lock.svg";
import RadioOptions from "../../../components/ClickerBattle/RadioOptions";
import ChampionBanner from "../../../components/ClickerBattle/ChampionBanner";

export class Customization extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            selectedWindow: '1',
            selectedCursor: props.t.state.user.cursorChanged,
            selectedBanner: props.t.state.user.bannerChanged,
            selectedBannerStat: props.t.state.user.bannerStatChanged - 1,

            cursors: [],
            banners: [],
            bannersStat: []
        };

        props.t.updateCustomizationData();
    }

    render() {
        const
            {props, state} = this,
            {t} = props,
            {
                selectedWindow,
                selectedCursor, selectedBanner, selectedBannerStat
            } = state,
            {
                cursors, banners, bannersStat
            } = t.state
        ;

        return (
            <div className='Customization'>
                <div className='SlideTitle'>
                    Кастомизация
                </div>
                <CustomSelect
                    options={[{value: '1', label: 'Курсор'}, {value: '2', label: 'Баннер'}]}
                    value={selectedWindow}
                    onChange={(option) => this.setState({selectedWindow: option.target.value})}
                    renderOption={(props) => {
                        return (
                            <CustomSelectOption
                                {...props}
                            />
                        );
                    }}
                />
                {
                    selectedWindow === '1' ?
                        <React.Fragment>
                            <div className='Cursors'>
                                {
                                    cursors.map((value, i) => {
                                            const locked = t.state.user.cursors.indexOf(value.id) < 0;
                                            return <div key={`customization_div_${i}`} onClick={() => {
                                                if (!locked) {
                                                    t.client.emit('cursor.change', {cursor: value.id}, response => {
                                                        if (response.response) {
                                                            if (selectedCursor === value.id) {
                                                                this.setState({selectedCursor: -1});
                                                            } else {
                                                                this.setState({selectedCursor: value.id});
                                                            }
                                                        }
                                                    });
                                                }
                                            }}>
                                                {
                                                    locked && <Lock className='ItemLock'/>
                                                }
                                                {
                                                    value.id === selectedCursor && <div className='SelectedCursor'/>
                                                }
                                                <div style={{
                                                    opacity: locked && .05
                                                }}>
                                                    <img
                                                        src={require(`../../../assets/clickerbattle/cursors/${value.file_name}.svg`)}/>
                                                </div>
                                            </div>
                                        }
                                    )
                                }
                            </div>
                            <div className='SlideDescription'>
                                Курсоры отображаются во время кликов на арене. Получить их можно только из кейсов.
                            </div>
                        </React.Fragment>
                        :
                        <React.Fragment>
                            <RadioOptions
                                style={{margin: '8px 20px 0'}}
                                activeElement={selectedBannerStat}
                                options={bannersStat.map((value, index) => {
                                    return {
                                        value: value.text,
                                        locked: t.state.user.bannersStat.indexOf(value.id) < 0,
                                        id: value.id,
                                        index
                                    }
                                })}
                                onChange={bannerstat => {
                                    t.client.emit('bannerstat.change', {bannerstat: bannerstat.id}, response => {
                                        if (response.response) {
                                            this.setState({selectedBannerStat: bannerstat.index});
                                            t.setState({user: {...t.state.user, bannerStatChanged: bannerstat.id}});
                                            this.forceUpdate();
                                        }
                                    });
                                }}
                            />
                            <div className='Banners'>
                                {
                                    banners.map((value, i) => {
                                        const locked = t.state.user.banners.indexOf(value.id) < 0;
                                        return <React.Fragment>
                                            <div key={`customization_2_div_${i}`} style={{position: 'relative'}}>
                                                {
                                                    locked && <Lock className='ItemLock'/>
                                                }
                                                {value.id === selectedBanner &&
                                                <div className='SelectedBanner'/>}
                                                <ChampionBanner
                                                    t={t}
                                                    onClick={() => {
                                                        if (!locked) {
                                                            t.client.emit('banner.change', {banner: value.id}, response => {
                                                                if (response.response) {
                                                                    if (selectedBanner === value.id) {
                                                                        this.setState({selectedBanner: -1});
                                                                    } else {
                                                                        this.setState({selectedBanner: value.id});
                                                                    }
                                                                }
                                                            })
                                                        }
                                                    }}
                                                    style={{
                                                        marginBottom: 12,
                                                        opacity: locked && .05
                                                    }}
                                                    user={t.state.user}
                                                    user_id={t.state.user.id}
                                                    type={value.id}
                                                    stats_type={t.state.user.bannerStatChanged > -1 ? t.state.user.bannerStatChanged : 1}
                                                />
                                            </div>
                                            {i === banners.length - 1 &&
                                            <div style={{height: 24}}/>}
                                        </React.Fragment>
                                    })
                                }
                            </div>
                        </React.Fragment>
                }
            </div>
        )
    }
}

Customization.defaultProps = {};

Customization.propTypes = {
    t: PropTypes.object
};

export default Customization;