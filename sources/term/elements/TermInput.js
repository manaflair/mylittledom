import { isBoolean, isString } from 'lodash';
import TextBuffer              from 'text-buffer';

import { TermTextBase }        from './TermTextBase';

export class TermInput extends TermTextBase {

    constructor({ value = ``, textBuffer = new TextBuffer(value), decored = true, multiline = false, ... props } = {}) {

        super({ ... props, textBuffer });

        this.style.when(`:element`).then({

            focusEvents: true

        });

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

                this.style.when(`:element`).then({

                    whiteSpace: value ? `pre` : undefined,

                    backgroundCharacter: value ? `.` : undefined,
                    backgroundColor: value ? `#000088` : undefined,

                    minHeight: value ? this.multiline ? 10 : 1 : undefined

                });

            }

        });

        this.setPropertyTrigger(`multiline`, multiline, {

            validate: value => {

                return isBoolean(value);

            },

            trigger: value => {

                this.enterIsNewline = multiline ? true : false;

                this.decored && this.style.when(`:element`).then({

                    minHeight: value ? 10 : 1

                });

            }

        });

    }

}
