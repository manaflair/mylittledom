import { TextLayout }   from '@manaflair/text-layout/sources/entry-browser';
import { isBoolean }    from 'lodash';
import TextBuffer       from 'text-buffer';

import { Event, Point } from '../../core';

import { TermElement }  from './TermElement';

export class TermTextBase extends TermElement {

    constructor({ textBuffer = new TextBuffer(), textLayout = new TextLayout(), enterIsNewline = true, readOnly = false, disabled = false, ... props } = {}) {

        super(props);

        this.textBuffer = textBuffer;
        this.textLayout = textLayout;
        this.textLines = [ `` ];

        this.setPropertyTrigger(`readOnly`, readOnly, {

            validate: value => {

                return isBoolean(value);

            }

        });

        this.setPropertyTrigger(`disabled`, disabled, {

            validate: value => {

                return isBoolean(value);

            },

            trigger: value => {

                if (value) {

                    this.caretIndex = null;
                    this.caret = null;
                    this.caretMaxColumn = null;

                } else {

                    this.caretIndex = 0;
                    this.caret = new Point(0, 0);
                    this.caretMaxColumn = 0;

                }

            }

        });

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
        this.textLayout.setPreserveLeadingSpaces(!this.style.$.whiteSpace.doesCollapse);
        this.textLayout.setPreserveTrailingSpaces(!this.style.$.whiteSpace.doesCollapse);
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
                this.queueDirtyRect();

            } else if (oldEnd.y === newEnd.y) {

                let dirtyRect = this.contentWorldRect.clone();

              //dirtyRect.x += start.x - this.scrollRect.x; // We can't do this because of syntax highlightning and non-left-aligned alignments, where adding a character might change the way the previous ones are displayed
                dirtyRect.y += start.y - this.scrollRect.y;

                dirtyRect.height = 1;

                this.queueDirtyRect(dirtyRect);

            } else {

                let dirtyRect = this.contentWorldRect.clone();

                dirtyRect.y += start.y - this.scrollRect.y;

                dirtyRect.height = Math.max(oldEnd.y, newEnd.y) - start.y + 1;

                this.queueDirtyRect(dirtyRect);

            }

            this.dispatchEvent(new Event(`change`));

        });

        this.addShortcutListener(`left`, () => {

            if (!this.caret)
                return;

            this.caretIndex = Math.max(0, this.caretIndex - 1);
            this.caret = new Point(this.textLayout.getPositionForCharacterIndex(this.caretIndex));
            this.caretMaxColumn = this.caret.x;

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`right`, () => {

            if (!this.caret)
                return;

            this.caretIndex = Math.min(this.caretIndex + 1, this.textBuffer.getMaxCharacterIndex());
            this.caret = new Point(this.textLayout.getPositionForCharacterIndex(this.caretIndex));
            this.caretMaxColumn = this.caret.x;

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`up`, () => {

            if (!this.caret)
                return;

            this.caret.x = this.caretMaxColumn;
            this.caret = new Point(this.textLayout.getPositionAbove(this.caret));
            this.caretIndex = this.textLayout.getCharacterIndexForPosition(this.caret);

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`down`, () => {

            if (!this.caret)
                return;

            this.caret.x = this.caretMaxColumn;
            this.caret = new Point(this.textLayout.getPositionBelow(this.caret));
            this.caretIndex = this.textLayout.getCharacterIndexForPosition(this.caret);

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`pgup`, () => {

            if (!this.caret)
                return;

            this.caret.x = this.caretMaxColumn;
            this.caret = new Point(this.textLayout.getPositionAbove(this.caret, this.elementRect.height));
            this.caretIndex = this.textLayout.getCharacterIndexForPosition(this.caret);

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`pgdown`, () => {

            if (!this.caret)
                return;

            this.caret.x = this.caretMaxColumn;
            this.caret = new Point(this.textLayout.getPositionBelow(this.caret, this.elementRect.height));
            this.caretIndex = this.textLayout.getCharacterIndexForPosition(this.caret);

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`home`, () => {

            if (!this.caret)
                return;

            this.caret = new Point();
            this.caretIndex = 0;
            this.caretMaxColumn = 0;

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`end`, () => {

            if (!this.caret)
                return;

            this.caretIndex = this.textBuffer.getMaxCharacterIndex();
            this.caret = new Point(this.textLayout.getPositionForCharacterIndex(this.caretIndex));
            this.caretMaxColumn = this.caret.x;

            this.scrollCellIntoView(this.caret);

            this.dispatchEvent(new Event(`caret`));

        });

        this.addShortcutListener(`enter`, () => {

            if (!this.caret)
                return;

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

            if (!this.caret)
                return;

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

            if (!this.caret)
                return;

            if (this.readOnly)
                return;

            let start = this.textBuffer.positionForCharacterIndex(this.caretIndex);
            let end = this.textBuffer.positionForCharacterIndex(this.caretIndex + 1);

            this.textBuffer.setTextInRange([ start, end ], ``);

            this.scrollCellIntoView(this.caret);

        });

        this.addEventListener(`data`, ({ buffer }) => {

            if (!this.caret)
                return;

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

            if (!this.caret)
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
