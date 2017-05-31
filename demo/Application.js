import './Application.css';

import { TermScreen }             from '@manaflair/mylittledom/term';
import { transform }              from 'babel-standalone';
import { autobind }               from 'core-decorators';
import * as Lodash                from 'lodash';

import { Editor }                 from './Editor';
import { Terminal }               from './Terminal';
import { Window }                 from './Window';
import { makeAnimationFunctions } from './tools';

let readme = require(`raw-loader!../README.md`).replace(/[^\x00-\x7f]/g, ``);
let rawFiles = require.context(`raw-loader!../examples/`, true, /$/);

let getPreset = require.context(`../examples/`, false, /^\.\/.*\.example\.js$/);
let getPresetName = moduleName => moduleName.replace(/^.*\/|\.[^\/]*$/g, ``);

export class Application extends React.PureComponent {

    static exposedModules = new Map([

        [ `@manaflair/mylittledom/term/react`, require(`@manaflair/mylittledom/term/react`) ],
        [ `@manaflair/mylittledom/term`,       require(`@manaflair/mylittledom/term`) ],
        [ `@manaflair/mylittledom`,            require(`@manaflair/mylittledom`) ],

        [ `core-decorators`,                   require(`core-decorators`) ],
        [ `faker`,                             require(`faker`) ],
        [ `lodash`,                            require(`lodash`) ]

    ]);

    constructor(props) {

        super(props);

        this.screen = null;

    }

    state = {

        code: `

            // Choose a demo from the picker above or just roll your own code to
            // try out OhUI! If you think you've found a bug, just share the URL
            // on a Github issue and we'll look into it. Have fun!

            import { TermText } from '@manaflair/mylittledom/term';

            let element = new TermText();
            element.style.whiteSpace = \`preWrap\`;
            element.textContent = readme;
            element.appendTo(screen);

        `.replace(/^ +| +$/gm, ``).replace(/^\n+/, ``).replace(/\n+$/, `\n`)

    };

    componentDidMount() {

        let presetName = window.location.hash.slice(1);
        let moduleName = getPreset.keys().find(moduleName => getPresetName(moduleName) === presetName);

        if (moduleName) {
            this.setRunningCode(getPreset(moduleName));
        } else if (presetName.startsWith(`custom:`)) {
            this.setRunningCode(decodeURIComponent(presetName.replace(/^custom:/, ``)));
        } else {
            this.setRunningCode(this.state.code);
        }

    }

    @autobind handlePresetChange(moduleName) {

        document.location.hash = `#${encodeURIComponent(getPresetName(moduleName))}`;

        this.setRunningCode(getPreset(moduleName));

    }

    @autobind handleCodeChange(code) {

        document.location.hash = `#custom:${encodeURIComponent(code)}`;

        this.setRunningCode(code);

    }

    setRunningCode(code) {

        this.setState({ code });

        try {

            let screen = new TermScreen({ debugPaintRects: false });
            screen.addShortcutListener(`C-r`, () => window.location.reload(), { capture: true });

            let raf = makeAnimationFunctions();

            let transpiled = `(function (env) { with(env) {${transform(code, { presets: [ `es2015`, `stage-0`, `react` ], plugins: [ `transform-decorators-legacy` ] }).code}\n} })`;
            let compiled = window.eval(transpiled);

            compiled(Object.assign(Object.create(null), {

                require: name => Application.exposedModules.get(name),
                readFileSync: path => rawFiles(path),

                setTimeout: raf.setTimeout,
                clearTimeout: raf.clearTimeout,

                setInterval: raf.setInterval,
                clearInterval: raf.clearInterval,

                requestAnimationFrame: raf.requestAnimationFrame,
                cancelAnimationFrame: raf.cancelAnimationFrame,

                setImmediate: raf.requestAnimationFrame,
                cancelImmediate: raf.cancelAnimationFrame,

                screen,

                readme

            }));

            this.refs.terminal.clear();

            if (this.screen)
                this.screen.releaseScreen();

            this.screen = window.screen = screen;
            this.screen.attachScreen({ stdin: this.refs.terminal.stdin, stdout: this.refs.terminal.stdout });

            if (this.raf)
                this.raf.stop();

            this.raf = raf;
            this.raf.start();

            this.setState({ error: null });

        } catch (error) {

            this.setState({ error });

        }

    }

    render() {

        return <div className={`Application`}>

            <div className={`Application-left`}>

                <div className={`Application-selector`}>
                    <select onChange={e => this.handlePresetChange(e.target.value)} value={getPreset.keys().find(moduleName => getPreset(moduleName) === this.state.code) || `custom`}>
                        {getPreset.keys().map(moduleName => <option key={moduleName} value={moduleName}>{getPresetName(moduleName)}</option>)}
                        <option disabled={true} style={{ fontStyle: `italic` }} value={`custom`}>custom</option>
                    </select>
                </div>

                <div className={`Application-editor`}>
                    <Editor onChange={this.handleCodeChange} value={this.state.code} />
                </div>

                {this.state.error && <div className={`Application-error`}>
                    {this.state.error.stack.replace(/^\s+/gm, ``).replace(/\n/, `\n\n`)}
                </div>}

            </div>

            <div className={`Application-right`}>

                <div className={`Application-window`}>
                    <Window>

                        <div className={`Application-terminal`}>
                            <Terminal ref={`terminal`} />
                        </div>

                    </Window>
                </div>

            </div>

        </div>;

    }

}
