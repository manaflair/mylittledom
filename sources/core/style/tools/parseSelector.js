import { isNull, isString } from 'lodash';

export function parseSelector(selector) {

    if (isNull(selector))
        return new Set();

    if (!isString(selector))
        throw new Error(`Failed to execute 'parseSelector': Parameter 1 is not a string.`);

    if (!selector.match(/^(:[a-z]+([A-Z][a-z]+)*)+$/))
        throw new Error(`Failed to execute 'parseSelector': '${selector}' is not a valid selector.`);

    return new Set(selector.match(/[a-zA-Z]+/g));

}
