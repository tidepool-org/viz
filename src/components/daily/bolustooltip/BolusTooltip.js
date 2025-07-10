import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import i18next from 'i18next';
import * as bolusUtils from '../../../utils/bolus';
import { AUTOMATED_BOLUS, ONE_BUTTON_BOLUS } from '../../../utils/constants';
import { formatLocalizedFromUTC, formatDuration, getMsPer24 } from '../../../utils/datetime';
import { formatInsulin, formatBgValue } from '../../../utils/format';
import { getPumpVocabulary, isLoop, isTwiistLoop } from '../../../utils/device';
import { getAnnotationMessages } from '../../../utils/annotations';
import Tooltip from '../../common/tooltips/Tooltip';
import colors from '../../../styles/colors.css';
import styles from './BolusTooltip.css';

const t = i18next.t.bind(i18next);

const BolusTooltip = (props) => {
  const carbs = bolusUtils.getCarbs(props.bolus);
  const carbsInput = _.isFinite(carbs) && carbs > 0;
  const bgUnits = props.bgPrefs?.bgUnits || '';
  const carbUnits = _.get(props, 'bolus.carbUnits') === 'exchanges' ? 'exch' : 'g';
  const carbRatioUnits = _.get(props, 'bolus.carbUnits') === 'exchanges' ? 'U/exch' : 'g/U';
  const isLoopBolus = isLoop(props.bolus);
  const isTwiistLoopBolus = isTwiistLoop(props.bolus);
  const msPer24 = getMsPer24(props.bolus?.normalTime, props.timePrefs?.timezoneName);
  const unitStyles = (carbsInput && carbUnits === 'exch') ? styles.unitsWide : styles.units;
  const deviceLabels = getPumpVocabulary(props.bolus?.source);

  const formatBgValueForTooltip = (val) => {
    return formatBgValue(val, props.bgPrefs);
  };

  const isAnimasExtended = () => {
    const annotations = bolusUtils.getAnnotations(props.bolus);
    const isAnimasExtendedValue =
      _.findIndex(annotations, { code: 'animas/bolus/extended-equal-split' }) !== -1;
    return isAnimasExtendedValue;
  };

  const animasExtendedAnnotationMessage = () => {
    let content = null;
    if (isAnimasExtended()) {
      const messages = getAnnotationMessages(bolusUtils.getBolusFromInsulinEvent(props.bolus));
      content = (
        <div className={styles.annotation}>
          {_.find(messages, { code: 'animas/bolus/extended-equal-split' }).message.value}
        </div>
      );
    }
    return content;
  };

  const isMedronicDeconvertedExchange = () => {
    const annotations = _.get(props.bolus, 'annotations', []);
    const isMedronicDeconvertedExchangeValue = _.findIndex(annotations, { code: 'medtronic/wizard/carb-to-exchange-ratio-deconverted' }) !== -1;
    return isMedronicDeconvertedExchangeValue;
  };

  const medronicDeconvertedExchangeMessage = () => {
    let content = null;

    if (isMedronicDeconvertedExchange()) {
      const messages = getAnnotationMessages(props.bolus);

      content = (
        <div className={styles.annotation}>
          {_.find(messages, { code: 'medtronic/wizard/carb-to-exchange-ratio-deconverted' }).message.value}
        </div>
      );
    }

    return content;
  };

  const getTarget = () => {
    const wizardTarget = _.get(props.bolus, 'bgTarget');
    const target = _.get(wizardTarget, 'target', null);
    const targetLow = _.get(wizardTarget, 'low', null);
    const targetHigh = _.get(wizardTarget, 'high', null);
    const targetRange = _.get(wizardTarget, 'range', null);
    const isAutomatedTarget = _.findIndex(_.get(props.bolus, 'annotations', []), {
      code: 'wizard/target-automated',
    }) !== -1;
    if (isAutomatedTarget) {
      return (
        <div className={styles.target}>
          <div className={styles.label}>{t('Target')}</div>
          <div className={styles.value}>{t('Auto')}</div>
          <div className={unitStyles} />
        </div>
      );
    }
    if (targetLow) {
      // medtronic
      let value;
      if (targetLow === targetHigh) {
        value = `${formatBgValueForTooltip(targetLow)}`;
      } else {
        value = `${formatBgValueForTooltip(targetLow)}-${formatBgValueForTooltip(targetHigh)}`;
      }
      return (
        <div className={styles.target}>
          <div className={styles.label}>{t('Target')}</div>
          <div className={styles.value}>{value}</div>
          <div className={unitStyles} />
        </div>
      );
    }
    if (targetRange) {
      // animas
      return [
        <div className={styles.target} key={'target'}>
          <div className={styles.label}>{t('Target')}</div>
          <div className={styles.value}>{`${formatBgValueForTooltip(target)}`}</div>
          <div className={unitStyles} />
        </div>,
        <div className={styles.target} key={'range'}>
          <div className={styles.label}>{t('Range')}</div>
          <div className={styles.value}>{`${formatBgValueForTooltip(targetRange)}`}</div>
          <div className={unitStyles} />
        </div>,
      ];
    }
    if (targetHigh) {
      // insulet
      return [
        <div className={styles.target} key={'target'}>
          <div className={styles.label}>{t('Target')}</div>
          <div className={styles.value}>{`${formatBgValueForTooltip(target)}`}</div>
          <div className={unitStyles} />
        </div>,
        <div className={styles.target} key={'high'}>
          <div className={styles.label}>{t('High')}</div>
          <div className={styles.value}>{`${formatBgValueForTooltip(targetHigh)}`}</div>
          <div className={unitStyles} />
        </div>,
      ];
    }
    if (isLoopBolus) {
      // loop
      const schedules = _.get(props.bolus, 'dosingDecision.bgTargetSchedule', []);
      const range = _.findLast(_.sortBy(schedules, 'start'), ({ start }) => start < msPer24);
      const label = t('Correction Range');
      return (
        <div className={styles.target}>
          <div className={styles.label}>{label} ({bgUnits})</div>
          <div className={styles.value}>{`${formatBgValueForTooltip(range?.low)}-${formatBgValueForTooltip(range?.high)}`}</div>
          <div className={unitStyles} />
        </div>
      );
    }
    // tandem
    return (
      <div className={styles.target}>
        <div className={styles.label}>{t('Target')}</div>
        <div className={styles.value}>{`${formatBgValueForTooltip(target)}`}</div>
        <div className={unitStyles} />
      </div>
    );
  };

  const getExtended = () => {
    const bolus = bolusUtils.getBolusFromInsulinEvent(props.bolus);
    const hasExtended = bolusUtils.hasExtended(bolus);
    const normalPercentage = bolusUtils.getNormalPercentage(bolus);
    const normal = _.get(bolus, 'normal', NaN);
    const isAnimasExtendedValue = isAnimasExtended();
    const extendedPercentage = _.isNaN(bolusUtils.getExtendedPercentage(bolus))
      ? ''
      : `(${bolusUtils.getExtendedPercentage(bolus)})`;
    let extendedLine = null;
    if (hasExtended) {
      if (isAnimasExtendedValue) {
        extendedLine = (
          <div className={styles.extended}>
            <div className={styles.label}>Extended Over*</div>
            <div className={styles.value}>{formatDuration(bolusUtils.getDuration(bolus))}</div>
          </div>
        );
      } else {
        extendedLine = [
          !!normal && (
            <div className={styles.normal} key={'normal'}>
              <div className={styles.label}>
                {t('Up Front ({{normalPercentage}})', { normalPercentage })}
              </div>
              <div className={styles.value}>{`${formatInsulin(normal)}`}</div>
              <div className={unitStyles}>U</div>
            </div>
          ),
          <div className={styles.extended} key={'extended'}>
            <div className={styles.label}>
              {`Over ${formatDuration(bolusUtils.getDuration(bolus))} ${extendedPercentage}`}
            </div>
            <div className={styles.value}>
              {`${formatInsulin(bolusUtils.getExtended(bolus))}`}
            </div>
            <div className={unitStyles}>U</div>
          </div>,
        ];
      }
    }
    return extendedLine;
  };

  const renderWizard = () => {
    const wizard = props.bolus;
    const recommended = bolusUtils.getRecommended(wizard);
    const suggested = _.isFinite(recommended) ? `${recommended}` : null;
    const bg = wizard?.bgInput || null;
    const iob = wizard?.insulinOnBoard;
    const carbsValue = bolusUtils.getCarbs(wizard);
    const carbsInputValue = _.isFinite(carbsValue) && carbsValue > 0;
    let carbRatio = wizard?.insulinCarbRatio || null;
    let isf = wizard?.insulinSensitivity || null;

    if (isLoopBolus) {
      const { activeSchedule, carbRatios, insulinSensitivities } = wizard?.dosingDecision?.pumpSettings || {};
      carbRatio = _.findLast(_.sortBy(carbRatios?.[activeSchedule] || [], 'start'), ({ start }) => start < msPer24)?.amount || carbRatio;
      isf = _.findLast(_.sortBy(insulinSensitivities?.[activeSchedule] || [], 'start'), ({ start }) => start < msPer24)?.amount || isf;
    }

    const delivered = bolusUtils.getDelivered(wizard);
    const isInterrupted = bolusUtils.isInterruptedBolus(wizard);
    const programmed = bolusUtils.getProgrammed(wizard);
    const hasExtended = bolusUtils.hasExtended(wizard);
    const isAnimasExtendedValue = isAnimasExtended();
    const isMedronicDeconvertedExchangeValue = isMedronicDeconvertedExchange();

    let overrideLine = null;
    if (bolusUtils.isOverride(wizard)) {
      overrideLine = (
        <div className={styles.override}>
          <div className={styles.label}>{t('Override')}</div>
          <div className={styles.value}>{`+${formatInsulin(programmed - recommended)}`}</div>
          <div className={unitStyles}>U</div>
        </div>
      );
    }
    if (bolusUtils.isUnderride(wizard)) {
      overrideLine = (
        <div className={styles.override}>
          <div className={styles.label}>{t('Underride')}</div>
          <div className={styles.value}>{`-${formatInsulin(recommended - programmed)}`}</div>
          <div className={unitStyles}>U</div>
        </div>
      );
    }
    const deliveredLine = _.isFinite(delivered) && (
      <div className={styles.delivered}>
        <div className={styles.label}>{t('Delivered')}</div>
        <div className={styles.value}>{`${formatInsulin(delivered)}`}</div>
        <div className={unitStyles}>U</div>
      </div>
    );
    const suggestedLine = (isInterrupted || overrideLine) &&
      !!suggested && (
      <div className={styles.suggested}>
        <div className={styles.label}>{t('Recommended')}</div>
        <div className={styles.value}>{formatInsulin(suggested)}</div>
        <div className={unitStyles}>U</div>
      </div>
    );
    const bgLine = !!bg && !isTwiistLoopBolus && (
      <div className={styles.bg}>
        <div className={styles.label}>{t('Glucose')} ({bgUnits})</div>
        <div className={styles.value}>{formatBgValueForTooltip(bg)}</div>
        <div className={unitStyles} />
      </div>
    );
    const carbsLine = !!carbsValue && (
      <div className={styles.carbs}>
        <div className={styles.label}>{t('Carbs')}</div>
        <div className={styles.value}>{carbsValue}</div>
        <div className={unitStyles}>{carbUnits}</div>
      </div>
    );
    const iobLine = _.isFinite(iob) && (
      <div className={styles.iob}>
        <div className={styles.label}>{t('IOB')}</div>
        <div className={styles.value}>{`${formatInsulin(iob)}`}</div>
        <div className={unitStyles}>U</div>
      </div>
    );
    const interruptedLine = isInterrupted && (
      <div className={styles.interrupted}>
        <div className={styles.label}>{t('Interrupted')}</div>
        <div className={styles.value}>{`-${formatInsulin(programmed - delivered)}`}</div>
        <div className={unitStyles}>U</div>
      </div>
    );
    const icRatioLine = !!carbsInputValue &&
      !!carbRatio && (
      <div className={styles.carbRatio}>
        <div className={styles.label}>{t('I:C Ratio')}{isMedronicDeconvertedExchangeValue && '*'} {` (${carbRatioUnits})`}</div>
        <div className={styles.value}>{carbRatio}</div>
        <div className={unitStyles} />
      </div>
    );
    const isfLine = !!isf &&
      !!bg && (
      <div className={styles.isf}>
        <div className={styles.label}>{t('ISF')} ({bgUnits}/U)</div>
        <div className={styles.value}>{`${formatBgValueForTooltip(isf)}`}</div>
        <div className={unitStyles} />
      </div>
    );

    return (
      <div className={styles.container}>
        {bgLine}
        {carbsLine}
        {iobLine}
        {suggestedLine}
        {getExtended()}
        {(isInterrupted || overrideLine || hasExtended) && <div className={styles.divider} />}
        {overrideLine}
        {interruptedLine}
        {deliveredLine}
        {(icRatioLine || isfLine || bg || isAnimasExtendedValue || isMedronicDeconvertedExchangeValue) && (
          <div className={styles.divider} />
        )}
        {icRatioLine}
        {isfLine}
        {!!bg && getTarget()}
        {animasExtendedAnnotationMessage()}
        {medronicDeconvertedExchangeMessage()}
      </div>
    );
  };

  const renderNormal = () => {
    const bolus = props.bolus;
    const delivered = bolusUtils.getDelivered(bolus);
    const isInterrupted = bolusUtils.isInterruptedBolus(bolus);
    const programmed = bolusUtils.getProgrammed(bolus);
    const isAnimasExtendedValue = isAnimasExtended();

    const deliveredLine = _.isFinite(delivered) && (
      <div className={styles.delivered}>
        <div className={styles.label}>{t('Delivered')}</div>
        <div className={styles.value}>{`${formatInsulin(delivered)}`}</div>
        <div className={unitStyles}>U</div>
      </div>
    );
    const interruptedLine = isInterrupted && (
      <div className={styles.interrupted}>
        <div className={styles.label}>{t('Interrupted')}</div>
        <div className={styles.value}>{`-${formatInsulin(programmed - delivered)}`}</div>
        <div className={unitStyles}>U</div>
      </div>
    );
    const programmedLine = isInterrupted &&
      !!programmed && (
      <div className={styles.programmed}>
        <div className={styles.label}>{t('Programmed')}</div>
        <div className={styles.value}>{`${formatInsulin(programmed)}`}</div>
        <div className={unitStyles}>U</div>
      </div>
    );

    return (
      <div className={styles.container}>
        {programmedLine}
        {interruptedLine}
        {deliveredLine}
        {getExtended()}
        {isAnimasExtendedValue && <div className={styles.divider} />}
        {animasExtendedAnnotationMessage()}
      </div>
    );
  };

  const renderBolus = () => {
    let content;
    if (props.bolus.type === 'wizard' || props.bolus?.dosingDecision) {
      content = renderWizard();
    } else {
      content = renderNormal();
    }
    return content;
  };

  const { automated, oneButton } = bolusUtils.getBolusFromInsulinEvent(props.bolus)?.tags || {};
  const tailColor = props.tailColor ?? (automated ? colors.bolusAutomated : colors.bolus);
  const borderColor = props.borderColor ?? (automated ? colors.bolusAutomated : colors.bolus);

  const title = (
    <div className={styles.title}>
      <div className={styles.types}>
        {oneButton && <div>{deviceLabels[ONE_BUTTON_BOLUS]}</div>}
        {automated && <div>{deviceLabels[AUTOMATED_BOLUS]}</div>}
      </div>
      {formatLocalizedFromUTC(props.bolus.normalTime, props.timePrefs, 'h:mm a')}
    </div>
  );

  return (
    <Tooltip
      {...props}
      borderColor={borderColor}
      tailColor={tailColor}
      title={title}
      content={renderBolus()}
    />
  );
};

BolusTooltip.propTypes = {
  position: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
  }).isRequired,
  offset: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number,
    horizontal: PropTypes.number,
  }),
  tail: PropTypes.bool.isRequired,
  side: PropTypes.oneOf(['top', 'right', 'bottom', 'left']).isRequired,
  tailColor: PropTypes.string,
  tailWidth: PropTypes.number.isRequired,
  tailHeight: PropTypes.number.isRequired,
  backgroundColor: PropTypes.string,
  borderColor: PropTypes.string,
  borderWidth: PropTypes.number.isRequired,
  bolus: PropTypes.shape({
    type: PropTypes.string.isRequired,
  }).isRequired,
  bgPrefs: PropTypes.object.isRequired,
  timePrefs: PropTypes.object.isRequired,
};

BolusTooltip.defaultProps = {
  tail: true,
  side: 'right',
  tailWidth: 8,
  tailHeight: 16,
  borderWidth: 2,
};

export default BolusTooltip;
