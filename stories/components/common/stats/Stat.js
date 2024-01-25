import React from 'react';
import _ from 'lodash';

import { storiesOf } from '@storybook/react';
import { select, button, boolean } from '@storybook/addon-knobs';

import Stat from '../../../../src/components/common/stat/Stat';
import { MGDL_UNITS, MMOLL_UNITS, MS_IN_DAY, MGDL_CLAMP_TOP, MMOLL_CLAMP_TOP, MGDL_PER_MMOLL } from '../../../../src/utils/constants';
import { getSum, statFormats, statTypes } from '../../../../src/utils/stat';

const bgPrefsOptions = {
  [MGDL_UNITS]: MGDL_UNITS,
  [MMOLL_UNITS]: MMOLL_UNITS,
};

const bgPrefsValues = {
  [MGDL_UNITS]: {
    bgBounds: {
      veryHighThreshold: 250,
      targetUpperBound: 180,
      targetLowerBound: 70,
      veryLowThreshold: 54,
    },
    bgUnits: MGDL_UNITS,
  },
  [MMOLL_UNITS]: {
    bgBounds: {
      veryHighThreshold: 13.9,
      targetUpperBound: 10.0,
      targetLowerBound: 3.9,
      veryLowThreshold: 3.0,
    },
    bgUnits: MMOLL_UNITS,
  },
};

const chartHeightOptions = {
  '0 (default fluid)': 0,
  80: 80,
  100: 100,
};

const convertPercentageToDayDuration = value => (value / 100) * MS_IN_DAY;

const randomValueByType = (type, bgUnits, opts = {}) => {
  const isMGDL = bgUnits === MGDL_UNITS;
  const {
    deviation,
  } = opts;

  switch (type) {
    case 'duration':
      return convertPercentageToDayDuration(_.random(0, 100, true));

    case 'units':
      return _.random(20, 100, true);

    case 'gmi':
      return _.random(4, 15, true);

    case 'carb':
      return {
        grams: _.random(0, 100, true),
        exchanges: _.random(0, 7, true),
      };

    case 'cv':
      return _.random(24, 40, true);

    case 'sensorUsage':
      return _.random(30, 100, true);

    case 'deviation':
      return _.random(
        isMGDL ? 12 : 12 / MGDL_PER_MMOLL,
        isMGDL ? 48 : 48 / MGDL_PER_MMOLL,
        true
      );

    case 'count':
      return _.random(0, 3);

    case 'bg':
      return _.random(
        isMGDL ? 18 + deviation : 1 + deviation,
        isMGDL ? MGDL_CLAMP_TOP - deviation : MMOLL_CLAMP_TOP - deviation,
        true
      );

    default:
      return _.random(0, 1, true);
  }
};

const generateRandomData = (data, type, bgUnits) => {
  const deviation = { value: randomValueByType('deviation', bgUnits) };

  const randomData = _.assign({}, data, {
    data: _.map(data.data, (d) => (_.assign({}, d, {
      value: randomValueByType(type, bgUnits, {
        deviation: d.deviation ? deviation.value : 0,
      }),
      deviation: d.deviation ? deviation : undefined,
    }))),
  });

  if (randomData.total) {
    randomData.total = _.assign({}, data.total, { value: getSum(randomData.data) });
  }

  return randomData;
};

const generateEmptyData = (data) => {
  const randomData = _.assign({}, data, {
    data: _.map(data.data, (d) => (_.assign({}, d, {
      value: -1,
      deviation: d.deviation
        ? _.assign(d.deviation, { value: -1 })
        : undefined,
    }))),
  });

  if (randomData.total) {
    randomData.total = _.assign({}, data.total, { value: getSum(randomData.data) });
  }

  return randomData;
};

/* eslint-disable react/prop-types */
const Container = (props) => (
  <div
    style={{
      background: '#f6f6f6',
      border: '1px solid #eee',
      margin: props.responsive ? '50px' : '50px auto',
      padding: '20px',
      width: props.responsive ? 'auto' : '320px',
    }}
  >{props.children}
  </div>
);
/* eslint-enable react/prop-types */

const stories = storiesOf('Stat', module);

