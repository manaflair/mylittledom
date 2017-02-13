import { autobind }               from 'core-decorators';
import { isEqual }                from 'lodash';

import { parseSelector }          from './tools/parseSelector';
import { runPropertyTriggers }    from './tools/runPropertyTriggers';
import { serializePropertyValue } from './tools/serializePropertyValue';
import { ClassList }              from './ClassList';
import { EasyComputedStyle }      from './EasyComputedStyle';
import { EasyStyle }              from './EasyStyle';
import { Ruleset }                from './Ruleset';

export class StyleManager {

    static RULESET_NATIVE = `RULESET_NATIVE`;
    static RULESET_USER = `RULESET_USER`;

    constructor(element) {

        this.element = element;

        this.localRuleset = new Ruleset();
        this.localRuleset.addEventListener(`change`, this.handleRulesetChange);

        this.nativeRulesets = new Set();
        this.userRulesets = new Set();

        this.states = new Set();

        this.computed = new Map();

    }

    getClassList() {

        return new ClassList(this);

    }

    getStyle() {

        let style = new EasyStyle(this.localRuleset, [], {

            $: new EasyComputedStyle(this.computed),

            assign: propertyValues => {

                Object.assign(style, propertyValues);

            },

            when: selector => {

                return new EasyStyle(this.localRuleset, parseSelector(selector));

            }

        });

        return style;

    }

    setStateStatus(state, status) {

        if (status) {

            if (this.states.has(state))
                return;

            this.states.add(state);

        } else {

            if (!this.states.has(state))
                return;

            this.states.delete(state);

        }

        let stylePasses = [

            this.nativeRulesets,
            this.userRulesets,

            [ this.localRuleset ]

        ];

        let dirtyProperties = new Set();

        for (let rulesets of stylePasses) {

            for (let ruleset of rulesets) {

                for (let { states, propertyValues } of ruleset.rules) {

                    if (!states.has(state))
                        continue;

                    for (let propertyName of propertyValues.keys()) {
                        dirtyProperties.add(propertyName);
                    }

                }

            }

        }

        this.refresh(dirtyProperties);

    }

    setRulesets(rulesets) {

        let current = Array.from(this.userRulesets);
        let next = Array.from(rulesets);

        let skip = 0;

        while (skip > Math.min(current.length, next.length) && current[skip] === next[skip])
            skip += 1;

        let dirtyPropertyNames = new Set();

        for (let t = skip; t < current.length; ++t) {

            this.userRulesets.remove(current[t]);

            let propertyNames = current[t].when(this.states).keys();
            ruleSet.removeEventListener(`change`, this.handleRulesetChange);

            for (let propertyName of propertyNames) {
                dirtyPropertyNames.add(propertyName);
            }

        }

        for (let t = skip; t < next.length; ++t) {

            this.userRulesets.add(next[t]);

            let props = next[t].when(this.states).keys();
            ruleSet.addEventListener(`change`, this.handleRulesetChange);

            for (let propertyName of propertyNames) {
                dirtyPropertyNames.add(propertyName);
            }

        }

        this.refresh(dirtyPropertyNames);

    }

    addRuleset(ruleSet, target = StyleManager.RULESET_USER) {

        if (!ruleSet)
            return;

        switch (target) {

            case StyleManager.RULESET_NATIVE: {

                if (this.nativeRulesets.has(ruleSet))
                    return;

                if (this.userRulesets.has(ruleSet))
                    throw new Error(`Failed to execute 'addRuleset': This ruleset already has been registered as a user ruleset.`);

                this.nativeRulesets.add(ruleSet);

            } break;

            case StyleManager.RULESET_USER: {

                if (this.userRulesets.has(ruleSet))
                    return;

                if (this.nativeRulesets.has(ruleSet))
                    throw new Error(`Failed to execute 'addRuleset': This ruleset already has been registered as a native ruleset.`);

                this.userRulesets.add(ruleSet);

            } break;

            default: {

                throw new Error(`Failed to execute 'addRuleset': Cannot.`);

            } break;

        }

        let dirtyPropertyNames = ruleSet.when(this.states).keys();
        ruleSet.addEventListener(`change`, this.handleRulesetChange);

        this.refresh(dirtyPropertyNames);

    }

    removeRuleset(ruleset) {

        if (this.nativeRulesets.has(ruleset))
            throw new Error(`Failed to execute 'removeRuleset': Cannot remove a native ruleset.`);

        if (!this.userRulesets.has(ruleset))
            return;

        this.userRulesets.add(ruleset);

        let dirtyPropertyNames = ruleset.when(this.states).keys();
        ruleSet.removeEventListener(`change`, this.handleRulesetChange);

        this.refresh(dirtyPropertyNames);

    }

    @autobind handleRulesetChange(e) {

        for (let state of e.states)
            if (!this.states.has(state))
                return;

        this.refresh(e.properties);

    }

    refresh(propertyNames) {

        let stylePasses = [

            this.nativeRulesets,
            this.userRulesets,

            [ this.localRuleset ]

        ];

        for (let propertyName of propertyNames) {

            let oldValue = this.computed.get(propertyName);
            let newValue = undefined;

            for (let rulesets of stylePasses) {

                let specificity = -Infinity;

                for (let ruleset of rulesets) {

                    ruleLoop: for (let { states, propertyValues } of ruleset.rules) {

                        if (!propertyValues.has(propertyName))
                            continue ruleLoop; // it doesn't have the property we're computing

                        if (states.size > this.states.size)
                            continue ruleLoop; // it cannot match anyway

                        if (states.size < specificity)
                            continue ruleLoop; // it has a lower specificity than ours

                        for (let state of states)
                            if (!this.states.has(state))
                                continue ruleLoop;

                        newValue = propertyValues.get(propertyName);
                        specificity = states.size;

                    }

                }

            }

            if (!isEqual(serializePropertyValue(newValue), serializePropertyValue(oldValue))) {

                this.computed.set(propertyName, newValue);

                runPropertyTriggers(propertyName, this.element, newValue, oldValue);

            }

        }

    }

}
