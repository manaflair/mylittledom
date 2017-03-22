import { isFunction } from 'lodash';

export class Event {

    constructor(name, { bubbles = false, cancelable = false } = {}, attrs = {}) {

        this.name = name;

        this.bubbles = bubbles;
        this.cancelable = cancelable;

        this.immediatlyCanceled = false;
        this.propagationStopped = false;

        this.defaultPrevented = false;
        this.default = null;

        this.target = null;
        this.currentTarget = null;

        for (let [ key, value ] of Object.entries(attrs)) {
            this[key] = value;
        }

    }

    reset() {

        this.immediatlyCanceled = false;
        this.bubblingCanceled = false;

        this.defaultPrevented = false;
        this.default = null;

        this.target = null;
        this.currentTarget = null;

        return this;

    }

    stopImmediatePropagation() {

        this.immediatlyCanceled = true;
        this.propagationStopped = true;

    }

    stopPropagation() {

        this.propagationStopped = true;

    }

    preventDefault() {

        if (!this.cancelable)
            throw new Error(`Failed to execute 'preventDefault': Event is not cancelable.`);

        this.defaultPrevented = true;

    }

    setDefault(callback) {

        if (!isFunction(callback))
            throw new Error(`Failed to execute 'setDefaultAction': Parameter 1 is not of type 'function'.`);

        this.default = callback;

    }

    inspect() {

        let defaultPrevented = this.defaultPrevented ? ` (default prevented)` : ``;

        return `<Event ${this.name}${defaultPrevented}>`;

    }

}
