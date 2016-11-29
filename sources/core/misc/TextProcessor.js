import { Point } from 'text-buffer';

export class TextProcessor {

    constructor(input, { columns = Infinity, enableWhitespaceCollapsing = true, enableWordBreak = false, enableNewlines = false, enableTextJustification = false } = {}) {

        this.input = input;

        this.options = {};

        this.options.columns = columns;

        this.options.enableWhitespaceCollapsing = enableWhitespaceCollapsing;
        this.options.enableWordBreak = enableWordBreak;
        this.options.enableNewlines = enableNewlines;
        this.options.enableTextJustification = enableTextJustification;

        this.lineInfos = [];

        this.needsRebuild = true;

        this.width = 0;
        this.height = 0;

    }

    setOptions({ columns, enableWhitespaceCollapsing, enableWordBreak, enableNewlines, enableTextJustification } = {}) {

        this.rebuildIfNeeded();

        if (typeof columns !== `undefined` && columns !== this.options.columns) {
            this.options.columns = columns;
            this.needsRebuild = this.needsRebuild || this.options.columns !== Infinity || this.width > columns;
        }

        if (typeof enableWhitespaceCollapsing !== `undefined` && enableWhitespaceCollapsing !== this.options.enableWhitespaceCollapsing) {
            this.options.enableWhitespaceCollapsing = enableWhitespaceCollapsing;
            this.needsRebuild = true;
        }

        if (typeof enableWordBreak !== `undefined` && enableWordBreak !== this.options.enableWordBreak) {
            this.options.enableWordBreak = enableWordBreak;
            this.needsRebuild = true;
        }

        if (typeof enableNewlines !== `undefined` && enableNewlines !== this.options.enableNewlines) {
            this.options.enableNewlines = enableNewlines;
            this.needsRebuild = true;
        }

        if (typeof enableTextJustification !== `undefined` && enableTextJustification !== this.options.enableTextJustification) {
            this.options.enableTextJustification = enableTextJustification;
            this.needsRebuild = true;
        }

    }

    rebuildIfNeeded() {

        if (this.needsRebuild) {
            this.forceRebuild();
        }

    }

    forceRebuild() {

        this.needsRebuild = false;

        this.update(0, this.input.getMaxCharacterIndex(), this.input.getText());

    }

    getColumnCount() {

        this.rebuildIfNeeded();

        return this.lineInfos.width;

    }

    getLineCount() {

        this.rebuildIfNeeded();

        return this.lineInfos.length;

    }

    positionForInputCharacterIndex(characterIndex) {

        this.rebuildIfNeeded();

        let pos = new Point(0, characterIndex);

        while (this.pos.row < this.lineInfos.length && this.pos.column >= this.lineInfos[this.pos.row].inputLength) {
            pos.column -= this.lineInfos[this.pos.row].inputLength;
            pos.row += 1;
        }

        return pos;

    }

    inputCharacterIndexForPosition() {

        this.rebuildIfNeeded();

        let characterIndex = 0;

        let clipRow = Math.min(pos.row, this.lineInfos.length - 1);
        let clipColumn = Math.min(pos.column, this.lineInfos[clipRow].inputLength);

        for (let t = 0, T = clipRow; t < T; ++t)
            characterIndex += this.lineInfos[t].inputLength;

        characterIndex += clipColumn;

        return characterIndex;

    }

