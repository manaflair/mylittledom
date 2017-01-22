import { isBoolean, isNull, isString }                                                           from 'lodash';

import { Event, findAncestorByPredicate, findDescendantsByPredicate, findDescendantByPredicate } from './../../core';

import { TermElement }                                                                           from './TermElement';
import { TermForm }                                                                              from './TermForm';

export class TermRadio extends TermElement {

    constructor({ checked = false, name = null, ... props } = {}) {

        super(props);

        this.style.when(`:element`).then({

            focusEvents: true

        });

        this.style.when(`:element:focused`).then({

            color: `red`

        });

        this.yogaNode.setMeasureFunc((maxWidth, widthMode, maxHeight, heightMode) => {

            let width = Math.min(maxWidth, 3);
            let height = Math.min(maxHeight, 1);

            return { width, height };

        });

        this.addShortcutListener(`enter`, () => {

            this.checked = true;

        });

        this.addShortcutListener(`left, up`, () => {

            if (isNull(this.name))
                return;

            let form = findAncestorByPredicate(this, node => node instanceof TermForm);

            if (!form)
                return;

            let radios = findDescendantsByPredicate(form, node => node instanceof TermRadio && node.name === this.name);

            let index = radios.indexOf(this);
            let prev = (index === 0 ? radios.length : index) - 1;

            radios[prev].focus();
            radios[prev].checked = true;

        });

        this.addShortcutListener(`down, right`, () => {

            if (isNull(this.name))
                return;

            let form = findAncestorByPredicate(this, node => node instanceof TermForm);

            if (!form)
                return;

            let radios = findDescendantsByPredicate(form, node => node instanceof TermRadio && node.name === this.name);

            let index = radios.indexOf(this);
            let next = (index === radios.length - 1 ? -1 : index) + 1;

            radios[next].focus();
            radios[next].checked = true;

        });

        this.setPropertyTrigger(`name`, name, {

            validate: value => {

                return isNull(value) || isString(value);

            },

            trigger: value => {

                if (!isNull(value)) {

                    let form = findAncestorByPredicate(this, node => node instanceof TermForm);

                    if (form) {

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

            }

        });

        this.setPropertyTrigger(`checked`, checked, {

            validate: value => {

                return isBoolean(value);

            },

            trigger: value => {

                if (!isNull(this.name)) {

                    if (value) {

                        let form = findAncestorByPredicate(this, node => node instanceof TermForm);

                        for (let radio of findDescendantsByPredicate(form, node => node instanceof TermRadio)) {

                            if (radio === this)
                                continue;

                            if (radio.name !== this.name)
                                continue;

                            radio.checked = false;

                        }

                    }

                }

                this.queueDirtyRect();
                this.dispatchEvent(new Event(`change`));

            }

        });

        this.addEventListener(`mousedown`, () => {

            this.checked = true;

        });

    }

    getInternalContentWidth() {

        return 3;

    }

    validateRelativeFocusTargetSelf(node) {

        if (this.name === null || this.checked)
            return true;

        let form = findAncestorByPredicate(this, node => node instanceof TermForm);

        if (!form)
            return true;

        let checked = findDescendantByPredicate(form, node => node instanceof TermRadio && node.name === this.name && node.checked);

        if (!checked)
            return true;

        return false;

    }

    validateRelativeFocusTarget(node) {

        return !(node instanceof TermRadio) || this.name === null || this.name !== node.name;

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
