import React from 'react';
import { render } from 'react-dom';
import { TestComponent } from "./test-component/test.jsx";

class App extends React.Component {
    render() {
        return (
            <div>
                <p> Hello React project</p>
                <TestComponent />
            </div>
        );
    }
}

render(<App />, document.getElementById('app'));