import { flatten, isEmpty, isNull } from 'lodash';

import { AbsoluteLayout }           from '../layout/AbsoluteLayout';
import { RootLayout }               from '../layout/RootLayout';
import { LayoutContext }            from '../layout/tools/LayoutContext';

import { EventSource }              from '../misc/EventSource';
import { Event }                    from '../misc/Event';
import { Rect }                     from '../misc/RectXY';

import { StyleDeclaration }         from '../style/StyleDeclaration';
import { StyleLength }              from '../style/types/StyleLength';
import { StyleOverflow }            from '../style/types/StyleOverflow';

import { Node }                     from './Node';
import { flags }                    from './flags';

export class Element extends Node {

    constructor({ style, ... props } = {}) {

        super(props);

        EventSource.setup(this, { dispatchToParent: event => this.parentNode && this.parentNode.dispatchEvent(event) });

        this.flags = flags.ELEMENT_HAS_DIRTY_CLIP | flags.ELEMENT_HAS_DIRTY_LAYOUT | flags.ELEMENT_HAS_DIRTY_NODE_LIST | flags.ELEMENT_HAS_DIRTY_RENDER_LIST;

        this.style = StyleDeclaration.makeNew(this);
        Object.assign(this.style, style);

        this.dirtyRects = [];
        this.pendingEvents = [];

        this.nodeList = [];
        this.renderList = [];

        this.elementRect = new Rect(); // Position & size of the whole element inside its parent
        this.contentRect = new Rect(); // Position & size of the content box inside the element
        this.scrollRect = new Rect(); // Position & size of the element children box | note: both `x` and `y` are "wrong", in that they are not the actual box offset (which would always be 0;0), but rather the scroll offset (ie = scrollLeft / scrollTop)

        this.clipRect = new Rect(); // Position & size of the actual visible box inside the element (ie. taking scrollLeft + scrollTop into account)
        this.worldRect = new Rect(); // Position & size of the element inside the viewport

        this.declareEvent(`dirty`);
        this.declareEvent(`scroll`);
        this.declareEvent(`resize`);

    }

    get scrollLeft() {

        this.triggerUpdates();

        return this.scrollRect.x;

    }

    set scrollLeft(scrollLeft) {

        let previousScrollLeft = this.scrollRect.x;
        let newScrollLeft = Math.min(scrollLeft, this.scrollRect.width - this.elementRect.width);

        if (previousScrollLeft !== newScrollLeft) {

            this.scrollRect.x = newScrollLeft;
            this.setDirtyClippingFlag();

            this.dispatchEvent(new Event(`scroll`));

        }

    }

    get scrollTop() {

        this.triggerUpdates();

        return this.scrollRect.y;

    }

    set scrollTop(scrollTop) {

        let previousScrollTop = this.scrollRect.y;
        let newScrollTop = Math.min(scrollTop, this.scrollRect.height - this.elementRect.height);

        if (previousScrollTop !== newScrollTop) {

            this.scrollRect.y = newScrollTop;
            this.setDirtyClippingFlag();

            this.dispatchEvent(new Event(`scroll`));

        }

    }

    get scrollWidth() {

        this.triggerUpdates();

        return this.scrollRect.width;

    }

    get scrollHeight() {

        this.triggerUpdates();

        return this.scrollRect.height;

    }

    get offsetWidth() {

        this.triggerUpdates();

        return this.elementRect.width;

    }

    get offsetHeight() {

        this.triggerUpdates();

        return this.elementRect.height;

    }

    appendChild(node) {

        if (!(node instanceof Element))
            throw new Error(`Failed to execute 'appendChild': Parameter 1 is not of type 'Element'.`);

        super.appendChild(node);

        this.setDirtyLayoutFlag();
        this.setDirtyClippingFlag();
        this.setDirtyRenderingFlag();

        this.rootNode.setDirtyNodeListFlag();
        this.rootNode.setDirtyRenderListFlag();

        node.clearDirtyNodeListFlag();
        node.clearDirtyRenderListFlag();

    }

    insertBefore(node, referenceNode) {

        if (!(node instanceof Element))
            throw new Error(`Failed to execute 'insertBefore': Parameter 1 is not of type 'Element'.`);

        super.insertBefore(node, referenceNode);

        this.setDirtyLayoutFlag();
        this.setDirtyClippingFlag();
        this.setDirtyRenderingFlag();

        this.rootNode.setDirtyNodeListFlag();
        this.rootNode.setDirtyRenderListFlag();

        node.clearDirtyNodeListFlag();
        node.clearDirtyRenderListFlag();

    }

