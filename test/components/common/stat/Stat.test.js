import React from 'react';
import _ from 'lodash';
import { render as rtlRender, cleanup, act } from '@testing-library/react/pure';
import { VictoryBar, VictoryContainer } from 'victory';

import { formatClassesAsSelector } from '../../../helpers/cssmodules';
import { Stat } from '../../../../src/components/common/stat/Stat';
import InputGroup from '../../../../src/components/common/controls/InputGroup';
import StatTooltip from '../../../../src/components/common/tooltips/StatTooltip';
import styles from '../../../../src/components/common/stat/Stat.css';
import colors from '../../../../src/styles/colors.css';
import * as stat from '../../../../src/utils/stat';
import {
  MGDL_UNITS,
  MGDL_CLAMP_TOP,
  MMOLL_UNITS,
  MMOLL_CLAMP_TOP,
} from '../../../../src/utils/constants';

jest.mock('react-sizeme', () => ({
  SizeMe: ({ render }) => render({ size: { width: 300, height: 100 } }),
}));

jest.mock('react-collapse', () => {
  const React = require('react');
  return {
    Collapse: ({ children, isOpened }) => React.createElement('div', { 'data-testid': 'Collapse' }, isOpened !== false ? children : null),
  };
});

jest.mock('../../../../src/components/common/stat/StatLegend', () => {
  const React = require('react');
  return function MockStatLegend(props) {
    const items = props.items || [];
    return React.createElement('ul', { 'data-testid': 'StatLegend' },
      items.map((item, i) =>
        // eslint-disable-next-line react/no-array-index-key
        React.createElement('li', { key: i },
          React.createElement('div', null,
            React.createElement('span', null, item.legendTitle)
          )
        )
      )
    );
  };
});

jest.mock('../../../../src/components/common/controls/InputGroup', () => {
  const React = require('react');
  const mock = jest.fn((props) => React.createElement('div', { 'data-testid': 'InputGroup' }, 'InputGroup'));
  return mock;
});

jest.mock('../../../../src/components/common/tooltips/StatTooltip', () => {
  const React = require('react');
  const mock = jest.fn((props) => React.createElement('div', { 'data-testid': 'StatTooltip' }));
  return mock;
});

const hexToRgb = (hex) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `rgb(${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)})` : hex;
};

/* eslint-disable max-len, no-underscore-dangle */

