import { StyleLength } from '../style/types/StyleLength';

export let BlockLayout = new class BlockLayout {

    isBlockWidthFixed(node) {

        if (node.style.$.position.isAbsolutelyPositioned) {

            return (

                node.style.$.width !== StyleLength.auto ||

                (node.style.$.left !== StyleLength.auto &&
                 node.style.$.right !== StyleLength.auto)

            );

        } else {

            return (

                node.style.$.width !== StyleLength.auto ||

                node.style.$.marginLeft !== StyleLength.auto ||
                node.style.$.marginRight !== StyleLength.auto

            );

        }

    }

    isBlockHeightFixed(node) {

        if (node.style.$.position.isAbsolutelyPositioned) {

            return (

                node.style.$.height !== StyleLength.auto ||

                (node.style.$.top !== StyleLength.auto &&
                 node.style.$.bottom !== StyleLength.auto)

            );

        } else {

            return (

                node.style.$.height !== StyleLength.auto

            );

        }

    }

    computeNodeWidth(node, context) {

        let containerWidth = context.getContainerWidth(node);

        let borderLeft = node.style.$.borderLeftCharacter ? 1 : 0;
        let borderRight = node.style.$.borderRightCharacter ? 1 : 0;

        let paddingLeft = Math.max(0, node.style.$.paddingLeft.resolve(containerWidth));
        let paddingRight = Math.max(0, node.style.$.paddingRight.resolve(containerWidth));

        if (node.style.$.width !== StyleLength.auto) {

            node.elementRect.width = Math.max(0, node.style.$.width.resolve(containerWidth));

        } else if (node.style.$.position.isAbsolutelyPositioned) {

            if (node.style.$.left === StyleLength.auto || node.style.$.right === StyleLength.auto) {

                let baseWidth = node.getPreferredContentWidth();

                baseWidth += borderLeft + paddingLeft;
                baseWidth += borderRight + paddingRight;

                node.elementRect.width = Math.max(baseWidth, ... node.childNodes.filter(child => {
                    return !child.style.$.position.isAbsolutelyPositioned;
                }).map(child => {
                    return child.elementRect.width;
                }));

            } else {

                let left = node.style.$.left.resolve(containerWidth);
                let right = node.style.$.right.resolve(containerWidth);

                node.elementRect.width = Math.max(0, containerWidth - left - right);

            }

        } else {

            let marginLeft = node.style.$.marginLeft.resolve(containerWidth);
            let marginRight = node.style.$.marginRight.resolve(containerWidth);

            node.elementRect.width = Math.max(0, containerWidth - marginLeft - marginRight);

        }

        let minWidth = node.style.$.minWidth.resolve(containerWidth);
        let maxWidth = node.style.$.maxWidth.resolve(containerWidth);

        // Apply min/max width parameters
        node.elementRect.width = Math.max(minWidth, Math.min(node.elementRect.width, maxWidth));

        // Compute the content width
        node.contentRect.width = Math.max(0, node.elementRect.width - borderLeft - paddingLeft - borderRight - paddingRight);

    }

    computeNodeHeight(node, context) {

        let containerWidth = context.getContainerWidth(node);
        let containerHeight = context.getContainerHeight(node);

        let borderTop = node.style.$.borderTopCharacter ? 1 : 0;
        let borderBottom = node.style.$.borderBottomCharacter ? 1 : 0;

        let paddingTop = Math.max(0, node.style.$.paddingTop.resolve(containerWidth));
        let paddingBottom = Math.max(0, node.style.$.paddingBottom.resolve(containerWidth));

        if (node.style.$.position.isAbsolutelyPositioned && (node.style.$.top !== StyleLength.auto && node.style.$.bottom !== StyleLength.auto)) {

            let top = node.style.$.top.resolve(containerHeight);
            let bottom = node.style.$.bottom.resolve(containerHeight);

            node.elementRect.height = Math.max(0, containerHeight - top - bottom);

        } else if (node.style.$.height === StyleLength.auto) {

            let baseHeight = node.getPreferredContentHeight();

            baseHeight += borderTop + paddingTop;
            baseHeight += borderBottom + paddingBottom;

            node.elementRect.height = Math.max(baseHeight, ... node.childNodes.filter(child => {
                return !child.style.$.position.isAbsolutelyPositioned;
            }).map(child => {
                return child.elementRect.y + child.elementRect.height + borderBottom + paddingBottom;;
            }));

        } else {

            node.elementRect.height = node.style.$.height.resolve(containerHeight);

        }

        let minHeight = node.style.$.minHeight.resolve(containerHeight);
        let maxHeight = node.style.$.maxHeight.resolve(containerHeight);

        // Apply min/max height parameters
        node.elementRect.height = Math.max(minHeight, Math.min(node.elementRect.height, maxHeight));

        // Compute the content height
        node.contentRect.height = Math.max(0, node.elementRect.height - borderTop - paddingTop - borderBottom - paddingBottom);

    }

    computeNodeContentPosition(node, context) {

        let containerWidth = context.getContainerWidth(node);
        let containerHeight = context.getContainerHeight(node);

        let borderLeft = node.style.$.borderLeftCharacter ? 1 : 0;
        let borderTop = node.style.$.borderTopCharacter ? 1 : 0;

        let paddingLeft = Math.max(0, node.style.$.paddingLeft.resolve(containerWidth));
        let paddingTop = Math.max(0, node.style.$.paddingTop.resolve(containerWidth));

        node.contentRect.x = borderLeft + paddingLeft;
        node.contentRect.y = borderTop + paddingTop;

    }

    computeChildPositionX(child, context) {

        let containerWidth = context.getContainerWidth(child);

        // -- Start our computations with using the parent node's border & padding properties

        child.elementRect.x = child.parentNode ? child.parentNode.contentRect.x : 0;

        // -- We compute the element's position on the horizontal axis

        let marginLeft = child.style.$.marginLeft;
        let marginRight = child.style.$.marginRight;

        if (marginLeft === StyleLength.auto && marginRight === StyleLength.auto) {

            child.elementRect.x += Math.max(0, (containerWidth - child.elementRect.width) / 2);

        } else if (marginLeft === StyleLength.auto) {

            child.elementRect.x += containerWidth - child.elementRect.width - marginRight.resolve(containerWidth);

        } else /* marginRight === auto doesn't change anything for us, we can just fallback to this case */ {

            child.elementRect.x += marginLeft.resolve(containerWidth);

        }

        // -- Move the element, if allowed by its positioning

        if (child.style.$.position.isPositioned) {

            if (child.style.$.left !== StyleLength.auto) {
                child.elementRect.x += child.style.$.left.resolve(containerWidth);
            } else {
              //child.elementRect.x -= child.style.$.right.resolve(containerWidth);
            }

        }

    }

    computeChildPositionY(child, context) {

        let containerHeight = context.getContainerHeight(child);

        // -- Start our computations with using the parent node's border & padding properties

        child.elementRect.y = child.parentNode ? child.parentNode.contentRect.y : 0;

        // -- We compute the element's position on the vertical axis

        let flowPrevSibling = child.previousSibling;

        while (flowPrevSibling && flowPrevSibling.style.$.position.isAbsolutelyPositioned)
            flowPrevSibling = flowPrevSibling.previousSibling;

        if (flowPrevSibling) {

            child.elementRect.y += Math.max(
                flowPrevSibling.style.$.marginBottom.resolve(containerHeight),
                child.style.$.marginTop.resolve(containerHeight)
            );

            child.elementRect.y += flowPrevSibling.elementRect.y;
            child.elementRect.y += flowPrevSibling.elementRect.height;

            if (flowPrevSibling.style.$.position.isPositioned) {
                if (flowPrevSibling.style.$.top !== StyleLength.auto) {
                    child.elementRect.y -= flowPrevSibling.style.$.top.resolve(containerHeight);
                } else {
                    child.elementRect.y += flowPrevSibling.style.$.bottom.resolve(containerHeight);
                }
            }

        } else {

            child.elementRect.y += child.style.$.marginTop.resolve(containerHeight);

        }

        // -- Move the element, if allowed by its positioning

        if (child.style.$.position.isPositioned) {

            if (child.style.$.top !== StyleLength.auto) {
                child.elementRect.y += child.style.$.top.resolve(containerHeight);
            } else {
              //child.elementRect.y -= child.style.$.bottom.resolve(containerHeight);
            }

        }

    }

};
