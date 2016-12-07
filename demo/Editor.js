import 'codemirror/addon/selection/active-line';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/theme/monokai.css';
import './Editor.css';

import { autobind } from 'core-decorators';
import CodeMirror   from 'react-codemirror';
import Measure      from 'react-measure';

export class Editor extends React.PureComponent {

    static propTypes = {

        value: React.PropTypes.string.isRequired,

        onChange: React.PropTypes.func

    };

    @autobind handleResize(dimensions) {

        if (!this.refs.editor)
            return;

        let codeMirror = this.refs.editor.getCodeMirror();

        codeMirror.setSize(dimensions.width, dimensions.height);
        codeMirror.refresh();

    }

    render() {

        return <div className={`Editor`}>

            <Measure onMeasure={this.handleResize}>

                <div className={`Editor-inner`}>

                    <CodeMirror ref={`editor`} options={{ theme: `monokai`, mode: `javascript`, lineNumbers: true, styleActiveLine: true }} onChange={this.props.onChange} value={this.props.value} />

                </div>

            </Measure>

        </div>;

    }

}
