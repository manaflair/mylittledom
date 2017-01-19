# [![MyLittleDom](/logo.png?raw=true)](https://github.com/manaflair/mylittledom)

> High-level DOM-like terminal interface library, complete with native React support

[![](https://img.shields.io/npm/v/@manaflair/mylittledom.svg)]() [![](https://img.shields.io/npm/l/@manaflair/mylittledom.svg)]()

[Check out our other OSS projects!](https://manaflair.github.io)

## Features

  - DOM-like API (`element.appendChild()`, `element.removeChild()`, `element.parentNode`, `element.childNodes`, ...)
  - CSS-like API (`element.style.display`, `element.style.position`, `element.style.backgroundColor`, ...)
  - Complex flex positioning (thanks to the awesome [Yoga](https://github.com/facebook/yoga) library!)
  - Work in Node.js but also inside web browsers (through [XTerm.js](https://github.com/sourcelair/xterm.js/))
  - Automatic text layout à-la-CSS (text-align, overflow-wrap, white-space, ...)
  - Border support, padding support, positioning support, custom rendering support ...
  - Native React renderer

## Installation

**Warning:** MyLittleDom is definitely not yet ready to be used in production. Some dependencies haven't yet been merged into the master trunk of their respective repositories, and some parts of the public API are expected to heavily change in the future. Feel free to start hacking with it, but be aware that the final product might be very different from what you can see here.

```
$> npm install --save @manaflair/mylittledom
```

## Example (raw js)

```js
import { TermScreen, TermElement } from '@manaflair/mylittledom/term';

let screen = new TermScreen();
screen.attachScreen();

let ball = new TermElement();
ball.style.position = `absolute`;
ball.style.left = 0;
ball.style.top = 0;
ball.style.width = 6;
ball.style.height = 3;
ball.style.borderCharacter = `modern`;
ball.appendTo(screen);

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

## Example (React)

```js
import { render }     from '@manaflair/mylittledom/term/react';
import { TermScreen } from '@manaflair/mylittledom/term';

let screen = new TermScreen();
screen.attachScreen();

render(<div>

    Hello world!

</div>, screen);
```

---

## HTML compatibility

### Un-features

MyLittleDom does not aim to be a perfect HTML renderer and, as such, will not attempt to implement DOM or CSS features that wouldn't make sense in a terminal environment, or would simply be too complex to implement for too little gain. Some of these unimplemented features are:

  - Perfect HTML compatibility
  - Floating positioning
  - Block / Inline display
  - Font size

### Major changes

For the same reasons than those exposed above, some features work a bit differently in MyLittleDom than what you could expect from a regular browser environment. Some key differences are detailed below.

#### APIs

  - Unless specified otherwise, `scrollIntoView` and its variants will automatically detect the best alignment, depending on the current location of the target. In the same spirit, the default behaviour of `scrollIntoView` and its variants is to have no effect if the target is already visible.

  - The `getAttribute` and `setAttribute` functions differ from their browser counterparts in that they can store actual JavaScript objects (rather than only strings).

#### Layouts

Because MyLittleDom uses [Yoga](https://facebook.github.io/yoga/) to layout its elements, it is subject to the same limitations:

  - The only display currently supported is `display: flex`.

  - In order to emulate the `display: block` behaviour, the default value for `flex-direction` is `column`.

  - Element layouts are computed as if they had been declared with `box-sizing: content-box`.

On top of these quirks, the MyLittleDom renderer deviates from the CSS standard on a few additional points:

  - The padding spaces are located outside of the scroll containers, instead of inside.

  - Fixed positioning will be applied relative to the nearest positioned element instead of the window.

#### Styling

  - Unlike actual CSS properties, MyLittleDom properties are correctly typed, and expect a literal `null` instead of `"none"`.

  - In the same fashion, integer values are stored and returned as such in style properties, instead of being strings.

  - Pixel units are replaced by raw numbers, but percent strings are kept as strings. No other unit is currently supported.

  - To prevent mistakes and facilitate onboarding, setting an invalid value will throw instead of being silently ignored.

### Supported CSS properties

An up-to-date list of supported CSS properties and supported values for each property can be found in the actual [source code](sources/core/style/styleProperties.js) of the repository.

---

## User API

  - `new TermScreen({ debugPaintRects })`

    - You will need to call `screen.attachScreen({ stdin, stdout })` before the screen actually prints anything (with `stdin` and `stdout` being Node.js streams). Use `screen.releaseScreen()` once you are done.

    - When `debugPaintRects` is on, the renderer will use random background colors to help you detect which parts of the screen have been redrawn. Check the section below for more information.

  - `new TermElement()`

    - Each other term element is a subclass of `TermElement` (including `TermScreen`).

    - You can focus an element (if it actually supports being focused!) by using `element.focus()`, and blur it by using `element.blur()`.

    - Scrolling to a specific row in the element can be done by using `element.scrollRowIntoView(row, { force, block })`. The `force` option is a boolean to instruct the function to scroll even if the specified row is already in the viewport, and `block` is used to specify where should the row be aligned (top or bottom). The default value is `auto`, which means that the algorithm will automatically compute the best alignment given the current position of the row relative to the viewport.

  - `new TermText({ textContent, textBuffer, multiline })`

    - If you omit the `textBuffer` option when instanciating the element, a default one will be created and populated with the value of the `textContent` option.

    - The `textContent` property contains the actual text content of the element. You can also access it directly from the `textBuffer` property.

  - `new TermForm()`

    - Forms are used to wrap various input elements.

  - `new TermInput({ value, textBuffer, allowNewlines })`

    - If you omit the `textBuffer` option when instanciating the element, a default one will be created and populated with the value of the `value` option.

    - The `value` property contains the actual value of the element. You can also access it directly from the `textBuffer` property.

    - When enabled, `multiline` will make <kbd>enter</kbd> insert newline characters inside the element content. When disabled, <kbd>enter</kbd> keystrokes will be forwarded to the nearest `TermForm` ancestor, or ignored if there's none to be found.

  - `new TermLabel()`

    - A component that forwards clicks to the nearest focusable child.

  - `new TermRadio({ checked })`

    - Display a radio button.

---

## Developer API

### How to render elements

The MyLittleDom renderer units of work are lines. When it detects that some part of the screen needs to be redrawn, it will forward the calls to the affected elements, asking them to re-render the lines they own. The various results obtained this way will be merged together before being printed on screen. You can easily setup your elements to use your own rendering implementation by overriding a few methods, detailed below.

#### `Element.prototype.render(x, y, l)`

The engine will call this method every time some part of an element needs to be redrawn, exactly once for each line that needs to be redrawn. You can't make any assumption about the coordinates, nor about the requested length (MyLittleDom will sometimes ask your element to render only a small part of a line instead of its entirety).

The default implementation includes all the logic required to support borders and paddings, and we don't advise you to override it. Consider overriding `renderContent` instead.

#### `Element.prototype.renderContent(x, y, l)`

This method is called by the default `render` implementation when a part of the content box of the element needs to be redrawn (the content box is similar to the element box, except that it might be smaller to account for borders and paddings).

The default implementation doesn't render anything else than the background, so you can safely override it to add your own behaviour to the rendering process. To help you with this, two helper functions exist: `renderText` and `renderBackground`.

#### `element.renderText(text)`

You can call this function by passing it a string as parameter. It will return the same string wrapped into each terminal sequences required to match the `fontWeight`, `textDecoration`, `backgroundColor` and `color` style properties of the element.

Note that the `length` property of the returned string cannot be trusted to be equal to the `length` property of the input string, since the string might also contain additional invisible characters used for terminal sequences.

#### `element.renderBackground(l)`

You can call this function by passing it a number as parameter. It will return a string of the given length, using `backgroundColor` and `backgroundCharacter` style properties to generate the right sequence.

Just like for `renderText`, you can't trust the `length` property of the returned string to be equal to the requested size, since it might contain additional invisible characters used for terminal sequences.

### Tips & Tricks

#### Logging things

Because the default MyLittleDom settings use the standard output to render the screen, it might be hard to log events as they occur.

An easy workaround is to instruct MyLittleDom to use something else than the standard output. To do this, just set an `stdout` option when calling `attachScreen`, using a stream that better suits your needs. For example, the following code completely disable any kind of output from MyLittleDom (which will in turn make your `console.log` calls display properly), but doesn't prevent it from accepting inputs:

```js
let screen = new TermScreen();
screen.attachScreen({ stdout: new stream.Writable() });
```

A less radical variant is to still print the MyLittleDom strings, but encoded as JSON so that terminal sequences aren't interpreted by your terminal:

```js
let screen = new TermScreen();
screen.attachScreen({ stdout: { write: str => console.log(JSON.stringify(str)) } });
```

#### Debugging rendering passes

The `debugPaintRects` option can be set on TermScreen elements. As long as this option is enabled, the rendering process will automatically use a random background color that wil be different for each render. It makes it super-easy to quickly find out which parts of the screen have been invalidated and when they have been invalidated, which can in turn help you find memory hogs.

A small catch tho: this option has no effect on elements that have a background color (because the element background color will unfortunately override the one set by the TermScreen element).

---

## License (MIT)

> **Copyright © 2014 Maël Nison & Manaflair**
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
