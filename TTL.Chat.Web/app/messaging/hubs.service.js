export class HubsService {
    constructor() {
        this.connection = $.hubConnection();
        this.hubProxy = this.connection.createHubProxy("chatHub");
        this.isStarted = false;

        this.chatEventHandlers = [];

        this.hubProxy.on("applyMessage", (msg) => {
            for (let handler of this.chatEventHandlers) {
                if (typeof (handler) === "function") {
                    handler(msg);
                }
            }
        });

        this.connection
            .start()
            .done(() => {
                this.isStarted = true;
            });
    }

    send(message) {
        if (!this.isStarted) {
            return;
        }
        this.hubProxy.invoke("send", message);
    }
    subscribe(handler) {
        if (!this.chatEventHandlers) {
            this.chatEventHandlers = [];
        }


        this.chatEventHandlers.push(handler);
    }

}