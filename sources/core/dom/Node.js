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

    constructor(props = {}) {

        this.nodeName = this.constructor.name;
        this.nodeId = currentNodeId++;

        this.rootNode = this;
        this.parentNode = null;

        this.previousSibling = null;
        this.nextSibling = null;

        this.childNodes = [];

        this.props = props;

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

    getAttribute(name) {

        if (!isString(name))
            throw new Error(`Failed to execute 'getAttribute': Parameter 1 is not of type 'string'.`);

        if (!Object.prototype.hasOwnProperty.call(this.props, name))
            return null;

        return String(this.props[name]);

    }

    setAttribute(name, value) {

        if (!isString(name))
            throw new Error(`Failed to execute 'setAttribute': Parameter 1 is not of type 'string'.`);

        if (!attributeNameRegex.test(name))
            throw new Error(`Failed to execute 'setAttribute': '${name}' is not a valid attribute name.`);

        this.props[name] = String(value);

    }

    removeAttribute(name) {

        if (!Object.prototype.hasOwnProperty.call(this.props, name))
            return;

        delete this.props[name];

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

        return `<${this.nodeName}#${this.props.name ? this.props.name : this.nodeId}>`;

    }

}
