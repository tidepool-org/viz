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

/* eslint-disable max-len */

import React from 'react';
import { render } from '@testing-library/react/pure';

import { detail } from '../../../helpers/scales';
const { detailXScale, detailBasalScale } = detail;

import Basal from '../../../../src/components/common/data/Basal';
import { getBasalSequencePaths } from '../../../../src/modules/render/basal';
import { getBasalSequences, getBasalPathGroups } from '../../../../src/utils/basal';

import { scheduledFlat, automatedAndScheduled, automated } from '../../../../data/basal/fixtures';

describe('Basal', () => {
  it('should return `null` if input `basals` prop is empty', () => {
    const { container } = render(
      <Basal basals={[]} xScale={detailXScale} yScale={detailBasalScale} />
    );
    expect(container.firstChild).to.be.null;
  });

  it('should return a `<g>` with as many `<path>s` as are calculated for the input basals', () => {
    const sequences = getBasalSequences(scheduledFlat);
    const paths = getBasalSequencePaths(sequences[0], detailXScale, detailBasalScale);
    const { container } = render(
      <Basal basals={scheduledFlat} xScale={detailXScale} yScale={detailBasalScale} />
    );
    expect(container.querySelectorAll(`#basals-${scheduledFlat[0].id}-thru-${scheduledFlat[1].id}`).length).to.equal(1);
    expect(container.querySelectorAll('path').length).to.equal(paths.length + 1);
  });

  it('should return automated and manual basal path and outline groupings', () => {
    const groups = getBasalPathGroups(automatedAndScheduled);
    const expectedGroupsLength = 3; // automated, manual, automated
    const expectedBordersLength = groups.length;
    const { container } = render(
      <Basal basals={automatedAndScheduled} xScale={detailXScale} yScale={detailBasalScale} />
    );

    expect(groups.length).to.equal(expectedGroupsLength);
    expect(container.querySelectorAll('path').length).to.equal(expectedGroupsLength + expectedBordersLength);
  });

  it('should return markers for each automated and manual basal path groupings, minus the first one', () => {
    const groups = getBasalPathGroups(automatedAndScheduled);
    const expectedGroupsLength = 3;
    const expectedMarkersLength = groups.length - 1;
    const { container } = render(
      <Basal basals={automatedAndScheduled} xScale={detailXScale} yScale={detailBasalScale} />
    );

    expect(groups.length).to.equal(expectedGroupsLength);

    const basalsGroup = container.querySelector(`#basals-${automatedAndScheduled[0].id}-thru-${automatedAndScheduled[automatedAndScheduled.length - 1].id}`);
    expect(basalsGroup).to.not.be.null;

    const markersGroup = basalsGroup.querySelectorAll(':scope > g');
    expect(markersGroup.length).to.equal(expectedMarkersLength);
    expect(basalsGroup.querySelectorAll(':scope > g line').length).to.equal(expectedMarkersLength);
    expect(basalsGroup.querySelectorAll(':scope > g circle').length).to.equal(expectedMarkersLength);
    expect(basalsGroup.querySelectorAll(':scope > g text').length).to.equal(expectedMarkersLength);
  });

  it('should not return markers if there is only one path grouping', () => {
    const groups = getBasalPathGroups(automated);
    const expectedGroupsLength = 1;
    const { container } = render(
      <Basal basals={automated} xScale={detailXScale} yScale={detailBasalScale} />
    );

    expect(groups.length).to.equal(expectedGroupsLength);

    const basalsGroup = container.querySelector(`#basals-${automated[0].id}-thru-${automated[automated.length - 1].id}`);
    expect(basalsGroup).to.not.be.null;

    const markersGroup = basalsGroup.querySelectorAll(':scope > g');
    expect(markersGroup.length).to.equal(0);
    expect(basalsGroup.querySelectorAll(':scope > g line').length).to.equal(0);
    expect(basalsGroup.querySelectorAll(':scope > g circle').length).to.equal(0);
    expect(basalsGroup.querySelectorAll(':scope > g text').length).to.equal(0);
  });
});
