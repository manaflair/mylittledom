# [![MyLittleDom](/logo.png?raw=true)](https://github.com/manaflair/mylittledom)

> High-level DOM-like terminal interface library

[![](https://img.shields.io/npm/v/@manaflair/mylittledom.svg)]() [![](https://img.shields.io/npm/l/@manaflair/mylittledom.svg)]()

[Check out our other OSS projects!](https://manaflair.github.io) • [Try out the MyLittleDom playground!](https://manaflair.github.io/mylittledom/demo/)

![](https://camo.githubusercontent.com/e297e9376f2d97869f51e40618670ca8dafe08a9/687474703a2f2f692e696d6775722e636f6d2f36583537774d6a2e676966)

## Features

  - DOM-like API (`element.appendChild()`, `element.removeChild()`, `element.parentNode`, `element.childNodes`, ...)
  - CSS-like API (`element.classList`, `element.style.display`, `element.style.backgroundColor`, ...)
  - Complex flex positioning (thanks to the awesome [Yoga](https://github.com/facebook/yoga) library!)
  - Work in Node.js but also inside web browsers (through [XTerm.js](https://github.com/sourcelair/xterm.js/))
  - Automatic text layout à-la-CSS (text-align, overflow-wrap, white-space, ...)
  - Border support, padding support, positioning support, custom rendering support ...
  - Ships with a fully-integrated React renderer

## Installation

**Warning:** MyLittleDom is definitely not yet ready to be used in production. Some dependencies haven't yet been merged into the master trunk of their respective repositories, and some parts of the public API are expected to heavily change in the future. Feel free to start hacking with it, but be aware that the final product might be very different from what you can see here.

```
$> npm install --save @manaflair/mylittledom
```

## Example (Vanilla)

<details>
<summary>Click to reveal the example</summary>

```js
import { TermElement } from '@manaflair/mylittledom/term';

let ball = new TermElement();
ball.style.position = `absolute`;
ball.style.left = 0;
ball.style.top = 0;
ball.style.width = 10;
ball.style.height = 5;
ball.style.border = `modern`;
ball.style.backgroundCharacter = `#`;
ball.appendTo(screen);

let dx = +1;
let dy = +1;

let animate = () => {

    setTimeout(animate, 1000 / 60);

    if (ball.style.left + dx >= screen.elementRect.width - ball.elementRect.width) {
        ball.style.left = screen.elementRect.width - ball.elementRect.width;
        dx = -1;
    } else if (ball.style.left + dx < 0) {
        ball.style.left = 0;
        dx = +1;
    } else {
        ball.style.left += dx;
    }

    if (ball.style.top + dy >= screen.elementRect.height - ball.elementRect.height) {
        ball.style.top = screen.elementRect.height - ball.elementRect.height;
        dy = -1;
    } else if (ball.style.top + dy < 0) {
        ball.style.top = 0;
        dy = +1;
    } else {
        ball.style.top += dy;
    }

};

animate();
```

</details>

## Example (React)

<details>
<summary>Click to reveal the example</summary>

```js
import { render }     from '@manaflair/mylittledom/term/react';
import { TermScreen } from '@manaflair/mylittledom/term';

let screen = new TermScreen();
screen.attachScreen();

render(<div>Hello world!</div>, screen);
```

</details>

---

## HTML compatibility

### Un-features

MyLittleDom does not aim to be a perfect HTML renderer and, as such, will not attempt to implement DOM or CSS features that wouldn't make sense in a terminal environment, or would simply be too complex to implement for too little gain. Some of these unimplemented features are:

  - Perfect HTML compatibility
  - Floating positioning
  - Block / Inline display
  - Font size
  - Opacity

### Major changes

For the same reasons than those exposed above, some features work a bit differently in MyLittleDom than what you could expect from a regular browser environment. Some key differences are detailed below.

#### APIs

  - Unless specified otherwise, `scrollIntoView` and its variants will automatically detect the best alignment, depending on the current location of the target. In the same spirit, the default behaviour of `scrollIntoView` and its variants is to have no effect if the target is already visible.

#### Layouts

Because MyLittleDom uses [Yoga](https://facebook.github.io/yoga/) to layout its elements, it is subject to the same limitations:

  - The only display currently supported are `display: flex` and `display: none` (using `null` instead of `"none"`).
  - In order to emulate the `display: block` behaviour, the default value for `flex-direction` is `"column"`.
  - Element layouts are computed as if they had been declared with `box-sizing: content-box`.

Additionally, the MyLittleDom renderer deviates from the CSS standard on a few additional points:

  - Fixed positioning will be applied relative to the nearest positioned element instead of the window.
  - Form inputs are strongly linked to their parent form components. For example, even if two radio component share a similar name, enabling one of them will not disable the other if they do not share the same form parent.

#### Styling

  - Unlike actual CSS properties, MyLittleDom properties are correctly typed, and expect a literal `null` instead of `"none"`.
  - In the same manner, integer values are stored and returned as such in style properties, instead of being strings.
  - Pixel units are replaced by raw numbers, but percent strings are kept as strings. No other unit is currently supported.
  - To prevent mistakes and facilitate onboarding, setting an invalid value will throw instead of being silently ignored.
  - For the same reason, setting an invalid style property will also throw an error.

### Supported CSS properties

An up-to-date list of supported CSS properties and supported values for each property can be found in the actual [source code](sources/core/style/styleProperties.js) of the repository.

---

## User API

  - **`new TermElement({ decored })`**
 
    - Each other term element is a subclass of `TermElement` (including `TermScreen`). As such, any TermElement prop can also be used on other elements (unless they strongly override it).

    - You can focus an element (if it actually supports being focused!) by using `element.focus()`, and blur it by using `element.blur()`.

    - Scrolling to a specific row in the element can be done by using `element.scrollRowIntoView(row, { force, block })`. The `force` option is a boolean to instruct the function to scroll even if the specified row is already in the viewport, and `block` is used to specify where should the row be aligned (top or bottom). The default value is `auto`, which means that the algorithm will automatically compute the best alignment given the current position of the row relative to the viewport.

    - The `decored` option can be set to `false` in order to disable any particular style set for the element, except those strongly required for the element to behave as expected. For example, you can use this option to remove the default style used by TermInput elements and display them as plain boxes instead.

  - **`new TermScreen({ debugPaintRects })`**

    - You will need to call `screen.attachScreen({ stdin, stdout })` before the screen actually prints anything (with `stdin` and `stdout` being Node.js streams). Use `screen.releaseScreen()` once you are done.

    - When `debugPaintRects` is on, the renderer will use random background colors to help you detect which parts of the screen have been redrawn. Check the section below for more information.

  - **`new TermText({ textContent, textBuffer, multiline })`**

    - If you omit the `textBuffer` option when instanciating the element, a default one will be created and populated with the value of the `textContent` option.

    - The `textContent` property contains the actual text content of the element. You can also access it directly from the `textBuffer` property.

  - **`new TermForm()`**

    - Forms are used to wrap various input elements.

  - **`new TermInput({ value, textBuffer, multiline, autoWidth, autoHeight })`**

    - Generates a user-editable textbox.

    - If you omit the `textBuffer` option when instanciating the element, a default one will be created and populated with the value of the `value` option (or an empty string if undefined).

    - The `value` property contains the actual value of the element. You can also access it directly from the `textBuffer` property. Setting this property will replace the text inside the buffer.

    - Note that since the `TermInput` class inherits from `TermElement`, you can instruct the element to not add any particular style to the element by setting the `decored` option to `false`. Useful if you want to style it yourself without having to override the native styles.

    - When enabled, the `multiline` option will make <kbd>enter</kbd> insert newline characters inside the element content. When disabled, <kbd>enter</kbd> keystrokes will be forwarded to the nearest `TermForm` ancestor, or ignored if there's none to be found.

    - When enabled, the `autoHeight` option will instruct the element to give its row count as height preference during the layout. It means that the element will try to be at least as big as its content, if allowed by the CSS rules. The `autoWidth` option does the same thing, but for the column count and the width. If these options are disabled (which is the default), the element size will completely ignore its content, just like in regular browsers.

    - A `change` event will be emitted when the text buffer gets updated.

  - **`new TermLabel()`**

    - This component will forward any click to its directly to the nearest focusable child.

    - You will usually want to put a text node and some kind of input inside the label, so that clicking on the text node will automatically forward the click event to the input.

  - **`new TermRadio({ checked })`**

    - Generates a radio input.

    - The status of the element (checked / unchecked) can be altered through the `checked` option.

    - When a radio button becomes checked, all other radio buttons sharing the same name (excepting `null`) and *located inside the same form element* will be automatically unchecked.

    - A `change` event will be emitted when the value changes because of a user action.

  - **`new TermCheckbox({ checked })`**

    - Generates a checkbox input.

    - The status of the element (checked / unchecked) can be altered through the `checked` option.

    - A `change` event will be emitted when the value changes because of a user action.

  - **`new TermButton({ textContent, textBuffer, submit })`**

    - Generates a simple button, that you can click.

    - You can instruct the TermButton to not add any particular style to the element by setting the `decored` option to `false`.

    - When pressed while the `submit` option is enabled, a `submit` event will be dispatched on the closest parent form.

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
