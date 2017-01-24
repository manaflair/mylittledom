import { TermText } from './TermText';

export class TermButton extends TermText {

    constructor({ ... props }) {

        super({ ... props });

        this.style.when(`:element`).then({

            focusEvents: true

        });

        this.style.when(`:element:hover`).then({

            borderColor: `white`,
            color: `white`,

            textDecoration: `underline`

        });

        this.style.when(`:element:active`).then({

            backgroundColor: `white`,
            borderColor: `black`,
            color: `black`,

            textDecoration: null

        });

    }

}
