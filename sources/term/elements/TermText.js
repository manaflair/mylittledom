import { style }                       from '@manaflair/term-strings';
import { autobind }                    from 'core-decorators';
import TextBuffer                      from 'text-buffer';

import { Event, Point, TextFormatter } from '../../core';

import { TermElement }                 from './TermElement';

export class TermText extends TermElement {

    constructor({ textContent = ``, ... props } = {}) {

        super(props);

        this.textBuffer = new TextBuffer();
        this.textFormatter = TextFormatter.open(this.textBuffer);

        this.setPropertyTrigger(`transformPass`, value => {

            if (value !== null && typeof value !== `function`)
                throw new Error(`Failed to set "transformPass": Value has to be null or a function.`);

            this.setDirtyRenderingFlag();

        }, { initial: null });

        if (textContent) {
            this.textContent = textContent;
        }

    }

    get textContent() {

        return this.textBuffer.getText();

    }

    set textContent(textContent) {

        this.textBuffer.setText(textContent);

        this.setDirtyLayoutFlag();

    }

    appendChild(node) {

        throw new Error(`Failed to execute 'appendChild': This node does not support this method.`);

    }

    insertBefore(node) {

        throw new Error(`Failed to execute 'insertBefore': This node does not support this method.`);

    }

    removeChild(node) {

        throw new Error(`Failed to execute 'removeChild': This node does not support this method.`);

    }

    prepareForLayout() {

        let allowWordBreaks = this.style.$.overflowWrap.doesBreakWords;
        let collapseWhitespaces = this.style.$.whiteSpace.doesCollapse;
        let demoteNewlines = this.style.$.whiteSpace.doesDemoteNewlines;
        let justifyText = this.style.$.textAlign.isJustified;

        this.textFormatter.setOptions({ allowWordBreaks, collapseWhitespaces, demoteNewlines, justifyText });

    }

    getPreferredContentWidth() {

        this.textFormatter.setOptions({ columns: Infinity });
        this.textFormatter.apply(this.textBuffer);

        return this.textFormatter.columns;

    }

    finalizeHorizontalLayout() {

        this.textFormatter.setOptions({ columns: this.style.$.whiteSpace.doesWrap ? this.contentRect.width : Infinity });
        this.textFormatter.apply(this.textBuffer);

    }

    getPreferredContentHeight() {

        return this.textFormatter.rows;

    }

    renderContent(x, y, l) {

        if (this.textFormatter.rows <= y)
            return this.renderBackground(l);

        let fullLine = this.textFormatter.lineForRow(y);

        if (this.transformPass)
            fullLine = this.transformPass(fullLine, y);

        let fullLineStart = 0;

        if (this.style.$.textAlign.isCentered)
            fullLineStart = Math.floor((this.scrollRect.width - fullLine.length) / 2);

        if (this.style.$.textAlign.isRightAligned)
            fullLineStart = this.scrollRect.width - fullLine.length;

        let prefixLength = Math.max(0, Math.min(fullLineStart - x, l));
        let lineStart = Math.max(0, x - fullLineStart);
        let lineLength = Math.max(0, Math.min(l - prefixLength, fullLine.length));
        let suffixLength = Math.max(0, l - prefixLength - lineLength);

        let prefix = this.renderBackground(prefixLength);
        let text = this.renderText(fullLine.substr(lineStart, lineLength));
        let suffix = this.renderBackground(suffixLength);

        return prefix + text + suffix;

    }

}
