import React, { PropTypes, PureComponent } from 'react';
import _ from 'lodash';
import i18next from 'i18next';
import Clipboard from 'react-clipboard.js';

import styles from './ClipboardButton.css';

const t = i18next.t.bind(i18next);

class ClipboardButton extends PureComponent {
  static propTypes = {
    onSuccess: PropTypes.func,
    buttonTitle: PropTypes.string.isRequired,
    buttonText: PropTypes.string.isRequired,
    clipboardText: PropTypes.string,
  };

  static defaultProps = {
    buttonText: t('Copy as text'),
    buttonTitle: t('Copy to clipboard'),
  };

  constructor(props) {
    super(props);
    this.state = this.getInitialState();
  }

  getInitialState = () => ({
    copied: false,
    buttonText: this.props.buttonText,
  });

  componentWillUnmount = () => {
    if (this.state.debouncedButtonTextUpdate) {
      this.state.debouncedButtonTextUpdate.cancel();
    }
  };

  onSuccess = () => {
    if (_.isFunction(this.props.onSuccess)) this.props.onSuccess();

    this.setState({ buttonText: t('Copied!') });

    // Update the chart date range in the patientData component.
    // We debounce this to avoid excessive updates while panning the view.
    if (this.state.debouncedButtonTextUpdate) {
      this.state.debouncedButtonTextUpdate.cancel();
    }

    const debouncedButtonTextUpdate = _.debounce(() => {
      this.setState({ buttonText: this.getInitialState().buttonText });
    }, 1000);
    debouncedButtonTextUpdate();

    this.setState({ debouncedButtonTextUpdate });
  };

  render = () => (
    <Clipboard
      className={styles.copyButton}
      button-title={this.props.buttonTitle}
      data-clipboard-text={this.props.clipboardText}
      onSuccess={this.onSuccess}
    >
      {this.state.buttonText}
    </Clipboard>
  );
}

export default ClipboardButton;
