import { flatten, groupBy, isEmpty, isNull } from 'lodash';
import Yoga                                  from 'yoga-layout';

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

        this.yogaNode = Yoga.Node.create();

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

    }

    insertBefore(node, referenceNode) {

        if (!(node instanceof Element))
            throw new Error(`Failed to execute 'insertBefore': Parameter 1 is not of type 'Element'.`);

        super.insertBefore(node, referenceNode);

        this.yogaNode.insertChild(node.yogaNode, this.childNodes.indexOf(node));

        this.setDirtyLayoutFlag();
        this.setDirtyClippingFlag();

        this.rootNode.setDirtyNodeListFlag();
        this.rootNode.setDirtyRenderListFlag();

        node.clearDirtyNodeListFlag();
        node.clearDirtyRenderListFlag();

    }

    removeChild(node) {

        if (!(node instanceof Element))
            throw new Error(`Failed to execute 'removeChild': Parameter 1 is not of type 'Element'.`);

        super.removeChild(node);

        this.yogaNode.removeChild(node.yogaNode);

        this.setDirtyLayoutFlag();
        this.setDirtyClippingFlag();

        this.rootNode.setDirtyNodeListFlag();
        this.rootNode.setDirtyRenderListFlag();

        node.setDirtyLayoutFlag();
        node.setDirtyClippingFlag();

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

    setDirtyLayoutFlag({ silent = false } = {}) {

        let wasDirty = this.flags & flags.ELEMENT_IS_DIRTY;
        this.flags |= flags.ELEMENT_HAS_DIRTY_LAYOUT;

        if (this.parentNode) // TODO: We're not yet smart enough to avoid triggering a relayout on the whole tree :(
            this.parentNode.setDirtyLayoutFlag({ silent });

        if (!wasDirty && !silent) {
            this.dispatchEvent(new Event(`dirty`));
        }

    }

    clearDirtyLayoutFlag() {

        this.flags &= ~flags.ELEMENT_HAS_DIRTY_LAYOUT;

    }

    setDirtyClippingFlag({ silent = false } = {}) {

        let wasDirty = this.flags & flags.ELEMENT_IS_DIRTY;
        this.flags |= flags.ELEMENT_HAS_DIRTY_CLIPPING;

        if (this.parentNode)
            this.parentNode.setDirtyChildrenFlag(flags.ELEMENT_HAS_DIRTY_CLIPPING_CHILDREN, { silent });

        if (!wasDirty && !silent) {
            this.dispatchEvent(new Event(`dirty`));
        }

    }

    clearDirtyClippingFlag() {

        this.flags &= ~flags.ELEMENT_HAS_DIRTY_CLIPPING;

    }

    setDirtyChildrenFlag(flag, { silent = false } = {}) {

        if (this.flags & flag)
            return;

        let wasDirty = this.flags & flags.ELEMENT_IS_DIRTY;
        this.flags |= flag;

        if (this.parentNode)
            this.parentNode.setDirtyChildrenFlag(flag);

        if (!wasDirty && !silent) {
            this.dispatchEvent(new Event(`dirty`));
        }

    }

    clearDirtyLayoutChildrenFlag() {

        this.flags &= ~flags.ELEMENT_HAS_DIRTY_LAYOUT_CHILDREN;

    }

    clearDirtyClippingChildrenFlag() {

        this.flags &= ~flags.ELEMENT_HAS_DIRTY_CLIPPING_CHILDREN;

    }

    queueDirtyRect(dirtyRect = this.elementClipRect, checkIntersectionFrom = 0) {

        if (!dirtyRect)
            return;

        if (this.rootNode !== this)
            return this.rootNode.queueDirtyRect(dirtyRect.intersect(this.elementClipRect), checkIntersectionFrom);

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

        if (!dirtyRects)
            return;

        if (this.rootNode !== this)
            return this.rootNode.queueDirtyRects(dirtyRects, checkIntersectionFrom);

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

        let dirtyLayoutNodes = [];
        let dirtyScrollNodes = [];

        this.yogaNode.calculateLayout();

        this.cascadeLayout({ dirtyLayoutNodes });
        this.cascadeClipping({ dirtyScrollNodes });

        if (needFullRerender && this.elementClipRect)
            this.rootNode.queueDirtyRect(this.elementClipRect);

        if (this.flags & flags.ELEMENT_IS_DIRTY)
            throw new Error(`Aborted 'triggerUpdates' execution: Flags have not been correctly reset at some point (${(this.flags & flags.ELEMENT_IS_DIRTY).toString(2)}).`);

        for (let dirtyLayoutNode of dirtyLayoutNodes)
            dirtyLayoutNode.dispatchEvent(new Event(`relayout`));

        for (let dirtyScrollNode of dirtyScrollNodes)
            dirtyScrollNode.dispatchEvent(new Event(`scroll`));

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
                } else if (child.style.$.position.isAbsolutelyPositioned) {
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

        renderList.reverse();

        return renderList;

    }

    cascadeLayout({ dirtyLayoutNodes, force = false } = {}) {

        if (force || this.flags & (flags.ELEMENT_HAS_DIRTY_LAYOUT | flags.ELEMENT_HAS_DIRTY_LAYOUT_CHILDREN)) {

            if (force || this.flags & flags.ELEMENT_HAS_DIRTY_LAYOUT) {

                let nextElementRect = new Rect();

                nextElementRect.x = this.yogaNode.getComputedLeft();
                nextElementRect.y = this.yogaNode.getComputedTop();

                nextElementRect.width = this.yogaNode.getComputedWidth();
                nextElementRect.height = this.yogaNode.getComputedHeight();

                let nextContentRect = new Rect();

                nextContentRect.x = this.yogaNode.getComputedBorder(Yoga.EDGE_LEFT) + this.yogaNode.getComputedPadding(Yoga.EDGE_LEFT);
                nextContentRect.y = this.yogaNode.getComputedBorder(Yoga.EDGE_TOP) + this.yogaNode.getComputedPadding(Yoga.EDGE_TOP);

                nextContentRect.width = nextElementRect.width - nextContentRect.x - this.yogaNode.getComputedBorder(Yoga.EDGE_RIGHT) - this.yogaNode.getComputedPadding(Yoga.EDGE_RIGHT);
                nextContentRect.height = nextElementRect.height - nextContentRect.y - this.yogaNode.getComputedBorder(Yoga.EDGE_BOTTOM) - this.yogaNode.getComputedPadding(Yoga.EDGE_BOTTOM);

                let doesChange = !nextElementRect.equals(this.elementRect) || !nextContentRect.equals(this.contentRect);

                this.elementRect = nextElementRect;
                this.contentRect = nextContentRect;

                if (doesChange || this.flags & flags.ELEMENT_HAS_DIRTY_LAYOUT)
                    for (let child of this.childNodes)
                        child.cascadeLayout({ dirtyLayoutNodes, force: true });

                if (doesChange)
                    dirtyLayoutNodes.push(this);

                this.setDirtyClippingFlag({ silent: true });

            } else for (let child of this.childNodes) {

                child.cascadeLayout({ dirtyLayoutNodes, force: true });

            }

            this.scrollRect.width = Math.max(this.contentRect.width, this.getInternalContentWidth(), ... this.childNodes.map(child => {
                return child.elementRect.x + child.elementRect.width;
            }));

            this.scrollRect.height = Math.max(this.contentRect.height, this.getInternalContentHeight(), ... this.childNodes.map(child => {
                return child.elementRect.y + child.elementRect.height;
            }));

            this.clearDirtyLayoutFlag();
            this.clearDirtyLayoutChildrenFlag();

        }

    }

    cascadeClipping({ dirtyScrollNodes, force = false } = {}) {

        if (force || this.flags & (flags.ELEMENT_HAS_DIRTY_CLIPPING | flags.ELEMENT_HAS_DIRTY_CLIPPING_CHILDREN)) {

            if (force || this.flags & flags.ELEMENT_HAS_DIRTY_CLIPPING) {

                this.rootNode.queueDirtyRect(this.elementClipRect);

                let nextScrollX = Math.min(this.scrollRect.x, this.scrollRect.width - this.contentRect.width);
                let nextScrollY = Math.min(this.scrollRect.y, this.scrollRect.height - this.contentRect.height);

                if (nextScrollX !== this.scrollRect.x || nextScrollY !== this.scrollRect.y)
                    dirtyScrollNodes.push(this);

                this.scrollRect.x = nextScrollX;
                this.scrollRect.y = nextScrollY;

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

                if (this.parentNode) {

                    let relativeClipRect = this.style.$.position.isAbsolutelyPositioned ? this.parentNode.elementClipRect : this.parentNode.contentClipRect;

                    this.elementClipRect = relativeClipRect ? relativeClipRect.intersect(this.elementWorldRect) : null;
                    this.contentClipRect = relativeClipRect ? relativeClipRect.intersect(this.contentWorldRect) : null;

                } else {

                    this.elementClipRect = this.elementWorldRect;
                    this.contentClipRect = this.contentWorldRect;

                }

                this.rootNode.queueDirtyRect(this.elementClipRect);

            }

            for (let child of this.childNodes)
                child.cascadeClipping({ dirtyScrollNodes, force: force || this.flags & flags.ELEMENT_HAS_DIRTY_CLIPPING });

            this.clearDirtyClippingFlag();
            this.clearDirtyClippingChildrenFlag();

        }

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

    getInternalContentWidth() {

        return 0;

    }

    getInternalContentHeight() {

        return 0;

    }

}
