import './Application.css';

import { transform }              from 'babel-standalone';
import { autobind }               from 'core-decorators';
import * as OhUICore              from 'ohui/core';
import * as OhUITerm              from 'ohui/term';
import { TermScreen }             from 'ohui/term';
import { Editor }                 from './Editor';
import { Terminal }               from './Terminal';
import { makeAnimationFunctions } from './tools';

let getPreset = require.context(`../examples/`, false, /^\.\/.*\.example\.js$/);
let getPresetName = moduleName => moduleName.replace(/^.*\/|\.[^\/]*$/g, ``);

export class Application extends React.PureComponent {

    constructor(props) {

        super(props);

        this.screen = null;

    }

    state = {

        code: `

            // Choose a demo from the picker above or just roll your own code to
            // try out OhUI! If you think you've found a bug, just share the URL
            // on a Github issue and we'll look into it. Have fun!

            let element = new TermText();
            element.contentText = \`Hello world! :)\`;
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

            let screen = new TermScreen();
            screen.addShortcutListener(`C-r`, () => window.location.reload());

            let raf = makeAnimationFunctions();

            let transpiled = `(function (env) { with(env) {${transform(code, { presets: [ `es2015` ] }).code}\n} })`;
            let compiled = window.eval(transpiled);

            let modules = { [`ohui`]: OhUICore, [`ohui/term`]: OhUITerm };
            let require = name => modules[name];

            compiled(Object.assign(Object.create(null), OhUICore, OhUITerm, {

                require,

                requestAnimationFrame: raf.requestAnimationFrame,
                cancelAnimationFrame: raf.cancelAnimationFrame,

                setImmediate: raf.requestAnimationFrame,
                cancelImmediate: raf.cancelAnimationFrame,

                screen

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

                <div className={`Application-terminal`}>
                    <Terminal ref={`terminal`} />
                </div>

            </div>

        </div>;

    }

}
