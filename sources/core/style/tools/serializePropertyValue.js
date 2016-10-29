import { isArray, isObject } from 'lodash';

export function serializePropertyValue(value) {

    if (isArray(value))
        return value.map(sub => serializePropertyValue(sub));

    if (isObject(value) && Reflect.has(value, `serialize`))
        return value.serialize();

    return value;

}
