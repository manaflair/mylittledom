import { TermElement, TermText, TermInput } from '@manaflair/mylittledom/term';
import { lorem }                            from 'faker';

let container = new TermElement();
container.style.position = `relative`;
container.style.paddingLeft = 4;
screen.appendChild(container);

let input = new TermInput({ multiline: true, autoHeight: true });
input.style.backgroundCharacter = ` `;
input.style.backgroundColor = null;
input.style.minHeight = 1;
input.style.maxHeight = `100%`;
input.style.whiteSpace = `preWrap`;
input.value = lorem.paragraphs(5).replace(/\n \r/g, `\n`);
container.appendChild(input);

let lines = new TermElement();
lines.style.position = `absolute`;
lines.style.left = 0;
lines.style.top = 0;
lines.style.bottom = 0;
lines.style.width = 4;
lines.renderContent = (x, y, l) => `${y + input.scrollTop}`.padEnd(4).substr(x, l);
container.appendChild(lines);

input.addEventListener(`scroll`, () => {
    lines.queueDirtyRect();
});
