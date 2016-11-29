# OhUI

> DOM-like terminal application framework

## Features

  - DOM-like API (`element.appendChild()`, `element.removeChild()`, `element.parentNode`, `element.childNodes`, ...)
  - CSS-like API (`element.style.display`, `element.style.position`, `element.style.backgroundColor`, ...)

## Example

```js
import { TermScreen, TermElement } from 'ohui';

let screen = new TermScreen();

let ball = new TermElement();
ball.style.position = `absolute`;
ball.style.left = 0;
ball.style.top = 0;
ball.style.width = 6;
ball.style.height = 3;
ball.style.borderCharacter = `modern`;
screen.appendChild(ball);

(function run() {

    let left = ball.style.left + dx;
    let top = ball.style.top + dy;

    Object.assign(ball.style, { left, top });

    let screenWidth = screen.scrollWidth;
    let screenHeight = screen.scrollHeight;

    let ballWidth = ball.offsetWidth;
    let ballHeight = ball.offsetHeight;

    if (left <= 0)
        dx = +1;
    else if (left + ballWidth >= screenWidth)
        dx = -1;

    if (top <= 0)
        dy = +1;
    else if (top + ballHeight >= screenHeight)
        dx = -1;

    setTimeout(() => run(dx, dy), 1000 / 60);

})(+1, +1)
```

## HTML compatibility

### Un-features

OhUI does not aim to be a perfect HTML renderer and, as such, will not attempt to implement DOM or CSS features that wouldn't make sense in a terminal environment, or would simply be too complex to implement for too little interest. Some of these unimplemented features are:

  - HTML compatibility
  - Floating positioning
  - Inline display
  - Font size

### Major changes

For the same reasons than those highlighted above, some features work a bit differently than what you could expect from a regular browser environment. Some key differences are:

#### Layouting

  - Margins do not collapse, except between siblings
  - Elements size have the same effect as if they had been declared with `box-sizing: content-box`
  - Fixed positioning will be applied relative to the nearest positioned element instead of the window

#### Styling

  - Unlike actual CSS properties, OhUI properties are correctly typed, and expect a literal `null` instead of `"none"`
  - In the same fashion, integer values are stored and returned as such in style properties, instead of being strings
  - To prevent mistakes and facilitate onboarding, setting an invalid value will throw instead of being silently ignored

### Supported CSS properties

An up-to-date list of supported CSS properties can be found in the actual [source code](sources/core/style/styleProperties.js) of the repository.

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
