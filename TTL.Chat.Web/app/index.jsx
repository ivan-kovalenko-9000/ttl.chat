import React from 'react';
import { render } from 'react-dom';
import { ChatComponent } from "./chat/chat.component.jsx";


class App extends React.Component {
    render() {
        return (
            <div>
                <ChatComponent />
            </div>
        );
    }
}

render(<App />, document.getElementById('app'));