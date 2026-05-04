import React from 'react';
import _ from 'lodash';
import { render as rtlRender, cleanup, act } from '@testing-library/react/pure';

import ClipboardButton from '../../../../src/components/common/controls/ClipboardButton';
import styles from '../../../../src/components/common/controls/ClipboardButton.css';

jest.mock('react-clipboard.js', () => {
  const R = require('react');
  const MockClipboard = R.forwardRef(({ className, onClick, onSuccess, children, ...rest }, ref) =>
    R.createElement('button', {
      className,
      onClick,
      'data-testid': 'clipboard-button',
    }, children)
  );
  MockClipboard.displayName = 'Clipboard';
  return { __esModule: true, default: MockClipboard };
});

describe('ClipboardButton', () => {
  let container;
  let instance;
  let unmountFn;
  let rerenderFn;

  const defaultProps = {
    getText: sinon.stub().returns('Got some text!'),
    onSuccess: sinon.stub(),
  };

  const props = overrides => _.assign({}, defaultProps, overrides);

  beforeEach(() => {
    const ref = React.createRef();
    const result = rtlRender(React.createElement(ClipboardButton, { ...defaultProps, ref }));
    container = result.container;
    unmountFn = result.unmount;
    rerenderFn = result.rerender;
    instance = ref.current;
  });

  afterEach(() => {
    cleanup();
    defaultProps.getText.resetHistory();
    defaultProps.onSuccess.resetHistory();
  });

  function setProps(newProps) {
    const ref = React.createRef();
    rerenderFn(React.createElement(ClipboardButton, { ...newProps, ref }));
    instance = ref.current;
  }

  describe('constructor', () => {
    it('should provide some sensible default props', () => {
      expect(instance.props.buttonText).to.equal('Copy as text');
      expect(instance.props.buttonTitle).to.equal('Copy to clipboard');
      expect(instance.props.clipboardText).to.equal('Sorry, there was nothing to copy.');
      expect(instance.props.successText).to.equal('Copied ✓');
    });

    it('should initialize the `successTextShowing` state as false', () => {
      expect(instance.state.successTextShowing).to.be.false;
    });
  });

  describe('getText', () => {
    it('should return results of `props.getText` if provided', () => {
      expect(instance.getText()).to.equal('Got some text!');
    });

    it('should return `props.clipboardText` if `props.getText` is not provided', () => {
      setProps(props({ getText: undefined, clipboardText: 'clipboard text' }));
      expect(instance.getText()).to.equal('clipboard text');
    });

    it('should return fallback text if neither `props.clipboardText` nor `props.getText` is provided', () => {
      setProps(props({ getText: undefined, clipboardText: undefined }));
      expect(instance.getText()).to.equal('Sorry, there was nothing to copy.');
    });
  });

  describe('componentWillUnmount', () => {
    it('should cancel `state.debouncedButtonTextUpdate` if set', () => {
      const cancelStub = sinon.stub();
      act(() => {
        instance.setState({ debouncedButtonTextUpdate: { cancel: cancelStub } });
      });
      sinon.assert.notCalled(cancelStub);

      unmountFn();
      sinon.assert.calledOnce(cancelStub);
    });
  });

  describe('onSuccess', () => {
    it('should call `props.onSuccess` if provided', () => {
      sinon.assert.notCalled(defaultProps.onSuccess);
      act(() => { instance.onSuccess(); });
      sinon.assert.calledOnce(defaultProps.onSuccess);
    });

    it('should set the `successTextShowing` state to `true`', () => {
      sinon.spy(instance, 'setState');
      act(() => { instance.onSuccess(); });
      sinon.assert.calledWith(instance.setState, { successTextShowing: true });
      instance.setState.restore();
    });

    it('should set a debounced call of the `setState` method', () => {
      sinon.spy(_, 'debounce');
      sinon.assert.callCount(_.debounce, 0);

      expect(instance.state.debouncedButtonTextUpdate).to.be.undefined;

      act(() => { instance.onSuccess(); });

      sinon.assert.callCount(_.debounce, 1);
      sinon.assert.calledWith(_.debounce, sinon.match.func, 1000);
      expect(instance.state.debouncedButtonTextUpdate).to.be.a('function');

      _.debounce.restore();
    });
  });

  describe('render', () => {
    it('should render a clipboard button with default and success text as children', () => {
      const button = container.querySelector(`.${styles.copyButton}`);
      expect(button).to.not.be.null;
      const spans = button.querySelectorAll('span');
      expect(spans[0].className).to.include(styles.buttonText);
      expect(spans[0].textContent).to.equal('Copy as text');
      expect(spans[1].className).to.include(styles.successText);
      expect(spans[1].textContent).to.equal('Copied ✓');
    });

    it('should show the default text and hide the success text span by default', () => {
      const button = container.querySelector(`.${styles.copyButton}`);
      expect(button.className).to.not.include(styles.buttonTextHidden);
      expect(button.className).to.include(styles.successTextHidden);
    });

    it('should hide the default text and show the successText when `state.successTextShowing` is true', () => {
      act(() => { instance.setState({ successTextShowing: true }); });
      const button = container.querySelector(`.${styles.copyButton}`);
      expect(button.className).to.include(styles.buttonTextHidden);
      expect(button.className).to.not.include(styles.successTextHidden);
    });
  });
});
