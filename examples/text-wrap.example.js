import { autobind } from 'core-decorators';
import { lorem }    from 'faker';
import { render }   from 'ohui/term/react';

class ControlPanel extends React.PureComponent {

    static styles = {

        position: `absolute`,

        left: 4,
        bottom: 2,

        border: `modern`

    };

    render() {

        return <div style={ControlPanel.styles}>

            <div style={{``}}>
                Test
            </div>

        </div>;

    }

}

class Example extends React.PureComponent {

    static styles = {

        position: `relative`,

        width: `100%`,
        height: `100%`

    };

    render() {

        return <div style={Example.styles}>

            <ControlPanel />

            {lorem.paragraphs(25)}

        </div>;

    }

}

render(<Example />, screen);
