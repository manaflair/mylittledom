import { isBoolean, isString }       from 'lodash';
import TextBuffer                    from 'text-buffer';

import { StyleManager, makeRuleset } from '../../core';

import { TermTextBase }              from './TermTextBase';

export class TermInput extends TermTextBase {

    constructor({ value = ``, textBuffer = new TextBuffer(value), multiline = false, ... props } = {}) {

        super({ ... props, textBuffer });

        this.styleManager.addRuleset(makeRuleset({

            focusEvents: true

        }, `:decored`, {

            minHeight: 1,

            whiteSpace: `pre`,

            backgroundCharacter: `.`

        }, `:decored:multiline`, {

            minHeight: 10

        }, `:decored:focus`, {

            background: `darkblue`

        }), StyleManager.RULESET_NATIVE);

        this.setPropertyAccessor(`value`, {

            validate: value => {

                return isString(value);

            },

            get: () => {

                return this.textBuffer.getText();

            },

            set: value => {

                this.textBuffer.setText(value);

            }

        });

        this.setPropertyTrigger(`multiline`, multiline, {

            validate: value => {

                return isBoolean(value);

            },

            trigger: value => {

                this.enterIsNewline = multiline ? true : false;

                this.styleManager.setStateStatus(`multiline`, value);

            }

        });

    }

}
