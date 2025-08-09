import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

import { THREE_HRS } from '../../../utils/datetime';
import { mungeBGDataBins } from '../../../utils/bloodglucose';

export default class SMBGRangeAvgContainer extends PureComponent {
  static propTypes = {
    bgBounds: PropTypes.shape({
      veryHighThreshold: PropTypes.number,
      targetUpperBound: PropTypes.number.isRequired,
      targetLowerBound: PropTypes.number.isRequired,
      veryLowThreshold: PropTypes.number,
    }).isRequired,
    bgUnits: PropTypes.string.isRequired,
    binSize: PropTypes.number.isRequired,
    data: PropTypes.arrayOf(PropTypes.shape({
      // here only documenting the properties we actually use rather than the *whole* data model!
      id: PropTypes.string.isRequired,
      msPer24: PropTypes.number.isRequired,
      value: PropTypes.number.isRequired,
    })).isRequired,
    smbgComponent: PropTypes.func.isRequired,
    someSmbgDataIsFocused: PropTypes.bool.isRequired,
    tooltipLeftThreshold: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    focusSmbgRange: PropTypes.func.isRequired,
    unfocusSmbgRange: PropTypes.func.isRequired,
    xScale: PropTypes.func.isRequired,
    yScale: PropTypes.func.isRequired,
  };

  static defaultProps = {
    binSize: THREE_HRS,
    width: 108,
  };

  UNSAFE_componentWillMount() {
    const { binSize, data } = this.props;
    this.setState({ mungedData: mungeBGDataBins('smbg', binSize, data) });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { binSize, data } = nextProps;
    if (binSize !== this.props.binSize || data !== this.props.data) {
      this.setState({ mungedData: mungeBGDataBins('smbg', binSize, data) });
    }
  }

  render() {
    const { mungedData } = this.state;
    const { smbgComponent: SMBGComponent, width } = this.props;

    return (
      <g className="smbgAggContainer">
        {_.map(mungedData, (datum) => (
          <SMBGComponent
            bgBounds={this.props.bgBounds}
            bgUnits={this.props.bgUnits}
            datum={datum}
            focusSmbgRange={this.props.focusSmbgRange}
            unfocusSmbgRange={this.props.unfocusSmbgRange}
            key={datum.id}
            someSmbgDataIsFocused={this.props.someSmbgDataIsFocused}
            tooltipLeftThreshold={this.props.tooltipLeftThreshold}
            xScale={this.props.xScale}
            yScale={this.props.yScale}
            width={width}
          />
        ))}
      </g>
    );
  }
}