    removeChild(node) {

        if (!(node instanceof Element))
            throw new Error(`Failed to execute 'removeChild': Parameter 1 is not of type 'Element'.`);

        super.removeChild(node);

        this.setDirtyLayoutFlag();
        this.setDirtyClippingFlag();
        this.setDirtyRenderingFlag();

        this.rootNode.setDirtyNodeListFlag();
        this.rootNode.setDirtyRenderListFlag();

        node.setDirtyLayoutFlag();
        node.setDirtyClippingFlag();
        node.setDirtyRenderingFlag();

        node.setDirtyNodeListFlag();
        node.setDirtyRenderListFlag();

    }

    setDirtyNodeListFlag() {

        let wasDirty = this.flags & flags.ELEMENT_IS_DIRTY;
        this.flags |= flags.ELEMENT_HAS_DIRTY_NODE_LIST;

        if (!wasDirty) {
            this.dispatchEvent(new Event(`dirty`));
        }

    }

    clearDirtyNodeListFlag() {

        this.flags &= ~flags.ELEMENT_HAS_DIRTY_NODE_LIST;

    }

    setDirtyRenderListFlag() {

        let wasDirty = this.flags & flags.ELEMENT_IS_DIRTY;
        this.flags |= flags.ELEMENT_HAS_DIRTY_RENDER_LIST;

        if (!wasDirty) {
            this.dispatchEvent(new Event(`dirty`));
        }

    }

    clearDirtyRenderListFlag() {

        this.flags &= ~flags.ELEMENT_HAS_DIRTY_RENDER_LIST;

    }

    setDirtyLayoutFlag() {

        let wasDirty = this.flags & flags.ELEMENT_IS_DIRTY;
        this.flags |= flags.ELEMENT_HAS_DIRTY_LAYOUT;

        if (this.parentNode)
            this.parentNode.setDirtyChildrenFlag(flags.ELEMENT_HAS_DIRTY_LAYOUT_CHILDREN);

        if (!wasDirty) {
            this.dispatchEvent(new Event(`dirty`));
        }

    }

    clearDirtyLayoutFlag() {

        this.flags &= ~flags.ELEMENT_HAS_DIRTY_LAYOUT;

    }

    setDirtyClippingFlag() {

        let wasDirty = this.flags & flags.ELEMENT_IS_DIRTY;
        this.flags |= flags.ELEMENT_HAS_DIRTY_CLIPPING;

        if (this.parentNode)
            this.parentNode.setDirtyChildrenFlag(flags.ELEMENT_HAS_DIRTY_CLIPPING_CHILDREN);

        if (!wasDirty) {
            this.dispatchEvent(new Event(`dirty`));
        }

    }

    clearDirtyClippingFlag() {

        this.flags &= ~flags.ELEMENT_HAS_DIRTY_CLIPPING;

    }

    setDirtyRenderingFlag() {

        let wasDirty = this.flags & flags.ELEMENT_IS_DIRTY;
        this.flags |= flags.ELEMENT_HAS_DIRTY_RENDERING;

        if (this.parentNode)
            this.parentNode.setDirtyChildrenFlag(flags.ELEMENT_HAS_DIRTY_RENDERING_CHILDREN);

        if (!wasDirty) {
            this.dispatchEvent(new Event(`dirty`));
        }

    }

    clearDirtyRenderingFlag() {

        this.flags &= ~flags.ELEMENT_HAS_DIRTY_RENDERING;

    }

    setDirtyChildrenFlag(flag) {

        if (this.flags & flag)
            return;

        let wasDirty = this.flags & flags.ELEMENT_IS_DIRTY;
        this.flags |= flag;

        if (this.parentNode)
            this.parentNode.setDirtyChildrenFlag(flag);

        if (!wasDirty) {
            this.dispatchEvent(new Event(`dirty`));
        }

    }

    clearDirtyLayoutChildrenFlag() {

        this.flags &= ~flags.ELEMENT_HAS_DIRTY_LAYOUT_CHILDREN;

    }

    clearDirtyClippingChildrenFlag() {

        this.flags &= ~flags.ELEMENT_HAS_DIRTY_CLIPPING_CHILDREN;

    }

    clearDirtyRenderingChildrenFlag() {

        this.flags &= ~flags.ELEMENT_HAS_DIRTY_RENDERING_CHILDREN;

    }

    queueDirtyRect(dirtyRect, checkIntersectionFrom = 0) {

        if (this.rootNode !== this)
            this.rootNode.queueDirtyRect(dirtyRect, checkIntersectionFrom);

        let intersectorIndex = this.dirtyRects.findIndex(other => {
            return dirtyRect.doesIntersect(other);
        });

        if (intersectorIndex !== -1) {
            this.queueDirtyRects(dirtyRect.exclude(this.dirtyRects[intersectorIndex]), intersectorIndex + 1);
        } else {
            this.dirtyRects.push(dirtyRect);
        }

    }

