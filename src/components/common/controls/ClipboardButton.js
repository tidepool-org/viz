import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import _ from 'lodash';
import i18next from 'i18next';
import Clipboard from 'react-clipboard.js';
import cx from 'classnames';

import styles from './ClipboardButton.css';

if (_.get(i18next, 'options.returnEmptyString') === undefined) {
  // Return key if no translation is present
  i18next.init({ returnEmptyString: false, nsSeparator: '|' });
}

const t = i18next.t.bind(i18next);

class ClipboardButton extends PureComponent {
  static propTypes = {
    buttonTitle: PropTypes.string.isRequired,
    buttonText: PropTypes.node.isRequired,
    clipboardText: PropTypes.string,
    getText: PropTypes.func,
    onClick: PropTypes.func,
    onSuccess: PropTypes.func,
    successText: PropTypes.node.isRequired,
  };

  static defaultProps = {
    buttonText: t('Copy as text'),
    buttonTitle: t('Copy to clipboard'),
    clipboardText: t('Sorry, there was nothing to copy.'),
    onClick: _.noop,
    successText: t('Copied ✓'),
  };

  static displayName = 'ClipboardButton';

  constructor(props) {
    super(props);
    this.state = this.getInitialState();
  }

  getInitialState = () => ({
    successTextShowing: false,
  });

  getText = () => (_.isFunction(this.props.getText)
    ? this.props.getText()
    : this.props.clipboardText
  );

  componentWillUnmount = () => {
    if (this.state.debouncedButtonTextUpdate) {
      this.state.debouncedButtonTextUpdate.cancel();
    }
  };

  onClick = () => this.props.onClick();

  onSuccess = () => {
    if (_.isFunction(this.props.onSuccess)) this.props.onSuccess();

    this.setState({ successTextShowing: true });

    // Update the chart date range in the patientData component.
    // We debounce this to avoid excessive updates while panning the view.
    if (this.state.debouncedButtonTextUpdate) {
      this.state.debouncedButtonTextUpdate.cancel();
    }

    const debouncedButtonTextUpdate = _.debounce(() => {
      this.setState({ successTextShowing: false });
    }, 1000);
    debouncedButtonTextUpdate();

    this.setState({ debouncedButtonTextUpdate });
  };

  render = () => {
    const textVisibilityClasses = cx({
      [styles.copyButton]: true,
      [styles.buttonTextHidden]: this.state.successTextShowing,
      [styles.successTextHidden]: !this.state.successTextShowing,
    });

    return (
      <Clipboard
        className={textVisibilityClasses}
        button-title={this.props.buttonTitle}
        option-text={this.getText}
        onClick={this.onClick}
        onSuccess={this.onSuccess}
      >
        <span className={styles.buttonText}>{this.props.buttonText}</span>
        <span className={styles.successText}>{this.props.successText}</span>
      </Clipboard>
    );
  };
}

export default ClipboardButton;
