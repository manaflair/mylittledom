import { flatten, groupBy, isBoolean, isEmpty, isNull, pick } from 'lodash';
import Yoga                                                   from 'yoga-layout';

import { EventSource }                                        from '../misc/EventSource';
import { Event }                                              from '../misc/Event';
import { Point }                                              from '../misc/Point';
import { Rect }                                               from '../misc/Rect';

import { StyleManager }                                       from '../style/StyleManager';
import { globalRuleset }                                      from '../style/globalRuleset';
import { StyleLength }                                        from '../style/types/StyleLength';
import { StyleOverflow }                                      from '../style/types/StyleOverflow';

import { Node }                                               from './Node';
import { flags }                                              from './flags';

Yoga.setExperimentalFeatureEnabled(Yoga.EXPERIMENTAL_FEATURE_ROUNDING, true);

function getPreferredSize(node, ... args) {

    return node.getPreferredSize(... args);

}

export class Element extends Node {

    constructor({ classList = [], style = {}, decored = true } = {}) {

        super();

        EventSource.setup(this, { getParentInstance: () => this.parentNode });

        this.yogaNode = Yoga.Node.create();
        this.yogaNode.setMeasureFunc(getPreferredSize.bind(null, this));

        this.flags = flags.ELEMENT_HAS_DIRTY_NODE_LIST | flags.ELEMENT_HAS_DIRTY_LAYOUT;

        this.styleManager = new StyleManager(this);

        this.styleManager.setStateStatus(`firstChild`, true);
        this.styleManager.setStateStatus(`lastChild`, true);

        this.styleManager.addRuleset(globalRuleset, StyleManager.RULESET_NATIVE);
        this.styleManager.setRulesets(classList, StyleManager.RULESET_USER);

        this.style = this.styleManager.getStyle();
        this.classList = this.styleManager.getClassList();

        this.style.assign(style);

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

        this.declareEvent(`dirty`); // After the node rects have became dirty and a call to triggerUpdates needs to be done. Usually only caught by the renderer.
        this.declareEvent(`layout`); // When the node layout is being computed. Element box and content box have been recomputed, but the scroll box hasn't yet.

        this.declareEvent(`focus`); // After the element has got the focus.
        this.declareEvent(`blur`); // After the element has lost the focus.

        this.declareEvent(`scroll`); // After the element scroll position has changed.
        this.declareEvent(`caret`); // After the element caret position has changed.

        this.setPropertyTrigger(`decored`, decored, {

            validate: value => {

                return isBoolean(value);

            },

            trigger: value => {

                this.styleManager.setStateStatus(`decored`, value);

            }

        });

    }

    get scrollLeft() {

        this.triggerUpdates();

        return this.scrollRect.x;

    }

