import { isFunction, isNull, isString } from 'lodash';

import { Event }                        from './Event';

export class EventSource {

    static symbol = Symbol();

    static setup(instance, extra) {

        let eventSource = instance[EventSource.symbol] = new this(instance, extra);

        for (let methodName of Object.getOwnPropertyNames(EventSource.prototype)) {

            if (methodName === `constructor`)
                continue;

            Object.defineProperty(instance, methodName, {
                value: (... args) => eventSource[methodName](... args),
                enumerable: true
            });

        }

    }

    static [Symbol.hasInstance](instance) {

        return Reflect.has(instance, EventSource.symbol);

    }

    constructor(instance, { dispatchToParent = () => {} } = {}) {

        this.instance = instance;
        this.listeners = new Map();

        Object.defineProperty(this, `dispatchToParent`, {
            value: dispatchToParent,
            enumerable: false
        });

    }

    declareEvent(name) {

        if (!isString(name))
            throw new Error(`Failed to execute 'declareEvent': Parameter 1 is not of type 'string'.`);

        if (this.listeners.has(name))
            throw new Error(`Failed to execute 'declareEvent': '${name}' already exists.`);

        this.listeners.set(name, new Set());

    }

    addEventListener(name, callback) {

        if (!isString(name))
            throw new Error(`Failed to execute 'addEventListener': Parameter 1 is not of type 'string'.`);

        if (!isFunction(callback))
            throw new Error(`Failed to execute 'addEventListener': Parameter 2 is not of type 'function'.`);

        if (!this.listeners.has(name))
            throw new Error(`Failed to execute 'addEventListener': '${name}' is not a valid event name.`);

        let listeners = this.listeners.get(name);

        if (listeners.has(callback))
            throw new Error(`Failed to execute 'addEventListener': This callback is already listening on this event.`);

        listeners.add(callback);

    }

    removeEventListener(name, callback) {

        if (!isString(name))
            throw new Error(`Failed to execute 'removeEventListener': Parameter 1 is not of type 'string'.`);

        if (!isFunction(callback))
            throw new Error(`Failed to execute 'removeEventListener': Parameter 2 is not of type 'function'.`);

        if (!this.listeners.has(name))
            throw new Error(`Failed to execute 'removeEventListener': '${name}' is not a valid event name.`);

        this.listeners.get(name).remove(callback);

    }

    dispatchEvent(event) {

        if (!(event instanceof Event))
            throw new Error(`Failed to execute 'dispatchEvent': Parameter 2 is not of type 'Event'.`);

        if (!this.listeners.has(event.name))
            throw new Error(`Failed to execute 'dispatchEvent': '${name}' is not a valid event name.`);

        if (isNull(event.target))
            event.currentTarget = event.target = this.instance;
        else
            event.currentTarget = this.instance;

        for (let listener of this.listeners.get(event.name)) {

            listener(event);

            if (event.immediatlyCanceled) {
                break;
            }

        }

        if (event.default && !event.defaultPrevented)
            event.default();

        if (event.bubbles && !event.bubblingCanceled) {
            this.dispatchToParent(event);
        }

    }

    on(... args) {

        return this.addEventListener(... args);

    }

    off(... args) {

        return this.removeEventListener(... args);

    }

    addListener(... args) {

        return this.addEventListener(... args);

    }

    removeListener(... args) {

        return this.removeEventListener(... args);

    }

}
