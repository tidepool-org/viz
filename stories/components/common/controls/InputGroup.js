import React from 'react';
import _ from 'lodash';

import InputGroup from '../../../../src/components/common/controls/InputGroup';

export default { title: 'InputGroup' }

const suffixOptions = [
  {
    label: 'kg',
    value: 'kg',
  },
  {
    label: 'lb',
    value: 'lb',
  },
];

const suffix = {
  id: 'units',
  options: suffixOptions,
  value: suffixOptions[0],
};

const Wrapper = ({ children }) => (
  <div
    style={{
      maxWidth: '300px',
      border: '1px solid #ccc',
      padding: '30px',
      margin: 'auto',
    }}
  >
    {children}
  </div>
);

class InteractiveContainer extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
      suffix: props.suffix,
    };
  }

  handleInputChange = (event) => {
    event.persist();
    this.setState(() => ({
      value: event.target.value,
    }));
  };

  handleSuffixChange = (value) => {
    this.setState((state) => ({
      suffix: _.assign({}, state.suffix, {
        value,
      }),
    }));
  };

  render = () => (
    <InputGroup
      {...this.props}
      defaultValue={this.state.value}
      onChange={this.handleInputChange}
      onSuffixChange={this.handleSuffixChange}
      suffix={this.state.suffix}
    />
  );
}

export const NumberSuffixOptions = () => (
  <Wrapper>
    <InteractiveContainer id="weight" label="Weight" step={1} suffix={suffix} type="number" />
  </Wrapper>
);

NumberSuffixOptions.story = {
  name: 'Number, Suffix options',
};

export const NumberSuffixString = () => (
  <Wrapper>
    <InputGroup id="weight" label="Weight" step={1} suffix="kg" type="number" />
  </Wrapper>
);

NumberSuffixString.story = {
  name: 'Number, Suffix string',
};
