/* global document */

import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import _ from 'lodash';
import bows from 'bows';
import cx from 'classnames';
import { SizeMe } from 'react-sizeme';
import { VictoryBar, VictoryContainer } from 'victory';
import { Collapse } from 'react-collapse';

import { formatPercentage } from '../../../utils/format';
import { MGDL_UNITS, MGDL_CLAMP_TOP, MMOLL_CLAMP_TOP } from '../../../utils/constants';
import { statFormats, statTypes, formatDatum } from '../../../utils/stat';
import styles from './Stat.css';
import colors from '../../../styles/colors.css';
import { bgPrefsPropType } from '../../../propTypes';
import HoverBar from './HoverBar';
import HoverBarLabel from './HoverBarLabel';
import BgBar from './BgBar';
import BgBarLabel from './BgBarLabel';
import StatTooltip from '../tooltips/StatTooltip';
import StatLegend from './StatLegend';
import CollapseIconOpen from './assets/expand-more-24-px.svg';
import CollapseIconClose from './assets/chevron-right-24-px.svg';
import InfoIcon from './assets/info-outline-24-px.svg';
import InputGroup from '../controls/InputGroup';

const dataPathPropType = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.array,
]);

const datumPropType = PropTypes.shape({
  id: PropTypes.string,
  value: PropTypes.number.isRequired,
  title: PropTypes.string,
});

const statFormatPropType = PropTypes.oneOf(_.values(statFormats));

class Stat extends PureComponent {
  static propTypes = {
    alwaysShowTooltips: PropTypes.bool,
    alwaysShowSummary: PropTypes.bool,
    annotations: PropTypes.arrayOf(PropTypes.string),
    bgPrefs: bgPrefsPropType,
    categories: PropTypes.object,
    chartHeight: PropTypes.number,
    collapsible: PropTypes.bool,
    data: PropTypes.shape({
      data: PropTypes.arrayOf(datumPropType).isRequired,
      total: datumPropType,
      dataPaths: PropTypes.shape({
        input: dataPathPropType,
        output: dataPathPropType,
        summary: dataPathPropType,
        title: dataPathPropType,
      }),
    }).isRequired,
    dataFormat: PropTypes.shape({
      label: statFormatPropType,
      summary: statFormatPropType,
      title: statFormatPropType,
      tooltip: statFormatPropType,
      tooltipTitle: statFormatPropType,
    }).isRequired,
    emptyDataPlaceholder: PropTypes.string.isRequired,
    isDisabled: PropTypes.bool,
    isOpened: PropTypes.bool,
    legend: PropTypes.bool,
    muteOthersOnHover: PropTypes.bool,
    onInputChange: PropTypes.func,
    reverseLegendOrder: PropTypes.bool,
    title: PropTypes.string.isRequired,
    type: PropTypes.oneOf(_.keys(statTypes)),
  };

  static defaultProps = {
    alwaysShowSummary: false,
    alwaysShowTooltips: true,
    animate: true,
    bgPrefs: {},
    categories: {},
    chartHeight: 0,
    collapsible: false,
    emptyDataPlaceholder: '--',
    isDisabled: false,
    isOpened: true,
    legend: false,
    muteOthersOnHover: true,
    type: statTypes.simple,
  };

  static displayName = 'Stat';

  static getStateByType = (props, prevState) => {
    const {
      data,
      legend,
    } = props;

    let isOpened;
    let input;

    const state = {
      chartTitle: props.title,
      isDisabled: _.sum(_.map(data.data, d => _.get(d, 'deviation.value', d.value))) <= 0,
    };

    switch (props.type) {
      case 'input':
        input = _.get(props.data, props.data.dataPaths.input, {});
        isOpened = _.get(prevState, 'isOpened', props.isOpened);
        state.inputSuffix = _.get(prevState, 'inputSuffix', input.suffix);
        state.inputValue = _.get(prevState, 'inputValue', input.value);
        state.isCollapsible = props.collapsible;
        state.isOpened = isOpened;
        state.showFooter = isOpened;
        break;

      case 'barHorizontal':
        isOpened = _.get(prevState, 'isOpened', props.isOpened);
        state.isCollapsible = props.collapsible;
        state.isOpened = isOpened;
        state.hoveredDatumIndex = _.get(prevState, 'hoveredDatumIndex', -1);
        state.showFooter = legend && isOpened;
        break;

      case 'barBg':
        isOpened = _.get(prevState, 'isOpened', props.isOpened);
        state.isCollapsible = props.collapsible;
        state.isOpened = isOpened;
        break;

      case 'simple':
      default:
        state.isCollapsible = false;
        state.isOpened = false;
        state.showFooter = false;
        break;
    }

    return state;
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    return Stat.getStateByType(nextProps, prevState);
  }

