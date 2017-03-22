// "instance" is whatever you want. They're also called "host components" in this documentation.

import { camelCase, difference, has, intersection, isUndefined, kebabCase, lowerFirst, partition, pick, upperFirst } from 'lodash';
import ReactFiberReconcilier                                                                                         from 'react-dom/lib/ReactFiberReconciler';
import ReactPortal                                                                                                   from 'react-dom/lib/ReactPortal';

import { Point, StyleManager }                                                                                       from '../core';

import * as TermElements                                                                                             from './elements';
import { KeySequence }                                                                                               from './misc/KeySequence';

const EVENT_SYMBOL = Symbol();
const SHORTCUT_SYMBOL = Symbol();

const MANAGED_PROPS = new Map([

    [ `caret`, (element, caret) => {

        if (caret !== null) {
            element.caret = new Point({ x: caret.x, y: caret.y });
        } else {
            element.caret = null;
        }

    } ],

    [ `scroll`, (element, scroll) => {

        if (element.scrollRect.x !== scroll.x)
            element.scrollLeft = scroll.x;

        if (element.scrollRect.y !== scroll.y) {
            element.scrollTop = scroll.y;
        }

    } ],

    [ `value`, (element, value) => {

        element.value = value;

    } ]

]);

function toEventName(key) {

    return key.replace(/^on|Capture$/g, ``).toLowerCase();

}

function doesUseCapture(key) {

    return key.endsWith(`Capture`);

}

function wrapShortcutListener(descriptor, fn) {

    let sequence = new KeySequence(descriptor);

    return { original: fn, wrapper: e => {

        if (!e.key)
            return;

        if (!sequence.add(e.key))
            return;

        TermRenderer.batchedUpdates(() => {

            fn(Object.assign(Object.create(e), {

                setDefault: fn => {

                    e.setDefault(() => {
                        TermRenderer.batchedUpdates(() => {
                            fn.call(e);
                        });
                    });

                }

            }));

        });

    } };

}

function wrapEventListener(fn) {

    return { original: fn, wrapper: (... args) => {

        TermRenderer.batchedUpdates(() => {
            fn(... args);
        });

    } };

}

function findListeners(props) {

    let events = new Map();
    let shortcuts = new Map();
    let renderers = new Map();

    for (let [ prop, value ] of Object.entries(props)) {

        if (!value)
            continue;

        if (prop === `elementRenderer` || prop === `contentRenderer`) {

            renderers.set(prop, value);

        } else if (prop === `onShortcuts`) {

            for (let [ shortcut, listener ] of Object.entries(value)) {
                shortcuts.set(shortcut, wrapShortcutListener(shortcut, listener));
            }

        } else if (/^on[A-Z]/.test(prop)) {

            events.set(prop, wrapEventListener(value));

        }

    }

    return { events, shortcuts, renderers };

}

function setupEventListeners(instance, newListeners) {

    let oldListeners = Reflect.get(instance, EVENT_SYMBOL);

    let oldEvents = Array.from(oldListeners.keys());
    let newEvents = Array.from(newListeners.keys());

    let removedEvents = difference(oldEvents, newEvents);
    let addedEvents = difference(newEvents, oldEvents);
    let replacedEvents = intersection(newEvents, oldEvents).filter(prop => oldListeners.get(prop).original !== newListeners.get(prop).original);

    for (let prop of [ ... removedEvents, ... replacedEvents ])
        instance.removeEventListener(toEventName(prop), oldListeners.get(prop).wrapper, { capture: doesUseCapture(prop) });

    for (let prop of [ ... replacedEvents, ... addedEvents ])
        instance.addEventListener(toEventName(prop), newListeners.get(prop).wrapper, { capture: doesUseCapture(prop) });

    Reflect.set(instance, EVENT_SYMBOL, newListeners);

}

function setupShortcutListeners(instance, newListeners) {

    let oldListeners = Reflect.get(instance, SHORTCUT_SYMBOL);

    let oldShortcuts = Array.from(oldListeners.keys());
    let newShortcuts = Array.from(newListeners.keys());

    let removedShortcuts = difference(oldShortcuts, newShortcuts);
    let addedShortcuts = difference(newShortcuts, oldShortcuts);
    let replacedShortcuts = intersection(newShortcuts, oldShortcuts).filter(prop => oldListeners.get(prop).original !== newListeners.get(prop).original);

    for (let prop of [ ... removedShortcuts, ... replacedShortcuts ])
        instance.removeEventListener(`keypress`, oldListeners.get(prop).wrapper, { capture: true });

    for (let prop of [ ... replacedShortcuts, ... addedShortcuts ])
        instance.addEventListener(`keypress`, newListeners.get(prop).wrapper, { capture: true });

    Reflect.set(instance, SHORTCUT_SYMBOL, newListeners);

}

