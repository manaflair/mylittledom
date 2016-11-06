import { TermText } from './TermText';

export class TermInput extends TermText {

    constructor(props) {

        super(props);

        this.style.element.backgroundCharacter = `.`;
        this.style.element.focusEvents = true;

        this.style.focused.backgroundColor = `#000088`;

    }

    get value() {

        return this.textContent;

    }

    set value(value) {

        this.textContent = value;

    }

}
