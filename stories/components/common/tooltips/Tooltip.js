import React from 'react';

import Tooltip from '../../../../src/components/common/tooltips/Tooltip';

const props = {
  title: <span style={{ padding: '5px', display: 'block' }}>Title</span>,
  content: <span style={{ fontSize: '15px', display: 'block', padding: '5px' }}>Some Content</span>,
  position: { top: 200, left: 200 },
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
  title: 'Tooltip',
  decorators: [BackgroundDecorator],
};

export const Defaults = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} />
    </div>
  ),

  name: 'defaults',
};

export const Offset55 = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} offset={{ top: -5, left: -5 }} />
    </div>
  ),

  name: 'offset -5,-5',
};

export const BackgroundColor = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} backgroundColor={'papayawhip'} />
    </div>
  ),

  name: 'backgroundColor',
};

export const BorderColor = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} borderColor={'blue'} />
    </div>
  ),

  name: 'borderColor',
};

export const TransparentBackgroundColorNoTail = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} tail={false} backgroundColor={'transparent'} />
    </div>
  ),

  name: 'transparent backgroundColor, no tail',
};

export const TransparentNoTailNoTitle = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip
        {...props}
        title={null}
        backgroundColor={'transparent'}
        borderColor={'transparent'}
      />
    </div>
  ),

  name: 'transparent, no tail, no title',
};

export const KnownIssueTransparentBackgroundColorWithTail = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} backgroundColor={'transparent'} />
    </div>
  ),

  name: '[KNOWN ISSUE] transparent backgroundColor with tail',
};

export const BorderWidth = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} borderWidth={3} />
    </div>
  ),

  name: 'borderWidth',
};

export const TailWidth = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} tailWidth={20} />
    </div>
  ),

  name: 'tailWidth',
};

export const TailHeight = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} tailHeight={4} />
    </div>
  ),

  name: 'tailHeight',
};

export const TailNoContent = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} content={null} />
    </div>
  ),

  name: 'tail, no content',
};

export const NoTailNoContent = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} content={null} tail={false} />
    </div>
  ),

  name: 'no tail, no content',
};

export const NoTitle = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} title={null} />
    </div>
  ),

  name: 'no title',
};

export const NoTail = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} tail={false} />
    </div>
  ),

  name: 'no tail',
};

export const NoTailNoTitle = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} tail={false} title={null} />
    </div>
  ),

  name: 'no tail, no title',
};

export const NoTailNoTitleOffset100 = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} tail={false} title={null} offset={{ left: -10, top: 0 }} />
    </div>
  ),

  name: 'no tail, no title, offset -10,0',
};

export const NoTailOnRight = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} tail={false} side={'right'} />
    </div>
  ),

  name: 'no tail, on right',
};

export const TailOnRight = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} side={'right'} />
    </div>
  ),

  name: 'tail, on right',
};

export const TailOnRightTailWidth = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} side={'right'} tailWidth={20} />
    </div>
  ),

  name: 'tail, on right, tailWidth',
};

export const TailOnRightOffset55 = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} side={'right'} offset={{ top: 5, left: 5 }} />
    </div>
  ),

  name: 'tail, on right, offset 5,5',
};

export const TailOnRightNoContent = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} side={'right'} content={null} />
    </div>
  ),

  name: 'tail, on right, no content',
};

export const TailOnRightNoTitle = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} side={'right'} title={null} />
    </div>
  ),

  name: 'tail, on right, no title',
};

export const TopNoTail = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} side={'top'} tail={false} />
    </div>
  ),

  name: 'top, no tail',
};

export const TopNoTailNoTitle = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} side={'top'} tail={false} title={null} />
    </div>
  ),

  name: 'top, no tail, no title',
};

export const TopNoTailNoTitleOffset010 = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} side={'top'} tail={false} title={null} offset={{ left: 0, top: -10 }} />
    </div>
  ),

  name: 'top, no tail, no title, offset 0,-10',
};

export const TopNoTailNoContent = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} side={'top'} tail={false} content={null} />
    </div>
  ),

  name: 'top, no tail, no content',
};

export const BottomNoTail = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} side={'bottom'} tail={false} />
    </div>
  ),

  name: 'bottom, no tail',
};

export const BottomNoTailNoTitle = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} side={'bottom'} tail={false} title={null} />
    </div>
  ),

  name: 'bottom, no tail, no title',
};

export const BottomNoTailNoContent = {
  render: () => (
    <div>
      {refDiv}
      <Tooltip {...props} side={'bottom'} tail={false} content={null} />
    </div>
  ),

  name: 'bottom, no tail, no content',
};
