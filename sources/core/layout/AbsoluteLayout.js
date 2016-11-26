import { StyleLength } from '../style/types/StyleLength';

export let AbsoluteLayout = new class AbsoluteLayout {

    computeChildPositionX(child, context) {

        let containerWidth = context.getContainerWidth(child);

        let left = child.style.$.left.resolve(containerWidth);
        let right = child.style.$.right.resolve(containerWidth);

        let marginLeft = child.style.$.marginLeft.resolve(containerWidth);
        let marginRight = child.style.$.marginRight.resolve(containerWidth);

        if (child.style.$.left !== StyleLength.auto) {
            child.elementRect.x = left + marginLeft;
        } else if (child.style.$.right !== StyleLength.auto) {
            child.elementRect.x = containerWidth - right - marginRight - child.elementRect.width;
        } else {
            child.elementRect.x = marginLeft;
        }

    }

    computeChildPositionY(child, context) {

        let containerHeight = context.getContainerHeight(child);

        let top = child.style.$.top.resolve(containerHeight);
        let bottom = child.style.$.bottom.resolve(containerHeight);

        let marginTop = child.style.$.marginTop.resolve(containerHeight);
        let marginBottom = child.style.$.marginBottom.resolve(containerHeight);

        if (child.style.$.top !== StyleLength.auto) {
            child.elementRect.y = top + marginTop;
        } else if (child.style.$.bottom !== StyleLength.auto) {
            child.elementRect.y = containerHeight - bottom - marginBottom - child.elementRect.height;
        } else {
            child.elementRect.y = marginTop;
        }

    }

};
