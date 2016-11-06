import { isUndefined }        from 'lodash';

import { StyleSet }           from './StyleSet';
import { styleProperties }    from './styleProperties';
import { parsePropertyValue } from './tools/parsePropertyValue';

export let initialStyleSet = new StyleSet();

for (let propertyName of Reflect.ownKeys(styleProperties)) {

    let property = styleProperties[propertyName];
    let initial = property.initial;

    if (isUndefined(initial))
        continue;

    let value = parsePropertyValue(propertyName, initial);
    initialStyleSet.set(propertyName, value);

}
