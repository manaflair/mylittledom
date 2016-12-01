# OhUI

> DOM-like terminal application framework

## Features

  - DOM-like API (`element.appendChild()`, `element.removeChild()`, `element.parentNode`, `element.childNodes`, ...)
  - CSS-like API (`element.style.display`, `element.style.position`, `element.style.backgroundColor`, ...)
  - Border support, padding support, positioning support, custom rendering support ...

## Example

```js
import { TermScreen, TermElement } from 'ohui';

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

## HTML compatibility

### Un-features

OhUI does not aim to be a perfect HTML renderer and, as such, will not attempt to implement DOM or CSS features that wouldn't make sense in a terminal environment, or would simply be too complex to implement for too little interest. Some of these unimplemented features are:

  - HTML compatibility
  - Floating positioning
  - Inline display
  - Font size

### Major changes

For the same reasons than those highlighted above, some features work a bit differently than what you could expect from a regular browser environment. Some key differences are:

#### APIs

  - Unless specified otherwise, `scrollIntoView` and its variants will automatically select between aligning to the top or bottom of the scrollable ancestors depending on the current location of the target.
  - In the same spirit, unless specified otherwise, `scrollIntoView` and its variants will have no effect if the target is already visible. Use the `force: true` option to disable this behaviour.
  - The `getAttribute` and `setAttribute` functions differ from their browser counterparts in that they can store actual JavaScript objects (rather than only strings).

#### Layouts

  - Margins do not collapse, except between siblings
  - Elements size have the same effect as if they had been declared with `box-sizing: content-box`
  - Fixed positioning will be applied relative to the nearest positioned element instead of the window

#### Styling

  - Unlike actual CSS properties, OhUI properties are correctly typed, and expect a literal `null` instead of `"none"`
  - In the same fashion, integer values are stored and returned as such in style properties, instead of being strings
  - To prevent mistakes and facilitate onboarding, setting an invalid value will throw instead of being silently ignored

### Supported CSS properties

An up-to-date list of supported CSS properties and supported values for each property can be found in the actual [source code](sources/core/style/styleProperties.js) of the repository.

## User API

  - `new TermScreen({ debugPaintRects })`

    - You will need to call `screen.attachScreen({ stdin, stdout })` before the screen actually prints anything (with `stdin` and `stdout` being Node.js streams). Use `screen.releaseScreen()` once you are done.
    - When `debugPaintRects` is on, the renderer will use random background colors to help you detect which parts of the screen have been redrawn. Check the section below for more information.

  - `new TermText({ textContent, textBuffer })`

    - If you omit the `textBuffer` option when instanciating the element, a default one will be created and populated with the value of the `textContent` option.
    - The `textContent` property contains the actual text content of the element. You can also access it directly from the `textBuffer` property.

  - `new TermInput({ value, textBuffer, allowNewlines })`

    - If you omit the `textBuffer` option when instanciating the element, a default one will be created and populated with the value of the `value` option.
    - The `value` property contains the actual value of the element. You can also access it directly from the `textBuffer` property.
    - When enabled, `allowNewlines` will permit the element to add newline characters to the value. When disabled, <kbd>enter</kbd> keystrokes will be ignored.
    - This element has a min-height

## Developer API

### How to render elements

OhUI uses lines as first-class citizens. When part of the screen need to be redrawn, it will ask your elements to render the lines they own, and will print the resulting strings on screen. You can use your own render implementation by overriding a few methods, detailed below.

#### `Element.prototype.render(x, y, l)`

OhUI will call this method every time it needs to redraw part of an element, once for each line that needs to be redrawn. You can't make any assumption about the coordinates, nor about the length (OhUI will sometimes ask your to render only a small part of a line instead of all of it).

The default implementation includes all the logic required to support borders and paddings, and we don't advise you to alter it. Consider overriding `renderContent` instead.

#### `Element.prototype.renderContent(x, y, l)`

This method is called by the default `render` implementation when a part of the content box of the element needs to be redrawn (the content box is similar to the element box, except that it might be smaller to account for borders and paddings).

The default implementation doesn't render anything else than the background, so you can safely override it to add your own behaviour to the rendering process. To help you with this, two helper functions exist: `renderText` and `renderBackground`.

#### `element.renderText(text)`

You can call this function by passing it a string as parameter. It will return the same string, except that it will account for the `backgroundColor` and `color` style properties by adding the required terminal sequences.

Note that the `length` property of the returned string cannot be trusted to be equal to the `length` property of the input string, since the string might contain additional invisible characters used for terminal sequences.

#### `element.renderBackground(l)`

You can call this function by passing it a number as parameter. It will return a string of the given length, using `backgroundColor` and `backgroundCharacter` style properties to generate the right sequence.

Just like for `renderText`, you can't trust the `length` property of the returned string to be equal to the requested size, since the string might contain additional invisible characters used for terminal sequences.

### Layout hooks

During the layout process, OhUI might need to get input from the elements to help decide how large should the final element be. It does so by triggering "hooks", methods that are designed to be reimplemented by each component.

#### `element.prototype.prepareForLayout()`

This method is called right before the layout process actually start on the context element. You can use it to setup internal values that will be used to compute the preferred width and/or height in the following hooks. You obviously cannot use any rect properties yet, because they haven't yet been updated. Any access will yield out-of-date values.

#### `element.prototype.getPreferredContentWidth()`

This method is used to ask the element for its preferred content width. It will only be called if this value is required by the layout algorithm (so for example on a "position: absolute; left: 0; right: auto" element). You still cannot use any rect here, because they may or may not have been computed yet. Any access will result in an undefined behaviour.

For example, a text editor widget would use this hook to return the number of columns in the editor should the text not wrap.

#### `element.prototype.getPreferredContentHeight()`

This method is used to ask the element for its preferred content width. It will only be called if this value is required by the layout algorithm (which is the case for most elements without explicit height). You can access this element's rects' "width" properties, since they are guaranteed to have already been computed when this function is called.

For example, a text editor widget would use this hook to return the number of rows in the editor given the maximal line size being set to "contentRect.width", soft wraps included.

#### `element.prototype.finalizeHorizontalAxis()`

This method is called once we've found out every horizontal-axis-properties from this element's rects. You can freely use the "x" and "width" properties of both elementRect and contentRect. Note that you CANNOT use the element's "y" and "height" properties, from any rect! The horizontal axis might be computed before the vertical one in some cases, such as if the width uses a fixed size but the height doesn't.

For example, a text editor would use this hook to wrap its content according to the "contentBox.width" property. Note that it cannot do this before (such as during "getPreferredContentWidth"), because 1/ getPreferredContentWidth shouldn't have any observable side effect, and 2/ the final size might not be equal to the preferred size (for example if min-width / max-width are set).

#### `element.prototype.finalizeVerticalAxis()`

This method is called once we've found out every vertical-axis-properties from this element's rects. You can freely use the "y" and "height" properties of both elementRect and contentRect. Note that you CANNOT use the element's "x" and "width" properties, from any rect! The vertical axis might be computed before the horizontal one in some cases, such as if the height uses a fixed size but the width doesn't.

A text editor wouldn't have anything special to do there, the hook mainly exists for consistency with the other ones.

#### `element.prototype.getInternalContentWidth()`

This method will be called once the layout has been fully computed, and should return the internal width of the element, which will then be used to compute the scroll box.

For example, a text editor would probably want to return the number of columns after which the text would wrap.

#### `element.prototype.getInternalContentHeight()`

This method will be called once the layout has been fully computed, and should return the internal height of the element, which will be used to compute the scroll box.

For example, a text editor would probably want to return the total amount of lines in the text buffer, soft wraps included.

### Tips

#### Logging things

Because the default OhUI settings use the standard output to render the screen, it might be hard to log events as they occur.

An easy workaround is to instruct OhUI to use something else than the standard output. To do this, just set an `stdout` option when calling `attachScreen`, using a stream that better suits your needs. For example, the following code completely disable any kind of output from OhUI (which will in turn make your `console.log` calls display properly), but doesn't prevent it from accepting inputs:

```js
let screen = new TermScreen();
screen.attachScreen({ stdout: new stream.Writable() });
```

A less radical variant is to still print the OhUI strings, but encoded as JSON so that terminal sequences aren't interpreted by your terminal:

```js
let screen = new TermScreen();
screen.attachScreen({ stdout: { write: str => console.log(JSON.stringify(str)) } });
```

#### `debugPaintRects`

The `debugPaintRects` option can be set on TermScreen elements. As long as this option is enabled, the rendering process will automatically use a random background color that wil be different for each render. It makes it super-easy to quickly find out which parts of the screen have been invalidated and when they have been invalidated, which can in turn help you find memory hogs.

A small catch tho: this option has no effect on elements that have a background color (because the element background color will unfortunately override the one set by the TermScreen element).

## License (MIT)

> **Copyright © 2014 Maël Nison**
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
