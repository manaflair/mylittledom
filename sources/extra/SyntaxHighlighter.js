import { TermStringBuilder }                                          from '@manaflair/term-strings/gen';
import { style }                                                      from '@manaflair/term-strings';
import { TextLayout, TextOperation }                                  from '@manaflair/text-layout';
import { GrammarRegistry }                                            from 'first-mate';
import { isNil, isNull, isPlainObject, isString, isUndefined, merge } from 'lodash';
import plist                                                          from 'plist';

export class SyntaxHighlighter extends TextLayout {

    constructor() {

        super();

        // I don't really like this interface, so we wrap it and expose a new one
        let grammarRegistry = new GrammarRegistry();

        this.colorCache = new Map();

        this.rawLines = [ `` ];
        this.tokenizedLines = [ ];

        this.grammar = {

            active: null,

            registry: new Map(),

            load: (name, data) => {

                if (isString(data) || data instanceof Buffer)
                    data = JSON.parse(data.toString());

                if (!isPlainObject(data))
                    throw new Error(`Failed to execute 'grammar.load': Parameter 1 is not of type 'object'.`);

                let grammar = grammarRegistry.createGrammar(null, data);
                grammarRegistry.addGrammar(grammar);

                this.grammar.registry.set(name, grammar);

                return { use: () => this.grammar.use(name) };

            },

            use: (name) => {

                if (!isNull(name) && isUndefined(this.grammar.registry.get(name)))
                    throw new Error(`Failed to execute 'grammar.use': '${name}' is not a valid grammar name.`);

                if (!isNull(name))
                    this.grammar.active = this.grammar.registry.get(name);
                else
                    this.grammar.active = null;

                return this.grammar;

            },

            apply: () => {

                return this.reset();

            }

        };

        this.theme = {

            active: null,

            registry: new Map(),

            load: (name, data) => {

                if (isString(data) || data instanceof Buffer)
                    data = plist.parse(data.toString());

                if (!isPlainObject(data))
                    throw new Error(`Failed to execute 'theme.load': Parameter 1 is not of type 'object'.`);

                this.theme.registry.set(name, data);

                return { use: () => this.theme.use(name) };

            },

            use: (name) => {

                if (!isNull(name) && isUndefined(this.theme.registry.get(name)))
                    throw new Error(`Failed to execute 'theme.use': '${name}' is not a valid theme name.`);

                if (!isNull(name))
                    this.theme.active = this.theme.registry.get(name);
                else
                    this.theme.active = null;

                this.colorCache.clear();

                return this.theme;

            },

            resolve: (scopes = [], name, def) => {

                let props = isNull(this.theme.active) ? {} : merge({}, ... this.theme.active.settings.filter(({ scope }) => {
                    return isNil(scope) || scopes.some(other => scope === other || other.startsWith(`${scope}.`));
                }).map(({ settings }) => {
                    return settings;
                }));

                if (isUndefined(name))
                    return props;

                if (!isUndefined(props[name]))
                    return props[name];

                return def;

            },

            apply: () => {

                let textOperation = new TextOperation();

                textOperation.startingRow = 0;

                textOperation.deletedLineCount = this.tokenizedLines.length;
                textOperation.addedLineStrings = Array.from(this.tokenizedLines.keys()).map(index => this.transformLine(textOperation.startingRow + index));

                return textOperation;

            }

        };

    }

    getColor(color) {

        let entry = this.colorCache.get(color);

        if (!entry) {

            let front = style.color.front(color);
            let back = style.color.back(color);

            entry = { front, back };
            this.colorCache.set(color, entry);

        }

        return entry;

    }

    reset() {

        let oldRange = { start: this.getFirstPosition(), end: this.getLastPosition() };
        let textOperation = super.reset();
        let newRange = { start: this.getFirstPosition(), end: this.getLastPosition() };

        textOperation.apply(this.rawLines);
        this.regenerateRange(textOperation, oldRange, newRange);

        return textOperation;

    }

    update(start, deleted, added) {

        let startingPoint = this.getPositionForCharacterIndex(start);

        let oldRange = { start: startingPoint, end: this.getPositionForCharacterIndex(start + deleted) };
        let textOperation = super.update(start, deleted, added);
        let newRange = { start: startingPoint, end: this.getPositionForCharacterIndex(start + added) };

        textOperation.apply(this.rawLines);
        this.regenerateRange(textOperation, oldRange, newRange);

        return textOperation;

    }

