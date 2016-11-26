import { camelCase, isArray, isFunction, isPlainObject, isString, isUndefined } from 'lodash';

export function parseRawValue(rawValue, parser) {

    if (isArray(parser)) {

        let value;

        for (let t = 0; isUndefined(value) && t < parser.length; ++t)
            value = parseRawValue(rawValue, parser[t]);

        return value;

    }

    if (isPlainObject(parser)) {

        if (!isString(rawValue))
            return undefined;

        let camelized = camelCase(rawValue);

        if (Object.prototype.hasOwnProperty.call(parser, camelized)) {
            return parser[rawValue];
        } else {
            return undefined;
        }

    }

    if (isFunction(parser)) {

        return parser(rawValue);

    }

    if (parser === rawValue) {
        return rawValue;
    }

}
