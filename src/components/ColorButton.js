import React, {PureComponent} from 'react';
import {Tappable} from '@vkontakte/vkui';

export class ColorButton extends PureComponent {

    render() {
        let color = this.props.color;
        let background_color = 'rgba' + color.substring(color.indexOf('('), color.indexOf(')')) + ',0.12)';
        return (
            <Tappable style={{borderRadius: '14px', marginBottom: '10px'}} onClick={this.props.onClick}>
                <div style={{
                    fontFamily: 'SF Pro Text',
                    backgroundColor: background_color,
                    color,
                    padding: '17px 18px',
                    borderRadius: '14px',
                    fontWeight: '600',
                    fontSize: this.props.description ? '16px' : '20px',
                    lineHeight: '20px',
                    backgroundPosition: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <span style={{position: 'relative', zIndex: '2'}}>{this.props.children}</span>
                    <div style={{
                        opacity: 0.5,
                        zIndex: '1',
                        position: 'absolute',
                        width: '56px',
                        height: '56px',
                        right: '19px',
                        bottom: '-14px',
                        color
                    }}>
                        <div style={{
                            position:'absolute',
                            right: '0',
                            bottom: '0',
                        }}>{this.props.icon}</div>
                    </div>
                </div>
            </Tappable>
        )
    }

}