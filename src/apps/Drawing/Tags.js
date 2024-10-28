import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    PanelHeader,
    PanelHeaderBack, ScreenSpinner, Checkbox
} from "@vkontakte/vkui";
import {
    isPlatformDesktop, toBlob
} from "../../js/utils";
import {
    Icon28DonateOutline
} from "@vkontakte/icons";
import bridge from "@vkontakte/vk-bridge";

let timeoutSave;

export class Tags extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            active_tags: props.t.state.user.active_tags || []
        }

        this.selectTag = this.selectTag.bind(this);
    }

    async selectTag(value) {
        const {t} = this.props;
        const {active_tags} = this.state;
        const {user} = t.state;
        const maxTags = t.privilege ? 5 : 3;

        if (user[value]) {
            if (active_tags.indexOf(value) > -1) {
                active_tags.splice(active_tags.indexOf(value), 1);
            } else {
                active_tags.push(value);
            }
            if (active_tags.length > maxTags) {
                active_tags.splice(active_tags.length - 2, 1);
            }
            console.log({active_tags});
            clearTimeout(timeoutSave);
            timeoutSave = setTimeout(() => {
                t.socket.call('users.saveTags', {tags: active_tags}, r => console.log(r));
            }, 2000);
            user.active_tags = active_tags;
            t.setState({user});
            await this.setState({active_tags});
            this.forceUpdate();
        } else {
            t.setSnackbar('У вас нет этой метки.');
        }
    }

    render() {
        const
            {t} = this.props,
            {_tags} = t,
            {active_tags} = this.state,
            {user} = t.state,
            maxTags = t.privilege ? 5 : 3
        ;

        return (
            <React.Fragment>
                <PanelHeader
                    left={<PanelHeaderBack onClick={t.back}/>}
                    separator={false}
                />
                <div
                    className={`Panel_Container_Card Panel_Container_Card-ManyCards`}>
                    <div>
                        <Icon28DonateOutline width={36} height={36}/>
                        <div className='Panel_Container_Card-Text'>
                            <h2>Метки</h2>
                            <p>Выберите {maxTags === 3 ? 'три метки' : 'пять меток'}, которые будут отображаться в вашем
                                профиле</p>
                        </div>
                        <div className='Panel_Container_Card-Buttons'>
                            <Button
                                stretched
                                size='m'
                                mode='gradient_gray'
                                onClick={async () => {
                                    await t.showOnboard('tag');
                                }}
                            >
                                Что это и зачем?
                            </Button>
                        </div>
                    </div>
                    {
                        _tags().map((value, index) =>
                            <div
                                key={`tag-${index}`}
                                onClick={() => this.selectTag(value[0])}
                            >
                                {value[1]}
                                <div>
                                    <h1>{value[2]}</h1>
                                    <p>{value[3]}</p>
                                </div>
                                <Checkbox
                                    disabled={!user[value[0]]}
                                    checked={active_tags.indexOf(value[0]) > -1}
                                    onClick={() => this.selectTag(value[0])}
                                />
                            </div>
                        )
                    }
                </div>
            </React.Fragment>
        )
    }

}

Tags.defaultProps = {};

Tags.propTypes = {
    t: PropTypes.object
};

export default Tags;