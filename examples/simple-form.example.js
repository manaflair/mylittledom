import { TermElement, TermText, TermInput } from '@manaflair/mylittledom/term';
import { lorem }                            from 'faker';

for (let t = 0; t < 10; ++t) {

    let container = new TermElement();
    container.style.marginTop = t > 0 ? 1 : 0;
    container.appendTo(screen);

    let n = t + 1;
    let th = n === 1 ? `st` : n === 2 ? `nd` : n === 3 ? `rd` : `th`;

    let label = new TermText({ textContent: `The ${n}${th} form entry` });
    label.style.fontWeight = `bold`;
    label.style.textDecoration = `underline`;
    label.appendTo(container);

    let input = new TermInput({ value: lorem.sentence(), multiline: true });
    input.style.marginTop = 1;
    input.appendTo(container);

}
