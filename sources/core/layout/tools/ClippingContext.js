import Immutable       from 'immutable';
import { isUndefined } from 'lodash';

export class ClippingContext extends new Immutable.Record({

    elementClipRect: undefined,
    contentClipRect: undefined

}) {

    pushNode(node) {

        if (isUndefined(this.elementClipRect) || isUndefined(this.contentClipRect) || true) {
            return this.merge({ elementClipRect: node.elementClipRect, contentClipRect: node.contentClipRect });
        } else {
            return this;
        }

    }

    getElementClipRect(node) {

        let containerClipRect = node.style.$.position.isAbsolutelyPositioned ? this.elementClipRect : this.contentClipRect;
        let targetWorldRect = node.elementWorldRect;

        if (isUndefined(containerClipRect))
            return targetWorldRect;

        if (containerClipRect)
            return containerClipRect.intersect(targetWorldRect);

        return null;

    }

    getContentClipRect(node) {

        let containerClipRect = node.style.$.position.isAbsolutelyPositioned ? this.elementClipRect : this.contentClipRect;
        let targetWorldRect = node.contentWorldRect;

        if (isUndefined(containerClipRect))
            return targetWorldRect.clone();

        if (containerClipRect)
            return containerClipRect.intersect(targetWorldRect);

        return null;

    }

}
