import { TextLayout }         from '@manaflair/text-layout/sources/entry-browser';
import { isFunction, isNull } from 'lodash';
import TextBuffer             from 'text-buffer';

import { Event, Point }       from '../../core';

import { TermElement }        from './TermElement';

export class TermTextBase extends TermElement {

    constructor({ textBuffer = new TextBuffer(), enterIsNewline = true, readOnly = false, ... props } = {}) {

        super(props);

        this.caretIndex = 0;
        this.caret = new Point(0, 0);
        this.caretMaxColumn = 0;

        this.textBuffer = textBuffer;
        this.textLayout = new TextLayout();
        this.textLines = [ `` ];

        this.textLayout.setCharacterGetter(offset => {

            let position = this.textBuffer.positionForCharacterIndex(offset);

            if (position.column == this.textBuffer.lineLengthForRow(position.row))
                return this.textBuffer.lineEndingForRow(position.row);

            return this.textBuffer.lineForRow(position.row)[position.column];

        });

        this.textLayout.setCharacterCountGetter(() => {

            return this.textBuffer.getMaxCharacterIndex();

        });

        this.textLayout.setSoftWrap(this.style.$.whiteSpace.doesWrap);
        this.textLayout.setDemoteNewlines(this.style.$.whiteSpace.doesDemoteNewlines);
        this.textLayout.setCollapseWhitespaces(this.style.$.whiteSpace.doesCollapse);
        this.textLayout.setJustifyText(this.style.$.textAlign.isJustified);
        this.textLayout.setAllowWordBreaks(this.style.$.overflowWrap.doesBreakWords);

        this.textLayout.reset().apply(this.textLines);

        this.addEventListener(`layout`, () => {

            if (this.textLayout.setOptions({ columns: this.contentRect.width })) {
                this.textLayout.reset().apply(this.textLines);
            }

        });

        this.textBuffer.onDidChange(({ oldRange, oldText, newText }) => {

            let offset = this.textBuffer.characterIndexForPosition(oldRange.start);
            let start = this.textLayout.getPositionForCharacterIndex(offset);

            let oldColumnCount = this.textLayout.getColumnCount();
            let oldRowCount = this.textLayout.getRowCount();

            let oldEnd = this.textLayout.getPositionForCharacterIndex(offset + oldText.length);
            let patch = this.textLayout.update(offset, oldText.length, newText.length);
            let newEnd = this.textLayout.getPositionForCharacterIndex(offset + newText.length);

            let newColumnCount = this.textLayout.getColumnCount();
            let newRowCount = this.textLayout.getRowCount();

            patch.apply(this.textLines);

            if (newColumnCount !== oldColumnCount || newRowCount !== oldRowCount) {

                this.yogaNode.markDirty();

                this.setDirtyLayoutFlag();

            } else if (oldEnd.y === newEnd.y) {

                let dirtyRect = this.contentWorldRect.clone();

                dirtyRect.x += start.x;
                dirtyRect.y += start.y;

                dirtyRect.height = 1;

                this.queueDirtyRect(dirtyRect);

            } else {

                let dirtyRect = this.contentWorldRect.clone();

                dirtyRect.y += start.y;

                dirtyRect.height = Math.max(oldEnd.y, newEnd.y) - start.y + 1;

                this.queueDirtyRect(dirtyRect);

            }

        });

        this.addShortcutListener(`left`, () => {

            this.caretIndex = Math.max(0, this.caretIndex - 1);
            this.caret = new Point(this.textLayout.getPositionForCharacterIndex(this.caretIndex));
            this.caretMaxColumn = this.caret.x;

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`right`, () => {

            this.caretIndex = Math.min(this.caretIndex + 1, this.textBuffer.getMaxCharacterIndex());
            this.caret = new Point(this.textLayout.getPositionForCharacterIndex(this.caretIndex));
            this.caretMaxColumn = this.caret.x;

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`up`, () => {

            this.caret.x = this.caretMaxColumn;
            this.caret = new Point(this.textLayout.getPositionAbove(this.caret));
            this.caretIndex = this.textLayout.getCharacterIndexForPosition(this.caret);

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`down`, () => {

            this.caret.x = this.caretMaxColumn;
            this.caret = new Point(this.textLayout.getPositionBelow(this.caret));
            this.caretIndex = this.textLayout.getCharacterIndexForPosition(this.caret);

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`pgup`, () => {

            this.caret.x = this.caretMaxColumn;
            this.caret = new Point(this.textLayout.getPositionAbove(this.caret, this.elementRect.height));
            this.caretIndex = this.textLayout.getCharacterIndexForPosition(this.caret);

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`pgdown`, () => {

            this.caret.x = this.caretMaxColumn;
            this.caret = new Point(this.textLayout.getPositionBelow(this.caret, this.elementRect.height));
            this.caretIndex = this.textLayout.getCharacterIndexForPosition(this.caret);

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`home`, () => {

            this.caret = new Point();
            this.caretIndex = 0;
            this.caretMaxColumn = 0;

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`end`, () => {

            this.caretIndex = this.textBuffer.getMaxCharacterIndex();
            this.caret = new Point(this.textLayout.getPositionForCharacterIndex(this.caretIndex));
            this.caretMaxColumn = this.caret.x;

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`enter`, () => {

            if (this.enterIsNewline) {

                if (this.readOnly)
                    return;

                this.textBuffer.insert(this.textBuffer.positionForCharacterIndex(this.caretIndex), `\n`);

                this.caretIndex += 1;
                this.caret = new Point(this.textLayout.getPositionForCharacterIndex(this.caretIndex));
                this.caretMaxColumn = this.caret.x;

                this.scrollCellIntoView(this.caret);

                this.dispatchEvent(new Event(`caret`));

            } else {

                this.dispatchEvent(new Event(`submit`));

            }

        });

        this.addShortcutListener(`backspace`, () => {

            if (this.readOnly)
                return;

            if (this.caretIndex === 0)
                return;

            let start = this.textBuffer.positionForCharacterIndex(this.caretIndex - 1);
            let end = this.textBuffer.positionForCharacterIndex(this.caretIndex);

            this.textBuffer.setTextInRange([ start, end ], ``);

            this.caretIndex -= 1;
            this.caret = new Point(this.textLayout.getPositionForCharacterIndex(this.caretIndex));
            this.caretMaxColumn = this.caret.x;

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`delete`, () => {

            if (this.readOnly)
                return;

            let start = this.textBuffer.positionForCharacterIndex(this.caretIndex);
            let end = this.textBuffer.positionForCharacterIndex(this.caretIndex + 1);

            this.textBuffer.setTextInRange([ start, end ], ``);

            this.scrollCellIntoView(this.caret);

        });

        this.addEventListener(`data`, ({ buffer }) => {

            if (this.readOnly)
                return;

            let string = buffer.toString();

            this.textBuffer.insert(this.textBuffer.positionForCharacterIndex(this.caretIndex), string);

            this.caretIndex += string.length;
            this.caret = new Point(this.textLayout.getPositionForCharacterIndex(this.caretIndex));
            this.caretMaxColumn = this.caret.x;

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addEventListener(`mousedown`, e => {

            if (e.mouse.name !== `left`)
                return;

            if (!this.style.$.focusEvents)
                return;

            e.setDefault(() => {

                this.caret = new Point(this.textLayout.getFixedPosition(e.contentCoordinates));
                this.caretIndex = this.textLayout.getCharacterIndexForPosition(this.caret);
                this.caretMaxColumn = this.caret.x;

                this.focus();

                this.dispatchEvent(new Event(`caret`));

            });

        });

        this.setPropertyTrigger(`transformPass`, null, {

            validate: value => {

                return isNull(value) || isFunction(value);

            },

            trigger: value => {

                this.queueDirtyRect();

            }

        });

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

    getPreferredSize(maxWidth) {

        if (this.textLayout.setOptions({ columns: maxWidth }))
            this.textLayout.reset().apply(this.textLines);

        let width = this.textLayout.getColumnCount();
        let height = this.textLayout.getRowCount();

        return { width, height };

    }

    getInternalContentWidth() {

        return this.textLayout.getColumnCount();

    }

    getInternalContentHeight() {

        return this.textLayout.getRowCount();

    }

    renderContent(x, y, l) {

        if (this.textLayout.rows <= y)
            return this.renderBackground(l);

        let fullLine = y < this.textLines.length ? this.textLines[y] : ``;
        let fullLineLength = fullLine.length;

        if (this.transformPass)
            fullLine = this.transformPass(fullLine, y);

        let fullLineStart = 0;

        if (this.style.$.textAlign.isCentered)
            fullLineStart = Math.floor((this.scrollRect.width - fullLineLength) / 2);

        if (this.style.$.textAlign.isRightAligned)
            fullLineStart = this.scrollRect.width - fullLineLength;

        let prefixLength = Math.max(0, Math.min(fullLineStart - x, l));
        let lineStart = Math.max(0, x - fullLineStart);
        let lineLength = Math.max(0, Math.min(l + x - fullLineStart, l, fullLineLength - lineStart));
        let suffixLength = Math.max(0, l - prefixLength - lineLength);

        let prefix = this.renderBackground(prefixLength);
        let text = this.renderText(fullLine.substr(lineStart, lineLength));
        let suffix = this.renderBackground(suffixLength);

        return prefix + text + suffix;

    }

}
