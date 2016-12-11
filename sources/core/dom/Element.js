import { flatten, groupBy, isEmpty, isNull } from 'lodash';

import { AbsoluteLayout }                    from '../layout/AbsoluteLayout';
import { RootLayout }                        from '../layout/RootLayout';
import { ClippingContext }                   from '../layout/tools/ClippingContext';
import { LayoutContext }                     from '../layout/tools/LayoutContext';

import { EventSource }                       from '../misc/EventSource';
import { Event }                             from '../misc/Event';
import { Point }                             from '../misc/Point';
import { Rect }                              from '../misc/Rect';

import { StyleDeclaration }                  from '../style/StyleDeclaration';
import { StyleSet }                          from '../style/StyleSet';
import { initialStyleSet }                   from '../style/initialStyleSet';
import { StyleLength }                       from '../style/types/StyleLength';
import { StyleOverflow }                     from '../style/types/StyleOverflow';

import { Node }                              from './Node';
import { flags }                             from './flags';

export class Element extends Node {

    constructor({ style } = {}) {

        super();

        EventSource.setup(this, { getParentInstance: () => this.parentNode });

        this.flags = flags.ELEMENT_HAS_DIRTY_NODE_LIST | flags.ELEMENT_HAS_DIRTY_LAYOUT;

        this.styleDeclaration = new StyleDeclaration(this);
        this.styleDeclaration.add(`initial`, initialStyleSet);
        this.styleDeclaration.add(`element`, new StyleSet());
        this.styleDeclaration.add(`local`, new StyleSet());
        this.styleDeclaration.add(`focused`, new StyleSet(), false);
        this.style = Object.assign(this.styleDeclaration.makeProxy(), style);

        this.caret = null;

        this.dirtyRects = [];
        this.pendingEvents = [];

        this.nodeList = [];
        this.focusList = [];
        this.renderList = [];

        this.activeElement = null;

        this.elementRect = new Rect(); // Position & size of the whole element inside its parent
        this.contentRect = new Rect(); // Position & size of the content box inside the element
        this.scrollRect = new Rect(); // Position & size of the element children box | note: both `x` and `y` are "wrong", in that they are not the actual box offset (which would always be 0;0), but rather the scroll offset (ie = scrollLeft / scrollTop)

        this.elementWorldRect = new Rect(); // Position & size of the element inside the viewport
        this.contentWorldRect = new Rect(); // Position & size of the element content inside the viewport

        this.elementClipRect = new Rect(); // Position & size of the actual visible box inside the element
        this.contentClipRect = new Rect(); // Position & size of the actual visible box inside the element

        this.declareEvent(`dirty`);
        this.declareEvent(`relayout`);

        this.declareEvent(`focus`);
        this.declareEvent(`blur`);

        this.declareEvent(`scroll`);
        this.declareEvent(`caret`);

    }

    get scrollLeft() {

        this.triggerUpdates();

        return this.scrollRect.x;

    }

