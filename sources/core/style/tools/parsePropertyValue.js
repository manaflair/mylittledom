import { has, isUndefined } from 'lodash';

import { StyleInherit }     from '../types/StyleInherit';

import { styleProperties }  from '../styleProperties';

import { parseRawValue }    from './parseRawValue';

export function parsePropertyValue(propertyName, rawValue) {

    if (!has(styleProperties, propertyName))
        throw new Error(`Failed to parse a style property: '${propertyName}' is not a valid style property.`);

    let property = styleProperties[propertyName];

    if (isUndefined(property.parsers))
        throw new Error(`Failed to parse a style property: '${propertyName}' has no declared parser.`);

    if (rawValue === `inherit`)
        return StyleInherit.inherit;

    let styleValue = parseRawValue(rawValue, property.parsers);

    if (isUndefined(styleValue))
        throw new Error(`Failed to parse a style property: '${rawValue}' is not a valid value for property '${propertyName}'.`);

    return styleValue;

}
