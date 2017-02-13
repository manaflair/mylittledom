import { has, isEqual, isNull, isString, isUndefined } from 'lodash';

import { parsePropertyValue }                          from './tools/parsePropertyValue';
import { parseSelector }                               from './tools/parseSelector';
import { serializePropertyValue }                      from './tools/serializePropertyValue';
import { styleProperties }                             from './styleProperties';

export function EasyStyle(ruleSet, selector, base = Object.create(null)) {

    let { assign, get } = ruleSet.when(selector);

    return new Proxy(base, {

        ownKeys(target) {

            return Reflect.ownKeys(styleProperties);

        },

        has(target, key) {

            return has(styleProperties, key);

        },

        get(target, key, receiver) {

            if (key in target)
                return target[key];

            if (!has(styleProperties, key))
                throw new Error(`Failed to get a style property: '${key}' is not a valid style property name.`);

            return serializePropertyValue(get(key));

        },

        set(target, key, value, receiver) {

            if (!has(styleProperties, key))
                throw new Error(`Failed to set a style property: '${key}' is not a valid style property name.`);

            if (has(styleProperties[key], `setter`))
                styleProperties[key].setter(receiver, parsePropertyValue(key, value));
            else if (!isUndefined(value))
                assign(new Map([ [ key, parsePropertyValue(key, value) ] ]));
            else
                assign(new Map([ [ key, undefined ] ]));

            return true;

        },

        deleteProperty(target, key, value) {

            if (!has(styleProperties, key))
                throw new Error(`Failed to delete a style property: '${key}' is not a valid style property name.`);

            assign(new Map([ [ key, undefined ] ]));

        }

    });

}
