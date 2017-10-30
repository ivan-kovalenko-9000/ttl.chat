import React from "react";
import moment from "moment";

import HubsSingleton from "../messaging/hubs.singleton";

import "./chat.less";

export class ChatComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            messages: [],
            message: ""
        };

        this.sendMessage = () => {
            HubsSingleton.service.send(this.state.message);
            this.setState({ message: "" });
        };

        this.handleChange = (event) => {
            this.setState({ message: event.target.value });
        };

        HubsSingleton.service.subscribe((msg) => {
            var messages = this.state.messages;
            var currentMsg = `${moment().format("MM.DD.YYYY HH:mm")}: ${msg}`;
            messages.push(currentMsg);

            this.setState({ messages: messages });
        });
    }

    render() {
        return (
            <div className="chat">
                <p>Enter the message</p>
                <input type="text" value={this.state.message} onChange={this.handleChange} />
                <button onClick={this.sendMessage}>SEND</button>
                <ul>
                    {
                        this.state.messages.map((x, i) => {
                            return <li key={i}>{x}</li>;
                        })
                    }
                </ul>
            </div>
        )
    }
}