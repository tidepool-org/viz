/* eslint-disable */
import React from 'react';
import { configure, addDecorator, addParameters } from '@storybook/react';
import { withNotes } from '@storybook/addon-notes';
import { withKnobs } from '@storybook/addon-knobs';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';

import DataUtil from '../src/utils/DataUtil';

addParameters({
  viewport: {
    viewports: {
      ...INITIAL_VIEWPORTS,
    },
  },
});

addDecorator(withNotes);
addDecorator(withKnobs);

let data;
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  data = _.flatten(_.map(require('../local/data.json'), v => v.data));
} catch (e) {
  data = { data: [] };
}

const patientId = 'abc123';
const dataUtil = new DataUtil();
dataUtil.addData(data, patientId);

const props = {
  dataUtil,
  patientId,
};

addDecorator(storyFn => (
  <div>{storyFn(props)}</div>
));

function loadStories() {
  const context = require.context('../stories', true, /.js$/); // Load .js files in /storybook
  context.keys().forEach(context);
}

configure(loadStories, module);