  constructor(props) {
    super(props);
    this.log = bows('Stat');

    this.state = {};
    this.chartProps = this.getChartPropsByType(props);

    this.setStatRef = ref => {
      this.stat = ref;
    };

    this.setTooltipIconRef = ref => {
      this.tooltipIcon = ref;
    };
  }

  componentDidUpdate(prevProps) {
    this.chartProps = this.getChartPropsByType(prevProps);
  }

  renderChartTitle = () => {
    const isDatumHovered = this.state.hoveredDatumIndex >= 0;

    const titleData = isDatumHovered
      ? this.state.tooltipTitleData
      : this.getFormattedDataByKey('title');

    const titleDataValue = _.get(titleData, 'value');

    return (
      <div className={styles.chartTitle}>
        {this.state.chartTitle}
        {titleDataValue && titleDataValue !== this.props.emptyDataPlaceholder && (
          <span className={styles.chartTitleData}>
            (&nbsp;
            <span
              style={{
                color: colors[titleData.id] || colors.statDefault,
              }}
            >
              {titleData.value}
            </span>
            <span className={styles.chartTitleSuffix}>
              {titleData.suffix}
            </span>
            &nbsp;)
          </span>
        )}
        {this.props.annotations && !isDatumHovered && (
          <span
            className={styles.tooltipIcon}
          >
            <img
              src={InfoIcon}
              alt="Hover for more info"
              ref={this.setTooltipIconRef}
              onMouseOver={this.handleTooltipIconMouseOver}
              onMouseOut={this.handleTooltipIconMouseOut}
            />
          </span>
        )}
      </div>
    );
  };

  renderChartSummary = () => {
    const summaryData = this.getFormattedDataByKey('summary');
    const showSummary = this.props.alwaysShowSummary || !this.state.isOpened;
    const summaryDataValue = _.get(summaryData, 'value');

    return (
      <div className={styles.chartSummary}>
        {summaryDataValue && showSummary && (
          <div
            className={styles.summaryData}
            style={{
              color: colors[summaryData.id] || colors.statDefault,
            }}
          >
            <span className={styles.summaryValue}>
              {summaryData.value}
            </span>
            <span className={styles.summarySuffix}>
              {summaryData.suffix}
            </span>
          </div>
        )}

        {this.props.units && !this.state.showFooter && this.renderStatUnits()}

        {this.state.isCollapsible && (
          <div className={styles.chartCollapse}>
            <img
              src={this.state.isOpened ? CollapseIconOpen : CollapseIconClose}
              onClick={this.handleCollapse}
            />
          </div>
        )}
      </div>
    );
  };

  renderStatUnits = () => (
    <div className={styles.units}>
      {this.props.units}
    </div>
  );

  renderStatHeader = () => (
    <div className={styles.statHeader}>
      {this.renderChartTitle()}
      {this.renderChartSummary()}
    </div>
  );

  renderStatFooter = () => (
    <div className={styles.statFooter}>
      {this.props.type === statTypes.input && this.renderCalculatedOutput()}
      {this.props.legend && this.renderStatLegend()}
      {this.props.units && this.renderStatUnits()}
    </div>
  );

  renderStatLegend = () => {
    const items = _.map(
      this.props.data.data,
      datum => _.pick(datum, ['id', 'legendTitle'])
    );

    if (!this.props.reverseLegendOrder) {
      _.reverse(items);
    }

    return (
      <div className={styles.statLegend}>
        <StatLegend items={items} />
      </div>
    );
  };

