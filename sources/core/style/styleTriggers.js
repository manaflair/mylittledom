import { isNull } from 'lodash';

export function dirtyLayout(node) {

    node.setDirtyLayoutFlag();

}

export function dirtyClipping(node) {

    node.setDirtyClippingFlag();

}

export function dirtyRendering(node) {

    node.setDirtyRenderingFlag();

}

export function dirtyFocusList(node) {

    node.rootNode.setDirtyFocusListFlag();

}

export function dirtyRenderList(node) {

    node.rootNode.setDirtyRenderListFlag();

}

export function onNullSwitch(trigger) {

    return function (node, newValue, oldValue) {

        if (isNull(newValue) === isNull(oldValue))
            return;

        trigger(node, newValue, oldValue);

    };

}