    queueDirtyRects(dirtyRects, checkIntersectionFrom = 0) {

        if (this.rootNode !== this)
            this.rootNode.queueDirtyRects(dirtyRects, checkIntersectionFrom);

        for (let dirtyRect of dirtyRects) {
            this.queueDirtyRect(dirtyRect, checkIntersectionFrom);
        }

    }

    flushDirtyRects() {

        if (this.rootNode !== this)
            throw new Error(`Failed to execute 'queueDirtyRect': This function can only be called from a root node.`);

        let dirtyRects = this.dirtyRects;
        this.dirtyRects = [];

        return dirtyRects;

    }

    triggerUpdates() {

        if (this.rootNode !== this)
            return this.rootNode.triggerUpdates();

        let needFullRerender = this.flags & (
            flags.ELEMENT_HAS_DIRTY_NODE_LIST |
            flags.ELEMENT_HAS_DIRTY_RENDER_LIST
        );

        if (this.flags & flags.ELEMENT_HAS_DIRTY_NODE_LIST) {
            this.nodeList = this.generateNodeList();
            this.clearDirtyNodeListFlag();
        }

        if (this.flags & flags.ELEMENT_HAS_DIRTY_RENDER_LIST) {
            this.renderList = this.generateRenderList();
            this.clearDirtyRenderListFlag();
        }

        this.cascadeLayout();
        this.cascadeClipping();
        this.cascadeRendering();

        if (needFullRerender && this.clipRect) {
            this.rootNode.queueDirtyRect(this.clipRect);
        }

    }

    generateNodeList() {

        let nodeList = [];
        let traverseList = [ this ];

        while (!isEmpty(traverseList)) {

            let element = traverseList.shift();
            nodeList.push(element);

            traverseList = element.childNodes.concat(traverseList);

        }

        return nodeList;

    }

    generateRenderList() {

        let makeTreeNode = () => ({ layers: new Map(), elements: [] });

        let renderList = [];

        let renderTree = makeTreeNode();
        let currentTreeNode = renderTree;

        let getLayer = zIndex => {

            if (!currentTreeNode.layers.has(zIndex))
                currentTreeNode.layers.set(zIndex, makeTreeNode());

            return currentTreeNode.layers.get(zIndex);

        };

        let layeringVisitor = element => {

            if (!element.style.$.display)
                return;

            let zIndex = element.style.$.zIndex;

            if (zIndex !== null) {

                let previousTreeNode = currentTreeNode;
                currentTreeNode = getLayer(zIndex);

                currentTreeNode.elements.unshift(element);
                element.childNodes.forEach(child => { layeringVisitor(child) });

                currentTreeNode = previousTreeNode;

            } else {

                currentTreeNode.elements.unshift(element);
                element.childNodes.forEach(child => { layeringVisitor(child) });

            }

        };

        layeringVisitor(this);

        let flatteningVisitor = treeNode => {

            for (let zIndex of Array.from(treeNode.layers.keys()).sort((a, b) => a - b))
                flatteningVisitor(treeNode.layers.get(zIndex));

            for (let element of treeNode.elements) {
                renderList.push(element);
            }

        };

        flatteningVisitor(renderTree);

        return renderList;

    }

    cascadeLayout({ context = new LayoutContext() } = {}) {

        if (this.flags & flags.ELEMENT_HAS_DIRTY_LAYOUT) {

            this.setDirtyClippingFlag();
            this.forceLayout({ context });

        } else if (this.flags & flags.ELEMENT_HAS_DIRTY_LAYOUT_CHILDREN) {

            let subContext = context.pushNode(this);

            for (let child of this.childNodes)
                child.cascadeLayout({ context: subContext });

            this.clearDirtyLayoutChildrenFlag();

        }

    }

    cascadeClipping() {

        if (this.flags & flags.ELEMENT_HAS_DIRTY_CLIPPING) {

            this.setDirtyRenderingFlag();
            this.forceClipping();

        } else if (this.flags & flags.ELEMENT_HAS_DIRTY_CLIPPING_CHILDREN) {

            for (let child of this.childNodes)
                child.cascadeClipping();

            this.clearDirtyClippingChildrenFlag();

        }

    }

    cascadeRendering() {

        if (this.flags & flags.ELEMENT_HAS_DIRTY_RENDERING) {

            this.forceRendering();

        } else if (this.flags & flags.ELEMENT_HAS_DIRTY_RENDERING_CHILDREN) {

            for (let child of this.childNodes)
                child.cascadeRendering();

            this.clearDirtyRenderingChildrenFlag();

        }

    }

