import { TermScreen }      from '@manaflair/mylittledom/term';
import faker               from 'faker';
import { readFileSync }    from 'fs';
import { registerHandler } from 'segfault-handler';
import yargs               from 'yargs';

// Extract the options from the command line

let argv = yargs

    .boolean(`debugPaintRects`)
    .default(`debugPaintRects`, false)

    .argv;

// Register the segfault handler, just in case

registerHandler();

// Use a static seed so that everybody will get the same output

faker.seed(42);

// Hook the output depending on the command line options

let stdout = undefined;

if (argv.output === undefined) {
    stdout = process.stdout;
} else if (argv.output === `encoded`) {
    stdout = Object.assign(Object.create(process.stdout), { write: str => console.log(JSON.stringify(str)) });
} else if (argv.output === false) {
    stdout = Object.assign(Object.create(process.stdout), { write: str => undefined });
} else {
    throw new Error(`Failed to execute: Invalid output '${argv.output}'.`);
}

// Setup the screen

global.screen = new TermScreen({ debugPaintRects: argv.debugPaintRects ? true : false });
global.screen.attachScreen({ stdout });

// Expose a few functions that can be used by the various examples

global.readFileSync = path => readFileSync(path).toString();
