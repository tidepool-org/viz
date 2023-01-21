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

/* eslint-disable lodash/prefer-lodash-method */

import _ from 'lodash';
import i18next from 'i18next';
import Plotly from 'plotly.js';

const agpLogo = require('./images/capturAGP-logo.png');

import PrintView from './PrintView';
import {
  AGP_TIR_MIN_RENDER_HEIGHT,
  colors,
} from './utils/AGPConstants';

const t = i18next.t.bind(i18next);

class DailyPrintView extends PrintView {
  constructor(doc, data, opts) {
    super(doc, data, opts);

    // TODO: override with AGP colors
    this.colors = _.assign(this.colors, {
      axes: '#858585',
    });

    this.cbgData = _.get(data, 'data.current.data.cbg', []);
    this.cbgStats = _.get(data, 'data.current.stats', {});
    // console.log('this.cbgData', this.cbgData);
    // console.log('this.cbgStats', this.cbgStats);

    // console.log('this.data', this.data);
    // console.log('this.stats', this.stats);

    this.doc.addPage();
    this.initLayout();
  }

  newPage() {
    super.newPage(this.getDateRange(this.endpoints.range[0], this.endpoints.range[1] - 1));
  }

  initLayout() {
    this.setLayoutColumns({
      width: this.chartArea.width,
      gutter: 15,
      type: 'percentage',
      widths: [25.5, 49, 25.5],
    });
  }

  async render() {
    await this.renderStats();
  }

  async renderStats() {
    this.goToPage(0);
    this.goToLayoutColumnPosition(0);
    this.doc.text(t('hello stats'));
    this.doc.image(agpLogo, undefined, undefined, { width: 80 });

    const stat = this.stats.timeInRange;
    const statHasData = _.get(stat, 'data.total.value') > 0;

    if (statHasData) {
      const statDatums = _.get(stat, 'data.data', []);
      const statTotal = _.get(stat, 'data.total.value', 1);

      const tickValues = _.reduce(
        statDatums,
        (res, datum, i) => ([...res, (res[i - 1] || 0) + _.max([_.toNumber(datum.value) / statTotal * 100, AGP_TIR_MIN_RENDER_HEIGHT])]),
        [],
      );

      const data = _.map(statDatums, datum => ({
        x: [stat.id],
        y: [_.max([_.toNumber(datum.value) / statTotal * 100, AGP_TIR_MIN_RENDER_HEIGHT])],
        name: datum.id,
        type: 'bar',
        marker: {
          color: _.toNumber(datum.value) > 6 ? colors.bgRange[datum.id] : colors.bgRange.empty,
          line: {
            color: colors.line.range.divider,
            width: 4,
          },
        },
      }));

      const layout = {
        title: {
          font: {
            family: 'Arial',
            size: 12,
            color: colors.text.label,
          },
          text: 'Time In Range',
        },
        barmode: 'stack',
        showlegend: false,
        width: 300,
        yaxis: {
          tickvals: tickValues.slice(0, 4),
          ticktext: [
            this.bgBounds.veryLowThreshold,
            this.bgBounds.targetLowerBound,
            this.bgBounds.targetUpperBound,
            this.bgBounds.veryHighThreshold,
          ],
        },
      };

      const plotDataURL = await Plotly.toImage({ data, layout });
      // this.doc.image(plotDataURL, undefined, undefined, { width: 300 });
      this.doc.image(plotDataURL);
    }
  }
}

export default DailyPrintView;
