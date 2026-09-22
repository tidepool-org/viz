import _ from 'lodash';
import i18next from 'i18next';

import PrintView from './PrintView';

const t = i18next.t.bind(i18next);

class TagsAndSitesPrintView extends PrintView {
  constructor(doc, data, opts) {
    super(doc, data, opts);

    this.columnCount = 3;
    this.columnGutter = 14;
    this.sectionHeadingFontSize = 12.7;
    this.nameFontSize = 9;
    this.namePadding = [7, 7, 7, 7];
    this.tableBottomMargin = 14;
    this.outerBorderWidth = 1.15;

    this.tableSettings.borderWidth = 0.6;
    this.tableSettings.colors.border = '#989898';
    this.tableSettings.colors.zebraEven = '#F6F6F6';
    this.tableSettings.colors.zebraOdd = '#FFFFFF';

    this.colors.tableDivider = '#5D5C5C';
    this.colors.tableText = '#1E1E1E';

    this.doc.addPage();
  }

  render() {
    this.setLayoutColumns({
      width: this.chartArea.width,
      count: this.columnCount,
      gutter: this.columnGutter,
    });

    this.goToLayoutColumnPosition(0);

    if (this.patientTags.length) this.renderNameSection(t('Tags'), this.patientTags);
    if (this.sites.length) this.renderNameSection(t('Clinic Sites'), this.sites);
  }

  renderNameSection(heading, items) {
    const columnWidth = this.getActiveColumnWidth();
    const rows = _.map(items, ({ name }) => ({ name, hasDynamicHeight: true }));
    const rowHeights = _.map(rows, row => this.measureNameRowHeight(row.name, columnWidth));
    const headingHeight = this.measureSectionHeadingHeight(heading, columnWidth);

    let index = 0;
    let needsHeading = true;
    let tableTop = this.chartArea.topEdge;

    while (index < rows.length) {
      const required = (needsHeading ? headingHeight : 0) + rowHeights[index];
      const overflows = this.doc.y + required > this.chartArea.bottomEdge;

      if (overflows) {
        const startedNewPage = this.advanceLayoutColumn();

        if (startedNewPage) {
          // A new page has no heading above it to read the section from, so it repeats.
          needsHeading = true;
          tableTop = this.chartArea.topEdge;
        }

        // Within a page the heading is not repeated, so a continuation column would start a
        // heading's worth higher than the first one; drop it to the same line instead.
        this.doc.y = _.max([this.doc.y, tableTop]);
      }

      if (needsHeading) {
        this.renderSectionHeading(heading, {
          fontSize: this.sectionHeadingFontSize,
          width: columnWidth,
        });

        needsHeading = false;
        tableTop = this.doc.y;
      }

      // Chunk to what fits before handing rows to the table: an overflow inside the table
      // triggers PrintView.onPageAdd, which would add a page instead of the next column.
      let end = index;
      let y = this.doc.y;

      do {
        y += rowHeights[end];
        end++;
      } while (end < rows.length && y + rowHeights[end] <= this.chartArea.bottomEdge);

      this.renderNameTable(rows.slice(index, end), columnWidth);

      index = end;
    }
  }

  renderNameTable(rows, columnWidth) {
    const tableLeft = this.doc.x;
    const tableTop = this.doc.y;

    this.renderTable([{
      id: 'name',
      cache: false,
      renderer: this.renderCustomTextCell,
      align: 'left',
      border: 'TBLR',
      borderColor: this.colors.tableDivider,
      font: this.font,
      fontSize: this.nameFontSize,
      padding: this.namePadding,
      width: columnWidth,
      zebra: true,
    }], rows, {
      showHeaders: false,
      bottomMargin: this.tableBottomMargin,
    });

    // The table draws every cell edge at one width and colour, so the heavier outer rule
    // goes on afterwards rather than through a column option.
    this.doc
      .lineWidth(this.outerBorderWidth)
      .rect(tableLeft, tableTop, columnWidth, this.doc.y - this.tableBottomMargin - tableTop)
      .stroke(this.tableSettings.colors.border);

    this.doc.lineWidth(this.tableSettings.borderWidth);

    this.updateLayoutColumnPosition(this.layoutColumns.activeIndex);
  }

  /**
   * advanceLayoutColumn
   * Moves to the next layout column, or to the first column of a new page when the current
   * column is the last one.
   *
   * @return {Boolean} true when a new page was started, false when the move stayed within
   *                   the current page
   */
  advanceLayoutColumn() {
    const nextIndex = this.layoutColumns.activeIndex + 1;

    if (nextIndex < this.layoutColumns.count) {
      this.goToLayoutColumnPosition(nextIndex);
      return false;
    }

    this.doc.addPage();

    // newPage() restores whichever column was active, so the reset to the top of the first
    // column of the fresh page has to happen here.
    this.layoutColumns.columns = _.map(
      this.layoutColumns.columns,
      column => ({ ...column, y: this.chartArea.topEdge })
    );

    this.goToLayoutColumnPosition(0);

    return true;
  }

  measureNameRowHeight(name, columnWidth) {
    const [top, right, bottom, left] = this.namePadding;

    const height = this.doc
      .font(this.font)
      .fontSize(this.nameFontSize)
      .heightOfString(name, { width: columnWidth - left - right });

    this.resetText();

    return height + top + bottom;
  }

  measureSectionHeadingHeight(heading, columnWidth) {
    const textHeight = this.doc
      .font(this.font)
      .fontSize(this.sectionHeadingFontSize)
      .heightOfString(heading, { width: columnWidth });

    const gap = this.doc
      .font(this.font)
      .fontSize(this.defaultFontSize)
      .currentLineHeight();

    this.resetText();

    return textHeight + gap;
  }

  onCellBackgroundAdded() {
    this.setFill(this.colors.tableText);
  }
}

export default TagsAndSitesPrintView;
