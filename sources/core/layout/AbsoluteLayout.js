export let AbsoluteLayout = new class AbsoluteLayout {

    computeChildPositionX(child, context) {

        let containerWidth = context.getContainerWidth(child);

        let left = child.style.$.left.resolve(containerWidth);
        let marginLeft = child.style.$.marginLeft.resolve(containerWidth);

        child.elementRect.x = left + marginLeft;

    }

    computeChildPositionY(child, context) {

        let containerHeight = context.getContainerHeight(child);

        let top = child.style.$.top.resolve(containerHeight);
        let marginTop = child.style.$.marginTop.resolve(containerHeight);

        child.elementRect.y = top + marginTop;

    }

};
