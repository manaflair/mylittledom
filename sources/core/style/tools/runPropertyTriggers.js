import { isUndefined }     from 'lodash';

import { styleProperties } from '../styleProperties';

export function runPropertyTriggers(name, node, newValue, oldValue) {

    if (!Object.prototype.hasOwnProperty.call(styleProperties, name))
        throw new Error(`Failed to run property triggers: '${name}' is not a valid style property name.`);

    let property = styleProperties[name];

    if (isUndefined(property.triggers))
        return;

    for (let trigger of property.triggers) {
        trigger(node, newValue, oldValue);
    }

}
