import { TextLayout }                                                       from '@manaflair/text-layout';
import { isBoolean }                                                        from 'lodash';
import TextBuffer                                                           from 'text-buffer';

import { Event, Point, StyleManager, findAncestorByPredicate, makeRuleset } from '../../core';

import { TermElement }                                                      from './TermElement';
import { TermForm }                                                         from './TermForm';

export class TermTextBase extends TermElement {

    constructor({ textBuffer = new TextBuffer(), textLayout = new TextLayout(), enterIsNewline = true, readOnly = false, disabled = false, ... props } = {}) {

        super(props);

        this.styleManager.addRuleset(makeRuleset({

            overflow: `hidden`

        }), StyleManager.RULESET_NATIVE);

        this.textLines = [ `` ];
        this.textBufferCallback = null;

        this.setPropertyTrigger(`textBuffer`, textBuffer, {

            trigger: value => {

                if (this.textBufferCallback) {

                    this.textBufferCallback.dispose();
                    this.textBufferCallback = null;

                }

                if (value) {

                    this.disposeTextBufferCallback = value.onDidChange(({ oldRange, oldText, newText }) => {

                        if (!this.textLayout)
                            return;

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

                          //dirtyRect.x += start.x - this.scrollRect.x; // We can't apply this optimization because of syntax highlightning and non-left-aligned alignments, where adding a character might change the way the *previous ones* are displayed
                            dirtyRect.y += start.y - this.scrollRect.y;

                            dirtyRect.height = 1;

                            this.queueDirtyRect(dirtyRect);

                        } else {

                            let dirtyRect = this.contentWorldRect.clone();

                            dirtyRect.y += start.y - this.scrollRect.y;

                            dirtyRect.height = Math.max(oldEnd.y, newEnd.y) - start.y + 1;

                            this.queueDirtyRect(dirtyRect);

                        }

                        if (oldText.length !== newText.length) {

                            this.caretIndex = this.rootNode.activeElement === this ? this.textBuffer.getMaxCharacterIndex() : 0;
                            this.caret = new Point(this.textLayout.getPositionForCharacterIndex(this.caretIndex));
                            this.caretMaxColumn = this.caret.x;

                            this.dispatchEvent(new Event(`caret`));

                        }

                    });

                }

                this.clearTextLayoutCache();

            }

        });

        this.setPropertyTrigger(`textLayout`, textLayout, {

            trigger: value => {

                if (value) {

                    value.setCharacterGetter(offset => {

                        if (!this.textBuffer)
                            return 0;

                        let position = this.textBuffer.positionForCharacterIndex(offset);

                        if (position.column == this.textBuffer.lineLengthForRow(position.row))
                            return this.textBuffer.lineEndingForRow(position.row);

                        return this.textBuffer.lineForRow(position.row)[position.column];

                    });

                    value.setCharacterCountGetter(() => {

                        if (!this.textBuffer)
                            return 0;

                        return this.textBuffer.getMaxCharacterIndex();

                    });

                    value.setSoftWrap(
                        this.style.$.whiteSpace.doesWrap
                    );

                    value.setDemoteNewlines(
                        this.style.$.whiteSpace.doesDemoteNewlines
                    );

                    value.setCollapseWhitespaces(
                        this.style.$.whiteSpace.doesCollapse
                    );

                    value.setPreserveLeadingSpaces(
                        !this.style.$.whiteSpace.doesCollapse
                    );

                    value.setPreserveTrailingSpaces(
                        !this.style.$.whiteSpace.doesCollapse
                    );

                    value.setJustifyText(
                        this.style.$.textAlign.isJustified
                    );

                    value.setAllowWordBreaks(
                        this.style.$.overflowWrap.doesBreakWords
                    );

                }

                this.clearTextLayoutCache();

            }

        });

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

        this.textLayout.reset().apply(this.textLines);

        this.addEventListener(`layout`, () => {

            if (this.textLayout.setOptions({ columns: this.contentRect.width })) {
                this.textLayout.reset().apply(this.textLines);
            }

        });

