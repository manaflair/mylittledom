import { Point } from 'text-buffer';

let STATIC_TOKEN = `STATIC`;
let DYNAMIC_TOKEN = `DYNAMIC`;

exports.TextFormatter = class TextFormatter {

    static open(textBuffer, options) {

        let textFormatter = new this(options);

        textFormatter.apply(textBuffer);

        textBuffer.onDidChange(({ oldRange, newText }) => {

            let offsetStart = textBuffer.characterIndexForPosition(oldRange.start);
            let offsetEnd = textBuffer.characterIndexForPosition(oldRange.end);

            let length = offsetEnd - offsetStart + 1;

            textFormatter.update(textBuffer, offsetStart, length, newText);

        });

        return textFormatter;

    }

    constructor({ columns = Infinity, tabWidth = 4, collapseWhitespaces = false, preserveLeadingSpaces = false, allowWordBreaks = false, demoteNewlines = false, justifyText = false } = {}) {

        this.options = {};

        this.options.columns = columns;
        this.options.tabWidth = tabWidth;

        this.options.collapseWhitespaces = collapseWhitespaces;
        this.options.preserveLeadingSpaces = preserveLeadingSpaces;
        this.options.allowWordBreaks = allowWordBreaks;
        this.options.demoteNewlines = demoteNewlines;
        this.options.justifyText = justifyText;

        this.lineInfo = [];

        this.columns = 0;
        this.rows = 0;

    }

    setOptions({ columns, tabWidth, collapseWhitespaces, preserveLeadingSpaces, allowWordBreaks, demoteNewlines, justifyText }) {

        if (typeof columns !== `undefined`)
            this.options.columns = columns;

        if (typeof tabWidth !== `undefined`)
            this.options.tabWidth = tabWidth;

        if (typeof collapseWhitespaces !== `undefined`)
            this.options.collapseWhitespaces = collapseWhitespaces;

        if (typeof preserveLeadingSpaces !== `undefined`)
            this.options.preserveLeadingSpaces = preserveLeadingSpaces;

        if (typeof allowWordBreaks !== `undefined`)
            this.options.allowWordBreaks = allowWordBreaks;

        if (typeof demoteNewlines !== `undefined`)
            this.options.demoteNewlines = demoteNewlines;

        if (typeof justifyText !== `undefined`) {
            this.options.justifyText = justifyText;
        }

    }

    getLineForInputOffset(offset) {

        let line = 0;

        while (line + 1 < this.lineInfo.length && offset >= this.lineInfo[line + 1].inputStartOffset)
            line += 1;

        return line;

    }

    getInputOffsetForLine(line) {

        let offset = 0;

        if (this.lineInfo.length === 0)
            return 0;

        if (line >= this.lineInfo.length)
            return this.lineInfo[this.lineInfo.length - 1].inputEndOffset;

        return this.lineInfo[line].inputStartOffset;

    }

    getTokenLocatorForPosition(position) {

        position = Point.fromObject(position);

        if (this.lineInfo.length === 0)
            return null;

        let row = Math.max(0, Math.min(position.row, this.lineInfo.length - 1));

        let line = this.lineInfo[row];
        let tokens = line.tokens;

        let col = Math.max(0, Math.min(position.column, line.outputLineLength));

        let l = 0;
        let r = tokens.length - 1;

        while (l <= r) {

            let m = Math.floor((l + r) / 2);

            let token = tokens[m];

            let tokenOutputStartOffset = token.outputOffset;
            let tokenOutputEndOffset = tokenOutputStartOffset + token.outputLength;

            // binary search: right side
            if (tokenOutputEndOffset < col) {
                l = m + 1;
                continue;
            }

            // binary search: left side
            if (tokenOutputStartOffset > col) {
                r = m - 1;
                continue;
            }

            return [ row, m, line, token ];

        }

        return null;

    }

    moveToLeft(position, copy) {

        position = Point.fromObject(position, copy);

        let tokenLocator = this.getTokenLocatorForPosition(position);

        if (!tokenLocator)
            return null;

        let [ row, tokenIndex, line, token ] = tokenLocator;

        // if we're inside the token, or on its right edge
        if (position.column > token.outputOffset) {

            // if we're a static token, we can just move inside the token
            if (token.type === STATIC_TOKEN) {
                position.column -= 1;

            // otherwise, we need to teleport to the beginning of the token
            } else {
                position.column = token.outputOffset;
            }

        // if we're on the left edge of the token
        } else {

            // if we're the first token of the line, we'll need to move up if possible
            if (tokenIndex === 0) {

                if (row > 0) {
                    position.row = row - 1;
                    position.column = this.lineInfo[position.row].outputLineLength;
                }

            } else {

                // if we can enter inside the left neighbour, we do it
                if (this.lineInfo[position.row].tokens[tokenIndex - 1].type === STATIC_TOKEN) {
                    position.column -= 1;

                // otherwise, we just skip it an go straight to the next one
                } else {
                    position.column = this.lineInfo[position.row].tokens[tokenIndex - 1].outputOffset;
                }

            }

        }

        return position;

    }

    moveToRight(position, copy) {

        position = Point.fromObject(position, copy);

        let tokenLocator = this.getTokenLocatorForPosition(position);

        if (!tokenLocator)
            return null;

        let [ row, tokenIndex, line, token ] = tokenLocator;

        // if we're inside the token, or on its left edge
        if (position.column < token.outputOffset + token.outputLength) {

            // if we're a static token, we can just move inside the token
            if (token.type === STATIC_TOKEN) {
                position.column += 1;

            // otherwise, we need to teleport to the end of the token
            } else {
                position.column = token.outputOffset + token.outputLength;
            }

        // if we're on the right edge of the token
        } else {

            // if we're the last token of the line, we'll need to move down if possible
            if (tokenIndex === line.tokens.length - 1) {

                if (row < this.lineInfo.length - 1) {
                    position.row = row + 1;
                    position.column = 0;
                }

            } else {

                // if we can enter inside the right neighbour, we do it
                if (this.lineInfo[position.row].tokens[tokenIndex + 1].type === STATIC_TOKEN) {
                    position.column += 1;

                // otherwise, we just skip it and go straight to the next one
                } else {
                    position.column += this.lineInfo[position.row].tokens[tokenIndex + 1].outputLength;
                }

            }

        }

        return position;

    }

    moveToTop(position, copy) {

        position = Point.fromObject(position, copy);

        // if we're already on the very first row, we just go to the beginning of the line
        if (position.row === 0) {
            position.column = 0;

        } else {
            position.row -= 1;

            // if we land on the left edge, short-circuit the rest of the procedure
            if (position.column === 0) {
                return position;

            // if we land on the right edge or beyond, we can short-circuit the rest of the procedure too
            } else if (position.column >= this.lineInfo[position.row].outputLineLength) {
                position.column = this.lineInfo[position.row].outputLineLength;
                return position;

            // otherwise, we have to check on which token we land, to stay outside of dynamic tokens
            } else {

                let [ row, tokenIndex, line, token ] = this.getTokenLocatorForPosition(position);

                if (token.type === DYNAMIC_TOKEN) {

                    // if we're closer to the right side, we jump to it
                    if (position.column >= token.outputOffset + token.outputLength / 2) {
                        position.column = token.outputOffset + token.outputLength;

                    // and if we're closer to the left side, we do the same
                    } else {
                        position.column = token.outputOffset;
                    }

                }

            }

        }

        return position;

    }

    moveToBottom(position, copy) {

        position = Point.fromObject(position, copy);

        // if we're already on the very last line, we just go to the end of the line
        if (position.row === this.lineInfo.length - 1) {
            position.column = this.lineInfo[position.row].outputLineLength;

        } else {
            position.row += 1;

            // if we land on the left edge, short-circuit the rest of the procedure
            if (position.column === 0) {
                return position;

            // if we land on the right edge or beyond, we can short-circuit the rest of the procedure too
            } else if (position.column >= this.lineInfo[position.row].outputLineLength) {
                position.column = this.lineInfo[position.row].outputLineLength;
                return position;

            // otherwise, we have to check on which token we land, to stay outside of dynamic tokens
            } else {

                let [ row, tokenIndex, line, token ] = this.getTokenLocatorForPosition(position);

                if (token.type === DYNAMIC_TOKEN) {

                    // if we're closer to the right side, we jump to it
                    if (position.column >= token.outputOffset + token.outputLength / 2) {
                        position.column = token.outputOffset + token.outputLength;

                    // and if we're closer to the left side, we do the same
                    } else {
                        position.column = token.outputOffset;
                    }

                }

            }

        }

        return position;

    }

    getInputOffsetForPosition(position) {

        position = Point.fromObject(position);

        let tokenLocator = this.getTokenLocatorForPosition(position);

        if (!tokenLocator)
            return null;

        let [ row, tokenIndex, line, token ] = tokenLocator;

        let tokenOutputStartOffset = token.outputOffset;
        let tokenOutputEndOffset = tokenStartOffset + token.outputLength;

        // if the character is on the left edge of a token, everything's fine
        if (position.column === tokenOutputStartOffset) {

            return line.inputStartOffset + token.inputOffset;

        // same if we're on the right edge of a token
        } else if (position.column === tokenOutputEndOffset) {

            return line.inputStartOffset + token.inputOffset + tokens[m].inputLength;

        // if we reach this case, it means that the character is located inside a token
        } else {

            // we can subdivise static tokens, but we cannot do this for dynamic tokens
            if (tokens[m].type === STATIC_TOKEN) {
                return line.inputStartOffset + token.inputOffset + column - token.outputOffset;
            } else {
                return null;
            }

        }

    }

    update(source, offset, length, replacement) {

        let generatedLineInfo = [];

        let startLine = this.getLineForInputOffset(offset);
        let nextLine = this.getLineForInputOffset(Math.max(offset + length, offset + replacement.length)) + 1;

        let currentOffset = this.getInputOffsetForLine(startLine);
        let nextOffset = Math.min(Math.max(this.getInputOffsetForLine(nextLine) + (replacement.length - length), offset + length, offset + replacement.length), source.getMaxCharacterIndex());

        let getCharacter = () => {

            let start = source.positionForCharacterIndex(currentOffset);
            let end = source.positionForCharacterIndex(currentOffset + 1);

            return source.getTextInRange([ start, end ]);

        };

        let moveForward = () => {

            // Move the point to the next significant character

            currentOffset += 1;

        };

        let isWhitespace = () => {

            // Return true if the current character counts as a whitespace

            if (isEndOfFile())
                return false;

            let c = getCharacter();

            if (c === ` ` || c === `\t`)
                return true;

            if ((c === `\r` || c === `\n` || c === `\r\n`) && this.options.demoteNewlines)
                return true;

            return false;

        };

        let isNewline = () => {

            // Return true if the current character counts as a newline

            if (isEndOfFile())
                return false;

            let c = getCharacter();

            if ((c === `\r` || c === `\n` || c === `\r\n`) && !this.options.demoteNewlines)
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

            // Return true if we've reached the end of the buffer

            if (currentOffset >= source.getMaxCharacterIndex())
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

            while (isWhitespace() && max-- > 0)
                whitespaces += shiftNext();

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

            let previousLine = null;

            if (!previousLine && generatedLineInfo.length > 0)
                previousLine = generatedLineInfo[generatedLineInfo.length - 1];

            if (!previousLine && this.lineInfo.length > 0 && startLine > 0)
                previousLine = this.lineInfo[startLine - 1];

            let tokens = [];

            let inputStartOffset = currentOffset;
            let outputLineLength = 0;

            while (!isEndOfLine() && outputLineLength < this.options.columns) {

                let spaceTokens = [];
                let spaceOutputLength = 0;

                let wordTokens = [];
                let wordOutputLength = 0;

                if (this.options.collapseWhitespaces && tokens.length === 0 && (!this.options.preserveLeadingSpaces || (previousLine && previousLine.doesSoftWrap))) {

                    // skip any leading spaces
                    shiftWhitespaces();

                } else if (this.options.collapseWhitespaces && tokens.length > 0) {

                    let tokenOffset = currentOffset;
                    let spaces = shiftWhitespaces();

                    // leading spaces cannot accept extra spaces because it wouldn't be possible otherwise to correctly align them
                    let canBeJustified = tokens.length > 0 ? true : false;

                    if (spaces === ` `) { // we can use a static token if we only have a single space

                        spaceTokens.push({ type: STATIC_TOKEN, inputOffset: tokenOffset - inputStartOffset, inputLength: spaces.length, outputLength: spaces.length, value: spaces, canBeJustified });
                        spaceOutputLength += spaces.length;

                    } else { // but in any other case, we unfortunately need to generate a dynamic token

                        spaceTokens.push({ type: DYNAMIC_TOKEN, inputOffset: tokenOffset - inputStartOffset, inputLength: spaces.length, outputLength: 1, value: ` `, canBeJustified });
                        spaceOutputLength += 1;

                    }

                } else {

                    let tokenOffset = currentOffset;
                    let spaces = shiftWhitespaces();

                    // we need to iterate over each character because some of them will have to be normalized
                    for (let t = 0, T = spaces.length; t < T; ++t) {

                        switch (spaces[t]) {

                            case ` `: { // we can generate a static token for a single token, they will be merged together later anyway

                                spaceTokens.push({ type: STATIC_TOKEN, inputOffset: tokenOffset + t - inputStartOffset, inputLength: 1, outputLength: 1, value: ` `, canBeJustified: false });
                                spaceOutputLength += 1;

                            } break;

                            case `\t`: { // convert a tab to multiple spaces

                                spaceTokens.push({ type: DYNAMIC_TOKEN, inputOffset: tokenOffset + t - inputStartOffset, inputLength: 1, outputLength: this.options.tabWidth, value: ` `.repeat(this.options.tabWidth), canBeJustified: false });
                                spaceOutputLength += this.options.tabWidth;

                            } break;

                            case `\r`: { // convert a \r to a single space - also support \r\n by adding a single space instead of two

                                let isRN = t + 1 < T && spaces[t + 1] === `\n`;

                                spaceTokens.push({ type: DYNAMIC_TOKEN, inputOffset: tokenOffset + t - inputStartOffset, inputLength: isRN ? 2 : 1, outputLength: 1, value: ` `, canBeJustified: false });
                                spaceOutputLength += 1;

                                if (isRN) t += 1;

                            } break;

                            case `\n`: { // convert a \n to a single space

                                spaceTokens.push({ type: DYNAMIC_TOKEN, inputOffset: tokenOffset + t - inputStartOffset, inputLength: 1, outputLength: 1, value: ` `, canBeJustified: false });
                                spaceOutputLength += 1;

                            } break;

                        }

                    }

                }

                // stop iterating further if we've reached the end of the line or the end of the available space, so we don't add those useless token to the string (trailing whitespaces are worthless)
                if (isEndOfLine() || outputLineLength + spaceOutputLength >= this.options.columns)
                    break;

                if (this.options.allowWordBreaks) {

                    let tokenOffset = currentOffset;
                    let word = shiftWord(this.options.columns - outputLineLength - spaceOutputLength);

                    wordTokens.push({ type: STATIC_TOKEN, inputOffset: tokenOffset - inputStartOffset, inputLength: word.length, outputLength: word.length, value: word, canBeJustified: false });
                    wordOutputLength += word.length;

                } else {

                    let tokenOffset = currentOffset;
                    let word = shiftWord(this.options.columns - outputLineLength - spaceOutputLength);

                    if (!isWord()) { // if the word is full (ie. if the next character is a whitespace), we've nothing special to do

                        wordTokens.push({ type: STATIC_TOKEN, inputOffset: tokenOffset - inputStartOffset, inputLength: word.length, outputLength: word.length, value: word, canBeJustified: false });
                        wordOutputLength += word.length;

                    } else { // howver, if our word is splitted (ie. if the next character is a word), we might have to backtrack

                        // prevent it from being splitted if we can try to make it fit on a single line
                        if (outputLineLength > 0 || spaceOutputLength > 0) {

                            currentOffset = tokenOffset;

                        // if we can't, break it apart (we won't be able to make it fit in a single line anyway)
                        } else {

                            wordTokens.push({ type: STATIC_TOKEN, inputOffset: tokenOffset - inputStartOffset, inputLength: word.length, outputLength: word.length, value: word, canBeJustified: false });
                            wordOutputLength += word.length;

                            outputLineLength += spaceOutputLength + wordOutputLength;
                            tokens = tokens.concat(spaceTokens, wordTokens);

                        }

                        // we break manually to get out of an infinite loop (since our currentOffset will never change)
                        break;

                    }

                }

                outputLineLength += spaceOutputLength + wordOutputLength;
                tokens = tokens.concat(spaceTokens, wordTokens);

            }

            if (this.options.justifyText && !isEndOfLine() && outputLineLength < this.options.columns) {

                // Compute the number of spaces that we need to add
                let sizeDiff = this.options.columns - outputLineLength;

                // Compute the number of slots where we can fit extra spaces
                let slotCount = tokens.reduce((count, token) => token.canBeJustified ? count + 1 : count, 0);

                // Compute the number of spaces we will have to add on each slot
                let extraSize = Math.ceil(sizeDiff / slotCount);

                for (let t = 0, T = tokens.length; sizeDiff > 0 && t < T; ++t) {

                    let token = tokens[t];

                    if (!token.canBeJustified)
                        continue;

                    let extraSlotSize = Math.min(extraSize, sizeDiff);
                    sizeDiff -= extraSlotSize;

                    token.outputLength += extraSlotSize;
                    token.value += ` `.repeat(extraSlotSize);

                }

            }

            for (let outputOffset = 0, t = 0, T = tokens.length; t < T; ++t) {

                tokens[t].outputOffset = outputOffset;
                outputOffset += tokens[t].outputLength;

            }

            let doesSoftWrap;

            if (isNewline()) {

                doesSoftWrap = false;

                if (getCharacter() === `\r`) {

                    shiftNext();

                    if (getCharacter() === `\n`) {
                        shiftNext();
                    }

                } else {

                    shiftNext();

                }

            } else {

                doesSoftWrap = true;

            }

            let inputEndOffset = currentOffset;
            let inputLineLength = inputEndOffset - inputStartOffset;

            let string = tokens.map(token => token.value).join(``);

            let lineInfo = { inputStartOffset, inputEndOffset, inputLineLength, outputLineLength, doesSoftWrap, string, tokens };
            generatedLineInfo.push(lineInfo);

            if (!isEndOfFile() && currentOffset >= nextOffset && currentOffset !== this.getInputOffsetForLine(nextLine) + (replacement.length - length)) {
                nextOffset = currentOffset + 1;
                nextLine += 1;
            }

        }

        if (isEndOfFile())
            nextLine = this.lineInfo.length;

        this.lineInfo.splice(startLine, nextLine - startLine, ... generatedLineInfo);

        for (let t = nextLine; t < this.lineInfo.length; ++t) {
            this.lineInfo[t].inputStartOffset = t > 0 ? this.lineInfo[t - 1].inputEndOffset : 0;
            this.lineInfo[t].inputEndOffset = this.lineInfo[t].inputStartOffset + this.lineInfo[t].inputLineLength;
        }

        this.rows = this.lineInfo.length;
        this.columns = this.lineInfo.reduce((max, { outputLineLength }) => Math.max(max, outputLineLength), 0);

        return generatedLineInfo.length;

    }

    apply(textBuffer) {

        this.lineInfo = [];

        this.update(textBuffer, 0, 0, textBuffer.getText());

    }

    getLine(line) {

        if (line >= 0 || line < this.lineInfo.length) {
            return this.lineInfo[line].string;
        } else {
            return ``;
        }

    }

    getText() {

        return this.lineInfo.map(({ string }) => {
            return string;
        }).join(`\n`);

    }

}
