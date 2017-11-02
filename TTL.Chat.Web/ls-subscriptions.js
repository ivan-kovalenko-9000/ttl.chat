$(function () {
    SubscriptionManager.MonitorDomObjects(true);
    PresenceMonitor.StartMonitoringPresence(); //TODO: enable when ready
});

var SubscriptionManager = {
    SESSION_DESCRIPTOR_KEY: 'LS-Subscriptions-SessionDescriptor',
    OBJECT_ATTR: 'data-ls-o',
    //SUBSCRIPTION_CONNECTED_EVENT: 'LS-Subscription-Connected',
    //SUBSCRIPTION_DISCONNECTED_EVENT: 'LS-Subscription-Disconnected',
    SUBSCRIPTIONS_DISCONNECTED_EVENT: 'LS-Subscriptions-Disconnected',
    OBJECT_NODE_ADDED_EVENT: 'LS-Object-NodeAdded',
    OBJECT_NODE_REMOVED_EVENT: 'LS-Object-NodeRemoved',
    OBJECT_SUBSCRIBED_EVENT: 'LS-Object-Subscribed',
    OBJECT_UNSUBSCRIBED_EVENT: 'LS-Object-Unsubscribed',
    OBJECT_CREATED_EVENT: 'LS-Object-Created',
    OBJECT_INVALIDATED_EVENT: 'LS-Object-Invalidated',
    OBJECT_FINALISED_EVENT: 'LS-Object-Finalised',
    DOM_NODES_ADDED_EVENT: 'LS-Dom-NodesAdded',
    DOM_NODES_REMOVED_EVENT: 'LS-Dom-NodesRemoved',
    DomMutationObserver: {},
    MonitorDomObjects: function (startNewSession) {
        if (startNewSession) {
            SubscriptionManager.StartNewSession();
        }

        // Notify of child node changes only!
        var observerConfig = {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: false
        };

        // listen to all changes to body and child nodes
        var targetNode = document.body;

        SubscriptionManager.DomMutationObserver = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.addedNodes != undefined && mutation.addedNodes.length) {
                    $(document).trigger(SubscriptionManager.DOM_NODES_ADDED_EVENT, [mutation.addedNodes]);
                }
                if (mutation.removedNodes != undefined && mutation.removedNodes.length) {
                    $(document).trigger(SubscriptionManager.DOM_NODES_REMOVED_EVENT, [mutation.removedNodes]);
                }
            });
        });

        $(document).on(SubscriptionManager.DOM_NODES_ADDED_EVENT, SubscriptionManager.HandleDomNodesAddedEvent);
        $(document).on(SubscriptionManager.DOM_NODES_REMOVED_EVENT, SubscriptionManager.HandleDomNodesRemovedEvent);
        $(document).on(SubscriptionManager.OBJECT_NODE_ADDED_EVENT, SubscriptionManager.HandleObjectNodeAddedEvent);
        $(document).on(SubscriptionManager.OBJECT_NODE_REMOVED_EVENT, SubscriptionManager.HandleObjectNodeRemovedEvent);

        SubscriptionManager.DomMutationObserver.observe(targetNode, observerConfig);
        SubscriptionManager.MonitorHubEvents();
    },
    MonitorHubEvents: function () {
        if (!ObjectEventingHub.Bind()) {
            SubscriptionManager.Log('Failed to bind subscription hub. Object subscriptions are disabled...');
        }
    },
    StartNewSession: function () {
        //TODO: clean up subscriptions

        SubscriptionManager.ResetSession();
    },
    ResetSession: function () {
        var sessionDescriptor = new SubscriptionManager.SessionDescriptor();

        SubscriptionManager.StoreSessionDescriptor(sessionDescriptor);
    },
    ClientSupportsSessionStorage: function () {
        return (typeof (Storage) !== "undefined");
    },
    HandleDomNodesAddedEvent: function (e, nodes) {
        if (!Array.prototype.isPrototypeOf(nodes)) {
            nodes = [...nodes];
        }
        if (nodes != undefined && nodes.length) {
            nodes.forEach(function (item) {
                var objectUri;
                var jitem = jQuery(item);
                var itemObjectAttribute = jitem.attr(SubscriptionManager.OBJECT_ATTR);

                if (itemObjectAttribute != undefined && itemObjectAttribute.length) {
                    objectUri = itemObjectAttribute;
                    $(document).trigger(SubscriptionManager.OBJECT_NODE_ADDED_EVENT, [objectUri, jitem]);
                } // process current data

                var objects = jitem.find('[' + SubscriptionManager.OBJECT_ATTR + ']');

                if (objects != undefined && objects.length) {
                    objects.forEach(function (object) {
                        objectUri = object.attr(SubscriptionManager.OBJECT_ATTR);
                        $(document).trigger(SubscriptionManager.OBJECT_NODE_ADDED_EVENT, [objectUri, object]);
                    });
                } // process child data
            });
        }
    },
    HandleObjectNodeAddedEvent: function (e, objectUri, node) {
        var count = SubscriptionManager.StoreObjectIdInstance(objectUri);
        SubscriptionManager.Log('Added ' + objectUri + ". Count = " + count);
        if (count === 1) {
            SubscriptionManager.SubscribeToObjectEvents(objectUri);
        }
    },
    GetSessionDescriptor: function () {
        var sessionDescriptor = undefined;
        if (SubscriptionManager.ClientSupportsSessionStorage()) {
            var sessionDescriptorJson = sessionStorage.getItem(SubscriptionManager.SESSION_DESCRIPTOR_KEY);

            if (sessionDescriptorJson) {
                sessionDescriptor = JSON.parse(sessionDescriptorJson);
            }
        }
        return sessionDescriptor;
    },
    StoreSessionDescriptor: function (sessionDescriptor) {
        if (SubscriptionManager.ClientSupportsSessionStorage()) {
            sessionStorage.setItem(SubscriptionManager.SESSION_DESCRIPTOR_KEY, JSON.stringify(sessionDescriptor));
        }
    },
    StoreObjectIdInstance: function (objectUri) {
        var instanceCount = undefined;

        if (SubscriptionManager.ClientSupportsSessionStorage()) {
            var sessionDescriptor = SubscriptionManager.GetSessionDescriptor();

            if (sessionDescriptor != undefined) {
                var existingSubscription = undefined;

                for (var i = 0; i < sessionDescriptor.ObjectSubscriptions.length; i++) {
                    var item = sessionDescriptor.ObjectSubscriptions[i];
                    if (item[0] === objectUri) {
                        existingSubscription = item;
                        break;
                    }
                }

                if (existingSubscription == undefined) {
                    instanceCount = 1;
                    sessionDescriptor.ObjectSubscriptions.push([objectUri, instanceCount]);
                } else {
                    instanceCount = Number(existingSubscription[1]) + 1;

                    for (var x = 0; x < sessionDescriptor.ObjectSubscriptions.length; x++) {
                        var item = sessionDescriptor.ObjectSubscriptions[x];
                        if (item[0] === objectUri) {
                            item[1] = instanceCount;
                            break;
                        }
                    }
                }
            } else {
                instanceCount = 1;
                sessionDescriptor = new SubscriptionManager.SessionDescriptor();
                sessionDescriptor.ObjectSubscriptions.push([objectUri, instanceCount]);
            }

            SubscriptionManager.StoreSessionDescriptor(sessionDescriptor);
        }

        return instanceCount;
    },
    SubscribeToObjectEvents: function (objectUri) {
        ObjectEventingHub.SubscribeToObjectEvents(objectUri);
        $(document).trigger(SubscriptionManager.OBJECT_SUBSCRIBED_EVENT, [objectUri]);
        //SubscriptionManager.Log('Subscribed ' + objectUri);
    },
    HandleDomNodesRemovedEvent: function (e, nodes) {
        if (!Array.prototype.isPrototypeOf(nodes)) {
            nodes = [...nodes];
        }
        if (nodes != undefined && nodes.length) {
            nodes.forEach(function (item) {
                var objectUri;
                var jitem = jQuery(item);
                var itemObjectAttribute = jitem.attr(SubscriptionManager.OBJECT_ATTR);

                if (itemObjectAttribute != undefined && itemObjectAttribute.length) {
                    objectUri = itemObjectAttribute;
                    $(document).trigger(SubscriptionManager.OBJECT_NODE_REMOVED_EVENT, [objectUri, jitem]);
                } // process current data

                var objects = jitem.find('[' + SubscriptionManager.OBJECT_ATTR + ']');

                if (objects != undefined && objects.length) {
                    objects.forEach(function (object) {
                        objectUri = object.attr(SubscriptionManager.OBJECT_ATTR);
                        $(document).trigger(SubscriptionManager.OBJECT_NODE_REMOVED_EVENT, [objectUri, object]);
                    });
                } // process child data
            });
        }
    },
    HandleObjectNodeRemovedEvent: function (e, objectUri, node) {
        var count = SubscriptionManager.RemoveStoredObjectIdInstance(objectUri);
        SubscriptionManager.Log('Removed ' + objectUri + ". Count = " + count);
        if (count < 1) {
            SubscriptionManager.UnsubscribeFromObjectEvents(objectUri);
        }
    },
    HandleHubDisconnectedEvent: function (e) {
        var logMessage = 'Hub disconnected' + e.message;
        SubscriptionManager.Log(logMessage);

        SubscriptionManager.MonitorHubEvents();
    },
    RemoveStoredObjectIdInstance: function (objectUri) {
        var instanceCount = undefined;

        if (SubscriptionManager.ClientSupportsSessionStorage()) {
            var sessionDescriptor = SubscriptionManager.GetSessionDescriptor();

            if (sessionDescriptor != undefined) {
                var existingSubscription = undefined;

                for (var i = 0; i < sessionDescriptor.ObjectSubscriptions.length; i++) {
                    var item = sessionDescriptor.ObjectSubscriptions[i];
                    if (item[0] === objectUri) {
                        existingSubscription = item;
                        break;
                    }
                }

                if (existingSubscription == undefined) {
                    // Do nothing
                } else {
                    instanceCount = Number(existingSubscription[1]) - 1;
                    var indexToRemove = -1;
                    for (var x = 0; x < sessionDescriptor.ObjectSubscriptions.length; x++) {
                        var item = sessionDescriptor.ObjectSubscriptions[x];
                        if (item[0] === objectUri) {
                            if (instanceCount < 1) {
                                indexToRemove = x;
                            } else {
                                item[1] = instanceCount;
                            }
                            break;
                        }
                    }

                    if (indexToRemove >= 0) {
                        sessionDescriptor.ObjectSubscriptions.splice(indexToRemove, 1);
                    }
                }

                SubscriptionManager.StoreSessionDescriptor(sessionDescriptor);
            }
        }

        return instanceCount;
    },
    UnsubscribeFromObjectEvents: function (objectUri) {
        ObjectEventingHub.UnsubscribeFromObjectEvents(objectUri);
        $(document).trigger(SubscriptionManager.OBJECT_UNSUBSCRIBED_EVENT, [objectUri]);
        //SubscriptionManager.Log('Unsubscribed ' + objectUri);
    },
    DisconnectSubscriptions: function () {
        //TODO: clean up subscriptions

        SubscriptionManager.ResetSession();
    },
    PublishObjectCreationEvent: function (objectUri) {
        $(document).trigger(SubscriptionManager.OBJECT_CREATED_EVENT, [objectUri]);
    },
    PublishObjectInvalidatedEvent: function (objectUri) {
        $(document).trigger(SubscriptionManager.OBJECT_INVALIDATED_EVENT, [objectUri]);
    },
    PublishObjectFinalisedEvent: function (objectUri) {
        $(document).trigger(SubscriptionManager.OBJECT_FINALISED_EVENT, [objectUri]);
    },
    SessionDescriptor: function () {
        this.ObjectSubscriptions = [];
    },
    Log: function (message) {
        console.log('SubscriptionManager: ' + message);
    }
}