  renderChart = size => {
    const { renderer: Renderer, ...chartProps } = this.chartProps;

    return (
      <Collapse
        isOpened={this.state.isOpened}
        springConfig={{ stiffness: 200, damping: 23 }}
      >
        <div className={styles.chartWrapper}>
          <Renderer {...chartProps} width={size.width || 298} />
        </div>
      </Collapse>
    );
  };

  renderInput = () => {
    const input = _.get(this.props.data, this.props.data.dataPaths.input);

    return (
      <div className={styles.inputWrapper}>
        <InputGroup
          {...input}
          onChange={this.handleInputChange}
          onSuffixChange={this.handleSuffixChange}
          suffix={this.state.inputSuffix}
          defaultValue={this.state.inputValue}
        />
      </div>
    );
  };

  renderCalculatedOutput = () => {
    const outputPath = _.get(this.props.data, 'dataPaths.output');
    const format = _.get(this.props.dataFormat, 'output');
    const output = _.get(this.props.data, outputPath);

    const calc = {
      result: {
        value: this.props.emptyDataPlaceholder,
      },
    };

    const label = _.get(output, 'label');

    const datum = {
      value: this.state.inputValue,
      suffix: _.get(this.state, 'inputSuffix.value.label', this.state.inputSuffix),
    };

    if (outputPath && output) {
      switch (output.type) {
        case 'divisor':
          calc.dividend = _.get(this.props.data, _.get(output, 'dataPaths.dividend'), {}).value;
          datum.value = calc.dividend / datum.value;
          calc.result = formatDatum(datum, format, this.props);
          break;

        default:
          calc.result = formatDatum(datum, format, this.props);
          break;
      }
    }

    const outputValueClasses = cx({
      [styles.outputValue]: true,
      [styles.outputValueDisabled]: calc.result.value === this.props.emptyDataPlaceholder,
    });

    return (
      <div className={styles.outputWrapper}>
        {label && <div className={styles.outputLabel}>{label}</div>}
        <div className={styles.outputValueWrapper}>
          <span className={outputValueClasses}>
            {calc.result.value}
          </span>
          <span className={styles.outputSuffix}>
            {calc.result.suffix}
          </span>
        </div>
      </div>
    );
  }

  renderTooltip = () => (
    <div className={styles.StatTooltipWrapper}>
      <StatTooltip
        annotations={this.props.annotations}
        offset={this.state.messageTooltipOffset}
        position={this.state.messageTooltipPosition}
        side={this.state.messageTooltipSide}
      />
    </div>
  );

  render = () => {
    const statClasses = cx({
      [styles.Stat]: true,
      [styles.isOpen]: this.state.isOpened,
    });

    return (
      <div className={styles.StatWrapper}>
        <div ref={this.setStatRef} className={statClasses}>
          {this.renderStatHeader()}
          {this.chartProps.renderer && (
            <div className={styles.statMain}>
              <SizeMe render={({ size }) => (this.renderChart(size))} />
            </div>
          )}
          {this.props.type === statTypes.input && this.renderInput()}
          {this.state.showFooter && this.renderStatFooter()}
        </div>
        {this.state.showMessages && this.renderTooltip()}
      </div>
    );
  };

  getDefaultChartProps = props => {
    const { chartHeight, animate } = props;

    return {
      animate: animate ? { duration: 300, onLoad: { duration: 0 } } : false,
      height: chartHeight,
      labels: d => formatPercentage(d.y),
      renderer: null,
      style: {
        data: {
          fill: d => colors[d.id] || colors.statDefault,
        },
      },
    };
  };