    set scrollLeft(scrollLeft) {

        this.triggerUpdates();

        let previousScrollLeft = this.scrollRect.x;
        let newScrollLeft = Math.max(0, Math.min(scrollLeft, this.scrollRect.width - this.contentRect.width));

        if (previousScrollLeft !== newScrollLeft) {

            this.scrollRect.x = newScrollLeft;

            this.setDirtyClippingFlag();
            this.queueDirtyRect();

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
        let newScrollTop = Math.max(0, Math.min(scrollTop, this.scrollRect.height - this.contentRect.height));

        if (previousScrollTop !== newScrollTop) {

            this.scrollRect.y = newScrollTop;

            this.setDirtyClippingFlag();
            this.queueDirtyRect();

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
        this.styleManager.setStateStatus(`focus`, true);

        this.scrollIntoView();

        this.dispatchEvent(new Event(`focus`));

    }

    blur() {

        if (this.rootNode.activeElement !== this)
            return;

        this.rootNode.activeElement = null;
        this.styleManager.setStateStatus(`focus`, false);

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

                while (nextIndex !== activeIndex && (!this.focusList[nextIndex].style.$.focusEvents || !this.activeElement.validateRelativeFocusTarget(this.focusList[nextIndex]) || !this.focusList[nextIndex].validateRelativeFocusTargetSelf(this.activeElement)))
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

    validateRelativeFocusTargetSelf(source) {

        return true;

    }

    validateRelativeFocusTarget(target) {

        return true;

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

    }

    linkBefore(node, referenceNode) {

        super.linkBefore(node, referenceNode);

        if (node.previousSibling) {
            node.previousSibling.styleManager.setStateStatus(`lastChild`, false);
            node.styleManager.setStateStatus(`firstChild`, false);
        }

        if (node.nextSibling) {
            node.nextSibling.styleManager.setStateStatus(`firstChild`, false);
            node.styleManager.setStateStatus(`lastChild`, false);
        }

        this.yogaNode.unsetMeasureFunc();
        this.yogaNode.insertChild(node.yogaNode, this.childNodes.indexOf(node));

        this.setDirtyLayoutFlag();
        this.setDirtyClippingFlag();

        this.rootNode.setDirtyNodeListFlag();
        this.rootNode.setDirtyRenderListFlag();

        node.clearDirtyNodeListFlag();
        node.clearDirtyRenderListFlag();

        node.styleManager.refresh(node.styleManager.inherited);

    }

    removeChild(node) {

        if (!(node instanceof Element))
            throw new Error(`Failed to execute 'removeChild': Parameter 1 is not of type 'Element'.`);

        let previousSibling = node.previousSibling;
        let nextSibling = node.nextSibling;

        super.removeChild(node);

        if (previousSibling)
            previousSibling.setStateStatus(`lastChild`, !nextSibling ? true : false);

        if (nextSibling)
            nextSibling.setStateStatus(`firstChild`, !previousSibling ? true : false);

        node.styleManager.setStateStatus(`firstChild`, true);
        node.styleManager.setStateStatus(`lastChild`, true);

        this.yogaNode.removeChild(node.yogaNode);

        if (this.childNodes.length === 0)
            this.yogaNode.setMeasureFunc(getPreferredSize.bind(null, this));

        this.setDirtyLayoutFlag();
        this.setDirtyClippingFlag();

        this.rootNode.setDirtyNodeListFlag();
        this.rootNode.setDirtyRenderListFlag();

        node.setDirtyLayoutFlag();
        node.setDirtyClippingFlag();

        node.setDirtyNodeListFlag();
        node.setDirtyRenderListFlag();

        node.styleManager.refresh(node.styleManager.inherited);

    }

    scrollIntoView({ align = `auto`, alignX = align, alignY = align, force = false, forceX = force, forceY = force } = {}) {

        this.triggerUpdates();

        if (!this.parentNode)
            return;

        if (this.caret) {

            let x = this.elementRect.x + this.contentRect.x + this.caret.x;
            let y = this.elementRect.y + this.contentRect.y + this.caret.y;

            this.parentNode.scrollCellIntoView(new Point({ x, y }), { alignX, alignY, forceX, forceY });

        } else {

            if (alignY === `auto`)
                alignY = Math.abs(this.elementRect.y - this.parentNode.scrollTop) < Math.abs((this.elementRect.y + this.elementRect.height - 1) - (this.parentNode.scrollTop + this.parentNode.contentRect.height - 1)) ? `start` : `end`;

            switch (alignY) {

                case `start`: {
                    this.parentNode.scrollRowIntoView(this.elementRect.y, { alignY, forceY });
                } break;

                case `end`: {
                    this.parentNode.scrollRowIntoView(this.elementRect.y + this.elementRect.height - 1, { alignY, forceY });
                } break;

            }

        }

    }

    scrollCellIntoView(position, { align = `auto`, alignX = align, alignY = align, force = false, forceX = force, forceY = force } = {}) {

        this.triggerUpdates();

        if (alignX === `auto`)
            alignX = Math.abs(position.x - this.scrollLeft) < Math.abs(position.x - (this.scrollLeft + this.contentRect.width - 1)) ? `start` : `end`;

        if (alignY === `auto`)
            alignY = Math.abs(position.y - this.scrollTop) < Math.abs(position.y - (this.scrollTop + this.contentRect.height - 1)) ? `start` : `end`;

        if (forceX || position.x < this.scrollLeft || position.x >= this.scrollLeft + this.elementRect.width) {

            switch (alignX) {

                case `start`: {
                    this.scrollLeft = position.x;
                } break;

                case `end`: {
                    this.scrollLeft = position.x - this.elementRect.width + 1;
                } break;

            }

        }

        if (forceY || position.y < this.scrollTop || position.y >= this.scrollTop + this.elementRect.height) {

            switch (alignY) {

                case `start`: {
                    this.scrollTop = position.y;
                } break;

                case `end`: {
                    this.scrollTop = position.y - this.elementRect.height + 1;
                } break;

            }

        }

        if (this.parentNode) {

            let x = this.elementRect.x + position.x - this.scrollRect.x;
            let y = this.elementRect.y + position.y - this.scrollRect.y;

            this.parentNode.scrollCellIntoView(new Point({ x, y }), { alignX, alignY });

        }

    }

    scrollColumnIntoView(column, { align = `auto`, force = false } = {}) {

        this.scrollCellIntoView(new Point({ x: column, y: this.scrollTop }), { alignX: align, forceX: force });

    }

    scrollRowIntoView(row, { align = `auto`, force = false } = {}) {

        this.scrollCellIntoView(new Point({ x: this.scrollLeft, y: row }), { alignY: align, forceY: force });

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

        if (this.parentNode)
            this.parentNode.setDirtyChildrenFlag(flags.ELEMENT_HAS_DIRTY_LAYOUT_CHILDREN, { silent });

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

        if (!dirtyRect || dirtyRect.isEmpty())
            return;

        if (this.rootNode !== this)
            return this.rootNode.queueDirtyRect(this.elementClipRect ? dirtyRect.intersect(this.elementClipRect) : null, checkIntersectionFrom);

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

        if (this.flags & flags.ELEMENT_IS_DIRTY)
            throw new Error(`Aborted 'triggerUpdates' execution: Flags have not been correctly reset at some point (${(this.flags & flags.ELEMENT_IS_DIRTY).toString(2)}).`);

        for (let dirtyLayoutNode of dirtyLayoutNodes)
            dirtyLayoutNode.dispatchEvent(new Event(`layout`));

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

            let doesLayoutChange = false;
            let doesScrollChange = false;

            if (force || this.flags & flags.ELEMENT_HAS_DIRTY_LAYOUT) {

                let prevElementRect = this.elementRect.clone();
                let prevContentRect = this.contentRect.clone();

                this.elementRect.x = this.yogaNode.getComputedLeft();
                this.elementRect.y = this.yogaNode.getComputedTop();

                this.elementRect.width = this.yogaNode.getComputedWidth();
                this.elementRect.height = this.yogaNode.getComputedHeight();

                this.contentRect.x = this.yogaNode.getComputedBorder(Yoga.EDGE_LEFT) + this.yogaNode.getComputedPadding(Yoga.EDGE_LEFT);
                this.contentRect.y = this.yogaNode.getComputedBorder(Yoga.EDGE_TOP) + this.yogaNode.getComputedPadding(Yoga.EDGE_TOP);

                this.contentRect.width = this.elementRect.width - this.contentRect.x - this.yogaNode.getComputedBorder(Yoga.EDGE_RIGHT) - this.yogaNode.getComputedPadding(Yoga.EDGE_RIGHT);
                this.contentRect.height = this.elementRect.height - this.contentRect.y - this.yogaNode.getComputedBorder(Yoga.EDGE_BOTTOM) - this.yogaNode.getComputedPadding(Yoga.EDGE_BOTTOM);

                // We try to optimize away the iterations inside elements that haven't changed and aren't marked as dirty, because we know their children's layouts won't change either
                doesLayoutChange = !this.elementRect.equals(prevElementRect) || !this.contentRect.equals(prevContentRect);

            }

            if (this.flags & (flags.ELEMENT_HAS_DIRTY_LAYOUT | flags.ELEMENT_HAS_DIRTY_LAYOUT_CHILDREN) || doesLayoutChange) {

                for (let child of this.childNodes)
                    child.cascadeLayout({ dirtyLayoutNodes, force: true });

                let prevScrollWidth = this.scrollRect.width;
                let prevScrollHeight = this.scrollRect.height;

                this.scrollRect.width = Math.max(this.elementRect.width, this.getInternalContentWidth(), ... this.childNodes.map(child => {
                    return child.elementRect.x + child.elementRect.width;
                }));

                this.scrollRect.height = Math.max(this.elementRect.height, this.getInternalContentHeight(), ... this.childNodes.map(child => {
                    return child.elementRect.y + child.elementRect.height;
                }));

                doesScrollChange = this.scrollRect.width !== prevScrollWidth || this.scrollRect.height !== prevScrollHeight;

            }

            if (doesLayoutChange || doesScrollChange) {

                this.rootNode.queueDirtyRect(this.elementClipRect);

                // We register this node so that we can emit the "postlayout" event once the layout process has been completed
                dirtyLayoutNodes.push(this);

                // We need to use the silent option because otherwise we could end up triggering a new "dirty" event that would schedule a useless new update that would itself trigger a new update, etc.
                this.setDirtyClippingFlag({ silent: true });

            }

            this.clearDirtyLayoutFlag();
            this.clearDirtyLayoutChildrenFlag();

        }

    }

    cascadeClipping({ dirtyScrollNodes, force = false } = {}) {

        if (force || this.flags & (flags.ELEMENT_HAS_DIRTY_CLIPPING | flags.ELEMENT_HAS_DIRTY_CLIPPING_CHILDREN)) {

            if (force || this.flags & flags.ELEMENT_HAS_DIRTY_CLIPPING) {

                let doesClippingChange = false;
                let doesScrollChange = false;

                let prevScrollX = this.scrollRect.x;
                let prevScrollY = this.scrollRect.y;

                this.scrollRect.x = Math.min(this.scrollRect.x, this.scrollRect.width - this.elementRect.width);
                this.scrollRect.y = Math.min(this.scrollRect.y, this.scrollRect.height - this.elementRect.height);

                doesScrollChange = this.scrollRect.x !== prevScrollX || this.scrollRect.y !== prevScrollY;

                if (doesScrollChange)
                    dirtyScrollNodes.push(this);

                let prevElementWorldRect = this.elementWorldRect.clone();

                this.elementWorldRect.x = this.parentNode ? this.parentNode.elementWorldRect.x + this.elementRect.x - this.parentNode.scrollRect.x : 0;
                this.elementWorldRect.y = this.parentNode ? this.parentNode.elementWorldRect.y + this.elementRect.y - this.parentNode.scrollRect.y : 0;

                this.elementWorldRect.width = this.elementRect.width;
                this.elementWorldRect.height = this.elementRect.height;

                let prevContentWorldRect = this.contentWorldRect.clone();

                this.contentWorldRect.x = this.elementWorldRect.x + this.contentRect.x;
                this.contentWorldRect.y = this.elementWorldRect.y + this.contentRect.y;

                this.contentWorldRect.width = this.contentRect.width;
                this.contentWorldRect.height = this.contentRect.height;

                let prevElementClipRect = this.elementClipRect ? this.elementClipRect.clone() : null;

                this.elementClipRect = this.parentNode ? this.elementWorldRect.intersect(this.parentNode.elementClipRect) : this.elementWorldRect;
                this.contentClipRect = this.parentNode ? this.contentWorldRect.intersect(this.parentNode.elementClipRect) : this.contentWorldRect;

                doesClippingChange = !Rect.areEqual(prevElementWorldRect, this.elementWorldRect) || !Rect.areEqual(prevContentWorldRect, this.contentWorldRect) || !Rect.areEqual(prevElementClipRect, this.elementClipRect);

                if (doesClippingChange || doesScrollChange) {

                    if (doesClippingChange)
                        this.rootNode.queueDirtyRect(prevElementClipRect);

                    this.rootNode.queueDirtyRect(this.elementClipRect);

                }

            }

            for (let child of this.childNodes)
                child.cascadeClipping({ dirtyScrollNodes, force: force || this.flags & flags.ELEMENT_HAS_DIRTY_CLIPPING });

            this.clearDirtyClippingFlag();
            this.clearDirtyClippingChildrenFlag();

        }

    }

    getElementRects() {

        return pick(this, [

            `elementRect`,
            `contentRect`,

            `elementWorldRect`,
            `contentWorldRect`,

            `elementClipRect`,
            `contentClipRect`,

            `scrollRect`

        ]);

    }

    getPreferredSize(maxWidth, widthMode, maxHeight, heightMode) {

        return { width: maxWidth, height: 0 };

    }

    getInternalContentWidth() {

        return 0;

    }

    getInternalContentHeight() {

        return 0;

    }

}
