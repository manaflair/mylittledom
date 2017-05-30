import './Window.css';

export class Window extends React.PureComponent {

    static propTypes = {

        title: React.PropTypes.string,

        children: React.PropTypes.node

    };

    static defaultProps = {

        title: `CSS OS X Yosemite Window`

    };

    render() {

        return <div className={`Window`}>

            <div className={`Window-titlebar`}>

                <div className={`Window-buttons`}>
                    <div className={`Window-close`} />
                    <div className={`Window-minimize`} />
                    <div className={`Window-zoom`} />
                </div>

                {this.props.title}

            </div>

            <div className={`Window-content`}>
                {this.props.children}
            </div>

        </div>;

    }

}
