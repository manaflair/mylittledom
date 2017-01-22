import { has, isUndefined }   from 'lodash';

import { styleProperties }    from './styleProperties';
import { parsePropertyValue } from './tools/parsePropertyValue';

export let initialStyles = new Map();

for (let key of Reflect.ownKeys(styleProperties)) {

    if (!has(styleProperties[key], `initial`))
        continue;

    let rawValue = styleProperties[key].initial;

    if (isUndefined(rawValue))
        continue;

    initialStyles.set(key, parsePropertyValue(key, rawValue));

}
