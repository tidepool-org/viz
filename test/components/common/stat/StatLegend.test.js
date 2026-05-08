import React from 'react';
import { render as rtlRender, cleanup, fireEvent } from '@testing-library/react/pure';

import { formatClassesAsSelector } from '../../../helpers/cssmodules';
import StatLegend from '../../../../src/components/common/stat/StatLegend';
import styles from '../../../../src/components/common/stat/StatLegend.css';
import colors from '../../../../src/styles/colors.css';

jest.mock('../../../../src/components/common/tooltips/StatTooltip', () => (props) => (
  <div data-testid="StatTooltip" data-annotations={JSON.stringify(props.annotations)} />
));

describe('StatLegend', () => {
  const defaultProps = {
    items: [
      {
        id: 'insulin',
        legendTitle: 'Other',
        pattern: { id: 'diagonalStripes', color: 'rgba(0, 0, 0, 0.15)' },
        annotations: ['This is a tooltip message', 'Second line of tooltip'],
      },
      {
        id: 'basal',
        legendTitle: 'Basal',
      },
      {
        id: 'bolus',
        legendTitle: 'Bolus',
        annotations: ['Bolus tooltip message'],
      },
    ],
  };

  afterEach(() => {
    cleanup();
  });

  it('should render legend item titles', () => {
    const { container } = rtlRender(<StatLegend {...defaultProps} />);
    const items = container.querySelectorAll(formatClassesAsSelector(styles.StatLegendItem));
    expect(items).to.have.length(3);
    expect(items[0].textContent).to.contain('Other');
    expect(items[1].textContent).to.contain('Basal');
    expect(items[2].textContent).to.contain('Bolus');
  });

  it('should render legend item borders in proper colors and patterns based on id', () => {
    // jsdom (cssstyle 2.x) does not support repeating-linear-gradient in inline styles,
    // so we spy on getLegendPatternStyle to verify the computed style objects directly.
    const spy = jest.spyOn(StatLegend.prototype, 'getLegendPatternStyle');
    rtlRender(<StatLegend {...defaultProps} />);
    const results = spy.mock.results.map(r => r.value);
    expect(results[0].backgroundColor).to.equal(colors.insulin);
    expect(results[0].backgroundImage).to.contain('repeating-linear-gradient');
    expect(results[1].backgroundColor).to.equal(colors.basal);
    expect(results[1].backgroundImage).to.be.undefined;
    expect(results[2].backgroundColor).to.equal(colors.bolus);
    expect(results[2].backgroundImage).to.be.undefined;
    spy.mockRestore();
  });

  describe('tooltip functionality', () => {
    it('should render info icons for items with annotations', () => {
      const { container } = rtlRender(<StatLegend {...defaultProps} />);
      const tooltipIcons = container.querySelectorAll(formatClassesAsSelector(styles.tooltipIcon));
      expect(tooltipIcons).to.have.length(2); // Only insulin and bolus have annotations

      const wrappers = container.querySelectorAll(formatClassesAsSelector(styles.StatLegendItemWrapper));
      expect(wrappers[0].querySelectorAll(formatClassesAsSelector(styles.tooltipIcon))).to.have.length(1);
      expect(wrappers[1].querySelectorAll(formatClassesAsSelector(styles.tooltipIcon))).to.have.length(0);
      expect(wrappers[2].querySelectorAll(formatClassesAsSelector(styles.tooltipIcon))).to.have.length(1);
    });

    it('should not render tooltip initially', () => {
      const { container } = rtlRender(<StatLegend {...defaultProps} />);
      const tooltip = container.querySelector('[data-testid="StatTooltip"]');
      expect(tooltip).to.be.null;
    });

    it('should show tooltip on icon hover', () => {
      const { container } = rtlRender(<StatLegend {...defaultProps} />);
      const firstTooltipIcon = container.querySelectorAll(formatClassesAsSelector(styles.tooltipIcon))[0].querySelector('img');

      // Simulate mouse over
      fireEvent.mouseOver(firstTooltipIcon);

      const tooltip = container.querySelector('[data-testid="StatTooltip"]');
      expect(tooltip).to.not.be.null;
      expect(JSON.parse(tooltip.getAttribute('data-annotations'))).to.deep.equal(['This is a tooltip message', 'Second line of tooltip']);
    });
  });
});
