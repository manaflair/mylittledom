import { TermStringBuilder }                                          from '@manaflair/term-strings/gen';
import { style }                                                      from '@manaflair/term-strings';
import { TextLayout, TextOperation }                                  from '@manaflair/text-layout/sources/entry-browser';
import { GrammarRegistry }                                            from 'first-mate';
import { isNil, isNull, isPlainObject, isString, isUndefined, merge } from 'lodash';
import plist                                                          from 'plist';

export class SyntaxHighlighter extends TextLayout {

    constructor() {

        super();

        // I don't really like this interface, so we wrap it and expose a new one
        let grammarRegistry = new GrammarRegistry();

        this.rawLines = [ `` ];
        this.tokenizedLines = [ ];

        this.grammar = {

            active: null,

            registry: new Map(),

            load: (name, data) => {

                if (isString(data))
                    data = plist.parse(data);

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

                if (isString(data))
                    data = plist.parse(data);

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

                textOperation.deletedLineCount = 0;
                textOperation.addedLineStrings = this.tokenizedLines.map((_, index) => this.getTransformedLine(startingRow + index));

                return textOperation;

            }

        };

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

        while (tokenizedLines.length < addedLineCount) {

            let lines = this.processLine(startingRow + tokenizedLines.length);

            tokenizedLines = tokenizedLines.concat(lines);

        }

        textOperation.startingRow = startingRow;
        textOperation.deletedLineCount = deletedLineCount + tokenizedLines.length - addedLineCount;

        this.tokenizedLines.splice(textOperation.startingRow, textOperation.deletedLineCount, ... tokenizedLines);

        textOperation.addedLineStrings = tokenizedLines.map((_, index) => this.getTransformedLine(startingRow + index));

    }

    processLine(row) {

        let lines = [ this.rawLines[row] ];

        while (this.doesSoftWrap(row + lines.length - 1))
            lines.push(this.rawLines[row + lines.length]);

        let { tags } = this.grammar.active.tokenizeLine(lines.join(``));

        let processedLines = [ { line: lines[0], tags: [] } ];
        let activeScopes = new Set();

        let currentRow = 0;
        let currentSize = 0;

        for (let t = 0; t < tags.length; ++t) {

            if (tags[t] < 0) {

                if (tags[t] % 2 === 0) {
                    activeScopes.add(tags[t]);
                } else {
                    activeScopes.delete(tags[t] + 1);
                }

                processedLines[currentRow].tags.push(tags[t]);

            } else {

                if (tags[t] > 0) {

                    while (currentRow + 1 < lines.length && currentSize >= lines[currentRow].length) {

                        for (let scope of activeScopes)
                            processedLines[currentRow].tags.push(scope - 1);

                        currentRow += 1, currentSize = 0;
                        processedLines.push({ line: lines[currentRow], tags: [] });

                        for (let scope of activeScopes) {
                            processedLines[currentRow].tags.push(scope);
                        }

                    }

                }

                if (currentRow < lines.length) {

                    processedLines[currentRow].tags.push(tags[t]);

                    currentSize += tags[t];

                }

            }

        }

        return processedLines;

    }

    getTransformedLine(row) {

        let output = new TermStringBuilder();

        for (let token of this.grammar.active.registry.decodeTokens(this.tokenizedLines[row].line, this.tokenizedLines[row].tags)) {

            let props = this.theme.resolve(token.scopes);

            if (props.foreground)
                output.enter(style.color.front(props.foreground));

            if (props.background)
                output.enter(style.color.back(props.background));

            output.append(token.value);

        }

        return output.build();

    }

}
