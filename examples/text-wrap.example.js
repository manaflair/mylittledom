import { autobind } from 'core-decorators';
import { lorem }    from 'faker';
import { pick }     from 'lodash';
import { render }   from 'ohui/term/react';

class ControlPanel extends React.PureComponent {

    static propTypes = {

        onChange: React.PropTypes.func

    };

    static defaultProps = {

        onChange: () => {}

    };

    static styles = {

        position: `absolute`,

        left: 4,
        bottom: 2,

        border: `modern`,

        padding: [ 1, 2 ]

    };

    static properties = {

        overflowWrap: [ `normal`, `breakWord` ],

        textAlign: [ `left`, `center`, `right`, `justify` ],

        whiteSpace: [ `normal`, `noWrap`, `pre`, `preWrap`, `preLine` ]

    };

    @autobind handleChange(property, name) {

        this.props.onChange(property, name);

    }

    render() {

        return <form style={ControlPanel.styles}>

            {Object.keys(ControlPanel.properties).map((property, index) =>

                <div key={property} style={{ marginTop: index > 0 ? 1 : 0 }}>

                    <text textContent={property} style={{ marginBottom: 1, fontWeight: `bold`, textDecoration: `underline` }} />

                    {ControlPanel.properties[property].map(value =>

                        <label key={value} style={{ flexDirection: `row` }}>
                            <radio name={property} style={{ marginRight: 1, flex: null }} onChange={() => this.handleChange(property, value)} />
                            {value}
                        </label>

                    )}

                </div>

             )}

        </form>;

    }

}

class Example extends React.PureComponent {

    static styles = {

        position: `relative`,

        width: `100%`,
        height: `100%`

    };

    state = {

        text: lorem.paragraphs(60),

        overflowWrap: `normal`,
        textAlign: `right`,
        whiteSpace: `normal`

    };

    @autobind handleStyleChange(property, value) {

        this.setState({ [property]: value });

    }

    render() {

        return <div style={Example.styles}>

            <ControlPanel onChange={this.handleStyleChange} />

            <text textContent={this.state.text} style={pick(this.state, `overflowWrap`, `textAlign`, `whiteSpace`)} />

        </div>;

    }

}

render(<Example />, screen);
