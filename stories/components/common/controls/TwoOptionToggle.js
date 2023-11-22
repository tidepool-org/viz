import PropTypes from 'prop-types';
import React from 'react';

import TwoOptionToggle from '../../../../src/components/common/controls/TwoOptionToggle';

// eslint-disable-next-line no-console
const toggleFn = () => {
  console.log('Clicked toggle!');
};

class InteractiveContainer extends React.Component {
  static propTypes = {
    disabled: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.state = {
      leftOption: true,
      rightOption: false,
    };
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.setState({
      leftOption: !this.state.leftOption,
      rightOption: !this.state.rightOption,
    });
  }

  render() {
    return (
      <div onClick={this.toggle}>
        <TwoOptionToggle
          disabled={this.props.disabled}
          left={{ label: 'BGM', state: this.state.leftOption }}
          right={{ label: 'CGM', state: this.state.rightOption }}
          toggleFn={toggleFn}
        />
      </div>
    );
  }
}

export default {
  title: 'TwoOptionToggle',
};

export const LeftSelected = {
  render: () => (
    <TwoOptionToggle
      left={{ label: 'BGM', state: true }}
      right={{ label: 'CGM', state: false }}
      toggleFn={toggleFn}
    />
  ),

  name: 'left selected',
};

export const RightSelected = {
  render: () => (
    <TwoOptionToggle
      left={{ label: 'BGM', state: false }}
      right={{ label: 'CGM', state: true }}
      toggleFn={toggleFn}
    />
  ),

  name: 'right selected',
};

export const Disabled = {
  render: () => (
    <TwoOptionToggle
      disabled
      left={{ label: 'BGM', state: false }}
      right={{ label: 'CGM', state: true }}
      toggleFn={toggleFn}
    />
  ),

  name: 'disabled',
};

export const Interactive = {
  render: () => <InteractiveContainer />,
  name: 'interactive',
};
