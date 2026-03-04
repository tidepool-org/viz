/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2017, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 * == BSD2 LICENSE ==
 */

import _ from 'lodash';
import React from 'react';
import { render } from '@testing-library/react/pure';

import { formatClassesAsSelector } from '../../../helpers/cssmodules';
import { MGDL_UNITS } from '../../../../src/utils/constants';

import FocusedRangeLabels from '../../../../src/components/trends/common/FocusedRangeLabels';
import styles from '../../../../src/components/trends/common/FocusedRangeLabels.css';

describe('FocusedRangeLabels', () => {
  const props = {
    bgPrefs: {
      bgUnits: MGDL_UNITS,
    },
    focusedKeys: null,
    focusedRange: null,
    focusedSlice: null,
    timePrefs: {
      timezoneAware: true,
      timezoneName: 'US/Central',
    },
  };
  describe('with no smbg range or cbg slice segment focused', () => {
    let container;
    it('[cbg data] should render nothing', () => {
      const noFocusProps = _.assign({}, props, { dataType: 'cbg' });
      ({ container } = render(
        <FocusedRangeLabels {...noFocusProps} />
      ));
      expect(container.firstChild).to.be.null;
    });

    it('[smbg data] should render nothing', () => {
      const noFocusProps = _.assign({}, props, { dataType: 'smbg' });
      ({ container } = render(
        <FocusedRangeLabels {...noFocusProps} />
      ));
      expect(container.firstChild).to.be.null;
    });
  });

  describe('when a cbg slice segment is focused', () => {
    const focusedSlice = {
      data: {
        firstQuartile: 25,
        id: 'a1b2c3',
        max: 421,
        median: 100,
        min: 28,
        msFrom: 0,
        msTo: 1800000,
        msX: 900000,
        upperQuantile: 382,
        lowerQuantile: 67,
        thirdQuartile: 270,
      },
      position: {
        left: 10,
        tooltipLeft: false,
        yPositions: {
          firstQuartile: 25,
          max: 421,
          median: 100,
          min: 28,
          upperQuantile: 382,
          lowerQuantile: 67,
          thirdQuartile: 270,
          topMargin: 0,
        },
      },
    };

    describe('when median is focused', () => {
      it('should render nothing', () => {
        const medianFocusProps = _.assign({}, props, {
          dataType: 'cbg',
          focusedKeys: ['median'],
          focusedSlice,
        });
        const { container: medianFocusContainer } = render(
          <FocusedRangeLabels {...medianFocusProps} />
        );
        expect(medianFocusContainer.firstChild).to.be.null;
      });
    });

    describe('when bottom 10% focused', () => {
      let container;
      before(() => {
        const bottom10Props = _.assign({}, props, {
          dataType: 'cbg',
          focusedKeys: ['min', 'lowerQuantile'],
          focusedSlice,
        });
        ({ container } = render(
          <FocusedRangeLabels {...bottom10Props} />
        ));
      });

      it('should render a min and a lowerQuantile label', () => {
        const keys = ['lowerQuantile', 'min'];
        const labels = container.querySelectorAll(formatClassesAsSelector(styles.number));
        expect(labels).to.have.length(2);
        labels.forEach((label, i) => { // eslint-disable-line lodash/prefer-lodash-method
          expect(label.textContent).to.equal(String(focusedSlice.data[keys[i]]));
        });
      });

      it('should render a time range label', () => {
        const timeLabel = container.querySelectorAll(formatClassesAsSelector(styles.timeLabel));
        expect(timeLabel).to.have.length(1);
        expect(timeLabel[0].textContent).to.equal('12:00 am - 12:30 am');
      });
    });

    describe('when lower 15% focused', () => {
      let container;
      before(() => {
        const lower15Props = _.assign({}, props, {
          dataType: 'cbg',
          focusedKeys: ['lowerQuantile', 'firstQuartile'],
          focusedSlice,
        });
        ({ container } = render(
          <FocusedRangeLabels {...lower15Props} />
        ));
      });

      it('should render a lowerQuantile and a firstQuartile label', () => {
        const keys = ['firstQuartile', 'lowerQuantile'];
        const labels = container.querySelectorAll(formatClassesAsSelector(styles.number));
        expect(labels).to.have.length(2);
        labels.forEach((label, i) => { // eslint-disable-line lodash/prefer-lodash-method
          expect(label.textContent).to.equal(String(focusedSlice.data[keys[i]]));
        });
      });

      it('should render a time range label', () => {
        const timeLabel = container.querySelectorAll(formatClassesAsSelector(styles.timeLabel));
        expect(timeLabel).to.have.length(1);
        expect(timeLabel[0].textContent).to.equal('12:00 am - 12:30 am');
      });
    });

    describe('when interquartile range is focused', () => {
      let container;
      before(() => {
        const interquartileProps = _.assign({}, props, {
          dataType: 'cbg',
          focusedKeys: ['firstQuartile', 'thirdQuartile'],
          focusedSlice,
        });
        ({ container } = render(
          <FocusedRangeLabels {...interquartileProps} />
        ));
      });

      it('should render a firstQuartile and a thirdQuartile label', () => {
        const keys = ['thirdQuartile', 'firstQuartile'];
        const labels = container.querySelectorAll(formatClassesAsSelector(styles.number));
        expect(labels).to.have.length(2);
        labels.forEach((label, i) => { // eslint-disable-line lodash/prefer-lodash-method
          expect(label.textContent).to.equal(String(focusedSlice.data[keys[i]]));
        });
      });

      it('should render a time range label', () => {
        const timeLabel = container.querySelectorAll(formatClassesAsSelector(styles.timeLabel));
        expect(timeLabel).to.have.length(1);
        expect(timeLabel[0].textContent).to.equal('12:00 am - 12:30 am');
      });
    });

    describe('when upper 15% focused', () => {
      let container;
      before(() => {
        const upper15Props = _.assign({}, props, {
          dataType: 'cbg',
          focusedKeys: ['thirdQuartile', 'upperQuantile'],
          focusedSlice,
        });
        ({ container } = render(
          <FocusedRangeLabels {...upper15Props} />
        ));
      });

      it('should render a thirdQuartile and a upperQuantile label', () => {
        const keys = ['upperQuantile', 'thirdQuartile'];
        const labels = container.querySelectorAll(formatClassesAsSelector(styles.number));
        expect(labels).to.have.length(2);
        labels.forEach((label, i) => { // eslint-disable-line lodash/prefer-lodash-method
          expect(label.textContent).to.equal(String(focusedSlice.data[keys[i]]));
        });
      });

      it('should render a time range label', () => {
        const timeLabel = container.querySelectorAll(formatClassesAsSelector(styles.timeLabel));
        expect(timeLabel).to.have.length(1);
        expect(timeLabel[0].textContent).to.equal('12:00 am - 12:30 am');
      });
    });

    describe('when top 10% focused', () => {
      let container;
      before(() => {
        const lower15 = _.assign({}, props, {
          dataType: 'cbg',
          focusedKeys: ['upperQuantile', 'max'],
          focusedSlice,
        });
        ({ container } = render(
          <FocusedRangeLabels {...lower15} />
        ));
      });

      it('should render a upperQuantile and a max label', () => {
        const keys = ['max', 'upperQuantile'];
        const labels = container.querySelectorAll(formatClassesAsSelector(styles.number));
        expect(labels).to.have.length(2);
        labels.forEach((label, i) => { // eslint-disable-line lodash/prefer-lodash-method
          expect(label.textContent).to.equal(String(focusedSlice.data[keys[i]]));
        });
      });

      it('should render a time range label', () => {
        const timeLabel = container.querySelectorAll(formatClassesAsSelector(styles.timeLabel));
        expect(timeLabel).to.have.length(1);
        expect(timeLabel[0].textContent).to.equal('12:00 am - 12:30 am');
      });
    });
  });

  describe('when an smbg range is focused', () => {
    const focusedRange = {
      data: {
        id: '81000000',
        max: 300,
        mean: 180,
        min: 70,
        msX: 81000000,
        msFrom: 75600000,
        msTo: 86400000,
      },
      position: {
        left: 880,
        tooltipLeft: true,
        yPositions: {
          max: 250,
          mean: 300,
          min: 400,
        },
      },
    };
    const smbgProps = _.assign({}, props, {
      dataType: 'smbg',
      focusedRange,
    });
    let container;
    before(() => {
      ({ container } = render(
        <FocusedRangeLabels {...smbgProps} />
      ));
    });

    it('should render min, mean, and max labels', () => {
      const keys = ['max', 'mean', 'min'];
      const labels = container.querySelectorAll(formatClassesAsSelector(styles.number));
      expect(labels).to.have.length(3);
      labels.forEach((label, i) => { // eslint-disable-line lodash/prefer-lodash-method
        expect(label.textContent.search(String(focusedRange.data[keys[i]]))).to.not.equal(-1);
      });
    });

    it('should *not* render a separate time range label', () => {
      const separateTimeLabel = container.querySelectorAll(formatClassesAsSelector(styles.separateTimeLabel));
      expect(separateTimeLabel).to.have.length(0);
    });

    it('should render the time range in tooltip title text', () => {
      const timeTooltipHeader = container.querySelectorAll(formatClassesAsSelector(styles.explainerText));
      expect(timeTooltipHeader).to.have.length(1);
      expect(timeTooltipHeader[0].textContent).to.equal('9:00 pm - 12:00 am');
    });
  });
});
