import { identity, pick }                                                                                                  from 'lodash';
import Yoga                                                                                                                from 'yoga-layout';

import { display, position, overflow, repeat, length, character, color, number, weight, list, optional }                   from './styleParsers';
import { dirtyLayout, dirtyClipping, dirtyRendering, dirtyRenderList, dirtyFocusList, forwardToYoga, forwardToTextLayout } from './styleTriggers';
import { onNullSwitch }                                                                                                    from './styleTriggers';
import { StyleAlignment }                                                                                                  from './types/StyleAlignment';
import { StyleDecoration }                                                                                                 from './types/StyleDecoration';
import { StyleDisplay }                                                                                                    from './types/StyleDisplay';
import { StyleFlexAlignment }                                                                                              from './types/StyleFlexAlignment';
import { StyleFlexDirection }                                                                                              from './types/StyleFlexDirection';
import { StyleOverflowWrap }                                                                                               from './types/StyleOverflowWrap';
import { StyleOverflow }                                                                                                   from './types/StyleOverflow';
import { StylePosition }                                                                                                   from './types/StylePosition';
import { StyleWeight }                                                                                                     from './types/StyleWeight';
import { StyleWhiteSpace }                                                                                                 from './types/StyleWhiteSpace';

let simple = [ `+`, `+`, `+`, `+`, `-`, `|` ];
let modern = [ `┌`, `┐`, `└`, `┘`, `─`, `│` ];
let strong = [ `╔`, `╗`, `╚`, `╝`, `═`, `║` ];

