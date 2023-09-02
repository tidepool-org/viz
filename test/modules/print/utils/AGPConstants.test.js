import * as AGPConstants from '../../../../src/modules/print/utils/AGPConstants';
import { DPI } from '../../../../src/modules/print/utils/constants';

describe('AGPConstants', () => {
  it('should define `AGP_BG_CLAMP_MGDL`', () => {
    expect(AGPConstants.AGP_BG_CLAMP_MGDL).to.equal(350);
  });

  it('should define `AGP_BG_CLAMP_MMOLL`', () => {
    expect(AGPConstants.AGP_BG_CLAMP_MMOLL).to.equal(19.4);
  });

  it('should define `AGP_FOOTER_Y_PADDING`', () => {
    expect(AGPConstants.AGP_FOOTER_Y_PADDING).to.equal(DPI * 0.25);
  });

  it('should define `AGP_TIR_MIN_HEIGHT`', () => {
    expect(AGPConstants.AGP_TIR_MIN_HEIGHT).to.equal(5);
  });

  it('should define `AGP_SECTION_BORDER_RADIUS`', () => {
    expect(AGPConstants.AGP_SECTION_BORDER_RADIUS).to.equal(8);
  });

  it('should define `AGP_SECTION_HEADER_HEIGHT`', () => {
    expect(AGPConstants.AGP_SECTION_HEADER_HEIGHT).to.equal(DPI * 0.25);
  });

  it('should define `AGP_SECTION_DESCRIPTION_HEIGHT`', () => {
    expect(AGPConstants.AGP_SECTION_DESCRIPTION_HEIGHT).to.equal(DPI * 0.25);
  });

  it('should define `AGP_LOWER_QUANTILE`', () => {
    expect(AGPConstants.AGP_LOWER_QUANTILE).to.equal(0.05);
  });

  it('should define `AGP_UPPER_QUANTILE`', () => {
    expect(AGPConstants.AGP_UPPER_QUANTILE).to.equal(0.95);
  });

  it('should define `AGP_FONT_FAMILY`', () => {
    expect(AGPConstants.AGP_FONT_FAMILY).to.equal('Helvetica, Arial, Sans-Serif');
  });

  it('should export report text', () => {
    expect(AGPConstants.text).to.eql({
      reportHeader: 'AGP Report:',
      reportSubHeader: 'Continuous glucose monitoring',
      reportFooter: 'Patent pending \u2013 HealthPartners Institute dba International Diabetes Center \u2013 All Rights Reserved. \u00A92022',
      reportInsuffienctData: 'Insufficient data to generate an AGP Report.',
      percentInRanges: {
        title: 'Time in Ranges',
        subtitle: 'Goals for Type 1 and Type 2 Diabetes',
      },
      reportInfo: {
        dob: 'DOB:',
        mrn: 'MRN:',
      },
      glucoseMetrics: {
        title: 'Glucose metrics',
        averageGlucose: {
          label: 'Average Glucose',
          goal: {
            mgdl: 'Goal: <154 mg/dL',
            mmoll: 'Goal: <8.6 mmol/L',
          },
        },
        glucoseManagementIndicator: {
          label: 'Glucose Management Indicator (GMI)',
          goal: 'Goal: <7%',
        },
        coefficientOfVariation: {
          label: 'Glucose Variability',
          subLabel: 'Defined as percent coefficient of variation',
          goal: 'Goal: <=36%',
        },
      },
      ambulatoryGlucoseProfile: {
        title: 'Ambulatory Glucose Profile (AGP)',
        'description': 'AGP is a summary of glucose values from the report period, with median (50%) and other percentiles shown as if they occurred in a single day.', // eslint-disable-line quote-props
        targetRange: 'Target<br>Range',
        insufficientData: 'Insufficient CGM data to generate AGP graph',
      },
      dailyGlucoseProfiles: {
        title: 'Daily Glucose Profiles',
        'description': 'Each daily profile represents a midnight-to-midnight period.', // eslint-disable-line quote-props
      },
      bgRanges: {
        veryHigh: 'Very High',
        high: 'High',
        target: 'Target',
        low: 'Low',
        veryLow: 'Very Low',
      },
      goals: {
        veryHigh: 'Goal: <5%',
        highCombined: 'Goal: <25%',
        target: 'Goal: >70%',
        lowCombined: 'Goal: <4%',
        veryLow: 'Goal: <1%',
      },
      subLabels: {
        TIRtarget: 'Each 5% increase is clinically beneficial',
        TIRminutes: 'Each 1% time in range = about 15 minutes',
      },
    });
  });

  it('should export report font sizes', () => {
    expect(AGPConstants.fontSizes).to.eql({
      reportHeader: 14,
      reportSubHeader: 14,
      reportFooter: 7,
      reportInfo: {
        default: 10,
        label: 8,
      },
      section: {
        title: 9,
        subtitle: 8,
        'description': 7, // eslint-disable-line quote-props
        insufficientData: 7,
      },
      percentInRanges: {
        values: 9,
        ticks: 7,
        summaries: 12,
        goals: 7,
        subLabels: 7,
      },
      glucoseMetrics: {
        values: 12,
        bgUnits: 8,
        labels: 9,
        subLabels: 8,
        goals: 8,
      },
      ambulatoryGlucoseProfile: {
        hourlyTicks: 7,
        bgTicks: 9,
        percentileTicks: 8,
        bgUnits: 7,
        targetRange: 9,
      },
      dailyGlucoseProfiles: {
        bgTicks: 7,
        bgUnits: 7,
        timeTicks: 7,
        weekdayTicks: 8,
        calendarDates: 8,
      },
    });
  });

  it('should export report colors', () => {
    const black = '#000000';
    const white = '#FFFFFF';
    const lightGrey = '#D9D9D9';
    const mediumGrey = '#7A7A7A';
    const darkGrey = '#626267';

    expect(AGPConstants.colors).to.eql({
      text: {
        reportHeader: '#522398',
        label: darkGrey,
        reportFooter: black,
        section: {
          title: black,
          subtitle: darkGrey,
          'description': black, // eslint-disable-line quote-props
          insufficientData: black,
        },
        reportInfo: black,
        calendarDates: darkGrey,
        goals: {
          veryHigh: darkGrey,
          highCombined: mediumGrey,
          target: mediumGrey,
          lowCombined: mediumGrey,
          veryLow: darkGrey,
          glucoseMetrics: darkGrey,
        },
        subLabels: {
          TIRtarget: darkGrey,
          TIRminutes: black,
          glucoseMetrics: darkGrey,
        },
        ticks: {
          bg: darkGrey,
          dailyProfileBg: black,
          hour: darkGrey,
          percentile: darkGrey,
        },
      },
      line: {
        default: darkGrey,
        ticks: lightGrey,
        range: {
          target: '#00AA51',
          dailyProfileTarget: black,
          default: lightGrey,
          divider: white,
        },
      },
      white,
      black,
      lightGrey,
      mediumGrey,
      darkGrey,
      background: {
        shaded: lightGrey,
      },
      bgRange: {
        veryLow: '#CC0019',
        low: '#FF0000',
        lowShaded: '#FF8080',
        target: '#0BAD5A',
        high: '#FFBF00',
        highShaded: '#FFD180',
        veryHigh: '#FF6900',
        empty: darkGrey,
      },
      ambulatoryGlucoseProfile: {
        median: {
          veryLow: '#A30014',
          low: '#FF0000',
          target: '#00AA51',
          high: '#FFA600',
          veryHigh: '#FF7538',
        },
        interQuartile: {
          veryLow: '#A30014',
          low: '#FF0000',
          target: '#8BCD9E',
          high: '#FFC966',
          veryHigh: '#FFB380',
        },
        outerQuantile: {
          veryLow: '#A30014',
          low: '#FF8080',
          target: '#BEE1C6',
          high: '#FFE6B3',
          veryHigh: '#FFD9BF',
        },
      },
      dailyGlucoseProfiles: {
        low: {
          line: '#FF0000',
          fill: '#FF8080',
        },
        target: {
          line: '#00AA51',
          fill: lightGrey,
        },
        high: {
          line: '#FFA600',
          fill: '#FFD180',
        },
      },
    });
  });
});
