import Immutable from 'immutable';

export class LayoutContext extends new Immutable.Record({

    shrinkWidthFlag: false,
    shrinkHeightFlag: false,

    staticWidth: 0,
    staticHeight: 0,

    positionedWidth: 0,
    positionedHeight: 0

}) {

    pushNode(node) {

        return this.pushNodeWidth(node).pushNodeHeight(node);

    }

    pushNodeWidth(node) {

        let res = this.set(`staticWidth`, node.contentRect.width);

        if (node.style.$.position.isPositioned)
            res = res.set(`positionedWidth`, node.elementRect.width);

        return res;

    }

    pushNodeHeight(node) {

        let res = this.set(`staticHeight`, node.contentRect.height);

        if (node.style.$.position.isPositioned)
            res = res.set(`positionedHeight`, node.elementRect.height);

        return res;

    }

    getContainerWidth(node) {

        if (node.style.$.position.isAbsolutelyPositioned) {
            return this.positionedWidth;
        } else {
            return this.staticWidth;
        }

    }

    getContainerHeight(node) {

        if (node.style.$.position.isAbsolutelyPositioned) {
            return this.positionedHeight;
        } else {
            return this.staticHeight;
        }

    }

}
