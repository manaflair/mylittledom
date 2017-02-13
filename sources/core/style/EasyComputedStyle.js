import { has }             from 'lodash';

import { styleProperties } from './styleProperties';

export function EasyComputedStyle(computed, base = Object.create(null)) {

    return new Proxy(base, {

        ownKeys(target) {

            return Reflect.ownKeys(styleProperties);

        },

        has(target, key) {

            return has(styleProperties, key);

        },

        get(target, key) {

            if (!has(styleProperties, key))
                throw new Error(`Failed to get a style property: '${key}' is not a valid style property name.`);

            return computed.get(key);

        }

    });

}
