import { isBoolean, isString }       from 'lodash';
import TextBuffer                    from 'text-buffer';

import { StyleManager, makeRuleset } from '../../core';

import { TermTextBase }              from './TermTextBase';

export class TermInput extends TermTextBase {

    constructor({ value = ``, textBuffer = new TextBuffer(value), decored = true, multiline = false, ... props } = {}) {

        super({ ... props, textBuffer });

        this.styleManager.addRuleset(makeRuleset({

            focusEvents: true

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

        this.setPropertyTrigger(`decored`, decored, {

            validate: value => {

                return isBoolean(value);

            },

            trigger: value => {

                this.style.assign({

                    whiteSpace: value ? `pre` : undefined,

                    backgroundCharacter: value ? `.` : undefined,

                    minHeight: value ? this.multiline ? 10 : 1 : undefined

                });

                this.style.when(`:focus`).assign({

                    backgroundColor: value ? `darkblue` : undefined

                });

            }

        });

        this.setPropertyTrigger(`multiline`, multiline, {

            validate: value => {

                return isBoolean(value);

            },

            trigger: value => {

                this.enterIsNewline = multiline ? true : false;

                this.decored && this.style.assign({

                    minHeight: value ? 10 : 1

                });

            }

        });

    }

}
