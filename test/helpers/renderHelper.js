import React from 'react';
import { render as rtlRender } from '@testing-library/react/pure';

/**
 * Helper that wraps RTL's render and provides setProps compatibility
 * to minimize changes when migrating from Enzyme.
 */
export function render(element) {
  let currentElement = element;
  const result = rtlRender(element);

  return {
    ...result,
    container: result.container,
    unmount: result.unmount,
    rerender: result.rerender,
    setProps: (newProps) => {
      const mergedProps = { ...currentElement.props, ...newProps };
      currentElement = React.createElement(
        currentElement.type,
        { ...mergedProps, key: currentElement.key, ref: currentElement.ref },
      );
      result.rerender(currentElement);
    },
  };
}
