import { lorem }                            from 'faker';
import { TermElement, TermText, TermInput } from 'ohui/term';

let container = new TermElement();
container.style.position = `relative`;
container.style.paddingLeft = 4;
screen.appendChild(container);

let input = new TermInput({ allowNewlines: true });
input.style.backgroundCharacter = ` `;
input.style.backgroundColor = null;
input.style.height = `auto`;
input.style.maxHeight = `100%`;
input.value = lorem.paragraphs(5);
container.appendChild(input);

let lines = new TermElement();
lines.style.position = `absolute`;
lines.style.left = 0;
lines.style.top = 0;
lines.style.bottom = 0;
lines.style.width = 4;
lines.style.backgroundColor = `red`;
lines.renderContent = (x, y, l) => `${y + input.scrollTop}`.padEnd(4).substr(x, l);
container.appendChild(lines);

input.addEventListener(`scroll`, () => {
    lines.setDirtyRenderingFlag();
});
