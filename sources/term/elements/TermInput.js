import TextBuffer       from 'text-buffer';

import { TermTextBase } from './TermTextBase';

export class TermInput extends TermTextBase {

    constructor({ value = ``, textBuffer = new TextBuffer(value), multiline = false, ... props } = {}) {

        super({ ... props, textBuffer });

        this.style.element.whiteSpace = `pre`;
        this.style.element.backgroundCharacter = `.`;
        this.style.element.focusEvents = true;

        this.style.element.focused.backgroundColor = `#000088`;

        this.setPropertyTrigger(`multiline`, value => {
            this.style.element.minHeight = value ? 10 : 1;
            this.enterIsNewline = multiline ? true : false;
        }, { initial: multiline });

    }

    get value() {

        return this.textBuffer.getText();

    }

    set value(value) {

        this.textBuffer.setText(value);

    }

}