describe('Stat', () => {
  let ref;
  let container;
  let rerenderFn;
  let currentProps;
  let instance;

  const defaultData = {
    data: [
      {
        value: 60,
        id: 'insulin',
      },
      {
        value: 120,
      },
    ],
    dataPaths: {
      summary: 'data.0',
      title: 'data.1',
    },
  };

  const defaultProps = {
    title: 'My Stat',
    data: defaultData,
    dataFormat: stat.statFormats.percentage,
    type: stat.statTypes.simple,
  };

  const props = overrides => _.assign({}, defaultProps, overrides);

  const setTestProps = (newProps) => {
    currentProps = newProps;
    act(() => { rerenderFn(<Stat {...currentProps} ref={ref} />); });
    instance = ref.current;
  };

  const setTestState = (newState) => {
    act(() => { instance.setState(newState); });
  };

  beforeEach(() => {
    ref = React.createRef();
    currentProps = { ...defaultProps };
    const rendered = rtlRender(<Stat {...currentProps} ref={ref} />);
    container = rendered.container;
    rerenderFn = rendered.rerender;
    instance = ref.current;
    InputGroup.mockClear();
    StatTooltip.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should set appropriate default props', () => {
    expect(Stat.defaultProps).to.eql({
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
      type: stat.statTypes.simple,
    });
  });

  describe('constructor', () => {
    it('should initialize the state by stat type', () => {
      expect(instance.state).to.be.an('object').and.include.keys([
        'isCollapsible',
        'isOpened',
        'showFooter',
      ]);
    });

    it('should set the chart props by stat type', () => {
      expect(instance.chartProps).to.be.an('object').and.have.keys([
        'animate',
        'height',
        'labels',
        'renderer',
        'style',
      ]);
    });

    it('should define a stat reference method', () => {
      expect(instance.setStatRef).to.be.a('function');
      instance.setStatRef('statRef');
      expect(instance.stat).to.equal('statRef');
    });

    it('should define a tooltip icon reference method', () => {
      expect(instance.setTooltipIconRef).to.be.a('function');
      instance.setTooltipIconRef('iconRef');
      expect(instance.tooltipIcon).to.equal('iconRef');
    });
  });

  describe('componentWillReceiveProps', () => {
    it('should call `setState` with the result of `getStateByType`', () => {
      const setStateSpy = sinon.spy(instance, 'setState');
      const getStateByTypeSpy = sinon.spy(instance, 'getStateByType');

      setTestProps({ ...currentProps, foo: 'bar' });

      sinon.assert.calledOnce(setStateSpy);
      sinon.assert.calledOnce(getStateByTypeSpy);
      sinon.assert.calledWith(getStateByTypeSpy, sinon.match({ foo: 'bar' }));
    });

    it('should call `getChartPropsByType` with the incoming props', () => {
      const getChartPropsByTypeSpy = sinon.spy(instance, 'getChartPropsByType');

      setTestProps({ ...currentProps, foo: 'bar' });

      sinon.assert.calledOnce(getChartPropsByTypeSpy);
      sinon.assert.calledWith(getChartPropsByTypeSpy, sinon.match({ foo: 'bar' }));
    });
  });

  describe('renderChartTitle', () => {
    it('should render a chart title', () => {
      setTestState({ chartTitle: 'chart title' });
      const title = container.querySelectorAll(formatClassesAsSelector(styles.chartTitle));
      expect(title).to.have.length(1);
      expect(title[0].textContent).to.include('chart title');
    });

    context('showing titleData', () => {
      let titleData;
      beforeEach(() => {
        titleData = () => container.querySelectorAll(formatClassesAsSelector(styles.chartTitleData));
      });

      context('datum is hovered', () => {
        beforeEach(() => {
          setTestState({
            hoveredDatumIndex: 0,
          });
        });

        it('should show the tooltip title data and suffix when a datum has a valid value', () => {
          setTestState({
            tooltipTitleData: { value: '3.6', suffix: 'U' },
          });
          expect(titleData()).to.have.length(1);
          expect(titleData()[0].textContent).to.include('3.6U');
        });

        it('should render title data in the color provided via `id`', () => {
          setTestState({
            tooltipTitleData: { value: '3.6', suffix: 'U', id: 'insulin' },
          });
          expect(titleData()).to.have.length(1);
          expect(titleData()[0].textContent).to.include('3.6U');
          expect(titleData()[0].querySelector('span > span').style.color).to.equal(hexToRgb(colors.insulin));
        });

        it('should render title data in the default color when not provided via `id`', () => {
          setTestState({
            tooltipTitleData: { value: '3.6', suffix: 'U' },
          });
          expect(titleData()).to.have.length(1);
          expect(titleData()[0].textContent).to.include('3.6U');
          expect(titleData()[0].querySelector('span > span').style.color).to.equal(hexToRgb(colors.statDefault));
        });

        it('should not show the tooltip title data and suffix when a datum has the empty placeholder value', () => {
          setTestState({
            tooltipTitleData: { value: '--', suffix: 'U' },
          });

          expect(titleData()).to.have.length(0);

          setTestProps(props({ emptyDataPlaceholder: 'XX' }));
          expect(titleData()).to.have.length(1);

          setTestState({
            tooltipTitleData: { value: 'XX', suffix: 'U' },
          });
          expect(titleData()).to.have.length(0);
        });

        it('should not show the tooltip title data and suffix when a datum has no value', () => {
          setTestState({
            tooltipTitleData: { value: undefined, suffix: 'U' },
          });

          expect(titleData()).to.have.length(0);
        });
      });

      context('datum is not hovered', () => {
        beforeEach(() => {
          setTestState({
            hoveredDatumIndex: -1,
          });
        });

        it('should show the data defined in the `dataPaths.title` prop when available', () => {
          expect(titleData()).to.have.length(1);
          expect(titleData()[0].textContent).to.include('120');
        });

        it('should not show the title when no `dataPaths.title` prop is available', () => {
          setTestProps(props({
            data: _.assign({}, defaultProps.data, {
              dataPaths: { summary: 'data.0' },
            }),
          }));
          expect(titleData()).to.have.length(0);
        });
      });
    });

    context('showing tooltip icon', () => {
      it('should render a tooltip icon when annotations props provide and datum is not hovered', () => {
        setTestState({
          hoveredDatumIndex: -1,
        });
        setTestProps(props({ annotations: ['my message'] }));

        const iconWrapper = container.querySelectorAll(formatClassesAsSelector(styles.tooltipIcon));
        expect(iconWrapper).to.have.length(1);
        expect(iconWrapper[0].querySelectorAll('img')).to.have.length(1);
      });

      it('should not render a tooltip icon when annotations props provide and datum is hovered', () => {
        setTestState({
          hoveredDatumIndex: 1,
        });
        setTestProps(props({ annotations: ['my message'] }));

        const iconWrapper = container.querySelectorAll(formatClassesAsSelector(styles.tooltipIcon));
        expect(iconWrapper).to.have.length(0);
      });

      it('should not render a tooltip icon when annotations props not provided and datum is hovered', () => {
        setTestState({
          hoveredDatumIndex: 1,
        });
        setTestProps(props({ annotations: undefined }));

        const iconWrapper = container.querySelectorAll(formatClassesAsSelector(styles.tooltipIcon));
        expect(iconWrapper).to.have.length(0);
      });

      it('should not render a tooltip icon when annotations props not provided and datum is not hovered', () => {
        setTestState({
          hoveredDatumIndex: -1,
        });
        setTestProps(props({ annotations: undefined }));

        const iconWrapper = container.querySelectorAll(formatClassesAsSelector(styles.tooltipIcon));
        expect(iconWrapper).to.have.length(0);
      });
    });
  });

  describe('renderChartSummary', () => {
    it('should render a chart summary wrapper', () => {
      const summary = container.querySelectorAll(formatClassesAsSelector(styles.chartSummary));
      expect(summary).to.have.length(1);
    });

    it('should call `renderStatUnits` method when `units` prop is truthy and `showFooter` state is false', () => {
      const renderStatUnitsSpy = sinon.spy(instance, 'renderStatUnits');
      setTestProps(props({ units: false }));
      setTestState({ showFooter: true });
      sinon.assert.callCount(renderStatUnitsSpy, 0);


      setTestProps(props({ units: 'U' }));
      setTestState({ showFooter: false });
      sinon.assert.callCount(renderStatUnitsSpy, 1);
    });

    it('should render the chart collapse icon when the `isCollapsible` state is `true`', () => {
      const icon = () => container.querySelectorAll(formatClassesAsSelector(styles.chartCollapse));

      setTestState({ isCollapsible: false });
      expect(icon()).to.have.length(0);

      setTestState({ isCollapsible: true });
      expect(icon()).to.have.length(1);
      expect(icon()[0].querySelectorAll('img')).to.have.length(1);
    });

    context('summary data is present', () => {
      let summaryData;
      beforeEach(() => {
        setTestProps(props({
          data: _.assign({}, defaultProps.data, {
            dataPaths: { summary: 'data.0' },
          }),
        }));
        summaryData = () => container.querySelectorAll(formatClassesAsSelector(styles.summaryData));
      });

      it('should render the summary data when `isOpened` state is `false`', () => {
        setTestState({ isOpened: true });
        expect(summaryData()).to.have.length(0);

        setTestState({ isOpened: false });
        expect(summaryData()).to.have.length(1);
      });

      it('should render the summary data when `alwaysShowSummary` prop is `true` and `isOpened` state is true', () => {
        setTestProps(props({ alwaysShowSummary: false }));
        setTestState({ isOpened: true });

        setTestProps(props({ alwaysShowSummary: true }));
        expect(summaryData()).to.have.length(1);
      });

      it('should render title data in the color provided via `id`', () => {
        setTestProps(props({
          data: _.assign({}, defaultProps.data, {
            data: [{
              id: 'bolus',
              value: 60,
            }],
          }),
        }));
        expect(summaryData()).to.have.length(1);
        expect(summaryData()[0].style.color).to.equal(hexToRgb(colors.bolus));
      });

      it('should render 2 stat values with suffixes when 2 values are provided', () => {
        setTestProps(props({
          data: _.assign({}, defaultProps.data, {
            data: [{
              id: 'carbs',
              value: [60, 3],
              suffix: ['g', 'exch'],
            }],
          }),
        }));
        expect(summaryData()).to.have.length(2);
        expect(summaryData()[0].children[0].textContent).to.equal('60');
        expect(summaryData()[0].children[1].textContent).to.equal('g');
        expect(summaryData()[1].children[0].textContent).to.equal('3');
        expect(summaryData()[1].children[1].textContent).to.equal('exch');
      });
    });

    context('summary data is not present', () => {
      let summaryData;
      beforeEach(() => {
        setTestProps(props({
          data: _.assign({}, defaultProps.data, {
            dataPaths: { title: 'data.0' },
          }),
          alwaysShowSummary: true, // shouldn't cause the summary to show since there's no dataPath
        }));
        summaryData = () => container.querySelectorAll(formatClassesAsSelector(styles.summaryData));
      });

      it('should not render the summary data', () => {
        expect(summaryData()).to.have.length(0);
      });
    });
  });

  describe('renderStatUnits', () => {
    it('should render the `units` prop', () => {
      setTestProps(props({ units: 'myUnits' }));
      expect(container.querySelectorAll(formatClassesAsSelector(styles.units))).to.have.length(1);
      expect(container.querySelector(formatClassesAsSelector(styles.units)).textContent).to.equal('myUnits');
    });
  });

  describe('renderStatHeader', () => {
    it('should render a statHeader div', () => {
      expect(container.querySelectorAll(formatClassesAsSelector(styles.statHeader))).to.have.length(1);
    });

    it('should call the `renderChartTitle` and `renderChartSummary` methods', () => {
      const renderChartTitleSpy = sinon.spy(instance, 'renderChartTitle');
      const renderChartSummarySpy = sinon.spy(instance, 'renderChartSummary');
      sinon.assert.callCount(renderChartTitleSpy, 0);
      sinon.assert.callCount(renderChartSummarySpy, 0);

      instance.renderStatHeader();
      sinon.assert.callCount(renderChartTitleSpy, 1);
      sinon.assert.callCount(renderChartSummarySpy, 1);
    });
  });

  describe('renderStatFooter', () => {
    it('should render a statFooter div when `showFooter` state is true', () => {
      expect(container.querySelectorAll(formatClassesAsSelector(styles.statFooter))).to.have.length(0);

      setTestState({ showFooter: true });
      expect(container.querySelectorAll(formatClassesAsSelector(styles.statFooter))).to.have.length(1);
    });

    it('should call the `renderCalculatedOutput` method when the stat type is `input`', () => {
      const renderCalculatedOutputSpy = sinon.spy(instance, 'renderCalculatedOutput');
      sinon.assert.callCount(renderCalculatedOutputSpy, 0);

      setTestProps({ ...currentProps, type: stat.statTypes.input });
      instance.renderStatFooter();
      sinon.assert.callCount(renderCalculatedOutputSpy, 1);
    });

    it('should call the `renderStatLegend` method when the `legend` prop is `true`', () => {
      setTestProps({ ...currentProps, legend: true });
      const renderStatLegendSpy = sinon.spy(instance, 'renderStatLegend');
      sinon.assert.callCount(renderStatLegendSpy, 0);

      instance.renderStatFooter();
      sinon.assert.callCount(renderStatLegendSpy, 1);
    });

    it('should call the `renderStatUnits` method when the `units` prop is truthy', () => {
      setTestProps({ ...currentProps, units: 'myUnits' });
      const renderStatUnitsSpy = sinon.spy(instance, 'renderStatUnits');
      sinon.assert.callCount(renderStatUnitsSpy, 0);

      instance.renderStatFooter();
      sinon.assert.callCount(renderStatUnitsSpy, 1);
    });
  });

  describe('renderStatLegend', () => {
    let statLegend;

    beforeEach(() => {
      setTestState({ isOpened: true });

      setTestProps(props({
        data: _.assign({}, defaultProps.data, {
          data: [
            {
              id: 'basal',
              value: 80,
              legendTitle: 'Basal',
            },
            {
              id: 'bolus',
              value: 60,
              legendTitle: 'Bolus',
            },
          ],
        }),
        legend: true,
        type: stat.statTypes.barHorizontal,
      }));

      statLegend = () => container.querySelectorAll('[data-testid="StatLegend"]');
    });

    it('should render the legendTitle text for each item passed to the `StatLegend` component', () => {
      expect(statLegend()).to.have.length(1);
      const items = () => statLegend()[0].querySelectorAll('li > div > span');
      expect(items()).to.have.length(2);
      expect(items()[0].textContent).to.equal('Bolus');
      expect(items()[1].textContent).to.equal('Basal');
    });

    it('should render the legend items in reverse order when the `reverseLegendOrder` prop is true', () => {
      setTestProps(_.assign({}, currentProps, {
        reverseLegendOrder: true,
      }));

      expect(statLegend()).to.have.length(1);
      const items = () => statLegend()[0].querySelectorAll('li > div > span');
      expect(items()).to.have.length(2);
      expect(items()[0].textContent).to.equal('Basal');
      expect(items()[1].textContent).to.equal('Bolus');
    });
  });

  describe('renderChart', () => {
    beforeEach(() => {
      setTestState({ isOpened: true });

      setTestProps(props({
        data: _.assign({}, defaultProps.data, {
          data: [
            {
              id: 'basal',
              value: 80,
              legendTitle: 'Basal',
            },
            {
              id: 'bolus',
              value: 60,
              legendTitle: 'Bolus',
            },
          ],
        }),
        type: stat.statTypes.barHorizontal,
      }));
    });

    it('should render `chartProps.renderer` instance property in a size-aware, collapsible wrapper', () => {
      const collapseWrapper = container.querySelectorAll('[data-testid="Collapse"]');
      expect(collapseWrapper).to.have.length(1);
    });
  });

  describe('renderInput', () => {
    let inputGroup;

    beforeEach(() => {
      setTestState({ isOpened: true });

      setTestProps(props({
        type: stat.statTypes.input,
      }));

      inputGroup = () => container.querySelectorAll('[data-testid="InputGroup"]');
    });

    it('should render an input group wrapper and component', () => {
      expect(container.querySelectorAll(formatClassesAsSelector(styles.inputWrapper))).to.have.length(1);
      expect(inputGroup()).to.have.length(1);
    });

    it('should spread the input data as props to the InputGroup component', () => {
      const inputData = {
        input: {
          id: 'weight',
          label: 'Weight',
          step: 1,
          suffix: {
            id: 'units',
            options: ['kg', 'lb'],
            value: 'kg',
          },
          type: 'number',
        },
      };

      setTestProps(props({
        data: _.assign({}, defaultProps.data, {
          data: [inputData],
          dataPaths: {
            input: 'data.0.input',
          },
        }),
        type: stat.statTypes.input,
      }));

      const lastCallProps = InputGroup.mock.calls[InputGroup.mock.calls.length - 1][0];
      expect(lastCallProps.id).to.equal('weight');
      expect(lastCallProps.label).to.equal('Weight');
      expect(lastCallProps.type).to.equal('number');
      expect(lastCallProps.step).to.equal(1);
    });

    it('should assign the `inputSuffix` state to the InputGroup component `suffix` prop', () => {
      setTestState({
        inputSuffix: 'suffix',
      });

      expect(InputGroup.mock.calls[InputGroup.mock.calls.length - 1][0].suffix).to.equal('suffix');
    });

    it('should assign the `inputValue` state to the InputGroup component `defaultValue` prop', () => {
      setTestState({
        inputValue: 'value',
      });

      expect(InputGroup.mock.calls[InputGroup.mock.calls.length - 1][0].defaultValue).to.equal('value');
    });

    it('should pass `onChange` and `onSuffixChange` handler function to the component', () => {
      const lastCallProps = InputGroup.mock.calls[InputGroup.mock.calls.length - 1][0];
      expect(lastCallProps.onChange).to.be.a('function');
      expect(lastCallProps.onSuffixChange).to.be.a('function');
    });

    it('should set the initial input and suffix values as provided by the `data.data.input` prop', () => {
      const inputData = {
        input: {
          id: 'weight',
          label: 'Weight',
          step: 1,
          suffix: {
            id: 'units',
            options: ['kg', 'lb'],
            value: 'lb',
          },
          type: 'number',
          value: 450,
        },
      };

      setTestProps(props({
        data: _.assign({}, defaultProps.data, {
          data: [inputData],
          dataPaths: {
            input: 'data.0.input',
          },
        }),
        type: stat.statTypes.input,
      }));

      const lastCallProps = InputGroup.mock.calls[InputGroup.mock.calls.length - 1][0];
      expect(lastCallProps.value).to.equal(450);
      expect(lastCallProps.suffix.value).to.equal('lb');
    });
  });

  describe('renderCalculatedOutput', () => {
    let outputWrapper;

    const outputData = {
      value: 60,
      output: {
        label: 'Output Label',
        type: 'divisor',
        dataPaths: {
          dividend: 'data.0',
        },
      },
    };

    beforeEach(() => {
      setTestState({
        isOpened: true,
        inputValue: 120,
        inputSuffix: {
          value: { label: 'kg' },
        },
      });

      setTestProps(props({
        data: _.assign({}, defaultProps.data, {
          data: [outputData],
          dataPaths: {
            output: 'data.0.output',
          },
        }),
        dataFormat: {
          output: stat.statFormats.unitsPerKg,
        },
        type: stat.statTypes.input,
      }));

      outputWrapper = () => container.querySelectorAll(formatClassesAsSelector(styles.outputWrapper));
    });

    it('should render an output wrapper', () => {
      expect(outputWrapper()).to.have.length(1);
    });

    it('should render a label when provided in output data', () => {
      expect(outputWrapper()[0].querySelectorAll(formatClassesAsSelector(styles.outputLabel))).to.have.length(1);
      expect(outputWrapper()[0].querySelector(formatClassesAsSelector(styles.outputLabel)).textContent).to.equal('Output Label');
    });

    it('should not render a label when no provided in output data', () => {
      setTestProps(props({
        data: _.assign({}, defaultProps.data, {
          data: [{
            value: 60,
            output: {
              type: 'divisor',
              dataPaths: {
                dividend: 'data.0',
              },
            },
          }],
          dataPaths: {
            output: 'data.0.output',
          },
        }),
        type: stat.statTypes.input,
      }));
      expect(outputWrapper()[0].querySelectorAll(formatClassesAsSelector(styles.outputLabel))).to.have.length(0);
    });

    it('should render the output value wrapper', () => {
      expect(outputWrapper()[0].querySelectorAll(formatClassesAsSelector(styles.outputValue))).to.have.length(1);
    });

    it('should render the output value wrapper with a disabled class', () => {
      expect(outputWrapper()[0].querySelectorAll(formatClassesAsSelector(styles.outputValueDisabled))).to.have.length(0);

      setTestState({
        inputValue: undefined,
      });

      expect(outputWrapper()[0].querySelectorAll(formatClassesAsSelector(styles.outputValueDisabled))).to.have.length(1);
      expect(outputWrapper()[0].querySelector(formatClassesAsSelector(styles.outputValueDisabled)).textContent).to.equal('--');
    });

    it('should render the output suffix wrapper', () => {
      expect(outputWrapper()[0].querySelectorAll(formatClassesAsSelector(styles.outputSuffix))).to.have.length(1);
      expect(outputWrapper()[0].querySelector(formatClassesAsSelector(styles.outputSuffix)).textContent).to.equal('U/kg');
    });

    context('output type is `divisor`', () => {
      it('should set the calculated value to `dividend / divisor`', () => {
        expect(outputData.value).to.equal(60);

        setTestState({
          inputValue: 120,
        });

        expect(outputWrapper()[0].querySelectorAll(formatClassesAsSelector(styles.outputValue))).to.have.length(1);
        expect(outputWrapper()[0].querySelector(formatClassesAsSelector(styles.outputValue)).textContent).to.equal('0.50');

        setTestState({
          inputValue: 240,
        });
        expect(outputWrapper()[0].querySelector(formatClassesAsSelector(styles.outputValue)).textContent).to.equal('0.25');
      });
    });

    context('output type is not defined', () => {
      it('should pass through the input value unmodified', () => {
        setTestProps(props({
          data: _.assign({}, defaultProps.data, {
            data: [{
              value: 60,
              output: {
                type: undefined,
                dataPaths: {
                  dividend: 'data.0',
                },
              },
            }],
            dataPaths: {
              output: 'data.0.output',
            },
          }),
          type: stat.statTypes.input,
        }));

        setTestState({
          inputValue: 120,
        });

        expect(outputWrapper()[0].querySelectorAll(formatClassesAsSelector(styles.outputValue))).to.have.length(1);
        expect(outputWrapper()[0].querySelector(formatClassesAsSelector(styles.outputValue)).textContent).to.equal('120');

        setTestState({
          inputValue: 240,
        });
        expect(outputWrapper()[0].querySelector(formatClassesAsSelector(styles.outputValue)).textContent).to.equal('240');
      });
    });
  });

  describe('renderTooltip', () => {
    let statTooltip;
    beforeEach(() => {
      setTestProps(props({
        annotations: ['one', 'two'],
      }));

      setTestState({ showMessages: true });

      statTooltip = () => container.querySelectorAll('[data-testid="StatTooltip"]');
    });

    it('should render a tooltip wrapper and `StatTooltip` component', () => {
      const statTooltipWrapper = container.querySelectorAll(formatClassesAsSelector(styles.StatWrapper));
      expect(statTooltipWrapper).to.have.length(1);
      expect(statTooltip()).to.have.length(1);
    });

    it('should pass the `annotations` prop to the `StatTooltip` component', () => {
      expect(StatTooltip.mock.calls[StatTooltip.mock.calls.length - 1][0].annotations).to.have.members(['one', 'two']);
    });

    it('should pass the `messageTooltipOffset` state to the `offset` prop of the `StatTooltip` component', () => {
      setTestState({
        messageTooltipOffset: 20,
      });
      expect(StatTooltip.mock.calls[StatTooltip.mock.calls.length - 1][0].offset).to.equal(20);
    });

    it('should pass the `messageTooltipPosition` state to the `position` prop of the `StatTooltip` component', () => {
      setTestState({
        messageTooltipPosition: { x: 100, y: 50 },
      });
      expect(StatTooltip.mock.calls[StatTooltip.mock.calls.length - 1][0].position).to.eql({ x: 100, y: 50 });
    });

    it('should pass the `messageTooltipSide` state to the `side` prop of the `StatTooltip` component', () => {
      setTestState({
        messageTooltipSide: 'right',
      });
      expect(StatTooltip.mock.calls[StatTooltip.mock.calls.length - 1][0].side).to.equal('right');
    });
  });

  describe('render', () => {
    beforeEach(() => {
      setTestState({ isOpened: true });

      setTestProps(props({
        type: stat.statTypes.barHorizontal,
      }));
    });

    it('should render an outer stat wrapper', () => {
      const statOuter = container.querySelectorAll(formatClassesAsSelector(styles.StatWrapper));
      expect(statOuter).to.have.length(1);
    });

    it('should render an inner wrapper with dynamic `isOpen` class', () => {
      const statInner = () => container.querySelector(formatClassesAsSelector(styles.Stat));
      expect(statInner()).to.not.be.null;

      setTestState({ isOpened: false });
      expect(statInner().matches(formatClassesAsSelector(styles.isOpen))).to.be.false;

      setTestState({ isOpened: true });
      expect(statInner().matches(formatClassesAsSelector(styles.isOpen))).to.be.true;
    });

    it('should render the stat header', () => {
      const renderStatHeaderSpy = sinon.spy(instance, 'renderStatHeader');

      sinon.assert.callCount(renderStatHeaderSpy, 0);
      instance.render();
      sinon.assert.callCount(renderStatHeaderSpy, 1);
    });

    it('should render the main stat chart area when the `chartProps.renderer` instance prop is set', () => {
      cleanup();
      const localRef = React.createRef();
      let localProps = { ...defaultProps };
      const { container: localContainer, rerender: localRerender } = rtlRender(<Stat {...localProps} ref={localRef} />);
      const localInstance = localRef.current;
      const renderChartSpy = sinon.spy(localInstance, 'renderChart');

      renderChartSpy.resetHistory();
      sinon.assert.callCount(renderChartSpy, 0);

      // Set to a type without a renderer
      localProps = props({ type: stat.statTypes.simple });
      act(() => { localRerender(<Stat {...localProps} ref={localRef} />); });

      expect(localContainer.querySelectorAll(formatClassesAsSelector(styles.statMain))).to.have.length(0);
      sinon.assert.callCount(renderChartSpy, 0);

      // Set to a type with a renderer
      localProps = props({ type: stat.statTypes.barHorizontal });
      act(() => { localRerender(<Stat {...localProps} ref={localRef} />); });

      expect(localContainer.querySelectorAll(formatClassesAsSelector(styles.statMain))).to.have.length(1);
      sinon.assert.callCount(renderChartSpy, 1);
    });

    it('should render the stat tooltip when the `showMessages` state is true', () => {
      const renderTooltipSpy = sinon.spy(instance, 'renderTooltip');

      sinon.assert.callCount(renderTooltipSpy, 0);

      setTestState({
        showMessages: true,
      });

      sinon.assert.callCount(renderTooltipSpy, 1);
    });
  });

  describe('getStateByType', () => {
    context('common', () => {
      beforeEach(() => {
        setTestProps(props({
          type: undefined,
          title: 'My Stat Title',
        }));
      });

      it('should set the `chartTitle` state to the `title` prop', () => {
        expect(instance.getStateByType(instance.props).chartTitle).to.equal('My Stat Title');
      });

      it('should set the `isDisabled` state to `true` if the sum of all positive data values, including deviation data, is not > 0', () => {
        setTestProps(props({
          data: _.assign({}, defaultProps.data, {
            data: [
              {
                value: 10,
              },
              {
                value: 20,
              },
            ],
            dataPaths: {
              summary: 'data.0',
            },
          }),
        }));

        expect(instance.getStateByType(instance.props).isDisabled).to.be.false;

        setTestProps(props({
          data: _.assign({}, defaultProps.data, {
            data: [
              {
                value: 0,
              },
              {
                value: 0,
              },
            ],
            dataPaths: {
              summary: 'data.0',
            },
          }),
        }));

        expect(instance.getStateByType(instance.props).isDisabled).to.be.true;

        setTestProps(props({
          data: _.assign({}, defaultProps.data, {
            data: [
              {
                value: 0,
                deviation: { value: 10 },
              },
              {
                value: 0,
              },
            ],
            dataPaths: {
              summary: 'data.0',
            },
          }),
        }));

        expect(instance.getStateByType(instance.props).isDisabled).to.be.false;

        setTestProps(props({
          data: _.assign({}, defaultProps.data, {
            data: [
              {
                value: 0,
                deviation: { value: 0.5 },
              },
              {
                value: -1,
              },
            ],
            dataPaths: {
              summary: 'data.0',
            },
          }),
        }));

        expect(instance.getStateByType(instance.props).isDisabled).to.be.false;
      });
    });

    context('input', () => {
      const inputData = {
        input: {
          id: 'weight',
          label: 'Weight',
          step: 1,
          suffix: {
            id: 'units',
            options: ['kg', 'lb'],
            value: 'kg',
          },
          type: 'number',
          value: 100,
        },
      };

      beforeEach(() => {
        setTestProps(props({
          data: _.assign({}, defaultProps.data, {
            data: [inputData],
            dataPaths: {
              input: 'data.0.input',
            },
          }),
          type: stat.statTypes.input,
        }));
      });

      it('should set the `inputSuffix` state to the `input.suffix` data when not already set in state', () => {
        setTestState({
          inputSuffix: undefined,
        });
        expect(instance.getStateByType(instance.props).inputSuffix).to.eql(inputData.input.suffix);
      });

      it('should not change the `inputSuffix` state if already set', () => {
        setTestState({
          inputSuffix: 'foo',
        });
        expect(instance.getStateByType(instance.props).inputSuffix).to.equal('foo');
      });

      it('should set the `inputValue` state to the `input.value` data when not already set in state', () => {
        setTestState({
          inputValue: undefined,
        });
        expect(instance.getStateByType(instance.props).inputValue).to.eql(inputData.input.value);
      });

      it('should not change the `inputValue` state if already set', () => {
        setTestState({
          inputValue: 'foo',
        });
        expect(instance.getStateByType(instance.props).inputValue).to.equal('foo');
      });

      it('should set the `isCollapsible` state to the `collapsible` prop', () => {
        setTestProps(_.assign({}, currentProps, {
          collapsible: false,
        }));
        expect(instance.getStateByType(instance.props).isCollapsible).to.be.false;

        setTestProps(_.assign({}, currentProps, {
          collapsible: true,
        }));
        expect(instance.getStateByType(instance.props).isCollapsible).to.be.true;
      });

      it('should set the `isOpened` and `showFooter` state to the `isOpened` prop, unless already set', () => {
        // state unset, prop is false
        setTestState({
          isOpened: undefined,
        });

        setTestProps(_.assign({}, currentProps, {
          isOpened: false,
        }));

        expect(instance.getStateByType(instance.props).isOpened).to.be.false;
        expect(instance.getStateByType(instance.props).showFooter).to.be.false;

        // state unset, prop is true
        setTestState({
          isOpened: undefined,
        });

        setTestProps(_.assign({}, currentProps, {
          isOpened: true,
        }));

        expect(instance.getStateByType(instance.props).isOpened).to.be.true;
        expect(instance.getStateByType(instance.props).showFooter).to.be.true;

        // state is true, prop is false
        setTestState({
          isOpened: true,
        });

        setTestProps(_.assign({}, currentProps, {
          isOpened: false,
        }));

        expect(instance.getStateByType(instance.props).isOpened).to.be.true;
        expect(instance.getStateByType(instance.props).showFooter).to.be.true;

        // state is false, prop is true
        setTestState({
          isOpened: false,
        });

        setTestProps(_.assign({}, currentProps, {
          isOpened: true,
        }));

        expect(instance.getStateByType(instance.props).isOpened).to.be.false;
        expect(instance.getStateByType(instance.props).showFooter).to.be.false;
      });
    });

    context('barHorizontal', () => {
      beforeEach(() => {
        setTestProps(props({
          type: stat.statTypes.barHorizontal,
        }));
      });

      it('should set the `isCollapsible` state to the `collapsible` prop', () => {
        setTestProps(_.assign({}, currentProps, {
          collapsible: false,
        }));
        expect(instance.getStateByType(instance.props).isCollapsible).to.be.false;

        setTestProps(_.assign({}, currentProps, {
          collapsible: true,
        }));
        expect(instance.getStateByType(instance.props).isCollapsible).to.be.true;
      });

      it('should set the `isOpened` state to the `isOpened` prop, unless already set', () => {
        // state unset, prop is false
        setTestState({
          isOpened: undefined,
        });

        setTestProps(_.assign({}, currentProps, {
          isOpened: false,
        }));

        expect(instance.getStateByType(instance.props).isOpened).to.be.false;

        // state unset, prop is true
        setTestState({
          isOpened: undefined,
        });

        setTestProps(_.assign({}, currentProps, {
          isOpened: true,
        }));

        expect(instance.getStateByType(instance.props).isOpened).to.be.true;

        // state is true, prop is false
        setTestState({
          isOpened: true,
        });

        setTestProps(_.assign({}, currentProps, {
          isOpened: false,
        }));

        expect(instance.getStateByType(instance.props).isOpened).to.be.true;

        // state is false, prop is true
        setTestState({
          isOpened: false,
        });

        setTestProps(_.assign({}, currentProps, {
          isOpened: true,
        }));

        expect(instance.getStateByType(instance.props).isOpened).to.be.false;
      });

      it('should set the `hoveredDatumIndex` state to `-1`', () => {
        setTestState({
          hoveredDatumIndex: undefined,
        });
        expect(instance.getStateByType(instance.props).hoveredDatumIndex).to.equal(-1);

        setTestProps(_.assign({}, currentProps, {
          collapsible: true,
        }));
        expect(instance.getStateByType(instance.props).isCollapsible).to.be.true;
      });

      it('should set the `showFooter` state to true if to the `isOpened` state is true and the `legend` prop is true', () => {
        // state is false, prop is false
        setTestState({
          isOpened: false,
        });

        setTestProps(_.assign({}, currentProps, {
          legend: false,
        }));

        expect(instance.getStateByType(instance.props).showFooter).to.be.false;

        // state is false, prop is true
        setTestState({
          isOpened: false,
        });

        setTestProps(_.assign({}, currentProps, {
          legend: true,
        }));

        expect(instance.getStateByType(instance.props).showFooter).to.be.false;

        // state is true, prop is false
        setTestState({
          isOpened: true,
        });

        setTestProps(_.assign({}, currentProps, {
          legend: false,
        }));

        expect(instance.getStateByType(instance.props).showFooter).to.be.false;

        // state is true, prop is true
        setTestState({
          isOpened: true,
        });

        setTestProps(_.assign({}, currentProps, {
          legend: true,
        }));

        expect(instance.getStateByType(instance.props).showFooter).to.be.true;
      });
    });

    context('barBg', () => {
      beforeEach(() => {
        setTestProps(props({
          type: stat.statTypes.barBg,
          bgPrefs: {
            bgUnits: MGDL_UNITS,
            bgBounds: {
              targetLowerBound: 70,
              targetUpperBound: 180,
            },
          },
        }));
      });

      it('should set the `isCollapsible` state to the `collapsible` prop', () => {
        setTestProps(_.assign({}, currentProps, {
          collapsible: false,
        }));
        expect(instance.getStateByType(instance.props).isCollapsible).to.be.false;

        setTestProps(_.assign({}, currentProps, {
          collapsible: true,
        }));
        expect(instance.getStateByType(instance.props).isCollapsible).to.be.true;
      });

      it('should set the `isOpened` state to the `isOpened` prop, unless already set', () => {
        // state unset, prop is false
        setTestState({
          isOpened: undefined,
        });

        setTestProps(_.assign({}, currentProps, {
          isOpened: false,
        }));

        expect(instance.getStateByType(instance.props).isOpened).to.be.false;

        // state unset, prop is true
        setTestState({
          isOpened: undefined,
        });
        setTestProps(_.assign({}, currentProps, {
          isOpened: true,
        }));

        expect(instance.getStateByType(instance.props).isOpened).to.be.true;

        // state is true, prop is false
        setTestState({
          isOpened: true,
        });

        setTestProps(_.assign({}, currentProps, {
          isOpened: false,
        }));

        expect(instance.getStateByType(instance.props).isOpened).to.be.true;

        // state is false, prop is true
        setTestState({
          isOpened: false,
        });

        setTestProps(_.assign({}, currentProps, {
          isOpened: true,
        }));

        expect(instance.getStateByType(instance.props).isOpened).to.be.false;
      });
    });

    context('simple', () => {
      beforeEach(() => {
        setTestProps(props({
          type: stat.statTypes.simple,
        }));
      });

      it('should set the `isCollapsible` state to `false`', () => {
        setTestState({
          isCollapsible: true,
        });
        expect(instance.getStateByType(instance.props).isCollapsible).to.be.false;
      });

      it('should set the `isOpened` state to `false`', () => {
        setTestState({
          isOpened: true,
        });
        expect(instance.getStateByType(instance.props).isOpened).to.be.false;
      });

      it('should set the `showFooter` state to `false`', () => {
        setTestState({
          showFooter: true,
        });
        expect(instance.getStateByType(instance.props).showFooter).to.be.false;
      });
    });
  });

  describe('getDefaultChartProps', () => {
    beforeEach(() => {
      setTestProps(props({
        chartHeight: 500,
      }));
    });

    it('should return an object with default chart props', () => {
      const result = instance.getDefaultChartProps(instance.props);
      expect(result).to.be.an('object').and.have.keys([
        'animate',
        'height',
        'labels',
        'renderer',
        'style',
      ]);

      expect(result.animate).to.be.an('object').and.have.keys([
        'animationWhitelist',
        'duration',
        // 'onEnd',
        'onLoad',
      ]);

      expect(result.labels).to.be.a('function');
      expect(result.style.data.fill).to.be.a('function');
    });

    it('should set `charProps.height` to the provided `chartHeight` prop', () => {
      expect(instance.getDefaultChartProps(instance.props).height).to.equal(500);
    });

    it('should set `charProps.renderer` to `null`', () => {
      expect(instance.getDefaultChartProps(instance.props).renderer).to.equal(null);
    });
  });

  describe('getChartPropsByType', () => {
    beforeEach(() => {
      setTestProps(props({
        chartHeight: 500,
      }));
    });

    context('simple stat', () => {
      beforeEach(() => {
        setTestProps(_.assign({}, currentProps, {
          type: stat.statTypes.simple,
        }));
      });

      it('should return default chartProps object', () => {
        const getDefaultChartPropsSpy = sinon.spy(instance, 'getDefaultChartProps');
        sinon.assert.callCount(getDefaultChartPropsSpy, 0);

        const result = instance.getChartPropsByType(instance.props);

        sinon.assert.callCount(getDefaultChartPropsSpy, 1);
        sinon.assert.calledWith(getDefaultChartPropsSpy, sinon.match(instance.props));

        expect(result).to.be.an('object').and.have.keys([
          'animate',
          'height',
          'labels',
          'renderer',
          'style',
        ]);
      });
    });

    context('input stat', () => {
      beforeEach(() => {
        setTestProps(_.assign({}, currentProps, {
          type: stat.statTypes.input,
        }));
      });

      it('should return default chartProps object', () => {
        const getDefaultChartPropsSpy = sinon.spy(instance, 'getDefaultChartProps');
        sinon.assert.callCount(getDefaultChartPropsSpy, 0);

        const result = instance.getChartPropsByType(instance.props);

        sinon.assert.callCount(getDefaultChartPropsSpy, 1);
        sinon.assert.calledWith(getDefaultChartPropsSpy, sinon.match(instance.props));

        expect(result).to.be.an('object').and.have.keys([
          'animate',
          'height',
          'labels',
          'renderer',
          'style',
        ]);
      });
    });

    context('barBg stat', () => {
      beforeEach(() => {
        setTestProps(_.assign({}, currentProps, {
          bgPrefs: {
            bgUnits: MGDL_UNITS,
            bgBounds: {
              targetLowerBound: 70,
              targetUpperBound: 180,
            },
          },
          data: _.assign({}, defaultProps.data, {
            data: [
              {
                value: 100,
                deviation: {
                  value: 30,
                },
              },
            ],
          }),
          type: stat.statTypes.barBg,
        }));
      });

      it('should return an extended default chartProps object', () => {
        const getDefaultChartPropsSpy = sinon.spy(instance, 'getDefaultChartProps');
        sinon.assert.callCount(getDefaultChartPropsSpy, 0);

        const result = instance.getChartPropsByType(instance.props);

        sinon.assert.callCount(getDefaultChartPropsSpy, 1);
        sinon.assert.calledWith(getDefaultChartPropsSpy, sinon.match(instance.props));

        const baseKeys = [
          'animate',
          'data',
          'height',
          'labels',
          'renderer',
          'style',
        ];

        expect(result).to.be.an('object').and.have.keys([
          ...baseKeys,
          'alignment',
          'containerComponent',
          'cornerRadius',
          'dataComponent',
          'domain',
          'horizontal',
          'labelComponent',
          'padding',
          'x',
          'y',
        ]);
      });

      it('should set basic chart layout properties', () => {
        const result = instance.getChartPropsByType(instance.props);

        expect(result.alignment).to.equal('middle');
        expect(result.horizontal).to.equal(true);
      });

      it('should set `data` to a chart-compatible map of the provided `data` prop', () => {
        const result = instance.getChartPropsByType(instance.props);

        expect(result.data).to.eql([
          {
            value: 100,
            _x: 1,
            _y: 100,
            deviation: { value: 30 },
            index: 0,
          },
        ]);
      });

      it('should set `containerComponent` to a non-responsive `VictoryContainer` component', () => {
        const result = instance.getChartPropsByType(instance.props);

        expect(result.containerComponent.type).to.equal(VictoryContainer);
        expect(result.containerComponent.props.responsive).to.be.false;
      });

      it('should set `dataComponent` to a `BgBar` component with necessary props', () => {
        const result = instance.getChartPropsByType(instance.props);
        const el = result.dataComponent;

        expect(el.props.barWidth).to.be.a('number');
        expect(el.props.bgPrefs).to.eql(instance.props.bgPrefs);
        expect(el.props.chartLabelWidth).to.be.a('number');
        expect(el.props.domain).to.eql(result.domain);
      });

      it('should set `labelComponent` to a `BgBarLabel` component with necessary props', () => {
        const result = instance.getChartPropsByType(instance.props);
        const el = result.labelComponent;

        expect(el.props.barWidth).to.be.a('number');
        expect(el.props.bgPrefs).to.eql(instance.props.bgPrefs);
        expect(el.props.domain).to.eql(result.domain);
        expect(el.props.text).to.be.a('function');
        expect(el.props.tooltipText).to.be.a('function');
      });

      it('should set `renderer` to a `VictoryBar` component', () => {
        const result = instance.getChartPropsByType(instance.props);
        expect(result.renderer).to.not.be.null;
      });

      it('should properly set the chart height to the `chartHeight` prop, or `24` if not provided', () => {
        setTestProps(_.assign({}, currentProps, {
          chartHeight: 40,
        }));

        const result = instance.getChartPropsByType(instance.props);

        expect(result.height).to.equal(40);

        setTestProps(_.assign({}, currentProps, {
          chartHeight: undefined,
        }));

        const result2 = instance.getChartPropsByType(instance.props);

        expect(result2.height).to.equal(24);
      });

      it('should properly set the chart domain for mg/dL units', () => {
        setTestProps(_.assign({}, currentProps, {
          bgPrefs: { bgUnits: MGDL_UNITS },
        }));

        const result = instance.getChartPropsByType(instance.props);

        expect(result.domain).to.eql({
          x: [0, 1],
          y: [0, MGDL_CLAMP_TOP],
        });
      });

      it('should properly set the chart domain for mmol/L units', () => {
        setTestProps(_.assign({}, currentProps, {
          bgPrefs: { bgUnits: MMOLL_UNITS },
        }));

        const result = instance.getChartPropsByType(instance.props);

        expect(result.domain).to.eql({
          x: [0, 1],
          y: [0, MMOLL_CLAMP_TOP],
        });
      });

      it('should set `style` for dynamic data and label styling', () => {
        const result = instance.getChartPropsByType(instance.props);

        expect(result.style).to.be.an('object').and.have.keys([
          'data',
          'labels',
        ]);

        expect(result.style.data.fill).to.be.a('function');
        expect(result.style.data.width).to.be.a('function');

        expect(result.style.labels.fill).to.be.a('function');
        expect(result.style.labels.fontSize).to.be.a('number');
        expect(result.style.labels.fontWeight).to.be.a('number');
        expect(result.style.labels.paddingLeft).to.be.a('number');
      });
    });

    context('barHorizontal stat', () => {
      beforeEach(() => {
        setTestProps(_.assign({}, currentProps, {
          data: _.assign({}, defaultProps.data, {
            data: [
              {
                value: 30,
                id: 'basal',
              },
              {
                value: 20,
                id: 'bolus',
              },
            ],
            total: { value: 50 },
          }),
          type: stat.statTypes.barHorizontal,
        }));
      });

      it('should return an extended default chartProps object', () => {
        const getDefaultChartPropsSpy = sinon.spy(instance, 'getDefaultChartProps');
        sinon.assert.callCount(getDefaultChartPropsSpy, 0);

        const result = instance.getChartPropsByType(instance.props);

        sinon.assert.callCount(getDefaultChartPropsSpy, 1);
        sinon.assert.calledWith(getDefaultChartPropsSpy, sinon.match(instance.props));

        const baseKeys = [
          'animate',
          'data',
          'height',
          'labels',
          'renderer',
          'style',
        ];

        expect(result).to.be.an('object').and.have.keys([
          ...baseKeys,
          'alignment',
          'containerComponent',
          'cornerRadius',
          'dataComponent',
          'domain',
          'events',
          'horizontal',
          'labelComponent',
          'padding',
          'x',
          'y',
        ]);
      });

      it('should set basic chart layout properties', () => {
        const result = instance.getChartPropsByType(instance.props);

        expect(result.alignment).to.equal('middle');
        expect(result.horizontal).to.equal(true);
      });

      it('should set `data` to a chart-compatible map of the provided `data` prop', () => {
        const result = instance.getChartPropsByType(instance.props);
        const firstDatum = result.data[0];
        const secondDatum = result.data[1];

        expect(firstDatum._x).to.equal(1);
        expect(firstDatum._y).to.equal(0.6);
        expect(firstDatum.id).to.equal('basal');

        expect(secondDatum._x).to.equal(2);
        expect(secondDatum._y).to.equal(0.4);
        expect(secondDatum.id).to.equal('bolus');
      });

      it('should set `containerComponent` to a non-responsive `VictoryContainer` component', () => {
        const result = instance.getChartPropsByType(instance.props);

        expect(result.containerComponent.type).to.equal(VictoryContainer);
        expect(result.containerComponent.props.responsive).to.be.false;
      });

      it('should set `dataComponent` to a `HoverBar` component with necessary props', () => {
        const result = instance.getChartPropsByType(instance.props);
        const el = result.dataComponent;

        expect(el.props.barWidth).to.be.a('number');
        expect(el.props.barSpacing).to.be.a('number');
        expect(el.props.chartLabelWidth).to.be.a('number');
        expect(el.props.domain).to.eql(result.domain);
      });

      it('should set `labelComponent` to a `HoverBarLabel` component with necessary props', () => {
        const result = instance.getChartPropsByType(instance.props);
        const el = result.labelComponent;

        expect(el.props.barWidth).to.be.a('number');
        expect(el.props.domain).to.eql(result.domain);
        expect(el.props.isDisabled).to.be.a('function');
        expect(el.props.text).to.be.a('function');
        expect(el.props.tooltipText).to.be.a('function');
      });

      it('should set `renderer` to a `VictoryBar` component', () => {
        const result = instance.getChartPropsByType(instance.props);
        expect(result.renderer).to.not.be.null;
      });

      it('should properly set the chart height to the `chartHeight` prop, or based on `datums.length`', () => {
        setTestProps(_.assign({}, currentProps, {
          chartHeight: 40,
        }));

        const result = instance.getChartPropsByType(instance.props);

        expect(result.height).to.equal(40);

        setTestProps(_.assign({}, currentProps, {
          chartHeight: undefined,
        }));

        const result2 = instance.getChartPropsByType(instance.props);

        const datumCount = instance.props.data.data.length;
        expect(datumCount).to.equal(2);

        expect(result2.height).to.equal(72); // datumCount:2 * (barWidth:30 + barSpacing:6)
      });

      it('should properly set the chart domain based on the length of data', () => {
        const result = instance.getChartPropsByType(instance.props);

        expect(result.domain).to.eql({
          x: [0, 2],
          y: [0, 1],
        });

        // Remove a datum
        instance.props.data.data.shift();
        const result2 = instance.getChartPropsByType(instance.props);
        expect(result2.domain).to.eql({
          x: [0, 1],
          y: [0, 1],
        });
      });

      it('should set `style` for dynamic data and label styling', () => {
        const result = instance.getChartPropsByType(instance.props);

        expect(result.style).to.be.an('object').and.have.keys([
          'data',
          'labels',
        ]);

        expect(result.style.data.fill).to.be.a('function');
        expect(result.style.data.width).to.be.a('function');

        expect(result.style.labels.fill).to.be.a('function');
        expect(result.style.labels.fontSize).to.be.a('number');
        expect(result.style.labels.fontWeight).to.be.a('number');
        expect(result.style.labels.paddingLeft).to.be.a('number');
      });

      it('should set `events` with `onMouseOver` and `onMouseOut` handlers', () => {
        const result = instance.getChartPropsByType(instance.props);

        expect(result.events).to.be.an('array');
        expect(result.events[0]).to.be.an('object').and.have.keys([
          'target',
          'eventHandlers',
        ]);

        expect(result.events[0].target).to.equal('data');
        expect(result.events[0].eventHandlers).to.be.an('object').and.have.keys([
          'onMouseOver',
          'onMouseOut',
        ]);

        expect(result.events[0].eventHandlers.onMouseOver).to.be.a('function');
        expect(result.events[0].eventHandlers.onMouseOut).to.be.a('function');
      });
    });
  });

  describe('setChartTitle', () => {
    it('should set the `chartTitle` state from the stat\'s `title` prop', () => {
      const setStateSpy = sinon.spy(instance, 'setState');
      instance.setChartTitle();

      sinon.assert.callCount(setStateSpy, 1);
      sinon.assert.calledWith(setStateSpy, sinon.match({
        chartTitle: 'My Stat',
      }));
    });

    it('should set the `chartTitle` state from a provided datum\'s `title` prop', () => {
      const setStateSpy = sinon.spy(instance, 'setState');

      instance.setChartTitle({
        title: 'My Datum',
      });

      sinon.assert.callCount(setStateSpy, 1);
      sinon.assert.calledWith(setStateSpy, sinon.match({
        chartTitle: 'My Datum',
      }));
    });

    it('should set the `tooltipTitleData` state from when provided a datum and a `dataFormat.tooltipTitle` prop is defined', () => {
      setTestProps(props({
        dataFormat: {
          tooltipTitle: stat.statFormats.units,
        },
      }));

      const setStateSpy = sinon.spy(instance, 'setState');

      instance.setChartTitle({
        index: 1,
      });

      sinon.assert.calledWith(setStateSpy, sinon.match({
        tooltipTitleData: sinon.match({
          suffix: 'U',
          value: '120.0',
        }),
      }));
    });

    it('should set the `tooltipTitleData` state to `undefined` when no datum arg is present', () => {
      setTestProps(props({
        dataFormat: {
          tooltipTitle: stat.statFormats.units,
        },
      }));

      const setStateSpy = sinon.spy(instance, 'setState');

      instance.setChartTitle();

      sinon.assert.calledWith(setStateSpy, sinon.match({
        tooltipTitleData: undefined,
      }));
    });

    it('should set the `tooltipTitleData` state to `undefined` when `dataFormat.tooltipTitle` prop is undefined', () => {
      setTestProps(props({
        dataFormat: {
          tooltipTitle: undefined,
        },
      }));

      const setStateSpy = sinon.spy(instance, 'setState');

      instance.setChartTitle();

      sinon.assert.calledWith(setStateSpy, sinon.match({
        tooltipTitleData: undefined,
      }));
    });
  });

  describe('getFormattedDataByDataPath', () => {
    it('should call and return result of `formatDatum` with the datum at the requested data path and format', () => {
      const result = instance.getFormattedDataByDataPath('data.1', stat.statFormats.units);

      // Verify formatDatum was called correctly by checking its output
      const expectedResult = stat.formatDatum(defaultData.data[1], stat.statFormats.units);
      expect(result.value).to.equal(expectedResult.value);
      expect(result.suffix).to.equal(expectedResult.suffix);

      expect(result.value).to.equal('120.0');
      expect(result.suffix).to.equal('U');
    });
  });

  describe('getFormattedDataByKey', () => {
    it('should call and return result of `getFormattedDataByDataPath` with the correct path and format', () => {
      setTestProps(props({
        data: {
          data: [
            {
              value: 60,
              id: 'basal',
            },
            {
              value: 120,
              id: 'bolus',
            },
          ],
          dataPaths: {
            summary: 'data.0',
            title: 'data.1',
          },
        },
        dataFormat: {
          summary: stat.statFormats.percentage,
          title: stat.statFormats.units,
        },
      }));

      const getFormattedDataByDataPathSpy = sinon.spy(instance, 'getFormattedDataByDataPath');

      const result = instance.getFormattedDataByKey('title');

      sinon.assert.callCount(getFormattedDataByDataPathSpy, 1);
      sinon.assert.calledWith(getFormattedDataByDataPathSpy, 'data.1', stat.statFormats.units);

      expect(result.value).to.equal('120.0');
      expect(result.suffix).to.equal('U');
    });
  });

  describe('getDatumFill', () => {
    it('should return a color based on `datum.id`', () => {
      expect(instance.getDatumFill({ id: 'basal' })).to.equal(colors.basal);
      expect(instance.getDatumFill({ id: 'bolus' })).to.equal(colors.bolus);
      expect(instance.getDatumFill({ id: 'target' })).to.equal(colors.target);
    });

    it('should return a default color when not given `datum.id`', () => {
      expect(instance.getDatumFill({ foo: 'bar' })).to.equal(colors.statDefault);
    });

    it('should return a default color when `datum.id` doesn\'t map to an available color', () => {
      expect(instance.getDatumFill({ id: 'foo' })).to.equal(colors.statDefault);
    });

    it('should return the disabled color when `isDisabled` state is true', () => {
      setTestState({ isDisabled: true });
      expect(instance.getDatumFill({ id: 'basal' })).to.equal(colors.statDisabled);
    });

    it('should return the muted color when another datum is being hovered and `muteOthersOnHover` prop is `true`', () => {
      setTestState({ hoveredDatumIndex: 2 });
      setTestProps(props({ muteOthersOnHover: true }));
      expect(instance.getDatumFill({ id: 'basal', index: 1 })).to.equal(colors.muted);
    });

    it('should return the standard color when another datum is being hovered and `muteOthersOnHover` prop is `false`', () => {
      setTestState({ hoveredDatumIndex: 2 });
      setTestProps(props({ muteOthersOnHover: false }));
      expect(instance.getDatumFill({ id: 'basal', index: 1 })).to.equal(colors.basal);
    });

    it('should return the standard color when the datum passed in is being hovered', () => {
      setTestState({ hoveredDatumIndex: 1 });
      setTestProps(props({ muteOthersOnHover: true }));
      expect(instance.getDatumFill({ id: 'basal', index: 1 })).to.equal(colors.basal);
    });

    it('should return the pattern id url when `usePattern` arg is `true`', () => {
      expect(instance.getDatumFill({ id: 'bolus', pattern: { id: 'myPattern' } }, true)).to.equal('url(#myPattern)');
    });

    it('should return the fill color when `usePattern` arg is `false`', () => {
      expect(instance.getDatumFill({ id: 'bolus', pattern: { id: 'myPattern' } }, false)).to.equal(colors.bolus);
    });
  });

  describe('handleCollapse', () => {
    it('should toggle the `isOpened` state', () => {
      setTestProps(props({
        type: stat.statTypes.barHorizontal,
      }));

      setTestState({
        isOpened: false,
      });

      instance.handleCollapse();
      expect(instance.state.isOpened).to.be.true;

      instance.handleCollapse();
      expect(instance.state.isOpened).to.be.false;
    });

    it('should reset the state to the result of `getStateByType` method after toggling the isOpened state', () => {
      setTestProps(props({
        type: stat.statTypes.barHorizontal,
      }));

      const setStateSpy = sinon.spy(instance, 'setState');
      const getStateByTypeSpy = sinon.spy(instance, 'getStateByType');

      instance.handleCollapse();

      sinon.assert.callCount(setStateSpy, 2);
      sinon.assert.callCount(getStateByTypeSpy, 1);

      sinon.assert.callOrder(setStateSpy, getStateByTypeSpy, setStateSpy);
    });
  });

  describe('handleTooltipIconMouseOver', () => {
    it('should set the message tooltip state', () => {
      const setStateSpy = sinon.spy(instance, 'setState');

      instance.tooltipIcon = {
        getBoundingClientRect: sinon.stub().returns({
          top: 10,
          left: 20,
          width: 200,
          height: 100,
        }),
      };

      instance.stat = {
        getBoundingClientRect: sinon.stub().returns({
          top: 10,
          left: 20,
          height: 100,
        }),
      };

      instance.handleTooltipIconMouseOver();

      sinon.assert.callCount(setStateSpy, 1);
      sinon.assert.calledWith(setStateSpy, sinon.match({
        showMessages: true,
        messageTooltipOffset: { horizontal: 100, top: 0 },
        messageTooltipPosition: { left: 100, top: -50 },
        messageTooltipSide: 'left',
      }));
    });
  });

  describe('handleTooltipIconMouseOut', () => {
    it('should set the `showMessages` state to `false`', () => {
      setTestState({ showMessages: true });
      expect(instance.state.showMessages).to.be.true;
      instance.handleTooltipIconMouseOut();
      expect(instance.state.showMessages).to.be.false;
    });
  });

  describe('handleInputChange', () => {
    it('should call `event.persist` and set the `event.target.value` to `inputValue` state', () => {
      const eventStub = {
        target: { value: 300 },
        persist: sinon.stub(),
      };

      setTestState({
        inputValue: 200,
      });

      expect(instance.state.inputValue).to.equal(200);

      instance.handleInputChange(eventStub);

      sinon.assert.callCount(eventStub.persist, 1);
      expect(instance.state.inputValue).to.equal(300);
    });

    it('should call `propagateInputChange` immediately after setting `inputValue` to state', () => {
      const setStateSpy = sinon.spy(instance, 'setState');
      const propagateInputChangeSpy = sinon.spy(instance, 'propagateInputChange');
      const eventStub = {
        target: { value: 300 },
        persist: sinon.stub(),
      };

      setTestState({
        inputValue: 200,
      });

      expect(instance.state.inputValue).to.equal(200);

      instance.handleInputChange(eventStub);

      sinon.assert.called(setStateSpy);
      sinon.assert.callCount(propagateInputChangeSpy, 1);
      expect(propagateInputChangeSpy.calledImmediatelyAfter(setStateSpy)).to.be.true;
    });
  });

  describe('handleSuffixChange', () => {
    it('should set the `inputSuffix` value to state', () => {
      setTestState({
        inputSuffix: { value: 300 },
      });

      expect(instance.state.inputSuffix.value).to.equal(300);

      instance.handleSuffixChange(600);

      expect(instance.state.inputSuffix.value).to.equal(600);
    });

    it('should call `propagateInputChange` immediately after setting `inputSuffix` to state', () => {
      const setStateSpy = sinon.spy(instance, 'setState');
      const propagateInputChangeSpy = sinon.spy(instance, 'propagateInputChange');

      setTestState({
        inputSuffix: { value: 300 },
      });

      expect(instance.state.inputSuffix.value).to.equal(300);

      instance.handleSuffixChange(600);

      sinon.assert.called(setStateSpy);
      sinon.assert.callCount(propagateInputChangeSpy, 1);
      expect(propagateInputChangeSpy.calledImmediatelyAfter(setStateSpy)).to.be.true;
    });
  });

  describe('propagateInputChange', () => {
    it('should call the `onInputChange` prop with the input and suffix values when present', () => {
      setTestState({
        inputSuffix: { value: 'suffix!' },
        inputValue: 'value!',
      });

      setTestProps(props({
        onInputChange: sinon.stub(),
      }));

      instance.propagateInputChange();

      sinon.assert.callCount(instance.props.onInputChange, 1);
      sinon.assert.calledWithExactly(instance.props.onInputChange, 'value!', 'suffix!');
    });
  });
});
