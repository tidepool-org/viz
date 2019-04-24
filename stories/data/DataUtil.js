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
import { storiesOf } from '@storybook/react';

import DataUtil from '../../src/utils/data2';

const stories = storiesOf('DataUtil', module);

let data;
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  data = require('../../local/blip-input.json');
} catch (e) {
  data = [];
}

const notes = `Run \`window.downloadInputData()\` from the console on a Tidepool Web data view.
Save the resulting file to the \`local/\` directory of viz as \`blip-input.json\`,
and then use this story to iterate on the Basics Print PDF outside of Tidepool Web!`;

const dataUtil = new DataUtil(data);

stories.add('dataUtil test', () => (
  <button
    onClick={() => console.log('click')}
  >
    Open PDF in new tab
  </button>
), { notes });
