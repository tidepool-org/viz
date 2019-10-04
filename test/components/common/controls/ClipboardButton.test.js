import React from 'react';
import { mount } from 'enzyme';
import _ from 'lodash';

import { formatClassesAsSelector } from '../../../helpers/cssmodules';
import ClipboardButton from '../../../../src/components/common/controls/ClipboardButton';
import styles from '../../../../src/components/common/controls/ClipboardButton.css';

describe('ClipboardButton', () => {
  let wrapper;
  let instance;

  const defaultProps = {
    getText: sinon.stub().returns('Got some text!'),
    onSuccess: sinon.stub(),
  };

  const props = overrides => _.assign({}, defaultProps, overrides);

  beforeEach(() => {
    wrapper = mount(<ClipboardButton {...defaultProps} />);
    instance = wrapper.instance();
  });

  afterEach(() => {
    defaultProps.getText.resetHistory();
    defaultProps.onSuccess.resetHistory();
  });

  describe('constructor', () => {
    it('should provide some sensible default props', () => {
      expect(instance.props.buttonText).to.equal('Copy as text');
      expect(instance.props.buttonTitle).to.equal('Copy to clipboard');
      expect(instance.props.clipboardText).to.equal('Sorry, there was nothing to copy.');
      expect(instance.props.successText).to.equal('Copied ✓');
    });

    it('should initialize the `successTextShowing` state as false', () => {
      expect(wrapper.state('successTextShowing')).to.be.false;
    });
  });

  describe('getText', () => {
    it('should return results of `props.getText` if provided', () => {
      expect(instance.getText()).to.equal('Got some text!');
    });

    it('should return `props.clipboardText` if `props.getText` is not provided', () => {
      wrapper.setProps(props({ getText: undefined, clipboardText: 'clipboard text' }));
      expect(instance.getText()).to.equal('clipboard text');
    });

    it('should return fallback text if neither `props.clipboardText` or `props.getText` is not provided', () => {
      wrapper.setProps(props({ getText: undefined, clipboardText: undefined }));
      expect(instance.getText()).to.equal('Sorry, there was nothing to copy.');
    });
  });

  describe('componentWillUnmount', () => {
    it('should cancel `state.debouncedButtonTextUpdate` if set', () => {
      wrapper.setState({ debouncedButtonTextUpdate: { cancel: sinon.stub() } });
      sinon.assert.notCalled(instance.state.debouncedButtonTextUpdate.cancel);

      wrapper.unmount();
      sinon.assert.calledOnce(instance.state.debouncedButtonTextUpdate.cancel);
    });
  });

  describe('onSuccess', () => {
    it('should call `props.getText` if provided', () => {
      sinon.assert.notCalled(defaultProps.onSuccess);
      instance.onSuccess();
      sinon.assert.calledOnce(defaultProps.onSuccess);
    });

    it('should set the `successTextShowing` state to `true`', () => {
      sinon.spy(instance, 'setState');
      instance.onSuccess();
      sinon.assert.calledWith(instance.setState, { successTextShowing: true });
    });

    it('should set a debounced call of the `setState` method', () => {
      sinon.spy(_, 'debounce');
      sinon.assert.callCount(_.debounce, 0);

      expect(wrapper.state().debouncedButtonTextUpdate).to.be.undefined;

      instance.onSuccess();

      sinon.assert.callCount(_.debounce, 1);
      sinon.assert.calledWith(_.debounce, sinon.match.func, 1000);
      expect(wrapper.state().debouncedButtonTextUpdate).to.be.a('function');

      _.debounce.restore();
    });
  });

  describe('render', () => {
    let button;

    beforeEach(() => {
      // button = () => wrapper.find('ClipboardButton').at(0);
      button = () => wrapper.find(formatClassesAsSelector(styles.copyButton)).hostNodes();
    });

    it('should render a clipboard button with default and success text as children', () => {
      expect(button()).to.have.length(1);
      expect(button().childAt(0).hasClass('ClipboardButton--buttonText')).to.be.true;
      expect(button().childAt(0).text()).to.equal('Copy as text');
      expect(button().childAt(1).hasClass('ClipboardButton--successText')).to.be.true;
      expect(button().childAt(1).text()).to.equal('Copied ✓');
    });

    it('should show the default text and hide the success text span by defualt', () => {
      expect(button().hasClass('ClipboardButton--buttonTextHidden')).to.be.false;
      expect(button().hasClass('ClipboardButton--successTextHidden')).to.be.true;
    });

    it('should hide the default text and show the successText when `state.successTextShowing` is true', () => {
      wrapper.setState({ successTextShowing: true });
      expect(button().hasClass('ClipboardButton--buttonTextHidden')).to.be.true;
      expect(button().hasClass('ClipboardButton--successTextHidden')).to.be.false;
    });
  });
});