let timeInRangeData = {
  data: [
    {
      id: 'veryLow',
      value: convertPercentageToDayDuration(0.04),
      title: 'Time Below Range',
      legendTitle: '<54',
    },
    {
      id: 'low',
      value: convertPercentageToDayDuration(3.96),
      title: 'Time Below Range',
      legendTitle: '54-70',
    },
    {
      id: 'target',
      value: convertPercentageToDayDuration(70),
      title: 'Time In Range',
      legendTitle: '70-180',
    },
    {
      id: 'high',
      value: convertPercentageToDayDuration(16),
      title: 'Time Above Range',
      legendTitle: '180-250',
    },
    {
      id: 'veryHigh',
      value: convertPercentageToDayDuration(10),
      title: 'Time Above Range',
      legendTitle: '>250',
    },
  ],
};
timeInRangeData.total = { value: getSum(timeInRangeData.data) };
timeInRangeData.dataPaths = {
  summary: [
    'data',
    _.findIndex(timeInRangeData.data, { id: 'target' }),
  ],
};

stories.add('Time In Range', () => {
  const responsive = boolean('responsive', false);
  const chartHeight = select('chartHeight', chartHeightOptions, chartHeightOptions['0 (default fluid)']);
  const bgUnits = select('BG Units', bgPrefsOptions, bgPrefsOptions[MGDL_UNITS]);
  const bgPrefs = bgPrefsValues[bgUnits];
  const alwaysShowTooltips = boolean('alwaysShowTooltips', true);
  const collapsible = boolean('collapsible', false);
  const isOpened = boolean('isOpened', true);
  const legend = boolean('legend', true);
  const muteOthersOnHover = boolean('muteOthersOnHover', true);
  const reverseLegendOrder = boolean('reverseLegendOrder', true);

  button('Random Data', () => {
    timeInRangeData = generateRandomData(timeInRangeData, 'duration');
  });

  button('Empty Data', () => {
    timeInRangeData = generateEmptyData(timeInRangeData);
  });

  return (
    <Container responsive={responsive}>
      <Stat
        alwaysShowTooltips={alwaysShowTooltips}
        annotations={[
          'Based on 70% CGM data availability for this view.',
        ]}
        bgPrefs={bgPrefs}
        chartHeight={chartHeight}
        collapsible={collapsible}
        data={timeInRangeData}
        dataFormat={{
          label: statFormats.percentage,
          summary: statFormats.percentage,
          tooltip: statFormats.duration,
          tooltipTitle: statFormats.bgRange,
        }}
        isOpened={isOpened}
        legend={legend}
        muteOthersOnHover={muteOthersOnHover}
        hideSummaryUnits
        reverseLegendOrder={reverseLegendOrder}
        title="Time In Range"
        type={statTypes.barHorizontal}
        units={bgUnits}
      />
    </Container>
  );
});

let readingsInRangeData = {
  data: [
    {
      id: 'veryLow',
      value: 0,
      title: 'Readings Below Range',
      legendTitle: '<54',
    },
    {
      id: 'low',
      value: 1,
      title: 'Readings Below Range',
      legendTitle: '54-70',
    },
    {
      id: 'target',
      value: 0,
      title: 'Readings In Range',
      legendTitle: '70-180',
    },
    {
      id: 'high',
      value: 2,
      title: 'Readings Above Range',
      legendTitle: '180-250',
    },
    {
      id: 'veryHigh',
      value: 1,
      title: 'Readings Above Range',
      legendTitle: '>250',
    },
  ],
};
readingsInRangeData.total = { value: getSum(readingsInRangeData.data) };
readingsInRangeData.dataPaths = {
  summary: [
    'data',
    _.findIndex(readingsInRangeData.data, { id: 'target' }),
  ],
};

