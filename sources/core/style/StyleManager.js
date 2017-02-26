import { autobind }               from 'core-decorators';
import { isEqual }                from 'lodash';

import { getSpecificity }         from './tools/getSpecificity';
import { parsePropertyValue }     from './tools/parsePropertyValue';
import { parseSelector }          from './tools/parseSelector';
import { runPropertyTriggers }    from './tools/runPropertyTriggers';
import { serializePropertyValue } from './tools/serializePropertyValue';
import { StyleInherit }           from './types/StyleInherit';
import { ClassList }              from './ClassList';
import { EasyComputedStyle }      from './EasyComputedStyle';
import { EasyStyle }              from './EasyStyle';
import { Ruleset }                from './Ruleset';
import { styleProperties }        from './styleProperties';

export class StyleManager {

    static RULESET_NATIVE = `RULESET_NATIVE`;
    static RULESET_USER = `RULESET_USER`;

    constructor(element) {

        this.element = element;

        this.states = new Set();

        this.nativeRulesets = new Set();
        this.userRulesets = new Set();

        this.localRuleset = new Ruleset();
        this.localRuleset.addEventListener(`change`, this.handleRulesetChange);

        this.stylePasses = [ this.nativeRulesets, this.userRulesets, [ this.localRuleset ] ];

        this.inherited = new Set();
        this.computed = new Map();

    }

    getClassList() {

        return new ClassList(this);

    }

    getStyle() {

        let localRuleset = this.localRuleset;

        return new EasyStyle(localRuleset, [], {

            $: new EasyComputedStyle(this.computed),

            assign(propertyValues) {

                Object.assign(this, propertyValues);

            },

            when(selector) {

                return new EasyStyle(localRuleset, parseSelector(selector), {

                    assign(propertyValues) {

                        Object.assign(this, propertyValues);

                    }

                });

            }

        });

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

        let dirtyProperties = new Set();

        for (let rulesets of this.stylePasses) {

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

    setRulesets(rulesets, target = StyleManager.RULESET_USER) {

        if (target !== StyleManager.RULESET_USER)
            throw new Error(`Failed to execute 'setRulesets': Invalid target.`);

        let current = Array.from(this.userRulesets);
        let next = Array.from(rulesets);

        let skipCurrent = 0;
        let skipNext = 0;

        while (skipCurrent < current.length && skipNext < next.length) {

            if (!current[skipCurrent]) {

                skipCurrent += 1;

            } else if (current[skipCurrent] === next[skipNext]) {

                skipCurrent += 1;
                skipNext += 1;

            } else {

                break;

            }

        }

        let dirtyPropertyNames = new Set();

        for (let t = skipCurrent; t < current.length; ++t) {

            let ruleset = current[t];

            if (!ruleset)
                continue;

            this.userRulesets.delete(ruleset);

            let propertyNames = ruleset.keys();
            ruleset.removeEventListener(`change`, this.handleRulesetChange);

            for (let propertyName of propertyNames) {
                dirtyPropertyNames.add(propertyName);
            }

        }

        for (let t = skipNext; t < next.length; ++t) {

            let ruleset = next[t];

            if (!ruleset)
                continue;

            this.userRulesets.add(ruleset);

            let propertyNames = ruleset.keys();
            ruleset.addEventListener(`change`, this.handleRulesetChange);

            for (let propertyName of propertyNames) {
                dirtyPropertyNames.add(propertyName);
            }

        }

        this.refresh(dirtyPropertyNames);

    }

    addRuleset(ruleset, target = StyleManager.RULESET_USER) {

        if (!ruleset)
            return;

        switch (target) {

            case StyleManager.RULESET_NATIVE: {

                if (this.nativeRulesets.has(ruleset))
                    return;

                if (this.userRulesets.has(ruleset))
                    throw new Error(`Failed to execute 'addRuleset': This ruleset already has been registered as a user ruleset.`);

                this.nativeRulesets.add(ruleset);

            } break;

            case StyleManager.RULESET_USER: {

                if (this.userRulesets.has(ruleset))
                    return;

                if (this.nativeRulesets.has(ruleset))
                    throw new Error(`Failed to execute 'addRuleset': This ruleset already has been registered as a native ruleset.`);

                this.userRulesets.add(ruleset);

            } break;

            default: {

                throw new Error(`Failed to execute 'addRuleset': Cannot.`);

            } break;

        }

        let dirtyPropertyNames = ruleset.keys();
        ruleset.addEventListener(`change`, this.handleRulesetChange);

        this.refresh(dirtyPropertyNames);

    }

    removeRuleset(ruleset) {

        if (this.nativeRulesets.has(ruleset))
            throw new Error(`Failed to execute 'removeRuleset': Cannot remove a native ruleset.`);

        if (!this.userRulesets.has(ruleset))
            return;

        this.userRulesets.add(ruleset);

        let dirtyPropertyNames = ruleset.keys();
        ruleset.removeEventListener(`change`, this.handleRulesetChange);

        this.refresh(dirtyPropertyNames);

    }

    @autobind handleRulesetChange(e) {

        for (let state of e.states)
            if (!this.states.has(state))
                return;

        this.refresh(e.properties);

    }

    get(propertyName) {

        let value = undefined;

        for (let rulesets of this.stylePasses) {

            let specificity = -Infinity;

            for (let ruleset of rulesets) {

                ruleLoop: for (let { states, propertyValues } of ruleset.rules) {

                    if (!propertyValues.has(propertyName))
                        continue ruleLoop; // it doesn't have the property we're computing

                    if (states.size > this.states.size)
                        continue ruleLoop; // it cannot match anyway

                    let ruleSpecificity = getSpecificity(states);

                    if (ruleSpecificity < specificity)
                        continue ruleLoop; // it has a lower specificity than ours

                    for (let state of states)
                        if (!this.states.has(state))
                            continue ruleLoop;

                    value = propertyValues.get(propertyName);
                    specificity = ruleSpecificity;

                }

            }

        }

        return value;

    }

    refresh(propertyNames, { inheritedOnly = false } = {}) {

        if (propertyNames.size === 0)
            return;

        let dirtyPropertyNames = new Set();

        for (let propertyName of propertyNames) {

            if (inheritedOnly && !this.inherited.has(propertyName))
                continue;

            let oldValue = this.computed.get(propertyName);
            let newValue = this.get(propertyName);

            if (newValue === StyleInherit.inherit) {

                this.inherited.add(propertyName);

                if (this.element.parentNode) {
                    newValue = this.element.parentNode.style.$[propertyName];
                } else {
                    newValue = parsePropertyValue(propertyName, styleProperties[propertyName].default);
                }

            } else {

                this.inherited.delete(propertyName);

            }

            if (!isEqual(serializePropertyValue(newValue), serializePropertyValue(oldValue))) {

                dirtyPropertyNames.add(propertyName);

                this.computed.set(propertyName, newValue);

                runPropertyTriggers(propertyName, this.element, newValue, oldValue);

            }

        }

        if (dirtyPropertyNames.size > 0) {

            for (let child of this.element.childNodes) {
                child.styleManager.refresh(dirtyPropertyNames, { inheritedOnly: true });
            }

        }

    }

}
