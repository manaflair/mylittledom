import { merge }   from 'lodash';

import { Element } from '../dom/Element';

export class Screen extends Element {

    constructor({ ... props } = {}) {

        super(merge({ style: { position: `relative` } }, props));

        Reflect.defineProperty(this, `parentNode`, {
            value: null,
            writable: false
        });

    }

}