    set scrollLeft(scrollLeft) {

        this.triggerUpdates();

        let previousScrollLeft = this.scrollRect.x;
        let newScrollLeft = Math.min(scrollLeft, this.scrollRect.width - this.contentRect.width);

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

        this.triggerUpdates();

        let previousScrollTop = this.scrollRect.y;
        let newScrollTop = Math.min(scrollTop, this.scrollRect.height - this.contentRect.height);

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

    focus() {

        if (this.rootNode.activeElement === this)
            return;

        if (!this.style.$.focusEvents)
            return;

        if (this.rootNode.activeElement)
            this.rootNode.activeElement.blur();

        this.rootNode.activeElement = this;
        this.styleDeclaration.enable(`focused`);

        this.scrollIntoView();

        this.dispatchEvent(new Event(`focus`));

    }

    blur() {

        if (this.rootNode.activeElement !== this)
            return;

        this.rootNode.activeElement = null;
        this.styleDeclaration.disable(`focused`);

        this.dispatchEvent(new Event(`blur`));

    }

    focusRelativeElement(offset) {

        if (this.rootNode !== this)
            return this.focusRelativeElement(offset);

        if (!(offset < 0 || offset > 0))
            return;

        this.triggerUpdates();

        if (!this.focusList.length)
            return;

        let getNextIndex = offset > 0 ? currentIndex => {
            return currentIndex === this.focusList.length - 1 ? 0 : currentIndex + 1;
        } : currentIndex => {
            return currentIndex === 0 ? this.focusList.length - 1 : currentIndex - 1;
        };

        if (!this.activeElement) {

            if (offset > 0) {
                this.focusList[0].focus();
            } else {
                this.focusList[this.focusList.length - 1].focus();
            }

        } else {

            let activeIndex = this.focusList.indexOf(this.activeElement);

            for (let t = 0, T = Math.abs(offset); t < T; ++t) {

                let nextIndex = getNextIndex(activeIndex);

                while (nextIndex !== activeIndex && !this.focusList[nextIndex].style.$.focusEvents)
                    nextIndex = getNextIndex(nextIndex);

                if (nextIndex !== activeIndex) {
                    activeIndex = nextIndex;
                } else {
                    break;
                }

            }

            this.focusList[activeIndex].focus();

        }

    }

    focusPreviousElement() {

        this.focusRelativeElement(-1);

    }

    focusNextElement() {

        this.focusRelativeElement(+1);

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

    scrollIntoView({ block = `auto`, force = false } = {}) {

        this.triggerUpdates();

        if (!this.parentNode)
            return;

        this.parentNode.scrollIntoView({ block, force });

        if (!force && this.elementRect.y >= this.parentNode.scrollTop && this.elementRect.y + this.elementRect.height - 1 < this.parentNode.scrollTop + this.parentNode.offsetHeight)
            return;

        if (block === `auto`)
            block = this.elementRect.y - this.parentNode.scrollTop < this.parentNode.scrollTop + this.parentNode.offsetHeight - this.elementRect.y - this.elementRect.height + 1 ? `top` : `bottom`;

        switch (block) {

            case `top`: {
                this.parentNode.scrollTop = this.elementRect.y;
            } break;

            case `bottom`: {
                this.parentNode.scrollTop = this.elementRect.y + this.elementRect.height - this.parentNode.offsetHeight;
            } break;

        }

    }

    scrollCellIntoView(position, { align = `auto`, alignX = align, alignY = align, force = false, forceX = force, forceY = force } = {}) {

        this.triggerUpdates();

        if (forceX || position.x < this.scrollLeft || position.x >= this.scrollLeft + this.contentRect.width) {

            if (alignX === `auto`)
                alignX = position.x - this.scrollLeft < this.scrollLeft + this.contentRect.width - position.x ? `start` : `end`;

            switch (alignX) {

                case `start`: {
                    this.scrollLeft = position.x;
                } break;

                case `end`: {
                    this.scrollLeft = position.x - this.contentRect.width + 1;
                } break;

            }

        }

        if (forceY || position.y < this.scrollTop || position.y >= this.scrollTop + this.contentRect.height) {

            if (alignY === `auto`)
                alignY = position.y - this.scrollTop < this.scrollTop + this.contentRect.height - position.y ? `start` : `end`;

            switch (alignY) {

                case `start`: {
                    this.scrollTop = position.y;
                } break;

                case `end`: {
                    this.scrollTop = position.y - this.contentRect.height + 1;
                } break;

            }

        }

    }

    scrollColumnIntoView(column, { align = `auto`, force = false } = {}) {

        this.scrollCellIntoView(new Point(column, this.scrollTop), { alignX: align, forceX: force });

    }

    scrollRowIntoView(row, { align = `auto`, force = false } = {}) {

        this.scrollCellIntoView(new Point(this.scrollLeft, row), { alignY: align, forceY: force });

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

    setDirtyFocusListFlag() {

        let wasDirty = this.flags & flags.ELEMENT_IS_DIRTY;
        this.flags |= flags.ELEMENT_HAS_DIRTY_FOCUS_LIST;

        if (!wasDirty) {
            this.dispatchEvent(new Event(`dirty`));
        }

    }

    clearDirtyFocusListFlag() {

        this.flags &= ~flags.ELEMENT_HAS_DIRTY_FOCUS_LIST;

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

        if (!dirtyRect)
            return;

        if (this.rootNode !== this) {
            this.rootNode.queueDirtyRect(dirtyRect, checkIntersectionFrom);
            return;
        }

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

    triggerUpdates({ maxDepth = 5 } = {}) {

        if (this.rootNode !== this)
            return this.rootNode.triggerUpdates();

        let needFullRerender = this.flags & (
            flags.ELEMENT_HAS_DIRTY_NODE_LIST |
            flags.ELEMENT_HAS_DIRTY_RENDER_LIST
        );

        if (this.flags & flags.ELEMENT_HAS_DIRTY_NODE_LIST) {
            this.nodeList = this.generateNodeList();
            this.clearDirtyNodeListFlag();
            this.setDirtyFocusListFlag()
            this.setDirtyRenderListFlag();
        }

        if (this.flags & flags.ELEMENT_HAS_DIRTY_FOCUS_LIST) {
            this.focusList = this.generateFocusList();
            this.clearDirtyFocusListFlag();
        }

        if (this.flags & flags.ELEMENT_HAS_DIRTY_RENDER_LIST) {
            this.renderList = this.generateRenderList();
            this.clearDirtyRenderListFlag();
        }

        let dirtyLayoutNodes = this.findDirtyLayoutNodes();

        this.cascadeLayout();
        this.cascadeClipping();
        this.cascadeRendering();

        if (needFullRerender && this.elementClipRect)
            this.rootNode.queueDirtyRect(this.elementClipRect);

        if (this.flags & flags.ELEMENT_IS_DIRTY)
            throw new Error(`Aborted 'triggerUpdates' execution: Flags have not been correctly reset at some point (${(this.flags & flags.ELEMENT_IS_DIRTY).toString(2)}).`);

        for (let dirtyLayoutNode of dirtyLayoutNodes)
            dirtyLayoutNode.dispatchEvent(new Event(`relayout`));

        if (this.flags & flags.ELEMENT_IS_DIRTY) {
            if (maxDepth < 1) {
                throw new Error(`Aborted 'triggerUpdates' execution: Too much recursion.`);
            } else {
                this.triggerUpdates({ maxDepth: maxDepth - 1 });
            }
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

    generateFocusList() {

        let focusList = [];

        for (let node of this.nodeList)
            if (node.style.$.focusEvents)
                focusList.push(node);

        return focusList;

    }

    generateRenderList() {

        let renderList = [];
        let stackingContexts = [ this ];

        while (stackingContexts.length > 0) {

            let stackingContext = stackingContexts.shift();
            renderList.push(stackingContext);

            let childNodes = stackingContext.childNodes.slice();
            let subContexts = [];

            while (childNodes.length > 0) {

                let child = childNodes.shift();

                if (!isNull(child.style.$.zIndex)) {
                    subContexts.push(child);
                } else {
                    renderList.push(child);
                    childNodes.splice(0, 0, ... child.childNodes);
                }

            }

            stackingContexts.splice(0, 0, ... subContexts.sort((a, b) => {
                return a.style.$.zIndex - b.style.$.zIndex;
            }));

        }

        return renderList.reverse();

    }

    cascadeLayout({ context = new LayoutContext() } = {}) {

        if (this.flags & flags.ELEMENT_HAS_DIRTY_LAYOUT) {

            this.setDirtyClippingFlag();
            this.forceLayout({ context });

        } else if (this.flags & flags.ELEMENT_HAS_DIRTY_LAYOUT_CHILDREN && (this.style.$.display.layout.isBlockWidthFixed(this, context) || this.style.$.display.layout.isBlockHeightFixed(this, context))) {

            this.setDirtyClippingFlag();
            this.forceLayout({ context });

        } else if (this.flags & flags.ELEMENT_HAS_DIRTY_LAYOUT_CHILDREN) {

            let subContext = context.pushNode(this);

            for (let child of this.childNodes)
                child.cascadeLayout({ context: subContext });

            this.clearDirtyLayoutChildrenFlag();

        }

    }

    cascadeClipping({ context = new ClippingContext() } = {}) {

        if (this.flags & flags.ELEMENT_HAS_DIRTY_CLIPPING) {

            this.setDirtyRenderingFlag();
            this.forceClipping({ context });

        } else if (this.flags & flags.ELEMENT_HAS_DIRTY_CLIPPING_CHILDREN) {

            let subContext = context.pushNode(this);

            for (let child of this.childNodes)
                child.cascadeClipping({ context: subContext });

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

        let isBlockWidthFixed = nodeLayout.isBlockWidthFixed(this);
        let isBlockHeightFixed = nodeLayout.isBlockHeightFixed(this);

        // -- Setup the procedures that will actually compute the X and Y axes

        let computeBlockWidth = () => {

            nodeLayout.computeNodeWidth(this, context);
            parentLayout.computeChildPositionX(this, context);

            this.finalizeHorizontalLayout();

            subContext = subContext.pushNodeWidth(this);

        };

        let computeBlockHeight = () => {

            nodeLayout.computeNodeHeight(this, context);
            parentLayout.computeChildPositionY(this, context);

            this.finalizeVerticalLayout();

            subContext = subContext.pushNodeHeight(this);

        };

        // -- First we can trigger the "will update layout" hook

        this.prepareForLayout();

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

    forceClipping({ context = new ClippingContext() } = {}) {

        // -- We queue the current clip rect so that if it moves or shrinks, we will still redraw the area beneath it

        if (this.elementClipRect)
            this.rootNode.queueDirtyRect(this.elementClipRect);

        // -- We first need to update our scroll rect

        this.scrollRect.width = Math.max(this.contentRect.width, this.getInternalContentWidth(), ... this.childNodes.map(child => {
            return child.elementRect.x + child.elementRect.width;
        }));

        this.scrollRect.height = Math.max(this.contentRect.height, this.getInternalContentHeight(), ... this.childNodes.map(child => {
            return child.elementRect.y + child.elementRect.height;
        }));

        // -- Don't forget to change the current scroll position if needed, so it doesn't suddenly become invalid

        this.scrollRect.x = Math.min(this.scrollRect.x, this.scrollRect.width - this.contentRect.width);
        this.scrollRect.y = Math.min(this.scrollRect.y, this.scrollRect.height - this.contentRect.height);

        // -- We can now compute the world rects ...

        if (!this.parentNode) {

            this.elementWorldRect.x = 0;
            this.elementWorldRect.y = 0;

            this.elementWorldRect.width = this.elementRect.width;
            this.elementWorldRect.height = this.elementRect.height;

        } else {

            this.elementWorldRect.x = this.parentNode.elementWorldRect.x + this.elementRect.x - this.parentNode.scrollRect.x;
            this.elementWorldRect.y = this.parentNode.elementWorldRect.y + this.elementRect.y - this.parentNode.scrollRect.y;

            this.elementWorldRect.width = this.elementRect.width;
            this.elementWorldRect.height = this.elementRect.height;

        }

        this.contentWorldRect.x = this.elementWorldRect.x + this.contentRect.x;
        this.contentWorldRect.y = this.elementWorldRect.y + this.contentRect.y;

        this.contentWorldRect.width = this.contentRect.width;
        this.contentWorldRect.height = this.contentRect.height;

        // -- ... and derive the clip rects from them

        this.elementClipRect = context.getElementClipRect(this);
        this.contentClipRect = context.getContentClipRect(this);

        // -- Now that the clip rect has been updated, we can now request to render it

        if (this.elementClipRect)
            this.rootNode.queueDirtyRect(this.elementClipRect);

        // -- Iterate over our childrens to update their own clip rects

        let subContext = context.pushNode(this);

        for (let child of this.childNodes)
            child.forceClipping({ context: subContext });

        // -- Clear the clipping flags so that we don't perform those tasks again

        this.clearDirtyClippingFlag();
        this.clearDirtyClippingChildrenFlag();

    }

    forceRendering() {

        if (this.elementClipRect)
            this.rootNode.queueDirtyRect(this.elementClipRect);

        for (let child of this.childNodes)
            child.forceRendering();

        this.clearDirtyRenderingFlag();
        this.clearDirtyRenderingChildrenFlag();

    }

    findDirtyLayoutNodes() {

        let dirtyNodes = [];
        let pendingQueue = [ this ];

        while (pendingQueue.length > 0) {

            let node = pendingQueue.shift();

            if (node.flags & (flags.ELEMENT_HAS_DIRTY_LAYOUT | flags.ELEMENT_HAS_DIRTY_LAYOUT_CHILDREN))
                pendingQueue = pendingQueue.concat(node.childNodes);

            if (node.flags & (flags.ELEMENT_HAS_DIRTY_LAYOUT)) {
                node.traverse(traversedNode => dirtyNodes.push(traversedNode));
            }

        }

        return dirtyNodes;

    }

    prepareForLayout() {

        // This method is called right before the layout process actually start on the context element. You can use it to setup internal values that will be used to compute the preferred width and/or height in the following hooks.
        // You obviously cannot use any rect properties yet, because they haven't yet been updated. Any access will yield out-of-date values.

    }

    getPreferredContentWidth() {

        // This method is used to ask the element for its preferred content width. It will only be called if this value is required by the layout algorithm (so for example on a "position: absolute; left: 0; right: auto" element).
        // You still cannot use any rect here, because they may or may not have been computed yet. Any access will result in an undefined behaviour.

        // For example, a text editor widget would use this hook to return the number of columns in the editor should the text not wrap.

        return 0;

    }

    getPreferredContentHeight() {

        // This method is used to ask the element for its preferred content width. It will only be called if this value is required by the layout algorithm (which is the case for most elements without explicit height).
        // You can access this element's rects' "width" properties, since they are guaranteed to have already been computed when this function is called.

        // For example, a text editor widget would use this hook to return the number of rows in the editor given the maximal line size being set to "contentRect.width", soft wraps included.

        return 0;

    }

    finalizeHorizontalLayout() {

        // This method is called once we've found out every horizontal-axis-properties from this element's rects. You can freely use the "x" and "width" properties of both elementRect and contentRect.
        // Note that you CANNOT use the element's "y" and "height" properties from any rect! The vertical axis might be computed before the horizontal one in some cases, such as if the height uses a fixed size but the width doesn't.

        // For example, a text editor would use this hook to wrap its content according to the "contentBox.width" property. Note that it cannot do this before (such as during "getPreferredContentWidth"), because 1/ getPreferredContentWidth shouldn't have any observable side effect, and 2/ the final size might not be equal to the preferred size (for example if min-width / max-width are set).

    }

    finalizeVerticalLayout() {

        // This method is called once we've found out every vertical-axis-properties from this element's rects. You can freely use the "y" and "height" properties of both elementRect and contentRect.
        // Note that you CANNOT use the element's "y" and "height" properties from any rect! The horizontal axis might be computed before the vertical one in some cases, such as if the width uses a fixed size but the height doesn't.

        // A text editor wouldn't have anything special to do there, the hook mainly exists for consistency with the other ones.

    }

    getInternalContentWidth() {

        // This method will be called once the layout has been fully computed, and should return the internal width of the element, which will then be used to compute the scroll box.

        // For example, a text editor would probably want to return the number of columns after which the text would wrap.

        return 0;

    }

    getInternalContentHeight() {

        // This method will be called once the layout has been fully computed, and should return the internal height of the element, which will be used to compute the scroll box.

        // For example, a text editor would probably want to return the total amount of lines in the text buffer, soft wraps included.

        return 0;

    }

}
