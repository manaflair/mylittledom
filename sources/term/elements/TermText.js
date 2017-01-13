import { isString }     from 'lodash';
import TextBuffer       from 'text-buffer';

import { TermTextBase } from './TermTextBase';

export class TermText extends TermTextBase {

    constructor({ textContent = ``, textBuffer = new TextBuffer(textContent), ... props } = {}) {

        super({ ... props, textBuffer, enterIsNewline: true });

        this.setPropertyAccessor(`textContent`, {

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

    }

}