stories.add('Readings In Range', () => {
  const responsive = boolean('responsive', false);
  const chartHeight = select('chartHeight', chartHeightOptions, chartHeightOptions['0 (default fluid)']);
  const bgUnits = select('BG Units', bgPrefsOptions, bgPrefsOptions[MGDL_UNITS]);
  const bgPrefs = bgPrefsValues[bgUnits];
  const alwaysShowTooltips = boolean('alwaysShowTooltips', true);
  const collapsible = boolean('collapsible', true);
  const isOpened = boolean('isOpened', true);
  const legend = boolean('legend', true);
  const muteOthersOnHover = boolean('muteOthersOnHover', true);
  const reverseLegendOrder = boolean('reverseLegendOrder', true);

  button('Random Data', () => {
    readingsInRangeData = generateRandomData(readingsInRangeData, 'count');
  });

  button('Empty Data', () => {
    readingsInRangeData = generateEmptyData(readingsInRangeData);
  });

  return (
    <Container responsive={responsive}>
      <Stat
        alwaysShowTooltips={alwaysShowTooltips}
        annotations={[
          'Based on 7 SMBG readings for this view.',
        ]}
        bgPrefs={bgPrefs}
        chartHeight={chartHeight}
        collapsible={collapsible}
        data={readingsInRangeData}
        dataFormat={{
          label: statFormats.percentage,
          summary: statFormats.percentage,
          tooltip: statFormats.bgCount,
          tooltipTitle: statFormats.bgRange,
        }}
        isOpened={isOpened}
        legend={legend}
        muteOthersOnHover={muteOthersOnHover}
        hideSummaryUnits
        reverseLegendOrder={reverseLegendOrder}
        title="Readings In Range"
        type={statTypes.barHorizontal}
        units={bgUnits}
      />
    </Container>
  );
});

let timeInAutoData = {
  data: [
    {
      id: 'basal',
      value: convertPercentageToDayDuration(30),
      title: 'Time In Manual Mode',
      legendTitle: 'Manual Mode',
    },
    {
      id: 'basalAutomated',
      value: convertPercentageToDayDuration(70),
      title: 'Time In Auto Mode',
      legendTitle: 'Auto Mode',
    },
  ],
};
timeInAutoData.total = { value: getSum(timeInAutoData.data) };
timeInAutoData.dataPaths = {
  summary: [
    'data',
    _.findIndex(timeInAutoData.data, { id: 'basalAutomated' }),
  ],
};

stories.add('Time In Auto', () => {
  const responsive = boolean('responsive', false);
  const chartHeight = select('chartHeight', chartHeightOptions, chartHeightOptions['0 (default fluid)']);
  const collapsible = boolean('collapsible', false);
  const alwaysShowTooltips = boolean('alwaysShowTooltips', true);
  const isOpened = boolean('isOpened', true);
  const legend = boolean('legend', true);
  const muteOthersOnHover = boolean('muteOthersOnHover', true);

  button('Random Data', () => {
    timeInAutoData = generateRandomData(timeInAutoData, 'duration');
  });

  button('Empty Data', () => {
    timeInAutoData = generateEmptyData(timeInAutoData);
  });

  return (
    <Container responsive={responsive}>
      <Stat
        alwaysShowTooltips={alwaysShowTooltips}
        annotations={[
          'Based on 50% pump data availability for this view.',
        ]}
        chartHeight={chartHeight}
        collapsible={collapsible}
        data={timeInAutoData}
        dataFormat={{
          label: statFormats.percentage,
          summary: statFormats.percentage,
          tooltip: statFormats.duration,
        }}
        isOpened={isOpened}
        legend={legend}
        muteOthersOnHover={muteOthersOnHover}
        title="Time In Auto Mode"
        type={statTypes.barHorizontal}
      />
    </Container>
  );
});

let timeInOverrideData = {
  data: [
    {
      id: 'physicalActivity',
      value: convertPercentageToDayDuration(7),
      title: 'Time In Exercise',
      legendTitle: 'Exercise',
    },
    {
      id: 'sleep',
      value: convertPercentageToDayDuration(36),
      title: 'Time In Sleep',
      legendTitle: 'Sleep',
    },
  ],
};
timeInOverrideData.sum = { value: getSum(timeInOverrideData.data) };
timeInOverrideData.total = { value: MS_IN_DAY };
timeInOverrideData.dataPaths = {
  summary: 'sum',
};

stories.add('Time In Override', () => {
  const responsive = boolean('responsive', false);
  const chartHeight = select('chartHeight', chartHeightOptions, chartHeightOptions['0 (default fluid)']);
  const collapsible = boolean('collapsible', false);
  const alwaysShowTooltips = boolean('alwaysShowTooltips', true);
  const isOpened = boolean('isOpened', true);
  const legend = boolean('legend', true);
  const muteOthersOnHover = boolean('muteOthersOnHover', true);

  button('Random Data', () => {
    timeInOverrideData = generateRandomData(timeInOverrideData, 'duration');
  });

  button('Empty Data', () => {
    timeInOverrideData = generateEmptyData(timeInOverrideData);
  });

  return (
    <Container responsive={responsive}>
      <Stat
        alwaysShowTooltips={alwaysShowTooltips}
        annotations={[
          'Based on 50% pump data availability for this view.',
        ]}
        chartHeight={chartHeight}
        collapsible={collapsible}
        data={timeInOverrideData}
        dataFormat={{
          label: statFormats.percentage,
          summary: statFormats.percentage,
          tooltip: statFormats.duration,
        }}
        isOpened={isOpened}
        legend={legend}
        muteOthersOnHover={muteOthersOnHover}
        title="Time In Activity"
        type={statTypes.barHorizontal}
      />
    </Container>
  );
});

