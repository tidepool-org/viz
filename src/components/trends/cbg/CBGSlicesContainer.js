import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

import { THIRTY_MINS } from '../../../utils/datetime';
import { mungeBGDataBins } from '../../../utils/bloodglucose';
import CBGMedianAnimated from './CBGMedianAnimated';
import CBGSliceAnimated from './CBGSliceAnimated';

export default class CBGSlicesContainer extends PureComponent {
  static propTypes = {
    bgBounds: PropTypes.shape({
      veryHighThreshold: PropTypes.number.isRequired,
      targetUpperBound: PropTypes.number.isRequired,
      targetLowerBound: PropTypes.number.isRequired,
      veryLowThreshold: PropTypes.number.isRequired,
    }).isRequired,
    bgUnits: PropTypes.string.isRequired,
    binSize: PropTypes.number.isRequired,
    sliceWidth: PropTypes.number.isRequired,
    data: PropTypes.arrayOf(PropTypes.shape({
      // here only documenting the properties we actually use rather than the *whole* data model!
      id: PropTypes.string.isRequired,
      msPer24: PropTypes.number.isRequired,
      value: PropTypes.number.isRequired,
    })).isRequired,
    displayFlags: PropTypes.shape({
      cbg100Enabled: PropTypes.bool.isRequired,
      cbg80Enabled: PropTypes.bool.isRequired,
      cbg50Enabled: PropTypes.bool.isRequired,
      cbgMedianEnabled: PropTypes.bool.isRequired,
    }).isRequired,
    focusCbgSlice: PropTypes.func.isRequired,
    unfocusCbgSlice: PropTypes.func.isRequired,
    showingCbgDateTraces: PropTypes.bool.isRequired,
    tooltipLeftThreshold: PropTypes.number.isRequired,
    topMargin: PropTypes.number.isRequired,
    xScale: PropTypes.func.isRequired,
    yScale: PropTypes.func.isRequired,
  };

  static defaultProps = {
    binSize: THIRTY_MINS,
    sliceWidth: 16,
  };

  constructor(props) {
    super(props);
    this.state = {
      mungedData: [],
    };
  }

  UNSAFE_componentWillMount() {
    const { binSize, data } = this.props;
    this.setState({ mungedData: mungeBGDataBins('cbg', binSize, data) });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { binSize, data } = nextProps;
    if (binSize !== this.props.binSize || data !== this.props.data) {
      this.setState({ mungedData: mungeBGDataBins('cbg', binSize, data) });
    }
  }

  render() {
    const { mungedData } = this.state;
    const { xScale, yScale, sliceWidth } = this.props;

    return (
      <g id="cbgSlices">
        {_.map(mungedData, (bin) => (
          <g id={`cbgBin-${bin.id}`} key={bin.id}>
            <CBGSliceAnimated
              bgBounds={this.props.bgBounds}
              datum={bin}
              displayFlags={this.props.displayFlags}
              focusCbgSlice={this.props.focusCbgSlice}
              unfocusCbgSlice={this.props.unfocusCbgSlice}
              showingCbgDateTraces={this.props.showingCbgDateTraces}
              tooltipLeftThreshold={this.props.tooltipLeftThreshold}
              topMargin={this.props.topMargin}
              xScale={xScale}
              yScale={yScale}
              sliceWidth={sliceWidth}
            />
            <CBGMedianAnimated
              bgBounds={this.props.bgBounds}
              bgUnits={this.props.bgUnits}
              datum={bin}
              displayingMedian={this.props.displayFlags.cbgMedianEnabled}
              showingCbgDateTraces={this.props.showingCbgDateTraces}
              xScale={xScale}
              yScale={yScale}
              sliceWidth={sliceWidth}
            />
          </g>
        ))}
      </g>
    );
  }
}
