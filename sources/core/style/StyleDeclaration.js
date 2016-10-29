import { camelCase, isArray, isEqual, isFunction, isNull, isString, isUndefined, kebabCase } from 'lodash';

import { styleProperties }                                                                   from './styleProperties';
import { getDefaultPropertyValue }                                                           from './tools/getDefaultPropertyValue';
import { parsePropertyValue }                                                                from './tools/parsePropertyValue';
import { runPropertyTriggers }                                                               from './tools/runPropertyTriggers';
import { serializePropertyValue }                                                            from './tools/serializePropertyValue';

export class StyleDeclaration {

    static makeNew(node) {

        return new Proxy(new StyleDeclaration(), {

            has(target, name) {

                return Object.prototype.hasOwnProperty.call(styleProperties, name);

            },

            ownKeys(target) {

                return Object.keys(target).filter(name => target[name] !== getDefaultPropertyValue(name));

            },

            get(target, name) {

                if (name === `$`)
                    return target;

                if (!this.has(target, name))
                    throw new Error(`Invalid property access: '${name}' is not a valid style property name.`);

                let property = styleProperties[name];
                let value = target[name];

                return serializePropertyValue(target[name]);

            },

            set(target, name, rawValue) {

                if (!this.has(target, name))
                    throw new Error(`Invalid property access: '${name}' is not a valid style property name.`);

                let property = styleProperties[name];

                let oldValue = target[name];
                let newValue = isUndefined(rawValue) ? getDefaultPropertyValue(name) : parsePropertyValue(name, rawValue);

                if (oldValue === newValue || isEqual(serializePropertyValue(newValue), serializePropertyValue(oldValue)))
                    return true; // Early return if the value doesn't actually change (we have to check after converting, because we might be comparing "#000" with "#000000" or "black")

                target[name] = newValue;
                runPropertyTriggers(name, node, newValue, oldValue);

                return true;

            },

            deleteProperty(target, name) {

                return this.set(target, name, undefined);

            }

        });

    }

    constructor() {

        for (let name of Object.keys(styleProperties)) {
            this[name] = getDefaultPropertyValue(name);
        }

    }

    get border() {

        return this.borderCharacter;

    }

    set border(characters) {

        this.borderCharacter = characters;

    }

    get borderCharacter() {

        return [

            this.borderTopRightCharacter,
            this.borderBottomRightCharacter,
            this.borderBottomLeftCharacter,
            this.borderTopLeftCharacter,

            this.borderTopCharacter,
            this.borderRightCharacter,
            this.borderBottomCharacter,
            this.borderLeftCharacter

        ];

    }

    set borderCharacter(characters) {

        switch (characters.length) {

            case 1: {

                let [ borderCharacter ] = characters;

                this.borderTopLeftCharacter = this.borderTopRightCharacter = this.borderBottomLeftCharacter = this.borderBottomRightCharacter = this.borderLeftCharacter = this.borderRightCharacter = this.borderTopCharacter = this.borderBottomCharacter = borderCharacter;

            } break;

            case 2: {

                let [ borderCornerCharacter, borderBorderCharacter ] = characters;

                this.borderTopLeftCharacter = this.borderTopRightCharacter = this.borderBottomLeftCharacter = this.borderBottomRightCharacter = borderCornerCharacter;
                this.borderLeftCharacter = this.borderRightCharacter = this.borderTopCharacter = this.borderBottomCharacter = borderBorderCharacter;

            } break;

            case 3: {

                let [ borderCornerCharacter, borderHorizontalCharacter, borderVerticalCharacter ] = characters;

                this.borderTopLeftCharacter = this.borderTopRightCharacter = this.borderBottomLeftCharacter = this.borderBottomRightCharacter = borderCornerCharacter;

                this.borderTopCharacter = this.borderBottomCharacter = borderHorizontalCharacter;
                this.borderLeftCharacter = this.borderRightCharacter = borderVerticalCharacter;

            } break;

            case 5: {

                let [ borderCornerCharacter, borderTopCharacter, borderRightCharacter, borderBottomCharacter, borderLeftCharacter ] = characters;

                this.borderTopLeftCharacter = this.borderTopRightCharacter = this.borderBottomLeftCharacter = this.borderBottomRightCharacter = borderCornerCharacter;

                this.borderLeftCharacter = borderLeftCharacter;
                this.borderRightCharacter = borderRightCharacter;

                this.borderTopCharacter = borderTopCharacter;
                this.borderBottomCharacter = borderBottomCharacter;

            } break;

            case 8: {

                let [ borderTopRightCharacter, borderBottomRightCharacter, borderBottomLeftCharacter, borderTopLeftCharacter, borderTopCharacter, borderRightCharacter, borderBottomCharacter, borderLeftCharacter ] = characters;

                this.borderTopLeftCharacter = borderTopLeftCharacter;
                this.borderTopRightCharacter = borderTopRightCharacter;

                this.borderBottomLeftCharacter = borderBottomLeftCharacter;
                this.borderBottomRightCharacter = borderBottomRightCharacter;

                this.borderLeftCharacter = borderLeftCharacter;
                this.borderRightCharacter = borderRightCharacter;

                this.borderTopCharacter = borderTopCharacter;
                this.borderBottomCharacter = borderBottomCharacter;

            } break;

        }

    }

    get padding() {

        return [

            this.paddingTop,
            this.paddingRight,
            this.paddingBottom,
            this.paddingLeft

        ];

    }

    set padding(paddings) {

        switch (paddings.length) {

            case 1: {

                let [ padding ] = paddings;

                this.paddingTop = this.paddingRight = this.paddingBottom = this.paddingLeft = padding;

            } break;

            case 2: {

                let [ paddingY, paddingX ] = paddings;

                this.paddingTop = this.paddingBottom = paddingX;
                this.paddingLeft = this.paddingRight = paddingY;

            } break;

            case 4: {

                let [ paddingTop, paddingRight, paddingBottom, paddingLeft ] = paddings;

                this.paddingTop = paddingTop;
                this.paddingRight = paddingRight;
                this.paddingBottom = paddingBottom;
                this.paddingLeft = paddingLeft;

            } break;

        }

    }

    get margin() {

        return [

            this.marginTop,
            this.marginRight,
            this.marginBottom,
            this.marginLeft

        ];

    }

    set margin(margins) {

        switch (margins.length) {

            case 1: {

                let [ margin ] = margins;

                this.marginTop = this.marginRight = this.marginBottom = this.marginLeft = margin;

            } break;

            case 2: {

                let [ marginY, marginX ] = margins;

                this.marginTop = this.marginBottom = marginX;
                this.marginLeft = this.marginRight = marginY;

            } break;

            case 4: {

                let [ marginTop, marginRight, marginBottom, marginLeft ] = margins;

                this.marginTop = marginTop;
                this.marginRight = marginRight;
                this.marginBottom = marginBottom;
                this.marginLeft = marginLeft;

            } break;

        }

    }

}
