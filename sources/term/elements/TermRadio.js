import { isBoolean, isNull, isString }                                                                                      from 'lodash';

import { Event, StyleManager, findAncestorByPredicate, findDescendantsByPredicate, findDescendantByPredicate, makeRuleset } from '../../core';

import { TermElement }                                                                                                      from './TermElement';
import { TermForm }                                                                                                         from './TermForm';

export class TermRadio extends TermElement {

    constructor({ checked = false, name = null, ... props } = {}) {

        super(props);

        this.styleManager.setStateStatus(`checked`, checked);

        this.styleManager.addRuleset(makeRuleset({

            focusEvents: true

        }, `:checked`, {

            fontWeight: `bold`,

            color: `white`

        }, `:focus`, {

            color: `cyan`

        }), StyleManager.RULESET_NATIVE);

        this.yogaNode.setMeasureFunc((maxWidth, widthMode, maxHeight, heightMode) => {

            let width = Math.min(maxWidth, 3);
            let height = Math.min(maxHeight, 1);

            return { width, height };

        });

        this.addEventListener(`click`, e => {

            e.setDefault(() => {
                this.checked = true;
            });

        }, { capture: true });

        this.addShortcutListener(`enter`, e => {

            e.setDefault(() => {
                this.checked = true;
            });

        }, { capture: true });

        this.addShortcutListener(`left, up`, e => {

            e.setDefault(() => {

                if (isNull(this.name))
                    return;

                let form = findAncestorByPredicate(this, node => node instanceof TermForm) || this.rootNode;

                if (form === this)
                    return;

                let radios = findDescendantsByPredicate(form, node => node instanceof TermRadio && node.name === this.name);

                let index = radios.indexOf(this);
                let prev = (index === 0 ? radios.length : index) - 1;

                radios[prev].focus();
                radios[prev].checked = true;

            });

        }, { capture: true });

        this.addShortcutListener(`down, right`, e => {

            e.setDefault(() => {

                if (isNull(this.name))
                    return;

                let form = findAncestorByPredicate(this, node => node instanceof TermForm) || this.rootNode;

                if (form === this)
                    return;

                let radios = findDescendantsByPredicate(form, node => node instanceof TermRadio && node.name === this.name);

                let index = radios.indexOf(this);
                let next = (index === radios.length - 1 ? -1 : index) + 1;

                radios[next].focus();
                radios[next].checked = true;

            });

        }, { capture: true });

        this.setPropertyTrigger(`name`, name, {

            validate: value => {

                return isNull(value) || isString(value);

            },

            trigger: value => {

                if (!isNull(value)) {

                    let form = findAncestorByPredicate(this, node => node instanceof TermForm) || this.rootNode;

                    if (form === this)
                        return;

                    let uncheck = false;

                    for (let radio of findDescendantsByPredicate(form, node => node instanceof TermRadio)) {

                        if (uncheck)
                            radio.checked = false;

                        if (radio.checked) {
                            uncheck = true;
                        }

                    }

                }

            }

        });

        this.setPropertyTrigger(`checked`, checked, {

            validate: value => {

                return isBoolean(value);

            },

            trigger: value => {

                this.styleManager.setStateStatus(`checked`, value);

                if (!isNull(this.name)) {

                    if (value) {

                        let form = findAncestorByPredicate(this, node => node instanceof TermForm) || this.rootNode;

                        if (form !== this) {

                            for (let radio of findDescendantsByPredicate(form, node => node instanceof TermRadio)) {

                                if (radio === this)
                                    continue;

                                if (radio.name !== this.name)
                                    continue;

                                radio.checked = false;

                            }

                        }

                    }

                }

                this.queueDirtyRect();
                this.dispatchEvent(new Event(`change`));

            }

        });

    }

    getInternalContentWidth() {

        return 3;

    }

    validateRelativeFocusTargetSelf(source) {

        if (this.name === null)
            return true;

        let formTarget = findAncestorByPredicate(this, node => node instanceof TermForm) || this.rootNode;

        if (source instanceof TermRadio && source.name === this.name) {

            let formSource = findAncestorByPredicate(source, node => node instanceof TermForm) || source.rootNode;

            if (formSource === formTarget) {
                return false;
            }

        }

        if (this.checked)
            return true;

        let checked = findDescendantByPredicate(formTarget, node => node instanceof TermRadio && node.name === this.name && node.checked);

        if (checked)
            return false;

        let first = findDescendantByPredicate(formTarget, node => node instanceof TermRadio && node.name === this.name);

        if (this !== first)
            return false;

        return true;

    }

    getInternalContentHeight() {

        return 1;

    }

    renderContent(x, y, l) {

        if (y === Math.floor(this.contentRect.height / 2)) {

            let fullLine = `(${this.checked ? `x` : ` `})`;
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
