import React from 'react';
import { render as rtlRender, cleanup } from '@testing-library/react/pure';
import _ from 'lodash';

import HoverBarLabel from '../../../../src/components/common/stat/HoverBarLabel';

// Mock VictoryTooltip so its text content is always rendered (not gated by active prop)
// Also mock TextSize so approximateTextSize returns non-zero in jsdom
jest.mock('victory', () => {
  const actual = jest.requireActual('victory');
  return {
    ...actual,
    TextSize: {
      ...actual.TextSize,
      approximateTextSize: (text, style) => ({
        width: text ? text.length * 8 : 0,
        height: (style && style.fontSize) || 14,
      }),
    },
    VictoryTooltip: (props) => {
      const text = typeof props.text === 'function' ? props.text(props.datum) : props.text;
      return (
        <g
          data-testid="VictoryTooltip"
          data-style={JSON.stringify(props.style || {})}
        >
          <text><tspan>{text}</tspan></text>
        </g>
      );
    },
  };
});

describe('HoverBarLabel', () => {
  const defaultProps = {
    barWidth: 30,
    isDisabled: () => false,
    domain: {
      x: [0, 1],
      y: [0, 1],
    },
    style: {},
    scale: {
      x: val => val,
      y: val => val,
    },
    text: () => ['text!', 'suffix!'],
    tooltipText: () => 'tooltip!',
  };

  const props = overrides => _.assign({}, defaultProps, overrides);

  afterEach(() => {
    cleanup();
  });

  it('should render the a text prop for the value and suffix text', () => {
    const { container } = rtlRender(<HoverBarLabel {...defaultProps} />);
    const tspans = container.querySelectorAll('tspan');
    const texts = Array.from(tspans).map(t => t.textContent);
    expect(texts).to.include('text!');
    expect(texts).to.include('suffix!');
  });

  it('should render the text element with the styles provided in the style prop', () => {
    const { container, rerender } = rtlRender(<HoverBarLabel {...defaultProps} />);
    rerender(<HoverBarLabel {...props({ style: { fill: 'mauve', fontSize: '40px' } })} />);
    const tspans = container.querySelectorAll('tspan');
    const valueTspan = Array.from(tspans).find(t => t.textContent === 'text!');
    expect(valueTspan).to.not.be.undefined;
    const styleAttr = valueTspan.getAttribute('style') || '';
    const fillValue = valueTspan.style.fill;
    const fontSizeValue = valueTspan.style.fontSize;
    if (fillValue) {
      expect(fillValue).to.contain('mauve');
    } else {
      expect(styleAttr).to.contain('mauve');
    }
    if (fontSizeValue) {
      expect(fontSizeValue).to.contain('40');
    } else {
      expect(styleAttr).to.contain('40');
    }
  });

  it('should render the tooltip text', () => {
    const { container } = rtlRender(<HoverBarLabel {...defaultProps} />);
    const tooltip = container.querySelector('[data-testid="VictoryTooltip"]');
    expect(tooltip).to.not.be.null;
    const tspans = tooltip.querySelectorAll('tspan');
    expect(Array.from(tspans).find(t => t.textContent === 'tooltip!')).to.not.be.undefined;
  });

  it('should render the tooltip element with the styles provided in the style prop', () => {
    const { container, rerender } = rtlRender(<HoverBarLabel {...defaultProps} />);
    rerender(<HoverBarLabel {...props({ style: { fill: 'mauve', fontSize: '40px' } })} />);
    const tooltip = container.querySelector('[data-testid="VictoryTooltip"]');
    expect(tooltip).to.not.be.null;
    const styleData = JSON.parse(tooltip.getAttribute('data-style'));
    expect(styleData.fill).to.equal('mauve');
  });

  it('should enforce the tooltip fontsize to the minimum of half the bar width or 12', () => {
    const { container, rerender } = rtlRender(<HoverBarLabel {...defaultProps} />);
    rerender(<HoverBarLabel {...props({ barWidth: 30 })} />);
    let tooltip = container.querySelector('[data-testid="VictoryTooltip"]');
    let styleData = JSON.parse(tooltip.getAttribute('data-style'));
    expect(styleData.fontSize).to.equal(12);

    rerender(<HoverBarLabel {...props({ barWidth: 20 })} />);
    tooltip = container.querySelector('[data-testid="VictoryTooltip"]');
    styleData = JSON.parse(tooltip.getAttribute('data-style'));
    expect(styleData.fontSize).to.equal(10);
  });
});
