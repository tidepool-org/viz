import React from 'react';

import DataUtil from '../src/utils/DataUtil';

let data;
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  data = require('../local/rawData.json');
  let dataSource = 'the Tidepool API';

  if (data?.data?.current?.data) {
    data = _.flatten(_.values(data.data.current.data));
    dataSource = 'a Tidepool Web console export';
  } else if (data?.[0].dataset) {
    data = _.flatten(_.map(data, v => v.data));
    dataSource = 'a Tidepool Account Tool export';
  }

  console.log(`Loading dataset provided by ${dataSource}`);
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

const preview = {
  decorators: [
    (Story) => (
      <div>{Story(props)}</div>
    ),
  ],
};

export default preview;
