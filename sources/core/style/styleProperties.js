import { display, position, overflow, repeat, length, character, color, number } from './styleParsers';
import { dirtyLayout, dirtyClipping, dirtyRendering, dirtyRenderList }           from './styleTriggers';
import { onNullSwitch }                                                          from './styleTriggers';

let simple = [ `+`, `-`, `|` ];
let modern = [ `┐`, `┘`, `└`, `┌`, `─`, `│`, `─`, `│` ];
let strong = [ `╗`, `╝`, `╚`, `╔`, `═`, `║`, `═`, `║` ]

export let styleProperties = {

    display                    : { parsers: [ display, null ],                   triggers: [ dirtyLayout, onNullSwitch(dirtyRenderList) ], initial:   `block` },

    position                   : { parsers: [ position ],                        triggers: [ dirtyLayout ],                                initial:  `static` },

    left                       : { parsers: [ length, length.rel, length.auto ], triggers: [ dirtyLayout ],                                initial:    `auto` },
    right                      : { parsers: [ length, length.rel, length.auto ], triggers: [ dirtyLayout ],                                initial:    `auto` },
    top                        : { parsers: [ length, length.rel, length.auto ], triggers: [ dirtyLayout ],                                initial:    `auto` },
    bottom                     : { parsers: [ length, length.rel, length.auto ], triggers: [ dirtyLayout ],                                initial:    `auto` },

    zIndex                     : { parsers: [ number ],                          triggers: [ dirtyRenderList ],                            initial:        0  },

    margin                     : { parsers: [ repeat([ 1, 2, 4 ], [ length, length.rel, length.auto ]) ],                                  initial:        0  },
    marginLeft                 : { parsers: [ length, length.rel, length.auto ], triggers: [ dirtyLayout ],                                initial:        0  },
    marginRight                : { parsers: [ length, length.rel, length.auto ], triggers: [ dirtyLayout ],                                initial:        0  },
    marginTop                  : { parsers: [ length, length.rel, length.auto ], triggers: [ dirtyLayout ],                                initial:        0  },
    marginBottom               : { parsers: [ length, length.rel, length.auto ], triggers: [ dirtyLayout ],                                initial:        0  },

    width                      : { parsers: [ length, length.rel, length.auto ], triggers: [ dirtyLayout ],                                initial:    `auto` },
    height                     : { parsers: [ length, length.rel, length.auto ], triggers: [ dirtyLayout ],                                initial:    `auto` },
    overflow                   : { parsers: [ overflow ],                        triggers: [ dirtyClipping ],                              initial: `visible` },

    border                     : { parsers: [ { simple, modern, strong }, repeat([ 1, 2, 4, 5, 8 ], [ character, null ]) ],                initial:     null  },
    borderCharacter            : { parsers: [ { simple, modern, strong }, repeat([ 1, 2, 4, 5, 8 ], [ character, null ]) ],                initial:     null  },
    borderLeftCharacter        : { parsers: [ character, null ],                 triggers: [ onNullSwitch(dirtyLayout), dirtyRendering ],  initial:     null  },
    borderRightCharacter       : { parsers: [ character, null ],                 triggers: [ onNullSwitch(dirtyLayout), dirtyRendering ],  initial:     null  },
    borderTopCharacter         : { parsers: [ character, null ],                 triggers: [ onNullSwitch(dirtyLayout), dirtyRendering ],  initial:     null  },
    borderBottomCharacter      : { parsers: [ character, null ],                 triggers: [ onNullSwitch(dirtyLayout), dirtyRendering ],  initial:     null  },
    borderTopLeftCharacter     : { parsers: [ character, null ],                 triggers: [ onNullSwitch(dirtyLayout), dirtyRendering ],  initial:     null  },
    borderTopRightCharacter    : { parsers: [ character, null ],                 triggers: [ onNullSwitch(dirtyLayout), dirtyRendering ],  initial:     null  },
    borderBottomLeftCharacter  : { parsers: [ character, null ],                 triggers: [ onNullSwitch(dirtyLayout), dirtyRendering ],  initial:     null  },
    borderBottomRightCharacter : { parsers: [ character, null ],                 triggers: [ onNullSwitch(dirtyLayout), dirtyRendering ],  initial:     null  },

    padding                    : { parsers: [ repeat([ 1, 2, 4 ], [ length, length.rel ]) ],                                               initial:        0  },
    paddingLeft                : { parsers: [ length, length.rel ],              triggers: [ dirtyLayout ],                                initial:        0  },
    paddingRight               : { parsers: [ length, length.rel ],              triggers: [ dirtyLayout ],                                initial:        0  },
    paddingTop                 : { parsers: [ length, length.rel ],              triggers: [ dirtyLayout ],                                initial:        0  },
    paddingBottom              : { parsers: [ length, length.rel ],              triggers: [ dirtyLayout ],                                initial:        0  },

    color                      : { parsers: [ color, null ],                     triggers: [ dirtyRendering ],                             initial:     null  },
    borderColor                : { parsers: [ color, null ],                     triggers: [ dirtyRendering ],                             initial:     null  },
    backgroundColor            : { parsers: [ color, null ],                     triggers: [ dirtyRendering ],                             initial:     null  },
    backgroundCharacter        : { parsers: [ character ],                       triggers: [ dirtyRendering ],                             initial:       ` ` }

};
