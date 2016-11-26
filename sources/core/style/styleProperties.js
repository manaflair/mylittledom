import { pick }                                                                        from 'lodash';

import { display, position, overflow, repeat, length, character, color, number }       from './styleParsers';
import { dirtyLayout, dirtyClipping, dirtyRendering, dirtyRenderList, dirtyFocusList } from './styleTriggers';
import { onNullSwitch }                                                                from './styleTriggers';
import { StyleAlignment }                                                              from './types/StyleAlignment';
import { StyleDisplay }                                                                from './types/StyleDisplay';
import { StyleOverflowWrap }                                                           from './types/StyleOverflowWrap';
import { StyleOverflow }                                                               from './types/StyleOverflow';
import { StylePosition }                                                               from './types/StylePosition';
import { StyleWhiteSpace }                                                             from './types/StyleWhiteSpace';

let simple = [ `+`, `+`, `+`, `+`, `-`, `|` ];
let modern = [ `┌`, `┐`, `└`, `┘`, `─`, `│` ];
let strong = [ `╔`, `╗`, `╚`, `╝`, `═`, `║` ];

export let styleProperties = {

    display: {
        parsers: [ pick(StyleDisplay, `block`), null ],
        triggers: [ dirtyLayout, onNullSwitch(dirtyRenderList) ],
        initial: `block`
    },

    position: {
        parsers: [ pick(StylePosition, `static`, `relative`, `absolute`, `fixed`) ],
        triggers: [ dirtyLayout ],
        initial: `static`
    },

    left: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout ],
        initial: `auto`
    },

    right: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout ],
        initial: `auto`
    },

    top: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout ],
        initial: `auto`
    },

    bottom: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout ],
        initial: `auto`
    },

    zIndex: {
        parsers: [ number, null ],
        triggers: [ dirtyRenderList ],
        initial: null
    },

    margin: {
        parsers: [ repeat([ 1, 2, 4 ], [ length, length.rel, length.auto ]) ],
        getter: (style) => [ style.marginTop, style.marginRight, style.marginBottom, style.marginLeft ],
        setter: (style, [ marginTop, marginRight = marginTop, marginBottom = marginTop, marginLeft = marginRight ]) => Object.assign(style, { marginTop, marginRight, marginBottom, marginLeft })
    },

    marginLeft: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout ],
        initial: 0
    },

    marginRight: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout ],
        initial: 0
    },

    marginTop: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout ],
        initial: 0
    },

    marginBottom: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout ],
        initial: 0
    },

    width: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout ],
        initial: `auto`
    },

    height: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout ],
        initial: `auto`
    },

    overflow: {
        parsers: [ pick(StyleOverflow, `visible`, `hidden`) ],
        triggers: [ dirtyClipping ],
        initial: `visible`
    },

    border: {
        parsers: [ { simple, modern, strong }, repeat([ 1, 2, 4, 5, 8 ], [ character, null ]) ],
        getter: (style) => [ borderTopLeftCharacter, borderTopRightCharacter, borderBottomLeftCharacter, borderBottomRightCharacter, borderTopCharacter, borderRightCharacter, borderBottomCharacter, borderLeftCharacter ],
        setter: (style, [ borderTopLeftCharacter, borderTopRightCharacter, borderBottomLeftCharacter, borderBottomRightCharacter, borderTopCharacter, borderRightCharacter = borderTopCharacter, borderBottomCharacter = borderTopCharacter, borderLeftCharacter = borderRightCharacter ]) => Object.assign(style, { borderTopLeftCharacter, borderTopRightCharacter, borderBottomLeftCharacter, borderBottomRightCharacter, borderTopCharacter, borderRightCharacter, borderBottomCharacter, borderLeftCharacter })
    },

    borderCharacter: {
        parsers: [ { simple, modern, strong }, repeat([ 5, 6, 8 ], [ character, null ]) ],
        getter: (style) => [ borderTopLeftCharacter, borderTopRightCharacter, borderBottomLeftCharacter, borderBottomRightCharacter, borderTopCharacter, borderRightCharacter, borderBottomCharacter, borderLeftCharacter ],
        setter: (style, [ borderTopLeftCharacter, borderTopRightCharacter, borderBottomLeftCharacter, borderBottomRightCharacter, borderTopCharacter, borderRightCharacter = borderTopCharacter, borderBottomCharacter = borderTopCharacter, borderLeftCharacter = borderRightCharacter ]) => Object.assign(style, { borderTopLeftCharacter, borderTopRightCharacter, borderBottomLeftCharacter, borderBottomRightCharacter, borderTopCharacter, borderRightCharacter, borderBottomCharacter, borderLeftCharacter })
    },

    borderLeftCharacter: {
        parsers: [ character, null ],
        triggers: [ onNullSwitch(dirtyLayout), dirtyRendering ],
        initial: null
    },

    borderRightCharacter: {
        parsers: [ character, null ],
        triggers: [ onNullSwitch(dirtyLayout), dirtyRendering ],
        initial: null
    },

    borderTopCharacter: {
        parsers: [ character, null ],
        triggers: [ onNullSwitch(dirtyLayout), dirtyRendering ],
        initial: null
    },

    borderBottomCharacter: {
        parsers: [ character, null ],
        triggers: [ onNullSwitch(dirtyLayout), dirtyRendering ],
        initial: null
    },

    borderTopLeftCharacter: {
        parsers: [ character, null ],
        triggers: [ onNullSwitch(dirtyLayout), dirtyRendering ],
        initial: null
    },

    borderTopRightCharacter: {
        parsers: [ character, null ],
        triggers: [ onNullSwitch(dirtyLayout), dirtyRendering ],
        initial: null
    },

    borderBottomLeftCharacter: {
        parsers: [ character, null ],
        triggers: [ onNullSwitch(dirtyLayout), dirtyRendering ],
        initial: null
    },

    borderBottomRightCharacter: {
        parsers: [ character, null ],
        triggers: [ onNullSwitch(dirtyLayout), dirtyRendering ],
        initial: null
    },

    padding: {
        parsers: [ repeat([ 1, 2, 4 ], [ length, length.rel ]) ],
        getter: (style) => [ style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft ],
        setter: (style, [ paddingTop, paddingRight = paddingTop, paddingBottom = paddingTop, paddingLeft = paddingRight ]) => Object.assign(style, { paddingTop, paddingRight, paddingBottom, paddingLeft })
    },

    paddingLeft: {
        parsers: [ length, length.rel ],
        triggers: [ dirtyLayout ],
        initial: 0
    },

    paddingRight: {
        parsers: [ length, length.rel ],
        triggers: [ dirtyLayout ],
        initial: 0
    },

    paddingTop: {
        parsers: [ length, length.rel ],
        triggers: [ dirtyLayout ],
        initial: 0
    },

    paddingBottom: {
        parsers: [ length, length.rel ],
        triggers: [ dirtyLayout ],
        initial: 0
    },

    textAlign: {
        parsers: [ pick(StyleAlignment, `left`, `center`, `right`, `justify`) ],
        triggers: [ dirtyRendering ],
        initial: `left`
    },

    whiteSpace: {
        parsers: [ pick(StyleWhiteSpace, `normal`, `noWrap`, `pre`, `preWrap`, `preLine`) ],
        triggers: [ dirtyLayout ],
        initial: `normal`
    },

    overflowWrap: {
        parsers: [ pick(StyleOverflowWrap, `normal`, `breakWord`) ],
        triggers: [ dirtyLayout ],
        initial: `normal`
    },

    wordWrap: {
        parsers: [ rawValue => rawValue ],
        getter: (style) => { throw new Error(`Please use the "overflow-wrap" property instead.`) },
        setter: (style, wordWrap) => { throw new Error(`Please use the "overflow-wrap" property instead.`) }
    },

    color: {
        parsers: [ color, null ],
        triggers: [ dirtyRendering ],
        initial: null
    },

    borderColor: {
        parsers: [ color, null ],
        triggers: [ dirtyRendering ],
        initial: null
    },

    backgroundColor: {
        parsers: [ color, null ],
        triggers: [ dirtyRendering ],
        initial: null
    },

    backgroundCharacter: {
        parsers: [ character ],
        triggers: [ dirtyRendering ],
        initial: ` `
    },

    focusEvents: {
        parsers: [ true, null ],
        triggers: [ dirtyFocusList ],
        initial: null
    },

    pointerEvents: {
        parsers: [ true, null ],
        triggers: [],
        initial: true
    }

};
