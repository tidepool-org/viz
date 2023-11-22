import React from 'react';

import Loader from '../../../../src/components/common/loader/Loader';

const props = {};

const BackgroundDecorator = (story) => (
  <div style={{ backgroundColor: '#ddd', width: '100%', height: '96vh' }}>{story()}</div>
);

export default {
  title: 'Loader',
  decorators: [BackgroundDecorator],
};

export const Defaults = {
  render: () => (
    <div>
      <Loader {...props} />
    </div>
  ),

  name: 'defaults',
};

export const WithOverlay = {
  render: () => (
    <div>
      <Loader {...props} overlay />
    </div>
  ),

  name: 'with overlay',
};

export const WithCustomText = {
  render: () => (
    <div>
      <Loader {...props} text="Ah Yeah :)" />
    </div>
  ),

  name: 'with custom text',
};

export const WithNoText = {
  render: () => (
    <div>
      <Loader {...props} text="" />
    </div>
  ),

  name: 'with no text',
};
