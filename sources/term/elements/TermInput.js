import { isBoolean, isString } from 'lodash';
import TextBuffer              from 'text-buffer';

import { TermTextBase }        from './TermTextBase';

export class TermInput extends TermTextBase {

    constructor({ value = ``, textBuffer = new TextBuffer(value), multiline = false, ... props } = {}) {

        super({ ... props, textBuffer });

        this.style.element.whiteSpace = `pre`;
        this.style.element.backgroundCharacter = `.`;
        this.style.element.focusEvents = true;

        this.style.element.focused.backgroundColor = `#000088`;

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

                this.style.element.minHeight = value ? 10 : 1;
                this.enterIsNewline = multiline ? true : false;

            }

        });

    }

}
