/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2016, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 * == BSD2 LICENSE ==
 */

import React from 'react';

import { render as rtlRender, cleanup, act } from '@testing-library/react/pure';

import { formatClassesAsSelector } from '../../../helpers/cssmodules';

import Tooltip from '../../../../src/components/common/tooltips/Tooltip';
import styles from '../../../../src/components/common/tooltips/Tooltip.css';

describe('Tooltip', () => {
  const position = { top: 50, left: 50 };
  const title = 'Title';
  const content = 'Content';

  afterEach(() => {
    cleanup();
    ['componentDidMount', 'calculateOffset', 'UNSAFE_componentWillReceiveProps'].forEach((m) => {
      if (Tooltip.prototype[m] && Tooltip.prototype[m].restore) {
        Tooltip.prototype[m].restore();
      }
    });
  });

  it('should render without issue when all properties provided', () => {
    const { container } = rtlRender(
      <Tooltip
        position={position}
        title={title}
        content={content}
      />
    );
    expect(container.querySelectorAll(formatClassesAsSelector(styles.title))).to.have.length(1);
    // With identity-obj-proxy, composes: is lost; title no longer includes content class
    expect(container.querySelectorAll(formatClassesAsSelector(styles.content))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.tail))).to.have.length(2);
  });

  it('should render without a tail when tail is false', () => {
    const { container } = rtlRender(
      <Tooltip
        position={position}
        title={title}
        content={content}
        tail={false}
      />
    );
    expect(container.querySelectorAll(formatClassesAsSelector(styles.title))).to.have.length(1);
    // With identity-obj-proxy, composes: is lost; title no longer includes content class
    expect(container.querySelectorAll(formatClassesAsSelector(styles.content))).to.have.length(1);
    expect(container.querySelectorAll(formatClassesAsSelector(styles.tail))).to.have.length(0);
  });

  it('should have offset {top: -5, left: -5} when tail on left', () => {
    const ref = React.createRef();
    rtlRender(
      <Tooltip
        ref={ref}
        position={position}
        title={title}
        content={content}
        side={'left'}
        tailWidth={10}
        tailHeight={10}
      />
    );

    const tailElem = ref.current.tailElem;
    const tailgetBoundingClientRect = sinon.stub(tailElem, 'getBoundingClientRect');
    tailgetBoundingClientRect.returns({ top: 50, left: 50, height: 10, width: 20 });

    const tooltipElem = ref.current.element;
    const tooltipgetBoundingClientRect = sinon.stub(tooltipElem, 'getBoundingClientRect');
    tooltipgetBoundingClientRect.returns({ top: 50, left: 50, height: 100, width: 100 });

    const titleElem = ref.current.titleElem;
    const titlegetBoundingClientRect = sinon.stub(titleElem, 'getBoundingClientRect');
    titlegetBoundingClientRect.returns({ top: 50, left: 50, height: 20, width: 100 });

    act(() => {
      ref.current.calculateOffset(ref.current.props);
    });

    // top: -(tooltip height + title height) / 2 + top offset prop = -(100 + 20) / 2 + 0 = -60
    // left: -tooltip width + (tail width * 2) = -100 + -(10 * 2) = -120
    expect(ref.current.state).to.deep.equal({ offset: { top: -60, left: -120 } });
  });

  it('should have offset {top: -5, left: -105} when tail on right', () => {
    const ref = React.createRef();
    rtlRender(
      <Tooltip
        ref={ref}
        position={position}
        title={title}
        content={content}
        side={'right'}
        tailWidth={10}
        tailHeight={10}
      />
    );

    const tailElem = ref.current.tailElem;
    const tailgetBoundingClientRect = sinon.stub(tailElem, 'getBoundingClientRect');
    tailgetBoundingClientRect.returns({ top: 50, left: 150, height: 10, width: 10 });

    const tooltipElem = ref.current.element;
    const tooltipgetBoundingClientRect = sinon.stub(tooltipElem, 'getBoundingClientRect');
    tooltipgetBoundingClientRect.returns({ top: 50, left: 50, height: 100, width: 100 });

    const titleElem = ref.current.titleElem;
    const titlegetBoundingClientRect = sinon.stub(titleElem, 'getBoundingClientRect');
    titlegetBoundingClientRect.returns({ top: 50, left: 50, height: 20, width: 100 });

    act(() => {
      ref.current.calculateOffset(ref.current.props);
    });

    // top: -(tooltip height + title height) / 2 + top offset prop = -(100 + 20) / 2 + 0 = -60
    // left: tail width * 2 = 10 * 2 = 20
    expect(ref.current.state).to.deep.equal({ offset: { top: -60, left: 20 } });
  });

  it('should have offset {top: -50, left: -100} when no tail, on left', () => {
    const ref = React.createRef();
    rtlRender(
      <Tooltip
        ref={ref}
        position={position}
        title={title}
        content={content}
        tail={false}
        side={'left'}
      />
    );
    const tooltipElem = ref.current.element;
    const tooltipgetBoundingClientRect = sinon.stub(tooltipElem, 'getBoundingClientRect');
    tooltipgetBoundingClientRect.returns({ top: 50, left: 50, height: 100, width: 100 });
    act(() => {
      ref.current.calculateOffset(ref.current.props);
    });
    expect(ref.current.state).to.deep.equal({ offset: { top: -50, left: -100 } });
  });

  it('should have offset {top: -50, left: 0} when no tail, on right', () => {
    const ref = React.createRef();
    rtlRender(
      <Tooltip
        ref={ref}
        position={position}
        title={title}
        content={content}
        tail={false}
        side={'right'}
      />
    );
    const tooltipElem = ref.current.element;
    const tooltipgetBoundingClientRect = sinon.stub(tooltipElem, 'getBoundingClientRect');
    tooltipgetBoundingClientRect.returns({ top: 50, left: 50, height: 100, width: 100 });
    act(() => {
      ref.current.calculateOffset(ref.current.props);
    });
    expect(ref.current.state).to.deep.equal({ offset: { top: -50, left: 0 } });
  });

  it('should have offset {top: -100, left: -50} when no tail, on top', () => {
    const ref = React.createRef();
    rtlRender(
      <Tooltip
        ref={ref}
        position={position}
        title={title}
        content={content}
        tail={false}
        side={'top'}
      />
    );
    const tooltipElem = ref.current.element;
    const tooltipgetBoundingClientRect = sinon.stub(tooltipElem, 'getBoundingClientRect');
    tooltipgetBoundingClientRect.returns({ top: 50, left: 50, height: 100, width: 100 });
    act(() => {
      ref.current.calculateOffset(ref.current.props);
    });
    expect(ref.current.state).to.deep.equal({ offset: { top: -100, left: -50 } });
  });

  it('should have offset {top: 0, left: -50} when no tail, on bottom', () => {
    const ref = React.createRef();
    rtlRender(
      <Tooltip
        ref={ref}
        position={position}
        title={title}
        content={content}
        tail={false}
        side={'bottom'}
      />
    );
    const tooltipElem = ref.current.element;
    const tooltipgetBoundingClientRect = sinon.stub(tooltipElem, 'getBoundingClientRect');
    tooltipgetBoundingClientRect.returns({ top: 0, left: 50, height: 100, width: 100 });
    act(() => {
      ref.current.calculateOffset(ref.current.props);
    });
    expect(ref.current.state).to.deep.equal({ offset: { top: 0, left: -50 } });
  });

  describe('an additional `offset` provided in props', () => {
    it('should be added to the calculated offset', () => {
      const top = 7;
      const left = 7;

      const ref = React.createRef();
      rtlRender(
        <Tooltip
          ref={ref}
          offset={{ top, left }}
          position={position}
          title={title}
          content={content}
          side={'right'}
          tailWidth={10}
          tailHeight={10}
        />
      );

      const tailElem = ref.current.tailElem;
      const tailgetBoundingClientRect = sinon.stub(tailElem, 'getBoundingClientRect');
      tailgetBoundingClientRect.returns({ top: 50, left: 150, height: 10, width: 10 });

      const tooltipElem = ref.current.element;
      const tooltipgetBoundingClientRect = sinon.stub(tooltipElem, 'getBoundingClientRect');
      tooltipgetBoundingClientRect.returns({ top: 50, left: 50, height: 100, width: 100 });

      const titleElem = ref.current.titleElem;
      const titlegetBoundingClientRect = sinon.stub(titleElem, 'getBoundingClientRect');
      titlegetBoundingClientRect.returns({ top: 50, left: 50, height: 20, width: 100 });

      act(() => {
        ref.current.calculateOffset(ref.current.props);
      });

      // top: -(tooltip height + title height) / 2 + top offset prop = -(100 + 20) / 2 + 0 = -60 + 7 offset
      // left: tail width * 2 = 10 * 2 = 20 + 7 offset
      expect(ref.current.state).to.deep.equal({ offset: { top: -53, left: 27 } });
    });

    describe('`horizontal` instead of `left` provided in `offset` in props', () => {
      it('should be used as-is in the offset computation for a tooltip on the right', () => {
        const top = 7;
        const horizontal = 7;

        const ref = React.createRef();
        rtlRender(
          <Tooltip
            ref={ref}
            offset={{ top, horizontal }}
            position={position}
            title={title}
            content={content}
            side={'right'}
            tailWidth={10}
            tailHeight={10}
          />
        );

        const tailElem = ref.current.tailElem;
        const tailgetBoundingClientRect = sinon.stub(tailElem, 'getBoundingClientRect');
        tailgetBoundingClientRect.returns({ top: 50, left: 150, height: 10, width: 10 });

        const tooltipElem = ref.current.element;
        const tooltipgetBoundingClientRect = sinon.stub(tooltipElem, 'getBoundingClientRect');
        tooltipgetBoundingClientRect.returns({ top: 50, left: 50, height: 100, width: 100 });

        const titleElem = ref.current.titleElem;
        const titlegetBoundingClientRect = sinon.stub(titleElem, 'getBoundingClientRect');
        titlegetBoundingClientRect.returns({ top: 50, left: 50, height: 20, width: 100 });

        act(() => {
          ref.current.calculateOffset(ref.current.props);
        });

        // top: -(tooltip height + title height) / 2 + top offset prop = -(100 + 20) / 2 + 0 = -60 + 7 offset
        // left: tail width * 2 = 10 * 2 = 20 + 7 offset
        expect(ref.current.state).to.deep.equal({ offset: { top: -53, left: 27 } });
      });

      it('should be subtracted from the offset computation for a tooltip on the left', () => {
        const top = 7;
        const horizontal = 7;

        const ref = React.createRef();
        rtlRender(
          <Tooltip
            ref={ref}
            offset={{ top, horizontal }}
            position={position}
            title={title}
            content={content}
            side={'left'}
            tailWidth={10}
            tailHeight={10}
          />
        );

        const tailElem = ref.current.tailElem;
        const tailgetBoundingClientRect = sinon.stub(tailElem, 'getBoundingClientRect');
        tailgetBoundingClientRect.returns({ top: 50, left: 50, height: 10, width: 10 });

        const tooltipElem = ref.current.element;
        const tooltipgetBoundingClientRect = sinon.stub(tooltipElem, 'getBoundingClientRect');
        tooltipgetBoundingClientRect.returns({ top: 50, left: 50, height: 100, width: 100 });

        const titleElem = ref.current.titleElem;
        const titlegetBoundingClientRect = sinon.stub(titleElem, 'getBoundingClientRect');
        titlegetBoundingClientRect.returns({ top: 50, left: 50, height: 20, width: 100 });

        act(() => {
          ref.current.calculateOffset(ref.current.props);
        });

        // top: -(tooltip height + title height) / 2 + top offset prop = -(100 + 20) / 2 + 0 = -60 + 7 offset
        // left: -tooltip width + (tail width * 2) = -100 + -(10 * 2) = -120 - 7 offset
        expect(ref.current.state).to.deep.equal({ offset: { top: -53, left: -127 } });
      });
    });
  });

  describe('lifecycle methods', () => {
    it('calls componentDidMount (which calls calculateOffset)', () => {
      sinon.spy(Tooltip.prototype, 'componentDidMount');
      sinon.spy(Tooltip.prototype, 'calculateOffset');
      rtlRender(
        <Tooltip
          position={position}
          title={title}
          content={content}
        />
      );
      expect(Tooltip.prototype.componentDidMount.calledOnce).to.be.true;
      expect(Tooltip.prototype.calculateOffset.calledOnce).to.be.true;
      Tooltip.prototype.componentDidMount.restore();
      Tooltip.prototype.calculateOffset.restore();
    });

    it('calls componentWillReceiveProps (which calls calculateOffset) on props update', () => {
      sinon.spy(Tooltip.prototype, 'UNSAFE_componentWillReceiveProps');
      const ref = React.createRef();
      const baseProps = { position, title, content };
      const { rerender } = rtlRender(
        <Tooltip ref={ref} {...baseProps} />
      );
      const instance = ref.current;

      const calcSpy = sinon.spy(instance, 'calculateOffset');
      expect(Tooltip.prototype.UNSAFE_componentWillReceiveProps.callCount).to.equal(0);
      expect(calcSpy.callCount).to.equal(0);
      rerender(<Tooltip ref={ref} {...baseProps} title="New title!" />);
      expect(Tooltip.prototype.UNSAFE_componentWillReceiveProps.calledOnce).to.be.true;
      expect(calcSpy.calledOnce).to.be.true;
      expect(calcSpy.args[0][0]).to.deep.equal(ref.current.props);
      Tooltip.prototype.UNSAFE_componentWillReceiveProps.restore();
      instance.calculateOffset.restore();
    });
  });
});