        this.addShortcutListener(`left`, e => {

            if (!this.caret)
                return;

            e.setDefault(() => {

                if (!this.caret)
                    return;

                this.caretIndex = Math.max(0, this.caretIndex - 1);
                this.caret = new Point(this.textLayout.getPositionForCharacterIndex(this.caretIndex));
                this.caretMaxColumn = this.caret.x;

                this.scrollCellIntoView(this.caret);

                this.dispatchEvent(new Event(`caret`));

            });

        }, { capture: true });

        this.addShortcutListener(`right`, e => {

            if (!this.caret)
                return;

            e.setDefault(() => {

                if (!this.caret)
                    return;

                this.caretIndex = Math.min(this.caretIndex + 1, this.textBuffer.getMaxCharacterIndex());
                this.caret = new Point(this.textLayout.getPositionForCharacterIndex(this.caretIndex));
                this.caretMaxColumn = this.caret.x;

                this.scrollCellIntoView(this.caret);

                this.dispatchEvent(new Event(`caret`));

            });

        }, { capture: true });

        this.addShortcutListener(`up`, e => {

            if (!this.caret)
                return;

            e.setDefault(() => {

                if (!this.caret)
                    return;

                this.caret.x = this.caretMaxColumn;
                this.caret = new Point(this.textLayout.getPositionAbove(this.caret));
                this.caretIndex = this.textLayout.getCharacterIndexForPosition(this.caret);

                this.scrollCellIntoView(this.caret);

                this.dispatchEvent(new Event(`caret`));

            });

        }, { capture: true });

        this.addShortcutListener(`down`, e => {

            if (!this.caret)
                return;

            e.setDefault(() => {

                if (!this.caret)
                    return;

                this.caret.x = this.caretMaxColumn;
                this.caret = new Point(this.textLayout.getPositionBelow(this.caret));
                this.caretIndex = this.textLayout.getCharacterIndexForPosition(this.caret);

                this.scrollCellIntoView(this.caret);

                this.dispatchEvent(new Event(`caret`));

            });

        }, { capture: true });

        this.addShortcutListener(`pgup`, e => {

            if (!this.caret)
                return;

            e.setDefault(() => {

                if (!this.caret)
                    return;

                this.caret.x = this.caretMaxColumn;
                this.caret = new Point(this.textLayout.getPositionAbove(this.caret, this.elementRect.height));
                this.caretIndex = this.textLayout.getCharacterIndexForPosition(this.caret);

                this.scrollCellIntoView(this.caret);

                this.dispatchEvent(new Event(`caret`));

            });

        }, { capture: true });

        this.addShortcutListener(`pgdown`, e => {

            if (!this.caret)
                return;

            e.setDefault(() => {

                if (!this.caret)
                    return;

                this.caret.x = this.caretMaxColumn;
                this.caret = new Point(this.textLayout.getPositionBelow(this.caret, this.elementRect.height));
                this.caretIndex = this.textLayout.getCharacterIndexForPosition(this.caret);

                this.scrollCellIntoView(this.caret);

                this.dispatchEvent(new Event(`caret`));

            });

        }, { capture: true });

        this.addShortcutListener(`home, ctrl-a`, e => {

            if (!this.caret)
                return;

            e.setDefault(() => {

                this.caret = new Point();
                this.caretIndex = 0;
                this.caretMaxColumn = 0;

                this.scrollCellIntoView(this.caret);

                this.dispatchEvent(new Event(`caret`));

            });

        }, { capture: true });

        this.addShortcutListener(`end, ctrl-e`, e => {

            if (!this.caret)
                return;

            e.setDefault(() => {

                this.caretIndex = this.textBuffer.getMaxCharacterIndex();
                this.caret = new Point(this.textLayout.getPositionForCharacterIndex(this.caretIndex));
                this.caretMaxColumn = this.caret.x;

                this.scrollCellIntoView(this.caret);

                this.dispatchEvent(new Event(`caret`));

            });

        }, { capture: true });

