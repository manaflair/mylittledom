import { isUndefined } from 'lodash';

import { EventSource } from '../misc/EventSource';
import { Event }       from '../misc/Event';

export class Ruleset {

    constructor() {

        EventSource.setup(this);

        this.declareEvent(`change`);

        this.rules = [];

        this.propertyNames = new Map();

        this.assign = this.when(new Set()).assign;

    }

    keys() {

        return this.propertyNames.keys();

    }

    when(states) {

        if (!(states instanceof Set))
            throw new Error(42);

        let rule = this.rules.find(rule => {

            if (states.size !== rule.states.size)
                return false;

            for (let state of rule.states)
                if (!states.has(state))
                    return false;

            return true;

        });

        if (!rule) {

            rule = { states, propertyValues: new Map() };

            this.rules.push(rule);

        }

        return {

            keys: () => {

                return rule.propertyValues.keys();

            },

            get: propertyName => {

                return rule.propertyValues.get(propertyName);

            },

            assign: propertyValues => {

                let dirtyPropertyNames = new Set();

                for (let [ propertyName, newValue ] of propertyValues) {

                    let oldValue = rule.propertyValues.get(propertyName);

                    if (newValue === oldValue)
                        continue;

                    if (!isUndefined(newValue))
                        rule.propertyValues.set(propertyName, newValue);
                    else
                        rule.propertyValues.delete(propertyName);

                    let count = this.propertyNames.get(propertyName) || 0;

                    if (!isUndefined(newValue))
                        count += 1;
                    else
                        count -= 1;

                    if (count > 0)
                        this.propertyNames.set(propertyName, count);
                    else
                        this.propertyNames.delete(propertyName);

                    dirtyPropertyNames.add(propertyName);

                }

                if (dirtyPropertyNames.size > 0) {

                    let event = new Event(`change`);

                    event.states = rule.states;
                    event.properties = dirtyPropertyNames;

                    this.dispatchEvent(event);

                }

            }

        };

    }

}
