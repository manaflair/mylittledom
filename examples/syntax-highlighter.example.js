import { TermElement, TermInput, TermScrollbar, TermText } from '@manaflair/mylittledom/term';
import { SyntaxHighlighter }                               from '@manaflair/mylittledom/extra';
import { TermString }                                      from '@manaflair/term-strings/gen';
import { GrammarRegistry }                                 from 'first-mate';
import plist                                               from 'plist';

// This demo doesn't work in browser environments, since Oniguruma hasn't
// been ported yet. The plan is to compile it to asm.js, just like we did
// with Yoga & Text-Buffer, but it will take time :)

let highlighter = new SyntaxHighlighter();
highlighter.grammar.load(`javascript`, readFileSync(`${__dirname}/data/language-javascript.json`)).use();
highlighter.theme.load(`tron`, readFileSync(`${__dirname}/data/theme-tron.tmTheme`)).use();

let container = new TermElement();
container.style.height = `100%`;
screen.appendChild(container);

let mainRow = new TermElement();
mainRow.style.flexDirection = `row`;
mainRow.style.flexGrow = 1;
mainRow.style.flexShrink = 1;
container.appendChild(mainRow);

let input = new TermInput({ decored: false, multiline: true, textLayout: highlighter });
input.style.background = highlighter.theme.resolve([], `background`, null);
input.style.flex = `auto`;
input.style.whiteSpace = `pre`;
input.value = readFileSync(__filename);
mainRow.appendChild(input);

let scrollbar = new TermScrollbar({ direction: `vertical` });
scrollbar.style.flex = null;
scrollbar.style.width = 2;
scrollbar.style.height = `100%`;
scrollbar.style.backgroundColor = `#222222`;
scrollbar.style.color = `white`;
mainRow.appendChild(scrollbar);

let status = new TermElement();
status.style.flexDirection = `row`;
status.style.backgroundColor = `lightgrey`;
status.style.backgroundCharacter = `-`;
status.style.color = `black`;
status.style.height = 1;
status.style.flex = null;
container.appendChild(status);

let dialog = new TermElement();
dialog.style.flexDirection = `row`;
dialog.style.height = 1;
dialog.style.flex = null;
container.appendChild(dialog);

let statusText = new TermText();
statusText.style.margin = [ 0, 5 ];
statusText.style.flex = null;
statusText.style.padding = [ 0, 1 ];
statusText.style.background = `white`;
statusText.style.color = `black`;
statusText.textContent = `syntax-highlighter.example.js`;
status.appendChild(statusText);

let statusCaret = new TermText();
statusCaret.style.flex = null;
statusCaret.style.padding = [ 0, 1 ];
statusCaret.style.background = `lightgrey`;
statusCaret.style.color = `black`;
statusCaret.textContent = `(?,?)`;
status.appendChild(statusCaret);

input.addEventListener(`caret`, e => {
    statusCaret.textContent = `(${input.caret.y},${input.caret.x})`;
});

input.addEventListener(`layout`, e => {
    scrollbar.viewportSize = input.offsetHeight;
    scrollbar.innerSize = input.scrollHeight;
});

input.addEventListener(`scroll`, e => {
    scrollbar.position = input.scrollTop;
});
