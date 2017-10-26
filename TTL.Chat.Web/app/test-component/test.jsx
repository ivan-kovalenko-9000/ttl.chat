import React from "react";

export class TestComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            count: 0
        };

        this.onLike = () => {
            console.log(this);
            const state = this.state.count + 1;
            this.setState({ count: state });
        };
    }

    render() {
        return (
            <div>
                Likes: <span>{this.state.count}</span>
                <button onClick={this.onLike}>Add like</button>
            </div>
        )
    }
}