var ObjectEventingHub = {
    Hub: undefined,
    Bind: function () {
        if (ObjectEventingHub.AreHubDependenciesAvailable()) {
            var hub = $.connection.objectHub;
            hub.client.objectCreated = ObjectEventingHub.ObjectCreated;
            hub.client.objectUpdated = ObjectEventingHub.ObjectUpdated;
            hub.client.objectFinalised = ObjectEventingHub.ObjectFinalised;

            ObjectEventingHub.Hub = hub;

            $.connection.hub.start().done(function () {
                // Add post start bindings
            });

            $.connection.hub.disconnected(function () {
                SubscriptionManager.HandleHubDisconnectedEvent();
            });

            return true;
        }
        return false;
    },
    AreHubDependenciesAvailable: function () {
        if ($.connection == undefined || $.connection.objectHub == undefined) {
            return false;
        }
        return true;
    },
    IsHubLoaded: function () {
        return ObjectEventingHub.Hub != undefined;
    },
    SubscribeToObjectEvents: function (objectUri) {
        if (ObjectEventingHub.IsHubLoaded()) {
            ObjectEventingHub.Hub.server.subscribeToObjectEvents(objectUri);
            ObjectEventingHub.Log('Subscribed ' + objectUri);
        }
    },
    UnsubscribeFromObjectEvents: function (objectUri) {
        if (ObjectEventingHub.IsHubLoaded()) {
            ObjectEventingHub.Hub.server.unsubscribeFromObjectEvents(objectUri);
            ObjectEventingHub.Log('Unsubscribed ' + objectUri);
        }
    },
    ObjectCreated: function (objectUri) {
        SubscriptionManager.PublishObjectCreationEvent(objectUri);
    },
    ObjectUpdated: function (objectUri) {
        SubscriptionManager.PublishObjectInvalidatedEvent(objectUri);
    },
    ObjectFinalised: function (objectUri) {
        SubscriptionManager.PublishObjectFinalisedEvent(objectUri);
    },
    Log: function (message) {
        console.log('ObjectEventingHub: ' + message);
    }
}

