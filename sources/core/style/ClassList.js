import { isUndefined } from 'lodash';

export class ClassList {

    constructor(styleManager) {

        this.styleManager = styleManager;

    }

    assign(ruleSets) {

        this.styleManager.setRulesets(ruleSets);

    }

    add(ruleSet) {

        this.styleManager.addRuleset(ruleSet);

    }

    remove(ruleSet) {

        this.styleManager.removeRuleset(ruleSet);

    }

    toggle(ruleSet, force) {

        if (isUndefined(force))
            force = !this.includes(ruleSet);

        if (force) {
            this.add(ruleSet);
        } else {
            this.remove(ruleSet);
        }

    }

    contains() {

        throw new Error(`Failed to execute 'contains': Use 'includes' instead.`);

    }

    includes(ruleSet) {

        return this.StyleManager.hasRuleset(ruleSet);

    }

}
