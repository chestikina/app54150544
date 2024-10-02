import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../../../css/ClickerBattle/persons/Person.css';
import {getRandomInt} from "../../../js/utils";

let
    mainInterval, subInterval
;

export class Person extends PureComponent {

    constructor(props) {
        super(props);

        const
            {name, width, height, showAnimation, onClick, getRef} = props,
            skin = props.skin ? props.skin : 'standart',
            defaultPerson = <img
                {...props}
                className={'Person ' + name}
                src={require(`./png/${name}=${skin}.png`)}
                width={width} height={height}
                alt='Person'
                onClick={(e) => onClick(e)}
                ref={(e) => getRef(e)}
            />
        ;

        this.defaultPerson = defaultPerson;
        this.state = {
            person: defaultPerson
        };
        this.doAnimation = this.doAnimation.bind(this);

        if (showAnimation) {
            setTimeout(() => {
                this.componentWillUnmount = () => {
                    clearInterval(mainInterval);
                    clearInterval(subInterval);
                };
            }, 5000);

            const
                chances = {
                    whisper: 60,
                    atlas: 15,
                    hr: 20,
                    crypto: 100,
                    imposter: 15,
                    leon: 5
                },
                currentChance = chances[name]
            ;

            mainInterval = setInterval(() => {
                if (getRandomInt(1, 100) <= currentChance) {
                    this.doAnimation(name);
                }
            }, 400);
        }

    }

    doAnimation(name) {
        const
            {state} = this,
            {used} = state
        ;

        return {
            whisper: () => {
                this.setState({used: !used});
                if (used) {
                    this.setState({person: this.defaultPerson});
                } else {
                    this.setState({
                        person: React.cloneElement(this.defaultPerson, {
                            style: {
                                transform: `translateX(${getRandomInt(-40, 40)}px)`
                            }
                        })
                    });
                }
            },
            atlas: () => {
                this.setState({used: !used});
                if (used) {
                    this.setState({person: this.defaultPerson});
                } else {
                    const isOnlickFirst = getRandomInt(0, 1) === 0;
                    this.setState({
                        person: <div style={{display: 'flex'}}>
                            {React.cloneElement(this.defaultPerson, {
                                    ...isOnlickFirst === false ? {
                                        onClick: () => {
                                        }
                                    } : {},
                                    style: {
                                        transform: 'translateX(60px) scale(0.6)',
                                        transformOrigin: 'bottom'
                                    }
                                }
                            )}
                            {React.cloneElement(this.defaultPerson, {
                                    ...isOnlickFirst ? {
                                        onClick: () => {
                                        }
                                    } : {},
                                    style: {
                                        transform: 'translateX(-60px) scale(0.6)',
                                        transformOrigin: 'bottom'
                                    }
                                }
                            )}
                        </div>
                    });
                }
            },
            hr: () => {
                this.setState({used: !used});
                if (used) {
                    this.setState({person: this.defaultPerson});
                } else {
                    this.setState({
                        person: React.cloneElement(this.defaultPerson, {
                            className: 'HR__Jump'
                        })
                    });
                }
            },
            crypto: () => {
                if (!used) {
                    this.setState({used: !used});
                    clearInterval(mainInterval);
                    subInterval = setInterval(() => {
                        const
                            allClicks = getRandomInt(50, 120),
                            clicks1 = getRandomInt(50, 120),
                            clicks2 = getRandomInt(50, 120)
                        ;

                        try {
                            if (document.getElementById('GamePlayerClicks').innerText === '-')
                                return;
                            document.getElementById('GamePlayerClicks').innerText = `${clicks1} - ${clicks2}`;
                            document.getElementById('GameAllClicks').innerText = `из ${allClicks}`;
                        } catch (e) {
                        }
                    }, 100);
                }
            },
            imposter: () => {
                if (!used) {
                    this.setState({
                        used: !used,
                        person: React.cloneElement(this.defaultPerson, {
                            className: 'Imposter__JumpHide'
                        })
                    });
                    setTimeout(() => {
                        this.setState({
                            person: React.cloneElement(this.defaultPerson, {
                                style: {
                                    opacity: 0,
                                    pointerEvents: 'none'
                                }
                            })
                        });
                        setTimeout(() => {
                            this.setState({
                                person: React.cloneElement(this.defaultPerson, {
                                    className: 'Imposter__JumpUp'
                                })
                            });
                            setTimeout(() => this.setState({used, person: this.defaultPerson}), 1000);
                        }, 900);
                    }, 900);
                }
            },
            leon: () => {
                if (!used) {
                    this.setState({
                        used: !used,
                        person: <React.Fragment>
                            <div className='leon_particles'/>
                            {React.cloneElement(this.defaultPerson, {
                                className: 'Leon__Hide'
                            })}
                        </React.Fragment>
                    });
                    setTimeout(() => {
                        this.setState({
                            person: React.cloneElement(this.defaultPerson, {
                                style: {
                                    opacity: .2,
                                    pointerEvents: 'none'
                                }
                            })
                        });
                        setTimeout(() => {
                            this.setState({
                                person: React.cloneElement(this.defaultPerson, {
                                    className: 'Leon__Show'
                                })
                            });
                            setTimeout(() => this.setState({used, person: this.defaultPerson}), 1000);
                        }, 2000);
                    }, 900);
                }
            }
        }[name]();
    }

    render() {
        const
            {person} = this.state
        ;
        return person;
    }
}

Person.defaultProps = {
    skin: 'standart',
    width: 237.05,
    height: 275,
    onClick: () => {
    },
    getRef: () => {
    }
};

Person.propTypes = {
    name: PropTypes.string.isRequired,
    skin: PropTypes.any,
    width: PropTypes.number,
    height: PropTypes.number,
    showAnimation: PropTypes.bool,
    onClick: PropTypes.func,
    getRef: PropTypes.func
};

export default Person;