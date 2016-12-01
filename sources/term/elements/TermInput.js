import { style }                from '@manaflair/term-strings';
import { autobind }             from 'core-decorators';
import TextBuffer, { Point }    from 'text-buffer';

import { Event, TextFormatter } from '../../core';

import { TermElement }          from './TermElement';

export class TermInput extends TermElement {

    constructor({ value = ``, textBuffer = new TextBuffer(value), allowNewlines = false, ... props } = {}) {

        super(props);

        this.caretIndex = 0;
        this.caret = new Point(0, 0);
        this.caretMaxColumn = 0;

        this.style.element.minHeight = 1;
        this.style.element.whiteSpace = `pre`;
        this.style.element.backgroundCharacter = `.`;
        this.style.element.focusEvents = true;

        this.style.focused.backgroundColor = `#000088`;

        this.textBuffer = textBuffer;
        this.textFormatter = TextFormatter.open(this.textBuffer, { demoteNewlines: !allowNewlines });

        this.setPropertyTrigger(`allowNewlines`, value => {

            this.textFormatter.setOptions({ demoteNewlines: !value });
            this.style.element.height = value ? 10 : 1;

        }, { initial: allowNewlines });

        this.textFormatter.onDidChange(({ oldRange, newRange }) => {

            let firstRow = Math.min(oldRange.start.row, newRange.start.row);
            let lastRow = Math.max(oldRange.end.row, newRange.end.row);

            let dirtyRect = this.contentWorldRect.clone();
            dirtyRect.y += firstRow;
            dirtyRect.height = lastRow - firstRow;

            if (!this.style.$.display.layout.isBlockWidthFixed(this) || (!this.style.$.display.layout.isBlockHeightFixed(this) && (oldRange.start.row !== newRange.start.row || oldRange.end.row !== newRange.end.row))) {
                this.setDirtyLayoutFlag();
            } else if (this.contentClipRect) {
                this.queueDirtyRect(dirtyRect.intersect(this.contentClipRect));
            }

        });

        this.addShortcutListener(`left`, () => {

            this.caretIndex = Math.max(0, this.caretIndex - 1);
            this.caret = this.textFormatter.positionForCharacterIndex(this.caretIndex);
            this.caretMaxColumn = this.caret.column;

            this.scrollRowIntoView(this.caret.row);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`right`, () => {

            this.caretIndex = Math.min(this.caretIndex + 1, this.textBuffer.getMaxCharacterIndex());
            this.caret = this.textFormatter.positionForCharacterIndex(this.caretIndex);
            this.caretMaxColumn = this.caret.column;

            this.scrollRowIntoView(this.caret.row);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`up`, () => {

            this.caret.column = this.caretMaxColumn;
            this.caret = this.textFormatter.moveUp(this.caret);
            this.caretIndex = this.textFormatter.characterIndexForPosition(this.caret);

            this.scrollRowIntoView(this.caret.row);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`down`, () => {

            this.caret.column = this.caretMaxColumn;
            this.caret = this.textFormatter.moveDown(this.caret);
            this.caretIndex = this.textFormatter.characterIndexForPosition(this.caret);

            this.scrollRowIntoView(this.caret.row);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`enter`, () => {

            if (!this.allowNewlines)
                return;

            this.textBuffer.insert(this.textBuffer.positionForCharacterIndex(this.caretIndex), `\n`);

            this.caretIndex += 1;
            this.caret = this.textFormatter.positionForCharacterIndex(this.caretIndex);
            this.caretMaxColumn = this.caret.column;

            this.scrollRowIntoView(this.caret.row);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`backspace`, () => {

            if (this.caretIndex === 0)
                return;

            let start = this.textBuffer.positionForCharacterIndex(this.caretIndex - 1);
            let end = this.textBuffer.positionForCharacterIndex(this.caretIndex);

            this.textBuffer.delete([ start, end ]);

            this.caretIndex -= 1;
            this.caret = this.textFormatter.positionForCharacterIndex(this.caretIndex);
            this.caretMaxColumn = this.caret.column;

            this.scrollRowIntoView(this.caret.row);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`delete`, () => {

            let start = this.textBuffer.positionForCharacterIndex(this.caretIndex);
            let end = this.textBuffer.positionForCharacterIndex(this.caretIndex + 1);

            this.scrollRowIntoView(this.caret.row);

            this.textBuffer.delete([ start, end ]);

        });

        this.addEventListener(`data`, ({ buffer }) => {

            let string = buffer.toString();

            this.textBuffer.insert(this.textBuffer.positionForCharacterIndex(this.caretIndex), string);

            this.caretIndex += string.length;
            this.caret = this.textFormatter.positionForCharacterIndex(this.caretIndex);
            this.caretMaxColumn = this.caret.column;

            console.log(this.caret.row);

            this.scrollRowIntoView(this.caret.row);

            this.dispatchEvent(new Event(`caret`));

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

    getPreferredContentWidth() {

        this.textFormatter.setOptions({ columns: Infinity });
        this.textFormatter.apply(this.textBuffer);

        return this.textFormatter.columns;

    }

    finalizeHorizontalLayout() {

        this.textFormatter.setOptions({ columns: this.contentRect.width });
        this.textFormatter.apply(this.textBuffer);

    }

    getPreferredContentHeight() {

        return this.textFormatter.rows;

    }

    getInternalContentWidth() {

        return this.textFormatter.columns;

    }

    getInternalContentHeight() {

        return this.textFormatter.rows;

    }

    renderContent(x, y, l) {

        if (this.textFormatter.rows <= y)
            return this.renderBackground(l);

        let fullLine = this.textFormatter.lineForRow(y);
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
