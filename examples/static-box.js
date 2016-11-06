import { TermInput, TermScreen, TermText, TermElement } from '../sources/term';

let stdout = Object.create(process.stdout);
stdout.write = d => console.log(JSON.stringify(d));

let screen = new TermScreen({ debugPaintRects: false });
screen.attachScreen({ stdout });

let left = new TermElement();
screen.appendChild(left);
left.style.position = `absolute`;
left.style.left = 0;
left.style.width = 40;
left.style.top = 0;
left.style.bottom = 0;
left.style.border = `strong`;
left.style.padding = [ 1, 2 ];

let text = new TermText();
left.appendChild(text);
text.textContent = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin iaculis turpis a nulla ullamcorper, ac pretium justo malesuada. Sed orci sapien, consectetur ac augue ut, vestibulum pulvinar nisl. Proin a enim vitae metus auctor euismod. Pellentesque aliquet efficitur dui, non vestibulum dolor rhoncus quis. Vestibulum ultricies feugiat diam ultrices aliquet. Nullam sed congue est. Curabitur interdum metus quis orci luctus, eu ullamcorper mauris dapibus. Aenean semper est quis nulla aliquam, vel volutpat quam tincidunt. Integer nec lectus lacus. Nullam et metus lacus.\n
Aliquam eget ipsum non lectus mattis elementum fermentum quis dolor. Duis a erat eu quam volutpat malesuada. Phasellus vulputate libero augue, et cursus turpis pharetra sed. Fusce condimentum magna velit, sed tempor urna accumsan nec. Praesent sagittis laoreet purus. Phasellus feugiat felis iaculis tortor molestie interdum et eget odio. Sed feugiat nunc eget ipsum eleifend, sed semper justo interdum. Aenean dapibus tortor quis ex molestie gravida. Nulla lacinia tincidunt metus et tincidunt. Proin et finibus mi. Aliquam efficitur, lectus at pellentesque maximus, enim justo vehicula lorem, non pharetra velit nibh eu risus. Phasellus ac tortor vitae eros dapibus convallis sit amet sed sapien. Phasellus sed ex lectus. Donec non metus quis massa tincidunt pretium aliquet a magna.\n
Phasellus non ex augue. Donec orci enim, pretium vitae egestas in, porttitor quis dui. Nam bibendum mauris sit amet volutpat facilisis. Pellentesque a placerat ante, eget gravida arcu. In hac habitasse platea dictumst. Vivamus lorem enim, tincidunt ac velit pellentesque, condimentum ultricies elit. Aenean ut purus eget sem vulputate facilisis eu ut odio. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Sed sed vestibulum metus. Nulla eu lobortis justo.\n
Quisque vehicula consequat diam, id malesuada lectus ornare vitae. Suspendisse vel consequat leo. Praesent ut quam vitae sem facilisis porta varius et tellus. Vestibulum a turpis eget magna sagittis tristique. Aliquam erat volutpat. Donec porttitor orci id justo tempus, non mattis ex convallis. Cras orci diam, vestibulum in elit a, fermentum pretium mauris. Phasellus imperdiet sem id placerat efficitur. Nunc eu ipsum arcu. Vivamus at lectus lacus. Suspendisse tempus ante in nulla tristique tincidunt. Nullam tempus mauris sit amet tellus aliquam, a molestie augue aliquet. Mauris non quam sapien.\n
Phasellus volutpat odio a dolor elementum aliquam. Etiam viverra lorem ut eleifend semper. Pellentesque pretium porttitor lectus id congue. Praesent mattis porta venenatis. Integer vulputate mattis semper. Nulla hendrerit enim eget posuere maximus. Maecenas nec felis leo. Vivamus sem dolor, blandit eget libero at, tempor ultricies tellus. Fusce ac porta eros, ut pulvinar felis. Maecenas tincidunt varius tellus, nec pellentesque lacus iaculis id. Proin a lectus convallis, tempor sem sed, fringilla dui. Maecenas sagittis quam id est ornare venenatis. Ut malesuada, enim et convallis accumsan, diam erat commodo ex, a mollis metus elit sed lorem.\n
`.trim();

let right = new TermElement();
screen.appendChild(right);
right.style.position = `absolute`;
right.style.right = 0;
right.style.width = 40;
right.style.top = 0;
right.style.bottom = 0;
right.style.border = `strong`;
right.style.padding = [ 1, 2 ];

let input = new TermInput();
right.appendChild(input);
input.value = `Hello world!`;

let middle = new TermElement();
screen.appendChild(middle);
middle.style.position = `absolute`;
middle.style.left = 40;
middle.style.right = 40;
middle.style.top = 0;
middle.style.bottom = 0;
middle.style.border = `modern`;

let container = new TermElement();
middle.appendChild(container);
container.style.position = `relative`;
container.style.width = `100%`;
container.style.height = `100%`;

let ball = new TermElement();
container.appendChild(ball);
ball.style.position = `absolute`;
ball.style.left = 0;
ball.style.top = 0;
ball.style.width = 8;
ball.style.height = 4;
ball.style.borderCharacter = `modern`;

0 && (function run(dx, dy) {

    let left = ball.style.left + dx;
    let top = ball.style.top + dy;

    Object.assign(ball.style, { left, top });

    let screenWidth = container.scrollWidth;
    let screenHeight = container.scrollHeight;

    let ballWidth = ball.offsetWidth;
    let ballHeight = ball.offsetHeight;

    if (left <= 0)
        dx = +1;
    else if (left + ballWidth >= screenWidth)
        dx = -1;

    if (top <= 0)
        dy = +1;
    else if (top + ballHeight >= screenHeight)
        dy = -1;

    setTimeout(() => run(dx, dy), 1000 / 60);

}(+1, +1))
