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

import React from 'react';
import { render } from '@testing-library/react/pure';

import { formatClassesAsSelector } from '../../../helpers/cssmodules';

import CBGDateTraceLabel from '../../../../src/components/trends/cbg/CBGDateTraceLabel';
import styles from '../../../../src/components/trends/cbg/CBGDateTraceLabel.css';

describe('CBGDateTraceLabel', () => {
  const props = {
    focusedDateTrace: {
      data: {
        localDate: '2017-01-01',
      },
      position: {
        left: 10,
        yPositions: {
          top: 100,
          topMargin: 50,
        },
      },
    },
  };

  describe('with no date trace currently focused', () => {
    it('should render nothing', () => {
      const { container } = render(<CBGDateTraceLabel focusedDateTrace={null} />);
      expect(container.firstChild).to.be.null;
    });
  });

  describe('with a date trace focused', () => {
    it('should render a date label', () => {
      const { container } = render(<CBGDateTraceLabel {...props} />);
      const label = container.querySelectorAll(formatClassesAsSelector(styles.dateLabel));
      expect(label).to.have.length(1);
      expect(label[0].textContent).to.equal('Sunday, January 1');
    });
  });
});
