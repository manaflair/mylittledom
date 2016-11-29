# OhUI

> DOM-like terminal application framework

## Features

  - DOM-like API (`element.appendChild()`, `element.insertBefore()`, `element.removeChild()`, `element.parentNode`, `element.childNodes`, ...)
  - CSS-like API (`element.style.display`, `element.style.position`, `element.style.backgroundColor`, ...)

## HTML compatibility

### Un-features

OhUI does not aim to be a perfect HTML renderer and, as such, will not attempt to implement DOM or CSS features that wouldn't make sense in a terminal environment, or would be to hard to implement for dubious results. Some of these unimplemented features are:

  - HTML compatibility
  - Floating positioning
  - Inline display
  - Font size

### Major changes

For the same reasons than those highlighted above, some features work a bit differently than what you could expect from a regular browser environment. Some key differences:

#### Layouting

  - Margins do not collapse, except between siblings
  - Elements size have the same effect as if they had been declared with `box-sizing: content-box`
  - Fixed positioning will be applied relative to the nearest positioned element instead of the window

#### Styling

  - Multiple CSS-like properties are correctly typed, and use a literal `null` instead of `none`
  - In the same fashion, integer values are stored and returned as such in style properties, instead of being strings

### Supported CSS properties

An up-to-date list of supported CSS properties can be found in the [repository](sources/core/style/styleProperties.js).

```
display

position

left
right
top
bottom
zIndex

margin
marginLeft
marginRight
marginTop
marginBottom

width
height
overflow

border
borderTopLeftCharacter
borderTopRightCharacter
borderBottomLeftCharacter
borderBottomRightCharacter
borderLeftCharacter
borderRightCharacter
borderTopCharacter
borderBottomCharacter

padding
paddingLeft
paddingRight
paddingTop
paddingBottom

textAlign
textOverflow
whiteSpace

color
backgroundColor
backgroundCharacter
```

## License (MIT)

> **Copyright © 2014 Maël Nison**
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