let totalInsulinData = {
  data: [
    {
      id: 'bolus',
      value: 49.5,
      title: 'Bolus Insulin',
      legendTitle: 'Bolus',
    },
    {
      id: 'basal',
      value: 62.9,
      title: 'Basal Insulin',
      legendTitle: 'Basal',
    },
  ],
};
totalInsulinData.total = { id: 'insulin', value: getSum(totalInsulinData.data) };
totalInsulinData.dataPaths = {
  summary: 'total',
  title: 'total',
};

stories.add('Total Insulin', () => {
  const responsive = boolean('responsive', false);
  const chartHeight = select('chartHeight', chartHeightOptions, chartHeightOptions['0 (default fluid)']);
  const collapsible = boolean('collapsible', false);
  const alwaysShowTooltips = boolean('alwaysShowTooltips', true);
  const isOpened = boolean('isOpened', true);
  const legend = boolean('legend', true);
  const muteOthersOnHover = boolean('muteOthersOnHover', true);

  button('Random Data', () => {
    totalInsulinData = generateRandomData(totalInsulinData, 'units');
  });

  button('Empty Data', () => {
    totalInsulinData = generateEmptyData(totalInsulinData);
  });

  return (
    <Container responsive={responsive}>
      <Stat
        alwaysShowTooltips={alwaysShowTooltips}
        annotations={[
          'Based on 50% pump data availability for this view.',
        ]}
        chartHeight={chartHeight}
        collapsible={collapsible}
        data={totalInsulinData}
        dataFormat={{
          label: statFormats.percentage,
          summary: statFormats.units,
          title: statFormats.units,
          tooltip: statFormats.units,
        }}
        isOpened={isOpened}
        legend={legend}
        muteOthersOnHover={muteOthersOnHover}
        title="Total Insulin"
        type={statTypes.barHorizontal}
      >
        <label htmlFor="no-bolus" style={{ 'font-size': '.8em' }}>
          <input id="no-bolus" type="checkbox" style={{ margin: '0 .5em 0 0' }} />
          <span style={{ position: 'relative', top: '-.1em' }}>
            Exclude days with no boluses
          </span>
        </label>
      </Stat>
    </Container>
  );
});

let averageGlucoseData = {
  data: [
    {
      value: 101,
    },
  ],
};
averageGlucoseData.dataPaths = {
  summary: 'data.0',
};

let averageGlucoseDataMmol = _.assign({}, averageGlucoseData, {
  data: _.map(averageGlucoseData.data, d => _.assign({}, d, { value: d.value / MGDL_PER_MMOLL })),
});

let averageGlucoseDataUnits = bgPrefsOptions[MGDL_UNITS];

stories.add('Average Glucose', () => {
  const responsive = boolean('responsive', false);
  const collapsible = boolean('collapsible', false);
  const isOpened = boolean('isOpened', true);
  averageGlucoseDataUnits = select('BG Units', bgPrefsOptions, bgPrefsOptions[MGDL_UNITS]);
  const bgPrefs = bgPrefsValues[averageGlucoseDataUnits];

  button('Random Data', () => {
    if (averageGlucoseDataUnits === MGDL_UNITS) {
      averageGlucoseData = generateRandomData(averageGlucoseData, 'bg', averageGlucoseDataUnits);
    } else {
      averageGlucoseDataMmol = generateRandomData(averageGlucoseDataMmol, 'bg', averageGlucoseDataUnits);
    }
  });

  button('Empty Data', () => {
    if (averageGlucoseDataUnits === MGDL_UNITS) {
      averageGlucoseData = generateEmptyData(averageGlucoseData);
    } else {
      averageGlucoseDataMmol = generateEmptyData(averageGlucoseDataMmol);
    }
  });

  return (
    <Container responsive={responsive}>
      <Stat
        annotations={[
          'Based on 70% CGM data availability for this view.',
          'Average Blood Glucose (mean) is all glucose values added together, divided by the number of readings.',
        ]}
        bgPrefs={bgPrefs}
        collapsible={collapsible}
        data={averageGlucoseDataUnits === MGDL_UNITS ? averageGlucoseData : averageGlucoseDataMmol}
        dataFormat={{
          label: statFormats.bgValue,
          summary: statFormats.bgValue,
        }}
        isOpened={isOpened}
        title="Average Glucose"
        type={statTypes.barBg}
        units={averageGlucoseDataUnits}
      />
    </Container>
  );
});

