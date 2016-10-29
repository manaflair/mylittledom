# dom-like

> Simple DOM-like implentation

## Features

  - DOM-like API (`appendChild`, `insertBefore`, `removeChild`, `parentNode`, `childNodes`, ...)
  - CSS-like API (`element.style.<property>`)

## HTML compatibility

### Un-features

OhUI does not aim to be a perfect HTML renderer and, as such, multiple HTML features will not be considered for inclusion. Some of them are:

  - HTML compatibility
  - Floating positioning
  - Inline display
  - Font size

### Major changes

  - **Layouting:**

    - Margins do not collapse, except between siblings
    - Elements size have the same effect as if they had been declared with `box-sizing: content-box`
    - Fixed positioning will be applied relative to the nearest positioned element instead of the window

  - **Styling:**

    - Multiple CSS-like properties are correctly typed, and use a literal `null` instead of `none`
    - In the same fashion, integer values are stored and returned as such in style properties, instead of being strings

  - Probably many more :)

### [Supported CSS properties](https://github.com/arcanis/ohui-v2/blob/master/sources/core/style/styleProperties.js)

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
