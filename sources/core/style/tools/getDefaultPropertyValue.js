import { styleProperties }    from '../styleProperties';

import { parsePropertyValue } from './parsePropertyValue';

let cache = new Map();

export function getDefaultPropertyValue(name) {

    if (!Object.prototype.hasOwnProperty.call(styleProperties, name))
        throw new Error(`Failed to get a style property default value: '${name}' is not a valid style property name.`);

    let property = styleProperties[name];

    if (!cache.has(name))
        cache.set(name, parsePropertyValue(name, property.initial));

    return cache.get(name);

}
