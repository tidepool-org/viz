import React from 'react';

import DataUtil from '../src/utils/DataUtil';

const patientId = 'abc123';
const dataUtil = new DataUtil();
dataUtil.addLocalData(patientId);

const props = {
  dataUtil,
  patientId,
};

const preview = {
  decorators: [
    (Story) => (
      <div>{Story(props)}</div>
    ),
  ],
};

export default preview;