var PresenceMonitor = {
    PRESENCE_ATTR: 'data-ls-pres',
    PRESENCE_STATE_ATTR: 'data-ls-pres-state',
    PRESENCE_STATE_CHANGED: 'LS-Presence-StateChanged',
    AccessToken: '',
    Monitoring: false,
    ProcessingInterval: false,
    Interval: 20000,
    StartMonitoringPresence: function () {
        if (PresenceMonitor.Monitoring) {
            return;
        }
        PresenceMonitor.Monitoring = true;
        setInterval(PresenceMonitor.ProcessMonitoringInterval, PresenceMonitor.Interval);
    },
    ProcessMonitoringInterval: function () {
        if (PresenceMonitor.ProcessingInterval) {
            return;
        }
        PresenceMonitor.ProcessingInterval = true;
        try {
            var presenceItems = $('[' + PresenceMonitor.PRESENCE_ATTR + ']').toArray();
            if (presenceItems != undefined && presenceItems.length > 0) {
                var processedItems = [];

                presenceItems.forEach(function (item) {
                    var itemPsy = $(item).attr(PresenceMonitor.PRESENCE_ATTR);

                    if (itemPsy !== undefined && itemPsy != null) {
                        itemPsy = itemPsy.toLowerCase().trim();

                        if (processedItems.indexOf(itemPsy) === -1) {
                            processedItems.push(itemPsy);

                            var itemState = $(item).attr(PresenceMonitor.PRESENCE_STATE_ATTR);

                            PresenceMonitor.CheckPresenceState(itemPsy, itemState);
                        }
                    }
                });
            }
        } catch (e) {

        } finally {
            PresenceMonitor.ProcessingInterval = false;
        }
    },
    CheckPresenceState: function (p, s) {
        if (s === undefined || s == null) {
            s = '';
        }
        s = s.toLowerCase().trim();

        jQuery.ajax({
            url: 'https://api.ticktockloans.com/api/identity/presence/' + encodeURIComponent(p),
            headers: {
                'Authorization': `Bearer ${PresenceMonitor.AccessToken}`
            },
            success: function (resp) {
                var state = resp.status;
                if (state === undefined || state == null) {
                    state = '';
                }

                state = state.toLocaleString().trim();
                if (s !== state) {
                    $(document).trigger(PresenceMonitor.PRESENCE_STATE_CHANGED, [p, state]);
                }
            },
            async: false,
            cache: false
        });
    }
}
