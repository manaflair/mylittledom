import { Element } from '../dom/Element';

export class Screen extends Element {

    constructor(props) {

        super(props);

        this.style.when(`:element`).then({

            position: `relative`

        });

        Reflect.defineProperty(this, `parentNode`, {

            value: null,
            writable: false

        });

    }

}
