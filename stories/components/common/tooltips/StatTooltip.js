import React from 'react';

import StatTooltip from '../../../../src/components/common/tooltips/StatTooltip';

const props = {
  position: { top: 105, left: 105 },
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
      top: '100px',
      left: '100px',
      backgroundColor: 'FireBrick',
      opacity: 0.5,
      zIndex: '1',
    }}
  />
);

export default{ title: 'StatTooltip', decorators: [BackgroundDecorator] };

export const ShortAnnotation = () => (
  <div>
    {refDiv}
    <StatTooltip {...props} annotations={['A nice, concise annotation.']} />
  </div>
);

ShortAnnotation.story = {
  name: 'short annotation',
};

export const LongAnnotation = () => (
  <div>
    {refDiv}
    <StatTooltip
      {...props}
      annotations={['A longer annotation that should wrap due to a max-width of 190px set.']}
    />
  </div>
);

LongAnnotation.story = {
  name: 'long annotation',
};

export const MarkdownAnnotation = () => (
  <div>
    {refDiv}
    <StatTooltip
      {...props}
      annotations={[
        '**A markdown annotation** that should [link](http://www.example.com) to example.com in a new tab',
      ]}
    />
  </div>
);

MarkdownAnnotation.story = {
  name: 'markdown annotation',
};

export const MultipleAnnotations = () => (
  <div>
    {refDiv}
    <StatTooltip
      {...props}
      annotations={[
        'A nice, concise annotation.',
        'A longer annotation that should wrap due to a max-width of 190px set.',
      ]}
    />
  </div>
);

MultipleAnnotations.story = {
  name: 'multiple annotations',
};
