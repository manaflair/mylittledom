import { style }   from '@manaflair/term-strings';
import { memoize } from 'lodash';

export class StyleColor {

    constructor(name) {

        this.name = name;

        Reflect.defineProperty(this, `front`, {
            get: memoize(() => style.color.front(this.name).in),
            enumerable: false
        });

        Reflect.defineProperty(this, `back`, {
            get: memoize(() => style.color.back(this.name).in),
            enumerable: false
        });

    }

    serialize() {

        return this.name;

    }

    inspect() {

        return this.serialize();

    }

}
