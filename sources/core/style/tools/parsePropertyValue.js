import { isUndefined }     from 'lodash';

import { styleProperties } from '../styleProperties';

import { parseRawValue }   from './parseRawValue';

export function parsePropertyValue(name, rawValue) {

    if (!Object.prototype.hasOwnProperty.call(styleProperties, name))
        throw new Error(`Failed to parse a style property: '${name}' is not a valid style property name.`);

    let property = styleProperties[name];

    if (isUndefined(property.parsers))
        throw new Error(`Failed to parse a style property: '${name}' has no declared parser.`);

    let value = parseRawValue(rawValue, property.parsers);

    if (isUndefined(value))
        throw new Error(`Failed to parse a style property: '${rawValue}' is not a valid value for property '${name}'.`);

    return value;

}
