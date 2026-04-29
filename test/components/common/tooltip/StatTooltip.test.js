import React from 'react';
import { render as rtlRender, cleanup } from '@testing-library/react/pure';
import _ from 'lodash';

import { formatClassesAsSelector } from '../../../helpers/cssmodules';
import StatTooltip from '../../../../src/components/common/tooltips/StatTooltip';
import styles from '../../../../src/components/common/tooltips/StatTooltip.css';

// Mock Tooltip to render title and content props
jest.mock('../../../../src/components/common/tooltips/Tooltip', () => ({
  __esModule: true,
  default: (props) => {
    const R = require('react');
    return R.createElement('div', { 'data-testid': 'Tooltip' },
      props.title && R.createElement('div', null, props.title),
      props.content,
    );
  },
}));

describe('StatTooltip', () => {
  let localContainer;
  let localRerender;

  const defaultProps = {
    position: {
      top: 0,
      left: 0,
    },
    annotations: [
      'message 1',
      'message 2',
    ],
  };

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    const result = rtlRender(React.createElement(StatTooltip, defaultProps));
    localContainer = result.container;
    localRerender = result.rerender;
  });

  it('should render a tooltip', () => {
    expect(localContainer.querySelectorAll('[data-testid="Tooltip"]')).to.have.length(1);
  });

  it('should render text messages', () => {
    const messages = localContainer.querySelectorAll(formatClassesAsSelector(styles.message));
    expect(messages).to.have.length(2);
    expect(messages[0].textContent).to.equal('message 1');
    expect(messages[1].textContent).to.equal('message 2');
  });

  it('should render markdown messages', () => {
    localRerender(React.createElement(StatTooltip, _.assign({}, defaultProps, {
      annotations: [
        'Some _italic_ text',
        'Some **bold** text',
        'a [link](http://www.example.com)',
      ],
    })));
    const messages = localContainer.querySelectorAll(formatClassesAsSelector(styles.message));
    expect(messages[0].innerHTML).to.include('<em>italic</em>');
    expect(messages[1].innerHTML).to.include('<strong>bold</strong>');
    expect(messages[2].innerHTML).to.include('<a href="http://www.example.com" target="_blank">link</a>');
  });

  it('should render a divider between messages', () => {
    const dividers = () => localContainer.querySelectorAll(formatClassesAsSelector(styles.divider));
    expect(dividers()).to.have.length(1);
    localRerender(React.createElement(StatTooltip, _.assign({}, defaultProps, {
      annotations: [
        'message 1',
        'message 2',
        'message 3',
        'message 4',
      ],
    })));
    expect(dividers()).to.have.length(3);
  });
});
