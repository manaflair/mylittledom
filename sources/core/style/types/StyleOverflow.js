import { pick } from 'lodash';

export class StyleOverflow {

    serialize() {

        return `unnamed`;

    }

    inspect() {

        return this.serialize();

    }

}

StyleOverflow.visible = new StyleOverflow();
StyleOverflow.visible.serialize = () => `visible`;

StyleOverflow.hidden = new StyleOverflow();
StyleOverflow.hidden.serialize = () => `hidden`;

StyleOverflow.values = pick(StyleOverflow, [ `visible`, `hidden` ]);
