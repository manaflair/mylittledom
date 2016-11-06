import { isUndefined } from 'lodash';

export class StyleSet {

    constructor(name) {

        this.name = name;

        this.properties = new Map();

    }

    keys() {

        return this.properties.keys();

    }

    set(propertyName, value) {

        if (!isUndefined(value)) {
            this.properties.set(propertyName, value);
        } else {
            this.properties.delete(propertyName);
        }

    }

    get(propertyName) {

        return this.properties.get(propertyName);

    }

    delete(propertyName) {

        this.properties.delete(propertyName);

    }

}