function setupRenderers(instance, renderers) {

    let oldElementListener = has(instance, `renderElement`) ? instance.renderElement.original : null;
    let newElementListener = renderers.get(`elementRenderer`) || null;

    let oldContentListener = has(instance, `renderContent`) ? instance.renderContent.original : null;
    let newContentListener = renderers.get(`contentRenderer`) || null;

    if (newElementListener !== oldElementListener) {

        if (newElementListener) {
            instance.renderElement = (... args) => newElementListener(... args, instance);
            instance.renderElement.original = newElementListener;
        } else {
            delete instance.renderElement;
        }

        instance.queueDirtyRect(instance.elementClipRect);

    }

    if (newContentListener !== oldContentListener) {

        if (newContentListener) {
            instance.renderContent = (... args) => newContentListener(... args, instance);
            instance.renderContent.original = newContentListener;
        } else {
            delete instance.renderContent;
        }

        instance.queueDirtyRect(instance.contentClipRect);

    }

}

function createInstance(type, props) {

    let elementName = type !== `div` ? `Term${upperFirst(camelCase(type))}` : `TermElement`;
    let ElementClass = TermElements[elementName];

    if (!ElementClass)
        throw new Error(`Invalid element type "${type}" (${elementName} is not amongst ${Object.keys(TermElements).join(`, `)})`);

    let instance = new ElementClass(props);

    Reflect.set(instance, EVENT_SYMBOL, new Map());
    Reflect.set(instance, SHORTCUT_SYMBOL, new Map());

    return instance;

}

