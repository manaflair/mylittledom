import { lorem }                            from 'faker';
import { TermElement, TermRadio, TermText } from 'ohui/term';

let controls = new TermElement();
controls.style.position = `absolute`;
controls.style.left = 2;
controls.style.bottom = 1;
controls.style.border = `modern`;
controls.appendTo(screen);

let label = new TermText();
label.textContent = `Some text`;
label.style.background = `green`;
label.appendTo(controls);

let radio = new TermRadio();
radio.appendTo(controls);

let text = new TermText();
text.textContent = lorem.paragraphs(5);
text.appendTo(screen);
