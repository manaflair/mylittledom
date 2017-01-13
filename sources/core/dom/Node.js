import { first, last, isEmpty } from 'lodash';

let currentNodeId = 0;
let attributeNameRegex = /^[a-z_][a-z_-]*$/;

function wouldContainItself(node, parentNode) {

    if (node === parentNode)
        return true;

    return node.childNodes.some(child => {
        return wouldContainItself(child, parentNode);
    });

}

export class Node {

    constructor() {

        this.id = currentNodeId++;
        this.classList = new Set();

        this.nodeName = this.constructor.name;

        this.rootNode = this;
        this.parentNode = null;

        this.previousSibling = null;
        this.nextSibling = null;

        this.childNodes = [];

    }

    get firstChild() {

        if (isEmpty(this.childNodes))
            return null;

        return first(this.childNodes);

    }

    get lastChild() {

        if (isEmpty(this.childNodes))
            return null;

        return last(this.childNodes);

    }

    appendTo(node) {

        if (!(node instanceof Node))
            throw new Error(`Failed to execute 'appendTo': Parameter 1 is not of type 'Node'.`);

        if (!Reflect.getOwnPropertyDescriptor(this, `parentNode`).writable)
            throw new Error(`Failed to execute 'appendTo': The new child element doesn't allow being appended to another node.`);

        if (wouldContainItself(this, node))
            throw new Error(`Failed to execute 'appendTo': The new child element contains the parent.`);

        node.appendChild(this);

    }

    appendChild(node) {

        if (!(node instanceof Node))
            throw new Error(`Failed to execute 'appendChild': Parameter 1 is not of type 'Node'.`);

        if (!Reflect.getOwnPropertyDescriptor(node, `parentNode`).writable)
            throw new Error(`Failed to execute 'appendChild': The new child element doesn't allow being appended to another node.`);

        if (wouldContainItself(node, this))
            throw new Error(`Failed to execute 'appendChild': The new child element contains the parent.`);

        this.insertBefore(node, null);

    }

    insertBefore(node, referenceNode) {

        if (!(node instanceof Node))
            throw new Error(`Failed to execute 'insertBefore': Parameter 1 is not of type 'Node'.`);

        if (!(referenceNode instanceof Node) && referenceNode !== null)
            throw new Error(`Failed to execute 'insertBefore': Parameter 2 is not of type 'Node'.`);

        if (!Reflect.getOwnPropertyDescriptor(node, `parentNode`).writable)
            throw new Error(`Failed to execute 'insertBefore': The new child element doesn't allow being appended to another node.`);

        if (wouldContainItself(node, this))
            throw new Error(`Failed to execute 'insertBefore': The new child element contains the parent.`);

        if (referenceNode && referenceNode.parentNode !== this)
            throw new Error(`Failed to execute 'insertBefore': The node before which the new node is to be inserted is not a child of this node.`);

        let index = referenceNode ? this.childNodes.indexOf(referenceNode) : this.childNodes.length;

        if (node.parentNode)
            node.remove();

        node.parentNode = this;

        node.previousSibling = referenceNode ? referenceNode.previousSibling : this.lastChild;
        node.nextSibling = referenceNode;

        if (node.nextSibling)
            node.nextSibling.previousSibling = node;

        if (node.previousSibling)
            node.previousSibling.nextSibling = node;

        this.childNodes.splice(index, 0, node);

        node.traverse(traversedNode => {
            traversedNode.rootNode = this.rootNode;
        });

    }

    removeChild(node) {

        if (!(node instanceof Node))
            throw new Error(`Failed to execute 'removeChild': Parameter 1 is not of type 'Node'.`);

        if (node.parentNode !== this)
            throw new Error(`Failed to execute 'removeChild': The node to be removed is not a child of this node.`);

        node.parentNode = null;

        if (node.previousSibling)
            node.previousSibling.nextSibling = node.nextSibling;

        if (node.nextSibling)
            node.nextSibling.previousSibling = node.previousSibling;

        node.previousSibling = null;
        node.nextSibling = null;

        let index = this.childNodes.indexOf(node);
        this.childNodes.splice(index, 1);

        node.traverse(traversedNode => {
            traversedNode.rootNode = node;
        });

    }

    remove() {

        if (!this.parentNode)
            return;

        this.parentNode.removeChild(this);

    }

    setPropertyAccessor(name, { validate = () => true, get = null, set = null }) {

        Reflect.defineProperty(this, name, {

            get() {

                return get();

            },

            set(newValue) {

                if (!validate(newValue))
                    throw new Error(`Failed to set "${name}": The value to be set does not pass the property's validation routine.`);

                return set(newValue);

            }

        });

    }

    setPropertyTrigger(name, initial, { validate = () => true, trigger = () => {} }) {

        let value;

        Reflect.defineProperty(this, name, {

            get() {

                return value;

            },

            set(newValue) {

                if (newValue === value)
                    return;

                if (!validate(newValue))
                    throw new Error(`Failed to set "${name}": The value to be set does not pass the property's validation routine.`);

                value = newValue;
                trigger(newValue);

            }

        });

        this[name] = initial;

    }

    traverse(fn) {

        let queue = [ this ];

        while (!isEmpty(queue)) {

            let node = queue.pop();

            fn(node);

            for (let child of node.childNodes) {
                queue.push(child);
            }

        }

    }

    inspect() {

        return `<${this.nodeName}#${this.id}${Array.from(this.classList).map(className => `.${className}`).join(``)}>`;

    }

}
