import React from 'react';
import _ from 'lodash';
import { fireEvent, cleanup } from '@testing-library/react/pure';

import { render } from '../../../helpers/renderHelper';
import InputGroup from '../../../../src/components/common/controls/InputGroup';
import styles from '../../../../src/components/common/controls/InputGroup.css';

let lastSelectProps = null;
jest.mock('react-select', () => {
  const R = require('react');
  const MockSelect = (props) => {
    lastSelectProps = props;
    return R.createElement('select', {
      'data-testid': 'react-select',
      id: props.id,
      name: props.name,
    });
  };
  MockSelect.displayName = 'Select';
  return { __esModule: true, default: MockSelect };
});

describe('InputGroup', () => {
  let container;
  let setProps;

  const suffixString = 'Suffix';

  const suffixOptions = [
    {
      label: 'Option 1',
      value: 'option1',
    },
    {
      label: 'Option 2',
      value: 'option2',
    },
  ];

  const suffixSelectInput = {
    id: 'mySelect',
    options: suffixOptions,
    value: suffixOptions[1],
  };

  const defaultProps = {
    id: 'myInput',
    label: 'My Input',
    onChange: sinon.stub(),
    onSuffixChange: sinon.stub().returns('suffix changed!'),
    step: 1,
    suffix: suffixString,
    type: 'number',
    value: 10,
  };

  const props = overrides => _.assign({}, defaultProps, overrides);

  beforeEach(() => {
    lastSelectProps = null;
    const rendered = render(<InputGroup {...defaultProps} />);
    container = rendered.container;
    setProps = rendered.setProps;
  });

  afterEach(() => {
    cleanup();
    defaultProps.onChange.resetHistory();
    defaultProps.onSuffixChange.resetHistory();
  });

  describe('input', () => {
    it('should render an input of the provided type', () => {
      expect(container.querySelectorAll('input[type="number"]')).to.have.length(1);

      setProps(props({ type: 'text' }));
      expect(container.querySelectorAll('input[type="text"]')).to.have.length(1);
    });

    it('should set the provided `id` prop to the `name` and `id` attributes of the input', () => {
      expect(container.querySelectorAll('input[id="myInput"]')).to.have.length(1);
      expect(container.querySelectorAll('input[name="myInput"]')).to.have.length(1);

      setProps(props({ id: 'otherId' }));
      expect(container.querySelectorAll('input[id="otherId"]')).to.have.length(1);
      expect(container.querySelectorAll('input[name="otherId"]')).to.have.length(1);
    });

    it('should set the provided `step` prop to the `step` attribute of the input', () => {
      expect(container.querySelectorAll('input[step="1"]')).to.have.length(1);

      setProps(props({ step: 2 }));
      expect(container.querySelectorAll('input[step="2"]')).to.have.length(1);
    });

    it('should set the provided `min` prop to the `min` attribute of the input', () => {
      setProps(props({ min: 2 }));
      expect(container.querySelectorAll('input[min="2"]')).to.have.length(1);
    });

    it('should set the provided `max` prop to the `max` attribute of the input', () => {
      setProps(props({ max: 2 }));
      expect(container.querySelectorAll('input[max="2"]')).to.have.length(1);
    });

    it('should set the provided `value` prop to the `value` attribute of the input', () => {
      setProps(props({ value: 2 }));
      const input = container.querySelector('input');
      expect(input.value).to.equal('2');
    });

    it('should call the `onChange` handler when the input changes', () => {
      const input = container.querySelector('input');
      sinon.assert.callCount(defaultProps.onChange, 0);

      fireEvent.change(input, { target: { value: '300' } });
      sinon.assert.callCount(defaultProps.onChange, 1);
      // React 16 event pooling nullifies event.target after handler returns,
      // so verify the handler received an event argument
      expect(defaultProps.onChange.firstCall.args.length).to.be.at.least(1);
    });
  });

  describe('suffix string', () => {
    it('should render the provided suffix string as text', () => {
      const suffix = () => container.querySelector(`.${styles.suffixText}`);
      expect(suffix()).to.not.be.null;
      expect(suffix().textContent).to.equal('Suffix');

      setProps(props({ suffix: 'New Suffix' }));
      expect(suffix().textContent).to.equal('New Suffix');
    });

    it('should not render the suffix string when suffix prop is undefined', () => {
      expect(container.querySelector(`.${styles.suffixText}`)).to.not.be.null;

      setProps(props({ suffix: undefined }));
      expect(container.querySelector(`.${styles.suffixText}`)).to.be.null;
    });

    it('should not render the suffix string when suffix prop is an object', () => {
      expect(container.querySelector(`.${styles.suffixText}`)).to.not.be.null;

      setProps(props({ suffix: suffixSelectInput }));
      expect(container.querySelector(`.${styles.suffixText}`)).to.be.null;
    });
  });

  describe('suffix select input', () => {
    beforeEach(() => {
      setProps(props({ suffix: suffixSelectInput }));
    });

    it('should render an `Select` component', () => {
      expect(container.querySelector('[data-testid="react-select"]')).to.not.be.null;
    });

    it('should pass the provided `id` prop to the `name` and `id` prop of the `Select` component', () => {
      expect(lastSelectProps.id).to.equal('mySelect');
      expect(lastSelectProps.name).to.equal('mySelect');
    });

    it('should pass the provided `options` prop to the `options` prop of the `Select` component', () => {
      expect(lastSelectProps.options).to.eql(suffixOptions);
    });

    it('should pass the provided `value` prop to the `value` prop of the `Select` component', () => {
      expect(lastSelectProps.value).to.eql(suffixOptions[1]);
    });

    it('should pass the provided `onSuffixChange` prop to the `onChange` prop of the `Select` component', () => {
      expect(lastSelectProps.onChange()).to.equal('suffix changed!');
    });

    it('should disable manual input on the `Select` component`', () => {
      expect(lastSelectProps.onInputChange('should retain', { action: 'non-input-change' })).to.equal('should retain');
      expect(lastSelectProps.onInputChange('should disable', { action: 'input-change' })).to.equal('');
    });
  });
});
