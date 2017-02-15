import { has, isUndefined }   from 'lodash';

import { EasyStyle }          from './EasyStyle';
import { Ruleset }            from './Ruleset';
import { styleProperties }    from './styleProperties';
import { parsePropertyValue } from './tools/parsePropertyValue';

let globalRuleset = new Ruleset();
let globalStyle = new EasyStyle(globalRuleset, new Set());

for (let key of Reflect.ownKeys(styleProperties)) {

    if (!has(styleProperties[key], `initial`))
        continue;

    globalStyle[key] = styleProperties[key].initial;

}

export { globalRuleset };
