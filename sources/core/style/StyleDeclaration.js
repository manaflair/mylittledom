import { has, isEqual, isUndefined } from 'lodash';
import { inspect }                   from 'util';

import { initialStyles }             from './initialStyles';
import { styleProperties }           from './styleProperties';
import { parsePropertyValue }        from './tools/parsePropertyValue';
import { runPropertyTriggers }       from './tools/runPropertyTriggers';
import { serializePropertyValue }    from './tools/serializePropertyValue';

export class StyleDeclaration {

    constructor(element) {

        this.element = element;

        this.states = new Set();
        this.enabled = new Set();

        this.stateStyles = [];

        this.computed = {};

        this.refresh(initialStyles.keys());

    }

    addStates(names, enabled = true) {

        for (let name of names) {

            this.states.add(name);

            if (enabled) {
                this.enabled.add(name);
            }

        }

    }

    enable(name) {

        this.enabled.add(name);

        let dirtyStyles = new Set();

        for (let { states, styles } of this.stateStyles)
            if (states.has(name))
                for (let style of styles.keys())
                    dirtyStyles.add(style);

        this.refresh(dirtyStyles);

    }

    disable(name) {

        this.enabled.delete(name);

        let dirtyStyles = new Set();

        for (let { states, styles } of this.stateStyles)
            if (states.has(name))
                for (let style of styles.keys())
                    dirtyStyles.add(style);

        this.refresh(dirtyStyles);

    }

    refresh(styles) {

        for (let style of styles) {

            let oldValue = this.computed[style];
            let newValue = undefined;

            stateStyleLoop: for (let { states, styles } of this.stateStyles) {

                if (!styles.has(style))
                    continue;

                let active = true;

                for (let state of states)
                    if (!this.enabled.has(state))
                        continue stateStyleLoop;

                newValue = styles.get(style);

            }

            if (isUndefined(newValue) && initialStyles.has(style))
                newValue = initialStyles.get(style);

            if (newValue === oldValue || isEqual(serializePropertyValue(newValue), serializePropertyValue(oldValue)))
                continue;

            this.computed[style] = newValue;
            runPropertyTriggers(style, this.element, newValue, oldValue);

        }

    }

    makeProxy() {

        let localStyles = new Map();

        this.stateStyles.push({

            states: new Set([ `local` ]),
            styles: localStyles

        });

        let makeProxy = (base, styles) => {

            let proxy;

            return proxy = new Proxy(Object.create(null), {

                ownKeys: (target) => {

                    return Reflect.ownKeys(styleProperties);

                },

                get: (target, key) => {

                    if (!has(styleProperties, key))
                        return base[key];

                    if (has(styleProperties[key], `getter`)) {
                        return serializePropertyValue(styleProperties[key].getter(proxy));
                    } else {
                        return serializePropertyValue(styles.get(key));
                    }

                },

                set: (target, key, rawValue) => {

                    if (!has(styleProperties, key))
                        throw new Error(`Failed to set: '${key}' is not a valid style property.`);

                    if (has(styleProperties[key], `setter`))
                        styleProperties[key].setter(proxy, parsePropertyValue(key, rawValue));
                    else if (!isUndefined(rawValue))
                        styles.set(key, parsePropertyValue(key, rawValue));
                    else
                        styles.delete(key);

                    this.refresh([ key ]);

                    return true;

                },

                deleteProperty: (target, key) => {

                    if (!has(styleProperties, key))
                        throw new Error(`Failed to delete: '${key}' is not a valid style property.`);

                    proxy[key] = undefined;

                }

            });

        }

        return makeProxy({

            $: this.computed,

            when: selector => {

                if (!selector.match(/^(:[a-z]+(-[a-z]+)*)+$/))
                    throw new Error(`Failed to execute 'when': Parameter 1 is not a valid selector.`);

                let states = new Set(selector.match(/[a-z-]+/g));
                let entry = this.stateStyles.find(stateSet => isEqual(states, stateSet.states));

                if (isUndefined(entry)) {
                    entry = { states, styles: new Map() };
                    this.stateStyles.push(entry);
                }

                let next = makeProxy({

                    then: properties => Object.assign(next, properties)

                }, entry.styles);

                return next;

            }

        }, localStyles);

    }

}