    forceLayout({ context = new LayoutContext() } = {}) {

        let subContext = context;

        let parentLayout = this.parentNode ? this.parentNode.style.$.display.layout : null;
        let nodeLayout = this.style.$.display.layout;

        // -- If the element is absolutely positioned, we use a different layout instead of the parent one

        if (parentLayout && this.style.$.position.isAbsolutelyPositioned)
            parentLayout = AbsoluteLayout;

        // -- If there's no parent layout, we assign one by default (it will simply set the position to 0;0)

        if (!parentLayout)
            parentLayout = RootLayout;

        // -- Detect if the element has fixed width and/or height (ie does not depend on its children to compute these sizes)

        let isBlockWidthFixed = nodeLayout.isBlockWidthFixed(this, context);
        let isBlockHeightFixed = nodeLayout.isBlockHeightFixed(this, context);

        // -- Setup the procedures that will actually compute the X and Y axes

        let computeBlockWidth = () => {

            nodeLayout.computeNodeWidth(this, context);
            parentLayout.computeChildPositionX(this, context);

            subContext = subContext.pushNodeWidth(this);

        };

        let computeBlockHeight = () => {

            nodeLayout.computeNodeHeight(this, context);
            parentLayout.computeChildPositionY(this, context);

            subContext = subContext.pushNodeHeight(this);

        };

        // -- If the element has a fixed width and/or height, then we can compute them here and now

        if (isBlockWidthFixed)
            computeBlockWidth();

        if (isBlockHeightFixed)
            computeBlockHeight();

        // -- Whatever happened, we now need to compute the element content box position, since our children will use it to position themselves

        nodeLayout.computeNodeContentPosition(this, context);

        // -- We now iterate over each non-absolutely-positioned children (we will process the absolutely-positioned ones at a later time, continue reading)

        for (let child of this.childNodes)
            if (!child.style.$.position.isAbsolutelyPositioned)
                child.forceLayout({ context: subContext });

        // -- If the element has a width and/or height that depend on the element's children, then we can now compute them correctly

        if (!isBlockWidthFixed)
            computeBlockWidth();

        if (!isBlockHeightFixed)
            computeBlockHeight();

        // -- Now that our element size has been fully computed, we can process absolutely positioned element (otherwise, size calculation that would have required to know this element's size, such as a child with "left: 0; right: 0", would have returned wrong results)

        for (let child of this.childNodes)
            if (child.style.$.position.isAbsolutelyPositioned)
                child.forceLayout({ context: subContext });

        // -- Clear the layout flags so that we don't perform those tasks again

        this.clearDirtyLayoutFlag();
        this.clearDirtyLayoutChildrenFlag();

    }

    forceClipping() {

        // -- We queue the current clip rect so that if it moves or shrinks, we will still redraw the area beneath it

        if (this.clipRect)
            this.rootNode.queueDirtyRect(this.clipRect);

        // -- We first need to update our scroll rect

        this.scrollRect.width = Math.max(this.contentRect.width, ... this.childNodes.map(child => {
            return child.elementRect.x + child.elementRect.width;
        }));

        this.scrollRect.height = Math.max(this.contentRect.height, ... this.childNodes.map(child => {
            return child.elementRect.y + child.elementRect.height;
        }));

        // -- Don't forget to change the current scroll position if needed, so it doesn't suddenly become invalid

        this.scrollRect.x = Math.min(this.scrollRect.x, this.scrollRect.width - this.contentRect.width);
        this.scrollRect.y = Math.min(this.scrollRect.y, this.scrollRect.height - this.contentRect.height);

        // -- We can now compute the world and clip rects

        if (!this.parentNode) {

            this.worldRect.x = this.clipRect.x = 0;
            this.worldRect.y = this.clipRect.y = 0;

            this.worldRect.width = this.clipRect.width = this.elementRect.width;
            this.worldRect.height = this.clipRect.height = this.elementRect.height;

        } else {

            this.worldRect.x = this.parentNode.worldRect.x + this.elementRect.x;
            this.worldRect.y = this.parentNode.worldRect.y + this.elementRect.y - this.scrollRect.y;

            this.worldRect.width = this.elementRect.width;
            this.worldRect.height = this.elementRect.height;

            if (this.style.$.overflow !== StyleOverflow.visible) {
                this.clipRect = this.worldRect.clone();
            } else {
                this.clipRect = this.parentNode.clipRect ? this.worldRect.intersect(this.parentNode.clipRect) : null;
            }

        }

        // -- Now that the clip rect has been updated, we can now request to render it

        if (this.clipRect)
            this.rootNode.queueDirtyRect(this.clipRect);

        // -- Iterate over our childrens to update their own clip rects

        for (let child of this.childNodes)
            child.forceClipping();

        // -- Clear the clipping flags so that we don't perform those tasks again

        this.clearDirtyClippingFlag();
        this.clearDirtyClippingChildrenFlag();

    }

    forceRendering() {

        if (this.clipRect)
            this.rootNode.queueDirtyRect(this.clipRect);

        for (let child of this.childNodes)
            child.forceRendering();

        this.clearDirtyRenderingFlag();
        this.clearDirtyRenderingChildrenFlag();

    }

}