    characterIndexForPosition(position) {

        this.rebuildIfNeeded();

        let characterIndex = 0;

        let clipRow = Math.min(pos.row, this.lineInfos.length - 1);
        let clipColumn = Math.min(pos.column, this.lineInfos[clipRow].outputLength + clipRow === this.lineInfos);

        for (let t = 0, T =

    }

    positionForCharacterIndex(characterIndex) {

        this.rebuildIfNeeded();

    }

    update(offset, deleteCount, text) {

        if (this.needsRebuild)
            return;

        let newLines = [];

        let startLine = this.positionForInputCharacterIndex(offset).y;
        let nextLine = this.positionForInputCharacterIndex(offset + Math.max(length, replacement.length) - 1).y + 1;

        let currentOffset = this.inputCharacterIndexForPosition(this.rangeForRow(startLine).start);
        let nextOffset = Math.min(Math.max(this.getInputOffsetForLine(nextLine), offset + replacement.length), this.input.getMaxCharacterIndex());

        let getCharacter = () => {

            let position = this.input.positionForCharacterIndex(currentOffset);

            return this.input.getTextInRange([ position, position ]);

        };

        let moveForward = () => {

            // Move the point to the next significant character

            currentOffset += 1;

        };

        let isWhitespace = () => {

            // Return true if the current character counts as a whitespace

            if (isEndOfFile())
                return false;

            if (getCharacter() === ` `)
                return true;

            if (getCharacter() === `\n` && !this.enableNewlines)
                return true;

            return false;

        };

        let isNewline = () => {

            // Return true if the current character counts as a newline

            if (isEndOfFile())
                return false;

            if (getCharacter() === `\n` && this.enableNewlines)
                return true;

            return false;

        };

        let isWord = () => {

            // Return true if the current character is neither a whitespace nor a newline

            if (isEndOfFile())
                return false;

            if (!isWhitespace() && !isNewline())
                return true;

            return false;

        };

        let isEndOfLine = () => {

            // Return true if the current pointer ends a line in the text

            if (isEndOfFile())
                return true;

            if (isNewline())
                return true;

            return false;

        };

        let isEndOfFile = () => {

            // Return true if the current pointer points out of the input range

            if (currentOffset >= this.getMaxCharacterIndex())
                return true;

            return false;

        };

        let shiftNext = () => {

            // Return the current character, and increase the pointer

            let character = getCharacter();

            moveForward();

            return character;

        };

        let shiftWhitespaces = (max = Infinity) => {

            // Return a string containing a space for each whitespace that follows, then move the pointer past this sequence

            let whitespaces = ``;

            while (isWhitespace() && max-- > 0) {
                whitespaces += ` `;
                shiftNext();
            }

            return whitespaces;

        };

        let shiftWord = (max = Infinity) => {

            // Return a string containing each character that follows, then move the pointer past this sequence

            let characters = ``;

            while (isWord() && max-- > 0)
                characters += shiftNext();

            return characters;

        };

        while (currentOffset < nextOffset) {

            let lineOffset = currentOffset;
            let line = ``;

            while (!isEndOfLine() && line.length < this.columns) {

                let spaces;

                if (this.enableWhitespaceCollapsing) {

                    spaces = shiftWhitespaces();

                    // Ignore any leading whitespace
                    if (line.length === 0)
                        spaces = ``;

                    // collapse multiple whitespaces into a single one
                    if (spaces.length > 0) {
                        spaces = ` `;
                    }

                } else {

                    spaces = shiftWhitespaces(this.columns - line.length);

                }

                // prevent a line from containing only whitespaces
                if (isEndOfLine() || line.length + spaces.length >= this.columns)
                    break;

                if (this.enableWordBreak) {

                    line += spaces;
                    line += shiftWord(this.columns - line.length);

                } else {

                    let wordOffset = currentOffset;
                    let word = shiftWord(this.columns - line.length - spaces.length);

                    if (isWord()) {

                        // prevent a word from being splitted if it can fit on a single line
                        if (line.length > 0 || spaces.length > 0) {
                            currentOffset = wordOffset;

                        // still if it's the only text possible on the line (we won't be able to make it fit in a single line anyway)
                        } else {
                            line += spaces;
                            line += word;
                        }

                        break;

                    } else {

                        line += spaces;
                        line += word;

                    }

                }

            }

            if (this.enableTextJustification && !isEndOfLine() && line.length < this.columns) {

                let sizeDiff = this.columns - line.length;
                let slotCount = (line.match(/ +/g) || []).length - (line[0] === ` ` ? 1 : 0);
                let extraSize = Math.ceil(sizeDiff / slotCount);

                line = line.replace(/ +/g, (slot, offset) => {

                    if (offset === 0)
                        return slot;

                    let extraSlotSize = Math.min(extraSize, sizeDiff);
                    sizeDiff -= extraSlotSize;

                    for (let s = 0; s < extraSlotSize; ++s)
                        slot += ` `;

                    return slot;

                });

            }

            if (isNewline())
                shiftNext();

            newLines.push({

                string: line,

                inputOffset: 0,
                outputOffset: 0,

                inputLength: currentOffset - lineOffset, // does include any newline required, including the final one, if any
                outputLength: line.length // does NOT include the final newline

            });

            if (!isEndOfFile() && currentOffset !== this.getInputOffsetForLine(startLine + newLines.length) + (replacement.length - length)) {
                nextOffset = currentOffset + 1;
                nextLine += 1;
            }

        }

        this.lineInfos.splice(startLine, nextLine - startLine, ... newLines);

        for (let t = Math.max(1, startLine); t < this.lineInfos.length; ++t) {

            this.lineInfos[t].inputOffset = this.lineInfos[t - 1].inputOffset + this.lineInfos[t - 1].inputLength;
            this.lineInfos[t].outputOffset = this.lineInfos[t - 1].outputOffset + this.lineInfos[t - 1].outputLength + t;

        }

        this.width = this.lineInfos.reduce((max, { outputLength }) => Math.max(max, outputLength), 0);
        this.height = this.lineInfos.length;

    }

}
