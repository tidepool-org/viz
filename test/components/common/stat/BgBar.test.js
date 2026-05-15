import React from 'react';
import { render as rtlRender, cleanup } from '@testing-library/react/pure';
import _ from 'lodash';

import BgBar from '../../../../src/components/common/stat/BgBar';
import colors from '../../../../src/styles/colors.css';
import { MGDL_CLAMP_TOP } from '../../../../src/utils/constants';

// Mock Victory primitives to render simple elements exposing props for assertion
jest.mock('victory', () => {
  const actual = jest.requireActual('victory');
  return {
    ...actual,
    Rect: (props) => (
      <rect
        data-testid="Rect"
        data-x={props.x}
        data-y={props.y}
        data-width={props.width}
        data-height={props.height}
        data-style={JSON.stringify(props.style || {})}
      />
    ),
    Point: (props) => (
      <circle
        data-testid="Point"
        data-x={props.x}
        data-y={props.y}
        data-style={JSON.stringify(props.style || {})}
        data-size={props.size}
      />
    ),
  };
});

jest.mock('victory-core', () => {
  const actual = jest.requireActual('victory-core');
  return {
    ...actual,
    Arc: (props) => (
      <path
        data-testid="Arc"
        data-style={JSON.stringify(props.style || {})}
      />
    ),
  };
});

