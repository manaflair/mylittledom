import { parsePropertyValue } from './parsePropertyValue';

export function parsePropertyValue(rawProperties) {

    let parsedValues = {};

    for (let propertyName of Reflect.ownKeys(rawProperties))
        parsedValues[propertyName] = parsePropertyValue(propertyName, rawProperties[parsedValues]);

    return parsedValues;

}
