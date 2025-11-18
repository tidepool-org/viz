import React from 'react';
import { shallow, mount } from 'enzyme';

import { formatClassesAsSelector } from '../../../helpers/cssmodules';
import StatLegend from '../../../../src/components/common/stat/StatLegend';
import StatTooltip from '../../../../src/components/common/tooltips/StatTooltip';
import styles from '../../../../src/components/common/stat/StatLegend.css';
import colors from '../../../../src/styles/colors.css';

describe('StatLegend', () => {
  let wrapper;

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

  beforeEach(() => {
    wrapper = shallow(<StatLegend {...defaultProps} />);
  });

  it('should render legend item titles', () => {
    const items = wrapper.find(formatClassesAsSelector(styles.StatLegendItem));
    expect(items).to.have.length(3);
    expect(items.at(0).text()).to.contain('Other');
    expect(items.at(1).text()).to.contain('Basal');
    expect(items.at(2).text()).to.contain('Bolus');
  });

  it('should render legend item borders in proper colors and patterns based on id', () => {
    const items = wrapper.find(formatClassesAsSelector(styles.LegendPattern));
    expect(items.at(0).props().style.backgroundColor).to.equal(colors.insulin);
    expect(items.at(0).props().style.backgroundImage).to.contain('repeating-linear-gradient');
    expect(items.at(1).props().style.backgroundColor).to.equal(colors.basal);
    expect(items.at(1).props().style.backgroundImage).to.be.undefined;
    expect(items.at(2).props().style.backgroundColor).to.equal(colors.bolus);
    expect(items.at(2).props().style.backgroundImage).to.be.undefined;
  });

  describe('tooltip functionality', () => {
    let mountedWrapper;

    beforeEach(() => {
      mountedWrapper = mount(<StatLegend {...defaultProps} />);
    });

    it('should render info icons for items with annotations', () => {
      const tooltipIcons = mountedWrapper.find(formatClassesAsSelector(styles.tooltipIcon));
      expect(tooltipIcons).to.have.length(2); // Only insulin and bolus have annotations


      const insulinItem = mountedWrapper.find(formatClassesAsSelector(styles.StatLegendItemWrapper)).at(0);
      const basalItem = mountedWrapper.find(formatClassesAsSelector(styles.StatLegendItemWrapper)).at(1);
      const bolusItem = mountedWrapper.find(formatClassesAsSelector(styles.StatLegendItemWrapper)).at(2);
      console.log(insulinItem.debug());

      expect(insulinItem.find(formatClassesAsSelector(styles.tooltipIcon))).to.have.length(1);
      expect(basalItem.find(formatClassesAsSelector(styles.tooltipIcon))).to.have.length(0);
      expect(bolusItem.find(formatClassesAsSelector(styles.tooltipIcon))).to.have.length(1);
    });

    it('should not render tooltip initially', () => {
      const tooltip = mountedWrapper.find(StatTooltip);
      expect(tooltip).to.have.length(0);
    });

    it('should show tooltip on icon hover', () => {
      const firstTooltipIcon = mountedWrapper.find(formatClassesAsSelector(styles.tooltipIcon)).at(0).find('img');

      // Simulate mouse over
      firstTooltipIcon.simulate('mouseOver');

      const tooltip = mountedWrapper.find(StatTooltip);
      expect(tooltip).to.have.length(1);
      expect(tooltip.props().annotations).to.deep.equal(['This is a tooltip message', 'Second line of tooltip']);
    });
  });
});
