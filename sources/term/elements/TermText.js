import TextBuffer       from 'text-buffer';

import { TermTextBase } from './TermTextBase';

export class TermText extends TermTextBase {

    constructor({ textContent = ``, textBuffer = new TextBuffer(textContent), ... props } = {}) {

        super({ ... props, textBuffer, enterIsNewline: true });

    }

    get textContent() {

        return this.textBuffer.getText();

    }

    set textContent(textContent) {

        this.textBuffer.setText(textContent);

    }

}
