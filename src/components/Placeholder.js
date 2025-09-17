import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import '../css/Placeholder.css';
import '../css/App.css';
import {Avatar, Input, Placeholder} from "@vkontakte/vkui";
import Icon38Message from "../assets/icons_track/Icon38Message.svg";

export class CustomPlaceholder extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            inputValue: ''
        }
    }

    componentDidMount() {
        this.input__.addEventListener('keyup', function (event) {
            if (event.keyCode === 13) {
                if (this.state.inputValue.length > 0) {
                    event.preventDefault();
                    document.getElementById('ph-submit').click();
                }
            }
        }.bind(this));
    }

    render() {
        return (
            false ?
                <div className='placeholder'>
                    <div className='top'>
                        <span className='description'>{this.props.description}</span>
                        <span className='title'>
                            <img src={this.props.topIcon}/>
                            <span className='text'>{this.props.title}</span>
                        </span>
                    </div>
                    <div className='bottom' style={{display: this.state.inputValue.length !== 0 && 'flex'}}>
                        <Input getRef={(ref) => {
                            this.input__ = ref;
                        }}
                               style={{}}
                               placeholder={this.props.inputPlaceholder}
                               onChange={async (e) => {
                                   this.setState({inputValue: e.currentTarget.value});
                                   await this.props.inputOnChange(e);
                               }}/>
                        {
                            this.state.inputValue.length > 0 &&
                            <div className='btn animated-loading'>
                                <img src={this.props.btnIcon} onClick={async (e) => {
                                    let target = e.currentTarget,
                                        body = document.body;
                                    body.style.pointerEvents = 'none';
                                    this.input__.disabled = true;

                                    if (this.props.btnIconLoading.length > 0) target.src = this.props.btnIconLoading;
                                    await this.props.btnOnClick(e, this.input__);
                                    if (this.props.btnIconLoading.length > 0) target.src = this.props.btnIcon;

                                    body.style.pointerEvents = 'auto';
                                    this.input__.disabled = false;
                                }}/>
                            </div>
                        }
                    </div>
                </div>
                :
                <Placeholder
                    className={'simple_placeholder'}
                    stretched
                    header={this.props.title}
                    icon={<img src={this.props.topIcon}/>}
                >
                    {this.props.description}
                    <div className='bottom' style={{display: this.state.inputValue.length !== 0 && 'flex'}}>
                        <Input maxlength={this.props.inputMaxLength} getRef={(ref) => {
                            this.input__ = ref;
                        }}
                               placeholder={this.props.inputPlaceholder}
                               onChange={async () => {
                                   this.setState({inputValue: this.input__.value});
                                   await this.props.inputOnChange(this.input__);
                               }}/>
                        {
                            this.state.inputValue.length > 0 &&
                            <div className='btn animated-loading'>
                                <img src={this.props.btnIcon} id='ph-submit' onClick={async (e) => {
                                    let target = e.currentTarget,
                                        body = document.body;
                                    body.style.pointerEvents = 'none';
                                    this.input__.disabled = true;

                                    if (this.props.btnIconLoading.length > 0) target.src = this.props.btnIconLoading;
                                    await this.props.btnOnClick(e, this.input__);
                                    if (this.props.btnIconLoading.length > 0) target.src = this.props.btnIcon;

                                    body.style.pointerEvents = 'auto';
                                    this.input__.disabled = false;
                                }}/>
                            </div>
                        }
                    </div>
                </Placeholder>
        )
    }
}

CustomPlaceholder.defaultProps = {
    btnIconLoading: '',
    btnOnClick: (e) => {
    },
    inputOnChange: (e) => {
    }
};

CustomPlaceholder.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    topIcon: PropTypes.string,
    btnIcon: PropTypes.string,
    btnIconLoading: PropTypes.string,
    inputPlaceholder: PropTypes.string,
    inputOnChange: PropTypes.func,
    btnOnClick: PropTypes.func,
    inputMaxLength: PropTypes.number
};

export default CustomPlaceholder;