    regenerateRange(textOperation, oldRange, newRange) {

        let tokenizedLines = [];

        let startingRow = textOperation.startingRow;

        let deletedLineCount = textOperation.deletedLineCount;
        let addedLineCount = textOperation.addedLineStrings.length;

        while (startingRow > 0 && this.doesSoftWrap(startingRow - 1)) {

            startingRow -= 1;

            deletedLineCount += 1;
            addedLineCount += 1;

        }

        for (let index = 0; index < addedLineCount; index = tokenizedLines.length) {

            let row = startingRow + index;
            let ruleStack = undefined;

            if (index > 0)
                ruleStack = tokenizedLines[index - 1].ruleStack;
            else if (row > 0)
                ruleStack = this.tokenizedLines[row - 1].ruleStack;

            tokenizedLines = [ ... tokenizedLines, ... this.processLine(row, ruleStack) ];

        }

        deletedLineCount += tokenizedLines.length - addedLineCount;
        addedLineCount += tokenizedLines.length - addedLineCount;

        this.tokenizedLines.splice(startingRow, deletedLineCount, ... tokenizedLines);

        textOperation.startingRow = startingRow;
        textOperation.deletedLineCount = deletedLineCount;

        textOperation.addedLineStrings = Array.from(tokenizedLines.keys()).map(index => this.transformLine(startingRow + index));

    }

    processLine(startingRow, ruleStack) {

        let length = 1;

        while (this.doesSoftWrap(startingRow + length - 1))
            length += 1;

        let affectedLines = this.rawLines.slice(startingRow, startingRow + length);

        let processedData = this.grammar.active.tokenizeLine(affectedLines.join(``), ruleStack, startingRow === 0);
        let processedLines = affectedLines.map((line, index) => ({ line, tags: [], ruleStack: index === affectedLines.length - 1 ? processedData.ruleStack : undefined }));

        let activeScopes = new Set();

        let index = 0;
        let size = 0;

        for (let tag of [ ... processedData.openScopeTags, ... processedData.tags ]) {

            if (tag < 0) {

                if (tag % 2 === 0) {
                    activeScopes.add(tag);
                } else {
                    activeScopes.delete(tag + 1);
                }

                processedLines[index].tags.push(tag);

            } else if (tag > 0) {

                let maxSlice = tag;//Math.min(processedLines[index].line.length - size);
                let slice = Math.min(tag, maxSlice);

                processedLines[index].tags.push(slice);
                size += slice;

            } else {

                processedLines[index].tags.push(0);

            }

        }

        return processedLines;

    }

    transformLine(row) {

        let output = new TermStringBuilder();

        let tokens;

        try {
            tokens = this.grammar.active.registry.decodeTokens(this.tokenizedLines[row].line, this.tokenizedLines[row].tags);
        } catch (err) {
            console.log(row, this.tokenizedLines[row]);
            throw err;
        }

        let defaultFrontColor = this.getColor(this.theme.resolve([], `foreground`, `#FFFFFF`));
        let defaultBackColor = this.getColor(this.theme.resolve([], `background`, `#FFFFFF`));

        if (true) {

            let spaceCount = 0;

            let guideColor = this.getColor(this.theme.resolve([], `guide`, `#333333`));
            let activeGuideColor = this.getColor(this.theme.resolve([], `activeGuide`, `#333333`));
            let stackedGuideColor = this.getColor(this.theme.resolve([], `stackedGuide`, `#333333`));

            output.pushStyle({ front: guideColor.front });

            for (let t = 0; t < tokens.length; ++t) {

                let token = tokens[t];
                let [ , spaces, rest ] = token.value.match(/^( *)(.*)$/);

                if (rest.length > 0) {
                    token.value = rest;
                } else {
                    tokens.shift();
                    t = t - 1;
                }

                if (spaces.length === 0)
                    break;

                for (let u = 0; u < spaces.length; ++u) {
                    output.pushText(spaceCount % 4 === 0 ? `│` : ` `);
                    spaceCount += 1;
                }

                if (rest.length > 0) {
                    break;
                }

            }

            if (tokens.length === 0) {

                let topRowSpaceCount = row > 0 ? this.rawLines[row - 1].match(/^ */)[0].length : 0;
                let bottomRowSpaceCount = row < this.rawLines.length - 2 ? this.rawLines[row + 1].match(/^ */)[0].length : 0;

                let minSpaceCount = Math.max(topRowSpaceCount, bottomRowSpaceCount);

                for (; spaceCount < minSpaceCount; ++spaceCount) {
                    output.pushText(spaceCount % 4 === 0 ? `│` : ` `);
                }

            }

        }

        let previousFrontColor = null;
        let previousBackColor = null;

        for (let t = 0; t < tokens.length; ++t) {

            let token = tokens[t];
            let props = this.theme.resolve(token.scopes);

            if (props.background)
                output.pushStyle({ back: this.getColor(props.background).back });
            else
                output.pushStyle({ back: defaultBackColor.back });

            if (props.foreground)
                output.pushStyle({ front: this.getColor(props.foreground).front });
            else
                output.pushStyle({ front: defaultFrontColor.front });

            output.pushText(token.value);

        }

        return output.build();

    }

}
