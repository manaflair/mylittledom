import { castArray, isFinite, isString, isUndefined, isNumber } from 'lodash';

import { colorNames }                                           from './colorNames';
import { parseRawValue }                                        from './tools/parseRawValue';
import { StyleColor }                                           from './types/StyleColor';
import { StyleLength }                                          from './types/StyleLength';
import { StyleWeight }                                          from './types/StyleWeight';

class Optional {

    constructor(parsers) {

        this.parsers = parsers;

    }

}

export function list(parserList) {

    let minSize = parserList.reduce((count, parser) => count + (parser instanceof Optional ? 0 : 1), 0);
    let maxSize = parserList.length;

    function iterate(parserList, rawValues) {

        if (rawValues.length === 0 && parserList.length === 0)
            return [];

        if (rawValues.length < minSize && parserList.length === 0)
            return undefined;

        if (parserList.length < minSize && rawValues.length === 0)
            return undefined;

        let rawValue = rawValues[0];
        let parserEntry = parserList[0];

        let isOptional = parserEntry instanceof Optional;
        let parsers = parserEntry instanceof Optional ? parserEntry.parsers : parserEntry;

        let value = parseRawValue(rawValue, parsers);

        if (value === undefined && !isOptional)
            return undefined;

        let next = value !== undefined
            ? iterate(parserList.slice(1), rawValues.slice(1))
            : iterate(parserList.slice(1), rawValues);

        if (next !== undefined) {
            return [ value, ... next ];
        } else {
            return undefined;
        }

    }

    return rawValue => {

        rawValue = castArray(rawValue);

        if (rawValue.length < minSize)
            return undefined;

        if (rawValue.length > maxSize)
            return undefined;

        return iterate(parserList, rawValue);

    };

}

export function optional(parsers) {

    return new Optional(parsers);

}

export function repeat(n, parsers) {

    return rawValue => {

        rawValue = castArray(rawValue);

        if (!n.includes(rawValue.length))
            return undefined;

        let value = rawValue.map(sub => {
            return parseRawValue(sub, parsers);
        });

        if (value.some(sub => isUndefined(sub)))
            return undefined;

        return value;

    };

}

export function number(rawValue) {

    if (!isNumber(rawValue) && !isString(rawValue))
        return undefined;

    let value = Number(rawValue);

    if (!isFinite(value))
        return undefined;

    return value;

}

export function length(rawValue) {

    if (rawValue instanceof StyleLength && !rawValue.isRelative)
        return rawValue;

    if (!isNumber(rawValue) && !isString(rawValue))
        return undefined;

    let value = Number(rawValue);

    if (!isFinite(value))
        return undefined;

    return new StyleLength(value);

}

length.rel = function (rawValue) {

    if (rawValue instanceof StyleLength && rawValue.isRelative)
        return rawValue;

    if (!isString(rawValue) || !rawValue.endsWith(`%`))
        return undefined;

    let value = Number(rawValue.slice(0, -1));

    if (!isFinite(value))
        return undefined;

    return new StyleLength(value, true);

};

length.auto = function (rawValue) {

    if (rawValue !== `auto` && rawValue !== StyleLength.auto)
        return undefined;

    return StyleLength.auto;

};

length.infinity = function (rawValue) {

    if (rawValue !== Infinity)
        return undefined;

    return StyleLength.infinity;

};

export function character(rawValue) {

    if (!isString(rawValue) || rawValue.length !== 1)
        return undefined;

    return rawValue;

}

export function color(rawValue) {

    if (rawValue instanceof StyleColor)
        return rawValue;

    if (!isString(rawValue))
        return undefined;

    rawValue = rawValue.toLowerCase();

    if (Object.prototype.hasOwnProperty.call(colorNames, rawValue))
        rawValue = colorNames[rawValue];

    if (/^#[0-9a-f]{3}$/.test(rawValue))
        rawValue = rawValue.replace(/([0-9a-f])/g, `$1$1`);

    if (!/^#[0-9a-f]{6}$/.test(rawValue))
        return undefined;

    return new StyleColor(rawValue);

}

export function weight(rawValue) {

    if (!isNumber(rawValue) && !isString(rawValue))
        return undefined;

    let value = Number(rawValue);

    if (!isFinite(value))
        return undefined;

    return new StyleWeight(value);

}
