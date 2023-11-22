import React from 'react';

import SMBGTooltip from '../../../src/components/daily/smbgtooltip/SMBGTooltip';

const bgPrefs = {
  bgClasses: {
    'very-high': { boundary: 600 },
    high: { boundary: 300 },
    target: { boundary: 180 },
    low: { boundary: 70 },
    'very-low': { boundary: 54 },
  },
  bgUnits: 'mg/dL',
};

const target = {
  type: 'smbg',
  units: 'mg/dL',
  value: 100,
};

const low = {
  type: 'smbg',
  units: 'mg/dL',
  value: 65,
};

const high = {
  type: 'smbg',
  units: 'mg/dL',
  value: 200,
};

const manual = {
  type: 'smbg',
  units: 'mg/dL',
  value: 100,
  subType: 'manual',
};

const linked = {
  type: 'smbg',
  units: 'mg/dL',
  value: 100,
  subType: 'linked',
};

const medT600accepted = {
  type: 'smbg',
  units: 'mg/dL',
  value: 100,
  annotations: [{ code: 'medtronic600/smbg/user-accepted-remote-bg' }],
};

const medT600rejected = {
  type: 'smbg',
  units: 'mg/dL',
  value: 100,
  annotations: [{ code: 'medtronic600/smbg/user-rejected-remote-bg' }],
};

const medT600timeout = {
  type: 'smbg',
  units: 'mg/dL',
  value: 100,
  annotations: [{ code: 'medtronic600/smbg/remote-bg-acceptance-screen-timeout' }],
};

const medT600acceptedManual = {
  type: 'smbg',
  units: 'mg/dL',
  value: 100,
  subType: 'manual',
  annotations: [{ code: 'medtronic600/smbg/user-accepted-remote-bg' }],
};

const medT600rejectedLinked = {
  type: 'smbg',
  units: 'mg/dL',
  value: 100,
  subType: 'linked',
  annotations: [{ code: 'medtronic600/smbg/user-rejected-remote-bg' }],
};

const medT600timeoutManual = {
  type: 'smbg',
  units: 'mg/dL',
  value: 100,
  subType: 'manual',
  annotations: [{ code: 'medtronic600/smbg/remote-bg-acceptance-screen-timeout' }],
};

const medT600calibManual = {
  type: 'smbg',
  units: 'mg/dL',
  value: 100,
  subType: 'manual',
  annotations: [{ code: 'medtronic600/smbg/bg-sent-for-calib' }],
};

const medT600noncalibManual = {
  type: 'smbg',
  units: 'mg/dL',
  value: 100,
  subType: 'manual',
  annotations: [{ code: 'medtronic600/smbg/user-rejected-sensor-calib' }],
};

const medT600acceptedNoncalibManual = {
  type: 'smbg',
  units: 'mg/dL',
  value: 100,
  subType: 'manual',
  annotations: [
    { code: 'medtronic600/smbg/user-accepted-remote-bg' },
    { code: 'medtronic600/smbg/user-rejected-sensor-calib' },
  ],
};

const veryHigh = {
  type: 'smbg',
  units: 'mg/dL',
  value: 601,
  annotations: [
    {
      code: 'bg/out-of-range',
      value: 'high',
      threshold: 600,
    },
  ],
};

const veryLow = {
  type: 'smbg',
  units: 'mg/dL',
  value: 39,
  annotations: [
    {
      code: 'bg/out-of-range',
      value: 'low',
      threshold: 40,
    },
  ],
};

const props = {
  position: { top: 200, left: 200 },
  timePrefs: { timezoneAware: false },
  bgPrefs,
};

const BackgroundDecorator = (story) => (
  <div style={{ backgroundColor: 'FloralWhite', width: '100%', height: '96vh' }}>{story()}</div>
);

const refDiv = (
  <div
    style={{
      position: 'absolute',
      width: '10px',
      height: '10px',
      top: '199px',
      left: '199px',
      backgroundColor: 'FireBrick',
      opacity: 0.5,
      zIndex: '1',
    }}
  />
);

export default {
  title: 'SMBGTooltip',
  decorators: [BackgroundDecorator],
};

export const Target = {
  render: () => (
    <div>
      {refDiv}
      <SMBGTooltip {...props} smbg={target} />
    </div>
  ),

  name: 'target',
};

export const Low = {
  render: () => (
    <div>
      {refDiv}
      <SMBGTooltip {...props} smbg={low} />
    </div>
  ),

  name: 'low',
};

export const High = {
  render: () => (
    <div>
      {refDiv}
      <SMBGTooltip {...props} smbg={high} />
    </div>
  ),

  name: 'high',
};

export const VeryHigh = {
  render: () => (
    <div>
      {refDiv}
      <SMBGTooltip {...props} smbg={veryHigh} />
    </div>
  ),

  name: 'veryHigh',
};

export const VeryLow = {
  render: () => (
    <div>
      {refDiv}
      <SMBGTooltip {...props} smbg={veryLow} />
    </div>
  ),

  name: 'veryLow',
};

export const Manual = {
  render: () => (
    <div>
      {refDiv}
      <SMBGTooltip {...props} smbg={manual} />
    </div>
  ),

  name: 'manual',
};

export const Linked = {
  render: () => (
    <div>
      {refDiv}
      <SMBGTooltip {...props} smbg={linked} />
    </div>
  ),

  name: 'linked',
};

export const MedT600Accepted = {
  render: () => (
    <div>
      {refDiv}
      <SMBGTooltip {...props} smbg={medT600accepted} />
    </div>
  ),

  name: 'medT600accepted',
};

export const MedT600Rejected = {
  render: () => (
    <div>
      {refDiv}
      <SMBGTooltip {...props} smbg={medT600rejected} />
    </div>
  ),

  name: 'medT600rejected',
};

export const MedT600Timedout = {
  render: () => (
    <div>
      {refDiv}
      <SMBGTooltip {...props} smbg={medT600timeout} />
    </div>
  ),

  name: 'medT600timedout',
};

export const MedT600AcceptedManual = {
  render: () => (
    <div>
      {refDiv}
      <SMBGTooltip {...props} smbg={medT600acceptedManual} />
    </div>
  ),

  name: 'medT600acceptedManual',
};

export const MedT600RejectedLinked = {
  render: () => (
    <div>
      {refDiv}
      <SMBGTooltip {...props} smbg={medT600rejectedLinked} />
    </div>
  ),

  name: 'medT600rejectedLinked',
};

export const MedT600TimeoutManual = {
  render: () => (
    <div>
      {refDiv}
      <SMBGTooltip {...props} smbg={medT600timeoutManual} />
    </div>
  ),

  name: 'medT600timeoutManual',
};

export const MedT600CalibManual = {
  render: () => (
    <div>
      {refDiv}
      <SMBGTooltip {...props} smbg={medT600calibManual} />
    </div>
  ),

  name: 'medT600calibManual',
};

export const MedT600NoncalibManual = {
  render: () => (
    <div>
      {refDiv}
      <SMBGTooltip {...props} smbg={medT600noncalibManual} />
    </div>
  ),

  name: 'medT600noncalibManual',
};

export const MedT600AcceptedNoncalibManual = {
  render: () => (
    <div>
      {refDiv}
      <SMBGTooltip {...props} smbg={medT600acceptedNoncalibManual} />
    </div>
  ),

  name: 'medT600acceptedNoncalibManual',
};
