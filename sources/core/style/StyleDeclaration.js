import { isEqual, isUndefined }    from 'lodash';
import { inspect }                 from 'util';

import { styleProperties }         from './styleProperties';
import { parsePropertyValue }      from './tools/parsePropertyValue';
import { runPropertyTriggers }     from './tools/runPropertyTriggers';
import { serializePropertyValue }  from './tools/serializePropertyValue';

export class StyleDeclaration {

    constructor(element) {

        this.element = element;

        this.styleSets = new Map();
        this.enabledSets = new WeakSet();

        this.computed = {};

    }

    add(name, styleSet, enabled = true) {

        this.styleSets.set(name, styleSet);

        if (enabled) {
            this.enable(name);
        }

    }

    enable(name) {

        let styleSet = this.styleSets.get(name);

        if (!styleSet)
            return;

        this.enabledSets.add(styleSet);
        this.refresh(styleSet.keys());

    }

    disable(name) {

        let styleSet = this.styleSets.get(name);

        if (!styleSet)
            return;

        this.enabledSets.delete(styleSet);
        this.refresh(styleSet.keys());

    }

    refresh(propertyNames) {

        for (let propertyName of propertyNames) {

            let oldValue = this.computed[propertyName];
            let newValue = undefined;

            for (let styleSet of this.styleSets.values()) {

                if (!this.enabledSets.has(styleSet))
                    continue;

                let setValue = styleSet.get(propertyName);

                if (isUndefined(setValue))
                    continue;

                newValue = setValue;

            }

            if (newValue === oldValue || isEqual(serializePropertyValue(newValue), serializePropertyValue(oldValue)))
                continue;

            this.computed[propertyName] = newValue;
            runPropertyTriggers(propertyName, this.element, newValue, oldValue);

        }

    }

    makeProxy() {

        let proxies = { $: this.computed };

        for (let [ name, styleSet ] of this.styleSets) {

            let proxy = proxies[name] = new Proxy({

                [inspect.custom](depth, opts) {

                    let serialized = {};

                    for (let propertyName of Reflect.ownKeys(styleProperties))
                        serialized[propertyName] = serializePropertyValue(styleSet.get(propertyName));

                    return serialized;

                }

            }, {

                ownKeys: (target) => {

                    return Reflect.ownKeys(styleProperties);

                },

                get: (target, key) => {

                    if (key in target)
                        return target[key];

                    if (Object.prototype.hasOwnProperty.call(proxies, key))
                        return proxies[key];

                    if (!Object.prototype.hasOwnProperty.call(styleProperties, key))
                        throw new Error(`Invalid property access: '${key}' is not a valid style property name.`);

                    let property = styleProperties[key];

                    if (property.getter) {

                        return property.getter(proxy);

                    } else {

                        return serializePropertyValue(styleSet.get(key));

                    }

                },

                set: (target, key, value) => {

                    if (!Object.prototype.hasOwnProperty.call(styleProperties, key))
                        throw new Error(`Invalid property access: '${key}' is not a valid style property name.`);

                    let property = styleProperties[key];

                    if (property.setter) {

                        property.setter(proxy, parsePropertyValue(key, value));

                        return true;

                    } else {

                        if (!isUndefined(value))
                            styleSet.set(key, parsePropertyValue(key, value));
                        else
                            styleSet.delete(key);

                        if (this.enabledSets.has(styleSet))
                            this.refresh([ key ]);

                        return true;

                    }

                },

                deleteProperty: (target, key) => {

                    if (!Object.prototype.hasOwnProperty.call(styleProperties, key))
                        throw new Error(`Invalid property access: '${key}' is not a valid style property name.`);

                    styleSet.delete(key);

                    if (this.enabledSets.has(styleSet))
                        this.refresh([ key ]);

                    return true;

                }

            });

        }

        return proxies.local;

    }

}
