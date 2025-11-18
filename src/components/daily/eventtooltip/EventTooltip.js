import React from 'react';
import PropTypes from 'prop-types';
import i18next from 'i18next';
import { capitalize } from 'lodash';

import Tooltip from '../../common/tooltips/Tooltip';
import colors from '../../../colors';
import detailedEventStyles from './DetailedEventTooltip.css';
import standardEventStyles from './StandardEventTooltip.css';
import { EVENT_HEALTH, EVENT_NOTES, EVENT_PHYSICAL_ACTIVITY, EVENT_PUMP_SHUTDOWN, MS_IN_MIN } from '../../../utils/constants';
import { formatClocktimeFromMsPer24, formatDuration, getMsPer24 } from '../../../utils/datetime';

import tandemShutDownImage from './images/tandemShutDownImage.png';

const t = i18next.t.bind(i18next);

const renderDetailedEvent = (content = {}) => (
  <div className={detailedEventStyles.wrapper}>
    <div className={detailedEventStyles.image}>{content.image}</div>
    <div className={detailedEventStyles.eventTitle}>{content.title}</div>
    <div className={detailedEventStyles.eventDescription}>{content.description}</div>
  </div>
);

const renderStandardEvent = (content = {}) => (
  <div>
    <div className={standardEventStyles.time}>{content.time}</div>
    <div className={standardEventStyles.title}>{content.title}</div>

    <div className={standardEventStyles.description}>
      <div className={standardEventStyles.label}>{content.label}</div>
      <div className={standardEventStyles.value}>{content.value}</div>
    </div>

    {content.notes && (
    <div className={standardEventStyles.notes}>
      {content.notes.map((note, index) => (
        <div className={standardEventStyles.note} key={`note-${index}`}>{note}</div>
      ))}
    </div>
    )}
  </div>
);

const getEventContent = (event, timePrefs) => {
  const msPer24 = getMsPer24(event?.normalTime, timePrefs?.timezoneName);
  const time = formatClocktimeFromMsPer24(msPer24);

  switch (event?.tags?.event) {
    case EVENT_PUMP_SHUTDOWN:
      return {
        title: t('Prior to this time, the pump was shut down'),
        description: t('Tidepool does not show data from before a pump is shut down. When the pump is turned off, its internal clock stops. This makes it hard to trust the timestamps on any data recorded right before shutdown. We can\'t verify that the device time was accurate at that point or correct for any clock drift that may have occurred.'),
        image: <img src={tandemShutDownImage} alt={t('Pump Shutdown')} />,
        renderer: renderDetailedEvent,
        tooltipOverrides: {
          boxShadow: '0px 4px 11px 0px rgba(0, 0, 0, 0.15)',
          tail: false,
          borderColor: colors.gray10,
          borderWidth: 1,
        },
      };
    case EVENT_HEALTH:
      const healthLabels = {
        alcohol: t('Alcohol'),
        cycle: t('Cycle'),
        hyperglycemiaSymptoms: t('Hyperglycemia Symptoms'),
        hypoglycemiaSymptoms: t('Hypoglycemia Symptoms'),
        illness: t('Illness'),
        stress: t('Stress'),
        other: capitalize(event.states?.[0]?.stateOther || t('Other')),
      };

      return {
        time,
        title: t('Health'),
        label: healthLabels[event.states?.[0]?.state],
        notes: event.notes,
        renderer: renderStandardEvent,
      };
    case EVENT_NOTES:
      return {
        time,
        title: null,
        label: null,
        notes: event.notes,
        renderer: renderStandardEvent,
      };
    case EVENT_PHYSICAL_ACTIVITY:
      const durationUnitsMultiplier = {
        seconds: MS_IN_MIN / 60,
        minutes: MS_IN_MIN,
        hours: MS_IN_MIN * 60,
      };

      const intensityLabels = {
        low: t('Light'),
        medium: t('Moderate'),
        high: t('Intense'),
      };

      const hasDuration = event.duration?.value && event.duration?.units && durationUnitsMultiplier[event.duration?.units];

      return {
        time,
        title: t('Exercise'),
        label: intensityLabels[event.reportedIntensity] || t('Duration'),
        value: hasDuration ? formatDuration(event.duration?.value * durationUnitsMultiplier[event.duration?.units], { condensed: true }) : null,
        renderer: renderStandardEvent,
      };
    default:
      return {};
  }
};

const EventTooltip = (props) => {
  const { renderer, tooltipOverrides = {}, ...renderProps } = getEventContent(props.event, props.timePrefs);

  return (
    <Tooltip
      {...props}
      {...tooltipOverrides}
      content={renderer(renderProps)}
    />
  );
};

EventTooltip.propTypes = {
  annotations: PropTypes.arrayOf(PropTypes.string),
  position: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
  }).isRequired,
  offset: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number,
    horizontal: PropTypes.number,
  }),
  title: PropTypes.node,
  tail: PropTypes.bool.isRequired,
  side: PropTypes.oneOf(['top', 'right', 'bottom', 'left']).isRequired,
  tailColor: PropTypes.string.isRequired,
  tailWidth: PropTypes.number.isRequired,
  tailHeight: PropTypes.number.isRequired,
  backgroundColor: PropTypes.string,
  borderColor: PropTypes.string,
  borderWidth: PropTypes.number,
  borderRadius: PropTypes.number,
  showDividers: PropTypes.bool,
  event: PropTypes.shape({
    tags: PropTypes.shape({
      event: PropTypes.string.isRequired,
    }).isRequired,
    normalTime: PropTypes.number.isRequired,
  }).isRequired,
  timePrefs: PropTypes.object.isRequired,
};

EventTooltip.defaultProps = {
  annotations: [],
  tail: true,
  side: 'bottom',
  tailWidth: 16,
  tailHeight: 8,
  tailColor: colors.gray30,
  borderColor: colors.gray30,
  borderWidth: 2,
};

export default EventTooltip;
