// "instance" is whatever you want. They're also called "host components" in this documentation.

import { camelCase, difference, lowerFirst, upperFirst } from 'lodash';
import ReactFiberReconcilier                             from 'react-dom/lib/ReactFiberReconciler';

import * as TermElements                                 from './elements';

let eventSymbol = Symbol();

function toEventName(key) {

    return lowerFirst(key.replace(/^on/g, ``));

}

function findEventProps(props) {

    let bindings = new Map();

    for (let key of Object.keys(props))
        if (/^on[A-Z]/.test(key) && ![ `onElementRender`, `onContentRender` ].includes(key))
            bindings.set(toEventName(key), props[key]);

    return bindings;

}

function setupEventListeners(instance, props) {

    let eventMap = instance[eventSymbol];

    if (!eventMap)
        eventMap = instance[eventSymbol] = new Map();

    let bindings = findEventProps(props);

    let previousEvents = Array.from(eventMap.keys());
    let events = Array.from(bindings.keys());

    let dirtyEvents = [
        ... events.filter(eventName => bindings.get(eventName) && eventMap.get(eventName) && bindings.get(eventName) !== eventMap.get(eventName)),
        ... difference(previousEvents, events)
    ];

    for (let eventName of dirtyEvents) {
        instance.removeEventListener(eventName, eventMap.get(eventName));
        eventMap.delete(eventName);
    }

    for (let eventName of events) {
        instance.addEventListener(eventName, bindings.get(eventName));
        eventMap.set(eventName, bindings.get(eventName));
    }

}

function setupRenderListeners(instance, props) {

    if (props.onElementRender) {
        instance.renderElement = props.onElementRender.bind(null, instance);
    } else {
        delete instance.renderElement;
    }

    if (props.onContentRender) {
        instance.renderContent = props.onContentRender.bind(null, instance);
    } else {
        delete instance.renderContent;
    }

}

function createInstance(type, props) {

    let elementName = type !== `div` ? `Term${upperFirst(camelCase(type))}` : `TermElement`;
    let ElementClass = TermElements[elementName];

    if (!ElementClass)
        throw new Error(`Invalid element type "${type}" (${elementName} is not amongst ${Object.keys(TermElements).join(`, `)})`);

    return new ElementClass(props);

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

        let instance = createInstance(type, props);

        setupEventListeners(instance, props);
        setupRenderListeners(instance, props);

        return instance;

    }

    createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle) {

        // Create a text instance. It will get called for each text node in your React tree, except if their parent is returning a truthy value when invoked through the `shouldSetTextContent` hook.

        return new (TermElements.TermText)({ textContent: text });

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

        return false;

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

    }

    prepareUpdate(instance, type, oldProps, newProps, hostContext) {

        //

    }

    commitUpdate(instance, type, oldProps, newProps) {

        // This function is called everytime the host component needs to be synced with the React props.

        setupEventListeners(instance, newProps);
        setupRenderListeners(instance, newProps);

        let { style, ... rest } = newProps;

        Object.assign(instance.style, style);
        Object.assign(instance, rest);

    }

    commitTextUpdate(textInstance, oldText, newText) {

        // This function is called whenever

        instance.textContent = newText;

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
