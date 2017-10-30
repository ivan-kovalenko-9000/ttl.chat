using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR;

namespace TTL.Chat.Web.hubs
{
    public class ChatHub : Hub
    {
        public void send(string message)
        {
            Clients.All.applyMessage(message);
        }
    }
}