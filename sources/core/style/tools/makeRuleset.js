import { isPlainObject, isString } from 'lodash';

import { EasyStyle }               from './../EasyStyle';
import { Ruleset }                 from './../Ruleset';
import { parseSelector }           from './parseSelector';

export function makeRuleset(... parts) {

    let ruleset = new Ruleset();
    let style = new EasyStyle(ruleset);

    for (let t = 0; t < parts.length; ++t) {

        if (isString(parts[t])) {

            style = new EasyStyle(ruleset, parseSelector(parts[t]));

        } else if (isPlainObject(parts[t])) {

            Object.assign(style, parts[t]);

        } else {

            throw new Error(`Failed to execute 'makeRuleset': Parameter ${t + 1} is not of type string, nor it is a plain object.`);

        }

    }

    return ruleset;

}