let TermRenderer = ReactFiberReconcilier(new class {

    useSyncScheduling = true;

    getRootHostContext() {

        // TODO: ???

        return {};

    }

    getChildHostContext() {

        // TODO: ???

        return {};

    }

    createInstance(type, props, rootContainerInstance, hostContext, internalInstanceHandle) {

        // Note that `type` will always be a string (because React itself will handle the React components). You will probably want to make some kind of switch (or use a type->host map, maybe?) to convert this string into the right host component.

        let propNames = Reflect.ownKeys(props).filter(prop => prop !== `ref`);
        let [ managed, unmanaged ] = partition(propNames, prop => MANAGED_PROPS.has(prop));

        let instance = createInstance(type, pick(props, unmanaged));

        let listeners = findListeners(props);
        setupEventListeners(instance, listeners.events);
        setupShortcutListeners(instance, listeners.shortcuts);
        setupRenderers(instance, listeners.renderers);

        for (let prop of managed)
            if (!isUndefined(props[prop]))
                MANAGED_PROPS.get(prop)(instance, props[prop]);

        return instance;

    }

    createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle) {

        // Create a text instance. It will get called for each text node in your React tree, except if their parent is returning a truthy value when invoked through the `shouldSetTextContent` hook.

        return new (TermElements.TermText)({ textContent: text });

    }

    getPublicInstance(instance) {

        // UNCONFIRMED: Return the public instance to the components (ie. the one which can be accessed via refs).

        return instance;

    }

    appendInitialChild(parentInstance, child) {

        // This function will only be called before the node is injected into the dom. In every other case, you will want to look at appendChild. That being said, multiple children might get appended before the element is inserted into the dom, so you can't just replace all the elements and be done with it.

        // The distinction between appendInitialChild and appendChild might be interesting for various optimizations. For example, in the Noop renderer, the `appendChild` method needs to check if the child node is already somewhere in the tree before appending it. Because `appendInitialChild` is only called before the node is mounted, we know for sure that the node we will insert will never have been already registered in our parent, so we can skip this check.

        // Don't forget to check for text nodes. For example, if "child" is a text node, you might want to return immediately if it should be stored into a property of "parent" instead of as a child node. That being said, you should probably avoid this pattern, since using a property means that you won't be able to have multiple text nodes (the last one will overwrite the others). Still, keep it in mind :)

        parentInstance.appendChild(child);

    }

    finalizeInitialChildren(instance, type, props) {

        // This function can be used to assign a value to an instance *after* both the elements and its child have been generated and linked together, but *before* they get mounted. It's useful in some particular cases, such as `<select value={...}>`: in order to support this use case, you need to check the child values and get the index of the child that match the specified value, which is only possible if the children have been generated (hence why you can't do this in `createInstance`).

        // The return value is used to inform React that a custom effect will need to be applied during commit (once host components have been mounted). For example, a DOM implementation might want to return true in order to support auto-focus. The auto-focus itself will be implemented into the `commitMount` method.

        return props.autofocus ? true : false;

    }

    appendChild(parentInstance, child) {

        // This function will be called every time we need to append a child node inside its new parent, but only after the parent has been mounted into the tree (otherwise the function called will be `appendInitialChild`).

        // Note that you will probably need to make sure that the child node is not already present in your registered children, and remove it if it is (so that you can move it at the end of the list). Some renderers don't need to do this because the underlying APIs (such as DOM) already check for this, but be careful.

        parentInstance.appendChild(child);

    }

    insertBefore(parentInstance, child, beforeChild) {

        // Nothing too complicated - just add a child inside a parent, but make sure to add it before another child. Just like `appendChild`, make sure that the child isn't already present in its parent before adding it, otherwise you could end up with duplicates.

        parentInstance.insertBefore(child, beforeChild);

    }

    removeChild(parentInstance, child) {

        // Just remove the child from its parent.

        parentInstance.removeChild(child);

    }

    prepareForCommit() {

        // This hook is used to save some values before proceeding to commit our new instances into the tree. For example, a DOM renderer would probably want to use this opportunity to save the current selection range, since adding new DOM nodes would probably destroy this selection that you will then need to restore.

        // The return value is a user-defined set of data that will be forwarded to `resetAfterCommit` (this is needed because `prepareForCommit` might be reentrant).

        return {};

    }

    resetAfterCommit(data) {

        // The data parameter is the value returned from `prepareForCommit`. To continue with the example of the DOM renderer, you would use this function to restore the selection range previously saved and returned in the state object.

    }

    commitMount(instance, type, newProps) {

        // This function will be called after the elements have been inserted into the host tree via `appendInitialChild` & co. That's where you need to trigger the actions that require the host components to be inserted in the tree, but also need to be only called once. For example, a DOM renderer would add support for autofocus through this hook.

        if (newProps.autofocus) {

            if (newProps.autofocus !== `steal` && newProps.autofocus !== `initial`) {
                throw new Error(`Invalid autofocus directive; expected "steal" or "initial"`);
            } else if (newProps.autofocus === `steal` || instance.rootNode.activeElement === null) {
                instance.focus();
            }

        }

    }

    prepareUpdate(instance, type, oldProps, newProps, hostContext) {

        // This function needs to check if an update is actually required, and return true in such a case. If you don't, the commitUpdate hook will not get called.

        return true;

    }

    commitUpdate(instance, payload, type, oldProps, newProps) {

        // This function is called everytime the host component needs to be synced with the React props.

        let listeners = findListeners(newProps);
        setupEventListeners(instance, listeners.events);
        setupShortcutListeners(instance, listeners.shortcuts);
        setupRenderers(instance, listeners.renderers);

        let { style = {}, classList = [], ... rest } = newProps;

        for (let name of Reflect.ownKeys(style))
            Reflect.set(instance.style, name, style[name]);

        for (let name of Reflect.ownKeys(rest)) {

            let manager = MANAGED_PROPS.get(name);
            let value = newProps[name];

            if (!manager) {
                Reflect.set(instance, name, value);
            } else if (!isUndefined(value)) {
                manager(instance, value);
            }

        }

        instance.classList.assign(classList);

    }

    commitTextUpdate(textInstance, oldText, newText) {

        // This function is called whenever

        textInstance.textContent = newText;

    }

    shouldSetTextContent(props) {

        // If this function return true, then `createTextInstance` and `commitTextUpdate` will not get called if the guest component contains some text. Instead, it is expected that you will set this text content yourself, both in `createInstance` and `commitUpdate`, and that you will correctly reset it when the `resetTextContent` hook will be called.

        // You will usually only check for "props.children is a string" and "props.children is a number", but it might check for additional props depending on your needs. For example, the DOM renderer also check for any `dangerouslySetInnerHTML` prop.

        return false;

    }

    resetTextContent(instance) {

        // This function is called when parent that returned true on `shouldSetTextContent` loses its text content.

        // TODO: Why isn't this reset inside `commitUpdate`? Just so that people don't forget to implement it?

        instance.textContent = ``;

    }

    scheduleAnimationCallback(callback) {

        // Register a function to be called just before the next screen redraw. In a browser environment, it would probably be implemented using `requestAnimationFrame`.

        // TODO: What are the tasks scheduled through this function?

        setTimeout(callback, 1000 / 60);

    }

    scheduleDeferredCallback(callback) {

        // Register a function to be called whenever we've got the time. In a browser environment, that would be something like `requestIdleCallback`.

        // TODO: What are the tasks scheduled through this function?

        setImmediate(callback);

    }

});

export function render(element, root, callback) {

    let container = TermRenderer.createContainer(root);

    TermRenderer.unbatchedUpdates(() => {
        TermRenderer.updateContainer(element, container, null, callback);
    });

}

export function createPortal(children, containerTag, key) {

    return ReactPortal.createPortal(children, containerTag, null, key);

}

export function getTermNode(component) {

    return TermRenderer.getHostInstance(component);

}
