import React from 'react';
import _ from 'lodash';
import { render as rtlRender, cleanup } from '@testing-library/react/pure';

import BgBarLabel from '../../../../src/components/common/stat/BgBarLabel';

describe('BgBarLabel', () => {
  const defaultProps = {
    barWidth: 4,
    domain: {
      x: [0, 1],
      y: [0, 1],
    },
    scale: {
      x: val => val,
      y: val => val,
    },
    style: {},
    text: () => 'text!',
    width: 80,
  };

  const props = overrides => _.assign({}, defaultProps, overrides);

  afterEach(() => {
    cleanup();
  });

  it('should render the text prop', () => {
    const { container } = rtlRender(<BgBarLabel {...defaultProps} />);
    // VictoryLabel renders <text> elements inside an SVG
    const textEls = container.querySelectorAll('text');
    const allText = Array.from(textEls).map(t => t.textContent).join('');
    expect(allText).to.contain('text!');
  });

  it('should render the text element with the styles provided in the style prop', () => {
    const { container } = rtlRender(
      <BgBarLabel {...props({ style: { fill: 'mauve', fontSize: '40px' } })} />
    );
    const tspanEls = container.querySelectorAll('tspan');
    // Find tspan containing our text
    const textTspan = Array.from(tspanEls).find(el => el.textContent === 'text!');
    expect(textTspan).to.exist;
    const fillValue = textTspan.style.fill;
    if (fillValue) {
      expect(fillValue).to.contain('mauve');
    } else {
      expect(textTspan.getAttribute('style')).to.contain('fill:');
      expect(textTspan.getAttribute('style')).to.contain('mauve');
    }
  });
});
