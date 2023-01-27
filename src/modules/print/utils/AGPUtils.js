import _ from 'lodash';
/* global document, XMLSerializer, btoa */

export function createSvgRectWithBorderRadius(x = 0, y = 0, width, height, radius) {
  const { tl = 0, tr = 0, br = 0, bl = 0 } = radius;

  // TODO: work x and y in
  return `M ${tl + x} ${y}\
    H ${width - tr}\
    Q ${width} 0 ${width} ${-tr}\
    V ${-height + br}\
    Q ${width} ${-height} ${width - br} ${-height}\
    H ${bl}\
    Q 0 ${-height} 0 ${-height + bl}\
    V ${-tr}\
    Q 0 0 ${tl} 0\
    Z `.replace(/\s\s+/g, ' ');
}

export function createImgSvgRectWithBorderRadius(x, y, width, height, radius, styles) {
  const {
    fill = '#FFFFFF',
    fillOpacity = 1,
    stroke = '#000000',
    strokeWidth = 3,
  } = styles;

  const roundRect = () => {
    const radiusCorners = { tl: 0, tr: 0, br: 0, bl: 0 };
    _.each(_.keys(radiusCorners), key => {
      radiusCorners[key] = typeof radius === 'number' ? radius : radius[key] || 0;
    });
    const r = radiusCorners;

    return `M${x + r.tl},${y}\
      h${width - (r.tl + r.tr)}\
      a${r.tr},${r.tr} 0 0 1 ${r.tr},${r.tr}\
      v${height - (r.tr + r.br)}\
      a${r.br},${r.br} 0 0 1 -${r.br},${r.br}\
      h-${width - (r.bl + r.br)}\
      a${r.bl},${r.bl} 0 0 1 -${r.bl},-${r.bl}\
      v-${height - (r.tl + r.bl)}\
      a${r.tl},${r.tl} 0 0 1 ${r.tl},-${r.tl}\
      z`.replace(/\s\s+/g, ' ').replace(',', ', ');
  };

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', roundRect(x, y, width, height, radius));
  path.setAttribute('fill', fill);
  path.setAttribute('fill-opacity', fillOpacity);
  path.setAttribute('stroke', stroke);
  path.setAttribute('stroke-width', strokeWidth);
  svg.append(path);


  const xml = (new XMLSerializer()).serializeToString(svg);
  return `data:image/svg+xml;base64,${btoa(xml)}`;
}