describe('BgBar', () => {
  const avgGlucoseDatum = {
    _y: 100,
  };

  const avgGlucoseDatumDisabled = {
    _y: 0,
  };

  const stdDevDatum = {
    ...avgGlucoseDatum,
    deviation: {
      value: 20,
    },
  };

  const stdDevDatumDisabled = {
    _y: 0,
    deviation: {
      value: 0,
    },
  };

  const defaultProps = {
    barWidth: 4,
    bgPrefs: {
      bgBounds: {
        veryHighThreshold: 300,
        targetUpperBound: 180,
        targetLowerBound: 70,
        veryLowThreshold: 54,
      },
      bgUnits: 'mg/dL',
    },
    chartLabelWidth: 80,
    datum: avgGlucoseDatum,
    domain: {
      x: [0, 1],
      y: [0, MGDL_CLAMP_TOP],
    },
    scale: {
      x: val => val,
      y: val => val,
    },
    width: 300,
  };

  const props = overrides => _.assign({}, defaultProps, overrides);

  afterEach(() => {
    cleanup();
  });

  it('should render without errors when required props provided', () => {
    const { container } = rtlRender(<BgBar {...defaultProps} />);
    expect(container.querySelector('.bgBar')).to.not.be.null;
  });

  context('showing Average Glucose', () => {
    it('should render the `bgScale` element', () => {
      const { container } = rtlRender(<BgBar {...props({ datum: avgGlucoseDatum })} />);
      expect(container.querySelectorAll('.bgScale')).to.have.length(1);
    });

    it('should render the `bgMean` element', () => {
      const { container } = rtlRender(<BgBar {...props({ datum: avgGlucoseDatum })} />);
      expect(container.querySelectorAll('.bgMean')).to.have.length(1);
    });

    it('should not render the `bgMean` element when disabled', () => {
      const { container } = rtlRender(<BgBar {...props({ datum: avgGlucoseDatumDisabled })} />);
      expect(container.querySelectorAll('.bgMean')).to.have.length(0);
    });

    it('should not render the `bgDeviation` element', () => {
      const { container } = rtlRender(<BgBar {...props({ datum: avgGlucoseDatum })} />);
      expect(container.querySelectorAll('.bgDeviation')).to.have.length(0);
    });
  });

  context('showing Standard Deviation', () => {
    it('should render the `bgScale` element', () => {
      const { container } = rtlRender(<BgBar {...props({ datum: stdDevDatum })} />);
      expect(container.querySelectorAll('.bgScale')).to.have.length(1);
    });

    it('should render the `bgDeviation` element', () => {
      const { container } = rtlRender(<BgBar {...props({ datum: stdDevDatum })} />);
      expect(container.querySelectorAll('.bgDeviation')).to.have.length(1);
    });

    it('should not render the `bgDeviation` element when disabled', () => {
      const { container } = rtlRender(<BgBar {...props({ datum: stdDevDatumDisabled })} />);
      expect(container.querySelectorAll('.bgDeviation')).to.have.length(0);
    });

    it('should not render the `bgMean` element', () => {
      const { container } = rtlRender(<BgBar {...props({ datum: stdDevDatum })} />);
      expect(container.querySelectorAll('.bgMean')).to.have.length(0);
    });
  });

  describe('bgScale', () => {
    const getBgScale = (container) => container.querySelector('.bgScale');

    it('should render a three-bar scale with arcs on each end', () => {
      const { container } = rtlRender(<BgBar {...defaultProps} />);
      const bgScale = getBgScale(container);
      const children = bgScale.children;
      expect(children).to.have.length(5);
      expect(children[0].getAttribute('data-testid')).to.equal('Arc');
      expect(children[1].getAttribute('data-testid')).to.equal('Rect');
      expect(children[2].getAttribute('data-testid')).to.equal('Rect');
      expect(children[3].getAttribute('data-testid')).to.equal('Rect');
      expect(children[4].getAttribute('data-testid')).to.equal('Arc');
    });

    it('should render the three-bar scale with the proper colors', () => {
      const { container } = rtlRender(<BgBar {...defaultProps} />);
      const bgScale = getBgScale(container);
      const children = bgScale.children;
      expect(JSON.parse(children[0].getAttribute('data-style')).fill).to.equal(colors.low);
      expect(JSON.parse(children[1].getAttribute('data-style')).fill).to.equal(colors.low);
      expect(JSON.parse(children[2].getAttribute('data-style')).fill).to.equal(colors.target);
      expect(JSON.parse(children[3].getAttribute('data-style')).fill).to.equal(colors.high);
      expect(JSON.parse(children[4].getAttribute('data-style')).fill).to.equal(colors.high);
    });

    it('should render the three-bar scale with the disabled color when disabled', () => {
      const { container } = rtlRender(<BgBar {...props({ datum: avgGlucoseDatumDisabled })} />);
      const bgScale = getBgScale(container);
      const children = bgScale.children;
      expect(JSON.parse(children[0].getAttribute('data-style')).fill).to.equal(colors.statDisabled);
      expect(JSON.parse(children[1].getAttribute('data-style')).fill).to.equal(colors.statDisabled);
      expect(JSON.parse(children[2].getAttribute('data-style')).fill).to.equal(colors.statDisabled);
      expect(JSON.parse(children[3].getAttribute('data-style')).fill).to.equal(colors.statDisabled);
      expect(JSON.parse(children[4].getAttribute('data-style')).fill).to.equal(colors.statDisabled);
    });

    it('should render proper widths for each section of the three-bar scale', () => {
      const { container } = rtlRender(<BgBar {...defaultProps} />);
      const bgScale = getBgScale(container);
      const children = bgScale.children;

      const {
        width,
        bgPrefs: { bgBounds },
        chartLabelWidth,
      } = defaultProps;

      // actual chart rendering width is corrected due to the chart labels taking some space
      const barRadius = 2;
      const widthCorrection = (width - chartLabelWidth) / width;
      expect(widthCorrection).to.equal(0.7333333333333333); // (220 / 300), as per default props

      const expectedWidths = {
        low: (bgBounds.targetLowerBound) * widthCorrection,
        target: (bgBounds.targetUpperBound - bgBounds.targetLowerBound) * widthCorrection,
        high: (MGDL_CLAMP_TOP - bgBounds.targetUpperBound) * widthCorrection,
      };

      expect(Number(children[1].getAttribute('data-width'))).to.equal(expectedWidths.low - barRadius);
      expect(Number(children[2].getAttribute('data-width'))).to.equal(expectedWidths.target);
      expect(Number(children[3].getAttribute('data-width'))).to.equal(expectedWidths.high - barRadius);
    });
  });

  describe('bgMean', () => {
    const getBgMean = (container) => container.querySelector('.bgMean');

    it('should render a bgMean point', () => {
      const { container } = rtlRender(<BgBar {...defaultProps} />);
      const bgMean = getBgMean(container);
      expect(bgMean.children).to.have.length(1);
      expect(bgMean.children[0].getAttribute('data-testid')).to.equal('Point');
    });

    it('should render the bg mean with the proper colors', () => {
      // target
      const { container, rerender } = rtlRender(<BgBar {...defaultProps} />);
      let bgMean = getBgMean(container);
      expect(JSON.parse(bgMean.children[0].getAttribute('data-style')).fill).to.equal(colors.target);

      // veryLow
      rerender(<BgBar {...props({ datum: { _y: 53 } })} />);
      bgMean = getBgMean(container);
      expect(JSON.parse(bgMean.children[0].getAttribute('data-style')).fill).to.equal(colors.low);

      // low
      rerender(<BgBar {...props({ datum: { _y: 69 } })} />);
      bgMean = getBgMean(container);
      expect(JSON.parse(bgMean.children[0].getAttribute('data-style')).fill).to.equal(colors.low);

      // high
      rerender(<BgBar {...props({ datum: { _y: 181 } })} />);
      bgMean = getBgMean(container);
      expect(JSON.parse(bgMean.children[0].getAttribute('data-style')).fill).to.equal(colors.high);

      // veryHigh
      rerender(<BgBar {...props({ datum: { _y: 251 } })} />);
      bgMean = getBgMean(container);
      expect(JSON.parse(bgMean.children[0].getAttribute('data-style')).fill).to.equal(colors.high);
    });
  });

  describe('bgDeviation', () => {
    const getBgDeviation = (container) => container.querySelector('.bgDeviation');

    it('should render 2 standard deviation markers', () => {
      const { container } = rtlRender(<BgBar {...props({ datum: stdDevDatum })} />);
      const bgDeviation = getBgDeviation(container);
      expect(bgDeviation.children).to.have.length(2);
      expect(bgDeviation.children[0].getAttribute('data-testid')).to.equal('Rect');
      expect(bgDeviation.children[1].getAttribute('data-testid')).to.equal('Rect');
    });

    it('should render the deviation markers with the proper colors', () => {
      // target - target
      const { container, rerender } = rtlRender(<BgBar {...props({ datum: stdDevDatum })} />);
      let bgDeviation = getBgDeviation(container);
      expect(JSON.parse(bgDeviation.children[0].getAttribute('data-style')).fill).to.equal(colors.target);
      expect(JSON.parse(bgDeviation.children[1].getAttribute('data-style')).fill).to.equal(colors.target);

      // veryLow - low
      rerender(<BgBar {...props({ datum: { _y: 50, deviation: { value: 18 } } })} />);
      bgDeviation = getBgDeviation(container);
      expect(JSON.parse(bgDeviation.children[0].getAttribute('data-style')).fill).to.equal(colors.low);
      expect(JSON.parse(bgDeviation.children[1].getAttribute('data-style')).fill).to.equal(colors.low);

      // low - target
      rerender(<BgBar {...props({ datum: { _y: 70, deviation: { value: 40 } } })} />);
      bgDeviation = getBgDeviation(container);
      expect(JSON.parse(bgDeviation.children[0].getAttribute('data-style')).fill).to.equal(colors.low);
      expect(JSON.parse(bgDeviation.children[1].getAttribute('data-style')).fill).to.equal(colors.target);

      // target - high
      rerender(<BgBar {...props({ datum: { _y: 160, deviation: { value: 40 } } })} />);
      bgDeviation = getBgDeviation(container);
      expect(JSON.parse(bgDeviation.children[0].getAttribute('data-style')).fill).to.equal(colors.target);
      expect(JSON.parse(bgDeviation.children[1].getAttribute('data-style')).fill).to.equal(colors.high);

      // high - veryHigh
      rerender(<BgBar {...props({ datum: { _y: 240, deviation: { value: 18 } } })} />);
      bgDeviation = getBgDeviation(container);
      expect(JSON.parse(bgDeviation.children[0].getAttribute('data-style')).fill).to.equal(colors.high);
      expect(JSON.parse(bgDeviation.children[1].getAttribute('data-style')).fill).to.equal(colors.high);
    });

    it('should not render when the deviation is greater than the mean, resulting in a negative low bar value', () => {
      // -1 low value
      const { container, rerender } = rtlRender(<BgBar {...props({ datum: { _y: 50, deviation: { value: 51 } } })} />);
      let bgDeviation = getBgDeviation(container);
      expect(bgDeviation).to.be.null;

      // 0 low value
      rerender(<BgBar {...props({ datum: { _y: 50, deviation: { value: 50 } } })} />);
      bgDeviation = getBgDeviation(container);
      expect(bgDeviation).to.be.null;

      // 1 low value
      rerender(<BgBar {...props({ datum: { _y: 50, deviation: { value: 49 } } })} />);
      bgDeviation = getBgDeviation(container);
      expect(bgDeviation).to.not.be.null;
      expect(bgDeviation.children).to.have.lengthOf(2);
    });

    it('should constrain the bars to render within the scale when the deviation would cause them to render outside of it', () => {
      // 1 to 499 -- scale only shows 0 to 400
      const { container } = rtlRender(<BgBar {...props({ datum: { _y: 250, deviation: { value: 249 } } })} />);
      const bgDeviation = getBgDeviation(container);

      const scaleWidth = defaultProps.width - defaultProps.chartLabelWidth;

      expect(Number(bgDeviation.children[0].getAttribute('data-x'))).to.equal(0);

      expect(scaleWidth).to.equal(220);
      expect(Number(bgDeviation.children[1].getAttribute('data-x'))).to.equal(217); // scaleWidth - 3 for bar thickness
    });
  });
});
