import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

import {ReactComponent as SVG} from "../../assets/clickerbattle/Background.svg";

export class Background extends PureComponent {

    render() {
        const {props} = this;
        return (
           <div className='Background' style={{
               opacity: props.arenaOpacity
           }}>
               <img className='Fog' style={{opacity: props.fogOpacity}} src={require('../../assets/clickerbattle/Fog.png')} alt='fog'/>
               {true ? <img src={require('../../assets/clickerbattle/Background.png')} /> : <SVG />}
           </div>
        )
    }
}

Background.defaultProps = {
    arenaOpacity: .5,
    fogOpacity: .15
};

Background.propTypes = {
    arenaOpacity: PropTypes.number,
    fogOpacity: PropTypes.number
};

export default Background;