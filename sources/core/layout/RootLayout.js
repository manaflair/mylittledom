export let RootLayout = new class RootLayout {

    computeChildPositionX(child, context) {

        child.elementRect.x = 0;

    }

    computeChildPositionY(child, context) {

        child.elementRect.y = 0;

    }

};
