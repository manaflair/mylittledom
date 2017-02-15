import { TermElement } from '@manaflair/mylittledom/term';
import { makeRuleset } from '@manaflair/mylittledom';

let testStyle = makeRuleset({

    marginLeft: 2

}, `:firstChild`, {

    marginLeft: 0

});

let container = new TermElement();
container.style.flexDirection = `row`;
container.style.width = `100%`;
container.style.height = `100%`;
container.appendTo(screen);

let left = new TermElement();
left.classList.assign([ testStyle ]);
left.style.flex = 1;
left.style.height = `100%`;
left.style.border = `modern`;
left.appendTo(container);

let center = new TermElement();
center.classList.assign([ testStyle ]);
center.style.flex = 4;
center.style.height = `100%`;
center.style.border = `modern`;
center.appendTo(container);

let right = new TermElement();
right.classList.assign([ testStyle ]);
right.style.flex = 1;
right.style.height = `100%`;
right.style.border = `modern`;
right.appendTo(container);
