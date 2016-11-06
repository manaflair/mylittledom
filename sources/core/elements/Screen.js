import { Element } from '../dom/Element';

export class Screen extends Element {

    constructor(props) {

        super(props);

        Object.assign(this.style.element, {
            position: `relative`
        });

        Reflect.defineProperty(this, `parentNode`, {
            value: null,
            writable: false
        });

    }

}
