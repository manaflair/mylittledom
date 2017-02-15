import { isBoolean, isNull, isString }                                                                                      from 'lodash';

import { Event, StyleManager, findAncestorByPredicate, findDescendantsByPredicate, findDescendantByPredicate, makeRuleset } from '../../core';

import { TermElement }                                                                                                      from './TermElement';

export class TermCheckbox extends TermElement {

    constructor({ checked = false, name = null, ... props } = {}) {

        super(props);

        this.styleManager.setStateStatus(`checked`, checked);

        this.styleManager.addRuleset(makeRuleset({

            focusEvents: true

        }, `:focus`, {

            color: `darkblue`

        }, `:checked`, {

            color: `darkcyan`

        }, `:focus:checked`, {

            color: `cyan`

        }), StyleManager.RULESET_NATIVE);

        this.yogaNode.setMeasureFunc((maxWidth, widthMode, maxHeight, heightMode) => {

            let width = Math.min(maxWidth, 3);
            let height = Math.min(maxHeight, 1);

            return { width, height };

        });

        this.addShortcutListener(`enter`, () => {

            this.checked = !this.checked;

        });

        this.setPropertyTrigger(`name`, name, {

            validate: value => {

                return isNull(value) || isString(value);

            }

        });

        this.setPropertyTrigger(`checked`, checked, {

            validate: value => {

                return isBoolean(value);

            },

            trigger: value => {

                this.styleManager.setStateStatus(`checked`, value);

                this.queueDirtyRect();
                this.dispatchEvent(new Event(`change`));

            }

        });

        this.addEventListener(`click`, () => {

            this.checked = !this.checked;

        });

    }

    getInternalContentWidth() {

        return 3;

    }

    getInternalContentHeight() {

        return 1;

    }

    renderContent(x, y, l) {

        if (y === Math.floor(this.contentRect.height / 2)) {

            let fullLine = `[${this.checked ? `x` : ` `}]`;
            let fullLineLength = fullLine.length;

            let fullLineStart = Math.floor((this.scrollRect.width - fullLineLength) / 2);

            let prefixLength = Math.max(0, Math.min(fullLineStart - x, l));
            let lineStart = Math.max(0, x - fullLineStart);
            let lineLength = Math.max(0, Math.min(fullLineLength - lineStart, l));
            let suffixLength = Math.max(0, l - prefixLength - lineLength);

            let prefix = this.renderBackground(prefixLength);
            let text = this.renderText(fullLine.substr(lineStart, lineLength));
            let suffix = this.renderBackground(suffixLength);

            return prefix + text + suffix;

        } else {

            return this.renderBackground(l);

        }

    }

}