let standardDevData = {
  data: [
    {
      value: 101,
      deviation: {
        value: 25,
      },
    },
  ],
};
standardDevData.dataPaths = {
  summary: 'data.0.deviation',
  title: 'data.0',
};

let standardDevDataMmol = _.assign({}, standardDevData, {
  data: _.map(standardDevData.data, d => _.assign({}, d, {
    value: d.value / MGDL_PER_MMOLL,
    deviation: { value: d.deviation.value / MGDL_PER_MMOLL },
  })),
});

let standardDevDataUnits = bgPrefsOptions[MGDL_UNITS];

stories.add('Standard Deviation', () => {
  const responsive = boolean('responsive', false);
  const collapsible = boolean('collapsible', false);
  const isOpened = boolean('isOpened', true);
  standardDevDataUnits = select('BG Units', bgPrefsOptions, bgPrefsOptions[MGDL_UNITS]);
  const bgPrefs = bgPrefsValues[standardDevDataUnits];

  button('Random Data', () => {
    if (standardDevDataUnits === MGDL_UNITS) {
      standardDevData = generateRandomData(standardDevData, 'bg', standardDevDataUnits);
    } else {
      standardDevDataMmol = generateRandomData(standardDevDataMmol, 'bg', standardDevDataUnits);
    }
  });

  button('Empty Data', () => {
    if (standardDevDataUnits === MGDL_UNITS) {
      standardDevData = generateEmptyData(standardDevData);
    } else {
      standardDevDataMmol = generateEmptyData(standardDevDataMmol);
    }
  });

  return (
    <Container responsive={responsive}>
      <Stat
        annotations={[
          'Based on 70% CGM data availability for this view.',
          'SD (Standard Deviation) is…',
        ]}
        bgPrefs={bgPrefs}
        collapsible={collapsible}
        data={standardDevDataUnits === MGDL_UNITS ? standardDevData : standardDevDataMmol}
        dataFormat={{
          label: statFormats.standardDevValue,
          summary: statFormats.standardDevValue,
          title: statFormats.standardDevRange,
        }}
        isOpened={isOpened}
        title="Standard Deviation"
        type={statTypes.barBg}
        units={standardDevDataUnits}
      />
    </Container>
  );
});

let glucoseManagementIndicatorData = {
  data: [
    {
      id: 'gmi',
      value: 5.1,
    },
  ],
};
glucoseManagementIndicatorData.dataPaths = {
  summary: 'data.0',
};

stories.add('Glucose Management Indicator', () => {
  const responsive = boolean('responsive', false);
  button('Random Data', () => {
    glucoseManagementIndicatorData = generateRandomData(glucoseManagementIndicatorData, 'gmi');
  });

  button('Empty Data', () => {
    glucoseManagementIndicatorData = generateEmptyData(glucoseManagementIndicatorData);
  });

  return (
    <Container responsive={responsive}>
      <Stat
        annotations={[
          'Based on 70% CGM data availability for this view.',
          'GMI (Glucose Management Indicator) is an estimate of HbA1c that has been calculated based on your average blood glucose.',
        ]}
        data={glucoseManagementIndicatorData}
        dataFormat={{
          summary: statFormats.gmi,
        }}
        title="GMI"
        type={statTypes.simple}
      />
    </Container>
  );
});

let coefficientOfVariationData = {
  data: [
    {
      id: 'cv',
      value: 36,
    },
  ],
};
coefficientOfVariationData.dataPaths = {
  summary: 'data.0',
};