        this.addShortcutListener(`enter`, e => {

            if (this.enterIsNewline && !this.caret)
                return;

            if (this.enterIsNewline && this.readOnly)
                return;

            e.setDefault(() => {

                if (this.enterIsNewline) {

                    let caretIndex = this.caretIndex;

                    this.textBuffer.insert(this.textBuffer.positionForCharacterIndex(this.caretIndex), `\n`);

                    this.caretIndex = caretIndex + 1;
                    this.caret = new Point(this.textLayout.getPositionForCharacterIndex(this.caretIndex));
                    this.caretMaxColumn = this.caret.x;

                    this.scrollCellIntoView(this.caret);

                    this.dispatchEvent(new Event(`change`));
                    this.dispatchEvent(new Event(`caret`));

                } else {

                    let form = findAncestorByPredicate(this, node => node instanceof TermForm);

                    if (form) {
                        form.dispatchEvent(new Event(`submit`, { cancelable: true }));
                    }

                }

            });

        }, { capture: true });

        this.addShortcutListener(`backspace`, e => {

            if (!this.caret)
                return;

            if (this.readOnly)
                return;

            e.setDefault(() => {

                if (this.caretIndex === 0)
                    return;

                let caretIndex = this.caretIndex;

                let start = this.textBuffer.positionForCharacterIndex(caretIndex - 1);
                let end = this.textBuffer.positionForCharacterIndex(caretIndex);

                this.textBuffer.setTextInRange([ start, end ], ``);

                this.caretIndex = caretIndex - 1;
                this.caret = new Point(this.textLayout.getPositionForCharacterIndex(this.caretIndex));
                this.caretMaxColumn = this.caret.x;

                this.scrollCellIntoView(this.caret);

                this.dispatchEvent(new Event(`change`));
                this.dispatchEvent(new Event(`caret`));

            });

        }, { capture: true });

        this.addShortcutListener(`delete`, e => {

            if (!this.caret)
                return;

            if (this.readOnly)
                return;

            e.setDefault(() => {

                let caretIndex = this.caretIndex;

                let start = this.textBuffer.positionForCharacterIndex(caretIndex);
                let end = this.textBuffer.positionForCharacterIndex(caretIndex + 1);

                this.textBuffer.setTextInRange([ start, end ], ``);

                this.dispatchEvent(new Event(`change`));
                this.scrollCellIntoView(this.caret);

            });

        }, { capture: true });

        this.addEventListener(`data`, e => {

            if (!this.caret)
                return;

            if (this.readOnly)
                return;

            e.setDefault(() => {

                let string = e.buffer.toString();

                let caretIndex = this.caretIndex;

                this.textBuffer.insert(this.textBuffer.positionForCharacterIndex(this.caretIndex), string);

                this.caretIndex = caretIndex + string.length;
                this.caret = new Point(this.textLayout.getPositionForCharacterIndex(this.caretIndex));
                this.caretMaxColumn = this.caret.x;

                this.scrollCellIntoView(this.caret);

                this.dispatchEvent(new Event(`change`));
                this.dispatchEvent(new Event(`caret`));

            });

        }, { capture: true });

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

        }, { capture: true });

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

    clearTextLayoutCache() {

        if (!this.textLayout)
            return;

        this.textLayout.reset().apply(this.textLines = [ `` ]);
        this.setDirtyLayoutFlag();

    }

    getPreferredSize(maxWidth) {

        if (this.textLayout && this.textLayout.setOptions({ columns: maxWidth }))
            this.textLayout.reset().apply(this.textLines);

        let width = this.textLayout
            ? this.textLayout.getColumnCount()
            : 0;

        let height = this.textLayout
            ? this.textLayout.getRowCount()
            : 0;

        return { width, height };

    }

    getInternalContentWidth() {

        return this.textLayout
            ? this.textLayout.getColumnCount()
            : 0;

    }

    getInternalContentHeight() {

        return this.textLayout
            ? this.textLayout.getRowCount()
            : 0;

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