  getChartPropsByType = props => {
    const { type, data, bgPrefs: { bgUnits } } = props;

    let barWidth;
    let barSpacing;
    let domain;
    let height;
    let labelFontSize = 24;
    let chartLabelWidth = labelFontSize * 2.75;
    let padding;
    let total;

    const chartProps = this.getDefaultChartProps(props);

    switch (type) {
      case 'barBg':
        barWidth = 4;
        height = chartProps.height || barWidth * 6;

        domain = {
          x: [0, bgUnits === MGDL_UNITS ? MGDL_CLAMP_TOP : MMOLL_CLAMP_TOP],
          y: [0, 1],
        };

        padding = {
          top: 10,
          bottom: 10,
        };

        _.assign(chartProps, {
          alignment: 'middle',
          containerComponent: <VictoryContainer responsive={false} />,
          cornerRadius: { topLeft: 2, bottomLeft: 2, topRight: 2, bottomRight: 2 },
          data: _.map(data.data, (d, i) => ({
            x: i + 1,
            y: d.value,
            deviation: d.deviation,
            eventKey: i,
          })),
          dataComponent: (
            <BgBar
              barWidth={barWidth}
              bgPrefs={props.bgPrefs}
              chartLabelWidth={chartLabelWidth}
              domain={domain}
            />
          ),
          domain,
          height,
          horizontal: true,
          labelComponent: (
            <BgBarLabel
              barWidth={barWidth}
              bgPrefs={props.bgPrefs}
              domain={domain}
              text={(datum = {}) => {
                const datumRef = _.get(props.data, ['data', datum.eventKey]);
                const { value } = formatDatum(
                  _.get(datumRef, 'deviation', datumRef),
                  props.dataFormat.label,
                  props,
                );
                return `${value}`;
              }}
              tooltipText={(datum = {}) => {
                const { value, suffix } = formatDatum(
                  _.get(props.data, ['data', datum.eventKey]),
                  props.dataFormat.tooltip,
                  props,
                );
                return `${value}${suffix}`;
              }}
            />
          ),
          padding,
          renderer: VictoryBar,
          style: {
            data: {
              fill: datum => this.getDatumColor(datum),
              width: () => barWidth,
            },
            labels: {
              fill: datum => this.getDatumColor(_.assign({}, datum, formatDatum(
                _.get(props.data, ['data', datum.eventKey]),
                props.dataFormat.label,
                props,
              ))),
              fontSize: labelFontSize,
              fontWeight: 500,
              paddingLeft: chartLabelWidth,
            },
          },
        });
        break;

      case 'barHorizontal':
        barSpacing = 6;
        height = chartProps.height;
        total = _.get(data, 'total.value');

        if (height > 0) {
          barWidth = ((height - barSpacing) / props.data.data.length) - (barSpacing / 2);
          labelFontSize = _.min([barWidth * 0.833, labelFontSize]);
          chartLabelWidth = labelFontSize * 2.75;
        } else {
          barWidth = 30;
          height = (barWidth + barSpacing) * props.data.data.length;
        }

        domain = {
          x: [0, 1],
          y: [0, props.data.data.length],
        };

        padding = {
          top: barWidth / 2,
          bottom: barWidth / 2 * -1,
        };

        _.assign(chartProps, {
          alignment: 'middle',
          containerComponent: <VictoryContainer responsive={false} />,
          cornerRadius: { topLeft: 2, bottomLeft: 2, topRight: 2, bottomRight: 2 },
          data: _.map(data.data, (d, i) => ({
            x: i + 1,
            y: total > 0 ? d.value / total : d.value,
            id: d.id,
            eventKey: i,
          })),
          dataComponent: (
            <HoverBar
              barWidth={barWidth}
              barSpacing={barSpacing}
              chartLabelWidth={chartLabelWidth}
              domain={domain}
            />
          ),
          domain,
          events: [
            {
              target: 'data',
              eventHandlers: {
                onMouseOver: (event, target) => {
                  if (this.state.isDisabled || !props.dataFormat.tooltip) {
                    return {};
                  }

                  const datum = _.get(props.data, ['data', target.index], {});
                  datum.index = target.index;
                  this.setChartTitle(datum);
                  this.setState({ hoveredDatumIndex: target.index });

                  return {
                    target: 'labels',
                    mutation: () => ({
                      active: true,
                    }),
                  };
                },
                onMouseOut: () => {
                  this.setChartTitle();
                  this.setState({ hoveredDatumIndex: -1 });
                  return {
                    target: 'labels',
                    mutation: () => ({ active: props.alwaysShowTooltips }),
                  };
                },
              },
            },
          ],
          height,
          horizontal: true,
          labelComponent: (
            <HoverBarLabel
              active={props.alwaysShowTooltips}
              barWidth={barWidth}
              isDisabled={() => this.state.isDisabled}
              domain={domain}
              text={(datum = {}) => {
                const { value, suffix } = formatDatum(
                  _.get(props.data, ['data', datum.eventKey]),
                  props.dataFormat.label,
                  props,
                );
                return [value, suffix];
              }}
              tooltipText={(datum = {}) => {
                const { value, suffix } = formatDatum(
                  _.get(props.data, ['data', datum.eventKey]),
                  props.dataFormat.tooltip,
                  props,
                );
                return `${value}${suffix}`;
              }}
            />
          ),
          padding,
          renderer: VictoryBar,
          style: {
            data: {
              fill: datum => (datum.y === 0 ? 'transparent' : this.getDatumColor(datum)),
              width: () => barWidth,
            },
            labels: {
              fill: datum => this.getDatumColor(_.assign({}, datum, formatDatum(
                _.get(props.data, ['data', datum.eventKey]),
                props.dataFormat.label,
                props,
              ))),
              fontSize: labelFontSize,
              fontWeight: 500,
              paddingLeft: chartLabelWidth,
            },
          },
        });
        break;

      default:
        break;
    }

    return chartProps;
  };