stories.add('Coefficient of Variation', () => {
  const responsive = boolean('responsive', false);
  button('Random Data', () => {
    coefficientOfVariationData = generateRandomData(coefficientOfVariationData, 'cv');
  });

  button('Empty Data', () => {
    coefficientOfVariationData = generateEmptyData(coefficientOfVariationData);
  });

  return (
    <Container responsive={responsive}>
      <Stat
        annotations={[
          'Based on 70% CGM data availability for this view.',
          'CV (Coefficient of Variation) is…',
        ]}
        data={coefficientOfVariationData}
        dataFormat={{
          summary: statFormats.cv,
        }}
        title="CV"
        type={statTypes.simple}
      />
    </Container>
  );
});

let sensorUsageData = {
  data: [
    {
      value: 73,
    },
  ],
};
sensorUsageData.total = { value: 100 };
sensorUsageData.dataPaths = {
  summary: 'data.0',
};

stories.add('Sensor Usage', () => {
  const responsive = boolean('responsive', false);
  button('Random Data', () => {
    sensorUsageData = generateRandomData(sensorUsageData, 'sensorUsage');
    sensorUsageData.total = { value: 100 };
  });

  button('Empty Data', () => {
    sensorUsageData = generateEmptyData(sensorUsageData);
  });

  return (
    <Container responsive={responsive}>
      <Stat
        annotations={[
          'Sensor Usage is…',
        ]}
        data={sensorUsageData}
        dataFormat={{
          summary: statFormats.percentage,
        }}
        title="Sensor Usage"
        type={statTypes.simple}
      />
    </Container>
  );
});

let carbData = {
  data: [
    {
      value: {
        grams: 60,
        exchanges: 3.5,
      },
    },
  ],
};
carbData.dataPaths = {
  summary: 'data.0',
};

stories.add('Avg. Daily Carbs', () => {
  const responsive = boolean('responsive', false);
  button('Random Data', () => {
    carbData = generateRandomData(carbData, 'carb');
  });

  button('Empty Data', () => {
    carbData = generateEmptyData(carbData);
  });

  return (
    <Container responsive={responsive}>
      <Stat
        annotations={[
          'Based on 5 bolus wizard events for this view.',
        ]}
        data={carbData}
        dataFormat={{
          summary: statFormats.carbs,
        }}
        title="Avg. Daily Carbs"
        type={statTypes.simple}
      />
    </Container>
  );
});

const dailyDoseUnitOptions = [
  {
    label: 'kg',
    value: 'kg',
  },
  {
    label: 'lb',
    value: 'lb',
  },
];

const input = {
  id: 'weight',
  label: 'Weight',
  type: 'number',
};

const staticSuffix = 'kg';

const dynamicSuffix = {
  id: 'units',
  options: dailyDoseUnitOptions,
  value: dailyDoseUnitOptions[0],
};

let dailyDoseData = {
  data: [
    {
      id: 'insulin',
      staticInput: {
        ...input,
        suffix: staticSuffix,
      },
      dynamicInput: {
        ...input,
        suffix: dynamicSuffix,
      },
      output: {
        label: 'Daily Dose ÷ Weight',
        type: 'divisor',
        dataPaths: {
          dividend: 'data.0',
        },
      },
      value: 112.4,
    },
  ],
};
dailyDoseData.dataPaths = {
  // input: 'data.0.staticInput',
  input: 'data.0.dynamicInput',
  output: 'data.0.output',
  summary: 'data.0',
};

stories.add('Avg. Daily Insulin', () => {
  const responsive = boolean('responsive', false);
  const collapsible = boolean('collapsible', false);
  const isOpened = boolean('isOpened', true);

  button('Random Data', () => {
    dailyDoseData = generateRandomData(dailyDoseData, 'units');
  });

  button('Empty Data', () => {
    dailyDoseData = generateEmptyData(dailyDoseData);
  });

  const handleInputChange = (value, suffixValue) => {
    console.log('onInputChange called with:', value, suffixValue); // eslint-disable-line no-console
  };

  return (
    <Container responsive={responsive}>
      <Stat
        alwaysShowSummary
        annotations={[
          'Based on 50% pump data availability for this view.',
        ]}
        collapsible={collapsible}
        data={dailyDoseData}
        dataFormat={{
          output: statFormats.unitsPerKg,
          summary: statFormats.units,
        }}
        isOpened={isOpened}
        onInputChange={handleInputChange}
        title="Avg. Daily Dose"
        type={statTypes.input}
      />
    </Container>
  );
});
