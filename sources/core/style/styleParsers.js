import { castArray, isFinite, isString, isUndefined, isNumber } from 'lodash';

import { colorNames }                                           from './colorNames';
import { parseRawValue }                                        from './tools/parseRawValue';
import { StyleColor }                                           from './types/StyleColor';
import { StyleDisplay }                                         from './types/StyleDisplay';
import { StyleLength }                                          from './types/StyleLength';
import { StyleOverflow }                                        from './types/StyleOverflow';
import { StylePosition }                                        from './types/StylePosition';

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

export function display(rawValue) {

    if (!Object.prototype.hasOwnProperty.call(StyleDisplay.values, rawValue))
        return undefined;

    return StyleDisplay.values[rawValue];

}

export function position(rawValue) {

    if (!Object.prototype.hasOwnProperty.call(StylePosition.values, rawValue))
        return undefined;

    return StylePosition.values[rawValue];

}

export function overflow(rawValue) {

    if (!Object.prototype.hasOwnProperty.call(StyleOverflow.values, rawValue))
        return undefined;

    return StyleOverflow.values[rawValue];

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

    if (!isNumber(rawValue) && !isString(rawValue))
        return undefined;

    let value = Number(rawValue);

    if (!isFinite(value))
        return undefined;

    return new StyleLength(value);

}

length.rel = function (rawValue) {

    if (!isString(rawValue) || !rawValue.endsWith(`%`))
        return undefined;

    let value = Number(rawValue.slice(0, -1));

    if (!isFinite(value))
        return undefined;

    return new StyleLength(value, true);

};

length.auto = function (rawValue) {

    if (rawValue !== `auto`)
        return undefined;

    return StyleLength.auto;

}

export function character(rawValue) {

    if (!isString(rawValue) || rawValue.length !== 1)
        return undefined;

    return rawValue;

}

export function color(rawValue) {

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
