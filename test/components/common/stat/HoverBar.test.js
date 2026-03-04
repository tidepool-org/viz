import React from 'react';
import { render as rtlRender, cleanup } from '@testing-library/react/pure';

import HoverBar from '../../../../src/components/common/stat/HoverBar';
import colors from '../../../../src/styles/colors.css';

describe('HoverBar', () => {
  const width = 300;

  const defaultProps = {
    barSpacing: 4,
    barWidth: 4,
    chartLabelWidth: 80,
    cornerRadius: { top: 2 },
    domain: {
      x: [0, 1],
      y: [0, 1],
    },
    index: 0,
    scale: {
      x: val => val,
      y: () => width,
    },
    width,
    x: 80,
  };

  afterEach(() => {
    cleanup();
  });

  it('should render without errors when required props provided', () => {
    const { container } = rtlRender(<HoverBar {...defaultProps} />);
    // Component renders rect elements (Victory primitives)
    expect(container.querySelectorAll('rect').length).to.be.at.least(1);
  });

  it('should render a full-width transparent hover target area', () => {
    const { container } = rtlRender(<HoverBar {...defaultProps} />);
    const rects = container.querySelectorAll('rect');
    // Find the transparent hover target rect (full width)
    const hoverRect = Array.from(rects).find(r => {
      const w = Number(r.getAttribute('width'));
      return w === width;
    });
    expect(hoverRect).to.exist;
  });

  it('should render a properly colored bar background the full width of the rendering area', () => {
    const { container } = rtlRender(<HoverBar {...defaultProps} />);
    const rects = container.querySelectorAll('rect');
    // Find the bg rect (220px wide = width - chartLabelWidth)
    const bgRect = Array.from(rects).find(r => {
      const w = Number(r.getAttribute('width'));
      return w === 220;
    });
    expect(bgRect).to.exist;
  });

  it('should render a bar with a width corresponding to the x prop value, corrected for the rendering area width', () => {
    const { container } = rtlRender(<HoverBar {...defaultProps} />);
    // actual chart rendering width is corrected due to the chart labels taking some space
    const widthCorrection = (width - defaultProps.chartLabelWidth) / width;
    expect(widthCorrection).to.equal(0.7333333333333333);
    // The bar path should exist in the SVG
    const paths = container.querySelectorAll('path');
    expect(paths.length).to.be.at.least(1);
    // Victory Bar renders a <path d="M x,y ..."> — there is no `x` DOM attribute;
    // extract the starting x coordinate from the M command in the d attribute instead.
    // Victory centers the bar at x, so the path's left edge is at x - barWidth/2.
    const barPath = paths[0];
    const expectedBarX = defaultProps.x * widthCorrection - defaultProps.barWidth / 2;
    const dAttr = barPath.getAttribute('d') || '';
    const mMatch = dAttr.match(/M\s*(-?[\d.]+)/);
    const actualBarX = mMatch ? parseFloat(mMatch[1]) : NaN;
    expect(actualBarX).to.be.closeTo(expectedBarX, 0.001);
  });
});
