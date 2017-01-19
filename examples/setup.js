import { TermScreen }      from '@manaflair/mylittledom/term';
import faker               from 'faker';
import { registerHandler } from 'segfault-handler';

registerHandler();

faker.seed(42);

let stdout = Object.create(process.stdout);
//stdout.write = str => console.log(JSON.stringify(str));
//stdout.write = () => {};

global.screen = new TermScreen({ debugPaintRects: true });
global.screen.attachScreen({ stdout });