  setChartTitle = (datum = {}) => {
    let tooltipTitleData;
    const { title = this.props.title } = datum;
    const tooltipTitleFormat = _.get(this.props, 'dataFormat.tooltipTitle');

    if (tooltipTitleFormat && datum.index >= 0) {
      tooltipTitleData = this.getFormattedDataByDataPath(['data', datum.index], tooltipTitleFormat);
    }

    this.setState({
      chartTitle: title,
      tooltipTitleData,
    });
  };

  getFormattedDataByDataPath = (path, format) => {
    const datum = _.get(this.props.data, path);
    return formatDatum(datum, format, this.props);
  };

  getFormattedDataByKey = key => {
    const path = _.get(this.props.data, ['dataPaths', key]);
    const format = this.props.dataFormat[key];
    return this.getFormattedDataByDataPath(path, format);
  };

  getDatumColor = datum => {
    const { hoveredDatumIndex, isDisabled } = this.state;
    const isMuted = this.props.muteOthersOnHover
      && hoveredDatumIndex >= 0
      && hoveredDatumIndex !== datum.eventKey;

    let color = colors[datum.id] || colors.statDefault;

    if (isDisabled || isMuted) {
      color = isDisabled ? colors.statDisabled : colors.muted;
    }

    return color;
  };

  handleCollapse = () => {
    this.setState(state => ({
      isOpened: !state.isOpened,
    }), () => this.setState(Stat.getStateByType(this.props, this.state)));
  };

  handleTooltipIconMouseOver = () => {
    const { top, left, width, height } = this.tooltipIcon.getBoundingClientRect();
    const {
      top: parentTop,
      left: parentLeft,
      height: parentHeight,
    } = this.stat.getBoundingClientRect();

    const position = {
      top: (top - parentTop) + height / 2,
      left: (left - parentLeft) + width / 2,
    };

    const offset = {
      horizontal: width / 2,
      top: -parentHeight,
    };

    const side = (_.get(document, 'body.clientWidth', 0) - left < 225) ? 'left' : 'right';

    this.setState({
      showMessages: true,
      messageTooltipPosition: position,
      messageTooltipOffset: offset,
      messageTooltipSide: side,
    });
  };

  handleTooltipIconMouseOut = () => {
    this.setState({
      showMessages: false,
    });
  };

  handleInputChange = event => {
    event.persist();
    this.setState(() => ({
      inputValue: event.target.value,
    }), this.propagateInputChange);
  };

  handleSuffixChange = value => {
    this.setState((state) => ({
      inputSuffix: _.assign({}, state.inputSuffix, {
        value,
      }),
    }), this.propagateInputChange);
  };

  propagateInputChange = () => {
    if (_.isFunction(this.props.onInputChange)) {
      this.props.onInputChange(_.get(this.state, 'inputValue'), _.get(this.state, 'inputSuffix.value'));
    }
  };
}

export default Stat;
