import { isFunction } from 'lodash';

export class Event {

    constructor(name, { bubbles = false, cancelable = false } = {}) {

        this.name = name;

        this.bubbles = bubbles;
        this.cancelable = cancelable;

        this.immediatlyCanceled = false;
        this.bubblingCanceled = false;

        this.defaultPrevented = false;
        this.default = null;

        this.target = null;
        this.currentTarget = null;

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
        this.bubblingCanceled = true;

    }

    stopPropagation() {

        this.bubblingCanceled = true;

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

}
