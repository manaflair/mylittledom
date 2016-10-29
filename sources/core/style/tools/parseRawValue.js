import { isArray, isFunction, isNull, isPlainObject, isUndefined } from 'lodash';

export function parseRawValue(rawValue, parser) {

    if (isArray(parser)) {

        let value;

        for (let t = 0; isUndefined(value) && t < parser.length; ++t)
            value = parseRawValue(rawValue, parser[t]);

        return value;

    }

    if (isPlainObject(parser)) {

        if (Object.prototype.hasOwnProperty.call(parser, rawValue)) {
            return parser[rawValue];
        } else {
            return undefined;
        }

    }

    if (isFunction(parser)) {

        return parser(rawValue);

    }

    if (isNull(parser)) {

        if (rawValue === null) {
            return null;
        }

    }

}
