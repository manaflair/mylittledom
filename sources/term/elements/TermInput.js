import { style }                from '@manaflair/term-strings';
import { autobind }             from 'core-decorators';
import TextBuffer, { Point }    from 'text-buffer';

import { Event, TextFormatter } from '../../core';

import { TermElement }          from './TermElement';

export class TermInput extends TermElement {

    constructor({ textContent = ``, ... props } = {}) {

        super(props);

        this.caret = new Point(0, 0);
        this.caretMaxColumn = 0;

        this.style.element.backgroundCharacter = `.`;
        this.style.element.focusEvents = true;

        this.style.focused.backgroundColor = `#000088`;

        this.textBuffer = new TextBuffer();
        this.textFormatter = TextFormatter.open(this.textBuffer);

        this.addShortcutListener(`left`, () => {

            this.caret = this.textFormatter.moveLeft(this.caret);
            this.caretMaxColumn = this.caret.column;

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`right`, () => {

            this.caret = this.textFormatter.moveRight(this.caret);
            this.caretMaxColumn = this.caret.column;

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`up`, () => {

            this.caret.column = this.caretMaxColumn;
            this.caret = this.textFormatter.moveUp(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`down`, () => {

            this.caret.column = this.caretMaxColumn;
            this.caret = this.textFormatter.moveDown(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addEventListener(`data`, ({ buffer }) => {

            let string = buffer.toString();

            let inputOffset = this.textFormatter.getInputOffsetForPosition(this.caret);
            let inputPosition = this.textBuffer.positionForCharacterIndex(inputOffset);

            this.textBuffer.insert(inputPosition, string);

            this.caret = this.textFormatter.getPositionForInputOffset(inputOffset + string.length);
            this.caretMaxColumn = this.caret.column;

            this.dispatchEvent(new Event(`caret`));

        });

        this.textBuffer.onDidChange(() => {

            this.setDirtyLayoutFlag();

        });

    }

    get value() {

        return this.textBuffer.getText();

    }

    set value(textContent) {

        this.textBuffer.setText(textContent);

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

    computeContentWidth() {

        this.textFormatter.setOptions({ columns: Infinity });
        this.textFormatter.apply(this.textBuffer);

        return this.textFormatter.columns;

    }

    finalizeHorizontalLayout() {

        this.textFormatter.setOptions({ columns: this.contentRect.width });
        this.textFormatter.apply(this.textBuffer);

    }

    computeContentHeight() {

        return this.textFormatter.rows;

    }

    renderContent(x, y, l) {

        if (this.textFormatter.rows <= y)
            return this.renderBackground(l);

        let fullLine = this.textFormatter.getLine(y);
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
        let line = fullLine.substr(lineStart, lineLength);
        let suffix = this.renderBackground(suffixLength);

        if (this.style.$.backgroundColor)
            line = this.style.$.backgroundColor.back + line;

        if (this.style.$.color)
            line = this.style.$.color.front + line;

        if (this.style.$.backgroundColor || this.style.$.color)
            line += style.clear;

        return prefix + line + suffix;

    }

}