export let styleProperties = {

    display: {
        parsers: [ pick(StyleDisplay, `flex`), null ],
        triggers: [ dirtyLayout, onNullSwitch(dirtyRenderList) ],
        initial: `flex`
    },

    alignContent: {
        parsers: [ pick(StyleFlexAlignment, `flexStart`, `flexEnd`, `center`, `spaceBetween`, `spaceAround`, `stretch` ) ],
        triggers: [ dirtyLayout, forwardToYoga(`setAlignContent`, forwardToYoga.value) ],
        initial: `stretch`
    },

    alignItems: {
        parsers: [ pick(StyleFlexAlignment, `flexStart`, `flexEnd`, `center`, `baseline`, `stretch`) ],
        triggers: [ dirtyLayout, forwardToYoga(`setAlignItems`, forwardToYoga.value) ],
        initial: `stretch`
    },

    alignSelf: {
        parsers: [ pick(StyleFlexAlignment, `auto`, `flexStart`, `flexEnd`, `center`, `baseline`, `stretch`) ],
        triggers: [ dirtyLayout, forwardToYoga(`setAlignSelf`, forwardToYoga.value) ],
        initial: `auto`
    },

    flexDirection: {
        parsers: [ pick(StyleFlexDirection, `row`, `column`, `rowReverse`, `columnReverse`) ],
        triggers: [ dirtyLayout, forwardToYoga(`setFlexDirection`, forwardToYoga.value) ],
        initial: `column`
    },

    position: {
        parsers: [ pick(StylePosition, `relative`, `absolute`, `fixed`) ],
        triggers: [ dirtyLayout, forwardToYoga(`setPositionType`, forwardToYoga.value) ],
        initial: `relative`
    },

    left: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout, forwardToYoga(`setPosition`, Yoga.EDGE_LEFT, forwardToYoga.value) ],
        initial: `auto`
    },

    right: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout, forwardToYoga(`setPosition`, Yoga.EDGE_RIGHT, forwardToYoga.value) ],
        initial: `auto`
    },

    top: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout, forwardToYoga(`setPosition`, Yoga.EDGE_TOP, forwardToYoga.value) ],
        initial: `auto`
    },

    bottom: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout, forwardToYoga(`setPosition`, Yoga.EDGE_BOTTOM, forwardToYoga.value) ],
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
        triggers: [ dirtyLayout, forwardToYoga(`setMargin`, Yoga.EDGE_LEFT, forwardToYoga.value) ],
        initial: 0
    },

    marginRight: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout, forwardToYoga(`setMargin`, Yoga.EDGE_RIGHT, forwardToYoga.value) ],
        initial: 0
    },

    marginTop: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout, forwardToYoga(`setMargin`, Yoga.EDGE_TOP, forwardToYoga.value) ],
        initial: 0
    },

    marginBottom: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout, forwardToYoga(`setMargin`, Yoga.EDGE_BOTTOM, forwardToYoga.value) ],
        initial: 0
    },

    flex: {
        parsers: [ list([ number, optional(number), optional([ length.rel ]) ]), list([ optional(number), optional(number), [ length, length.rel ] ]), new Map([ [ null, [ 0, 0, `auto` ] ] ]) ],
        getter: (style) => [ style.flexGrow, style.flexShrink, style.flexBasis ],
        setter: (style, [ flexGrow, flexShrink, flexBasis ]) => Object.assign(style, { flexGrow, flexShrink, flexBasis })
    },

    flexGrow: {
        parsers: [ number ],
        triggers: [ dirtyLayout, forwardToYoga(`setFlexGrow`, identity) ],
        initial: 0
    },

    flexShrink: {
        parsers: [ number ],
        triggers: [ dirtyLayout, forwardToYoga(`setFlexShrink`, identity) ],
        initial: 0
    },

    flexBasis: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout, forwardToYoga(`setFlexBasis`, forwardToYoga.value) ],
        initial: `auto`
    },

    width: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout, forwardToYoga(`setWidth`, forwardToYoga.value) ],
        initial: `auto`
    },

    height: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout, forwardToYoga(`setHeight`, forwardToYoga.value) ],
        initial: `auto`
    },

    minWidth: {
        parsers: [ length, length.rel ],
        triggers: [ dirtyLayout, forwardToYoga(`setMinWidth`, forwardToYoga.value) ],
        initial: 0
    },

    minHeight: {
        parsers: [ length, length.rel, length.auto ],
        triggers: [ dirtyLayout, forwardToYoga(`setMinHeight`, forwardToYoga.value) ],
        initial: 0
    },

    maxWidth: {
        parsers: [ length, length.rel, length.infinity ],
        triggers: [ dirtyLayout, forwardToYoga(`setMaxWidth`, forwardToYoga.value) ],
        initial: Infinity
    },

    maxHeight: {
        parsers: [ length, length.rel, length.infinity ],
        triggers: [ dirtyLayout, forwardToYoga(`setMaxHeight`, forwardToYoga.value) ],
        initial: Infinity
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
        triggers: [ onNullSwitch(dirtyLayout), dirtyRendering, forwardToYoga(`setBorder`, Yoga.EDGE_LEFT, value => value !== null ? 1 : 0) ],
        initial: null
    },

    borderRightCharacter: {
        parsers: [ character, null ],
        triggers: [ onNullSwitch(dirtyLayout), dirtyRendering, forwardToYoga(`setBorder`, Yoga.EDGE_RIGHT, value => value !== null ? 1 : 0) ],
        initial: null
    },

    borderTopCharacter: {
        parsers: [ character, null ],
        triggers: [ onNullSwitch(dirtyLayout), dirtyRendering, forwardToYoga(`setBorder`, Yoga.EDGE_TOP, value => value !== null ? 1 : 0) ],
        initial: null
    },

    borderBottomCharacter: {
        parsers: [ character, null ],
        triggers: [ onNullSwitch(dirtyLayout), dirtyRendering, forwardToYoga(`setBorder`, Yoga.EDGE_BOTTOM, value => value !== null ? 1 : 0) ],
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
        triggers: [ dirtyLayout, forwardToYoga(`setPadding`, Yoga.EDGE_LEFT, forwardToYoga.value) ],
        initial: 0
    },

    paddingRight: {
        parsers: [ length, length.rel ],
        triggers: [ dirtyLayout, forwardToYoga(`setPadding`, Yoga.EDGE_RIGHT, forwardToYoga.value) ],
        initial: 0
    },

    paddingTop: {
        parsers: [ length, length.rel ],
        triggers: [ dirtyLayout, forwardToYoga(`setPadding`, Yoga.EDGE_TOP, forwardToYoga.value) ],
        initial: 0
    },

    paddingBottom: {
        parsers: [ length, length.rel ],
        triggers: [ dirtyLayout, forwardToYoga(`setPadding`, Yoga.EDGE_BOTTOM, forwardToYoga.value) ],
        initial: 0
    },

    fontWeight: {
        parsers: [ pick(StyleWeight, `normal`, `bold`) ],
        triggers: [ dirtyRendering ],
        initial: `normal`
    },

    textAlign: {
        parsers: [ pick(StyleAlignment, `left`, `center`, `right`, `justify`) ],
        triggers: [ dirtyRendering, forwardToTextLayout(`justifyText`, value => value.isJustified) ],
        initial: `left`
    },

    textDecoration: {
        parsers: [ pick(StyleDecoration, `underline`), null ],
        triggers: [ dirtyRendering ],
        initial: null
    },

    whiteSpace: {
        parsers: [ pick(StyleWhiteSpace, `normal`, `noWrap`, `pre`, `preWrap`, `preLine`) ],
        triggers: [ dirtyLayout, forwardToTextLayout(`collapseWhitespaces`, value => value.doesCollapse), forwardToTextLayout(`demoteNewlines`, value => value.doesDemoteNewlines) ],
        initial: `normal`
    },

    overflowWrap: {
        parsers: [ pick(StyleOverflowWrap, `normal`, `breakWord`) ],
        triggers: [ dirtyLayout, forwardToTextLayout(`allowWordBreaks`, value => value.doesBreakWords) ],
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


    background: {
        parsers: [ list([ optional(character), color ]), list([ character, optional(color) ]), new Map([ [ null, [ null, ` ` ] ] ]) ],
        getter: (style) => [ style.backgroundCharacter, style.backgroundColor ],
        setter: (style, [ backgroundCharacter = style.backgroundCharacter, backgroundColor = style.backgroundColor ]) => Object.assign(style, { backgroundCharacter, backgroundColor })
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
