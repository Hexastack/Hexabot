## NestJS WebSocket Implementation

This README provides documentation for this custom WebSocket service implementation designed to handle real-time communication efficiently. The service uses custom decorators and dynamic event dispatching to manage WebSocket connections and route events within a NestJS application as a Restful API.

### Features

- Dynamic Event Handling: Methods can be dynamically tagged to handle specific WebSocket events using custom decorators.
- Robust Exception Handling: Integrated exception handling to manage both expected and unexpected errors gracefully.
- Extensible Request Handling: Enhanced request handling through the SocketRequest class, which supports query parameters and other HTTP-like features.

### Components

The implementation consists of several components:

- SocketEventMetadataStorage: Stores event handler metadata.
- Socket[Get|Post|Put|...] Decorators: Decorates methods to handle specific HTTP verb events.
- SocketRequest & SocketResponse Classes: Parses incoming WebSocket messages and creates synthetic request and response objects.
- SocketEventDispatcherService: Dispatches events to appropriate handlers.
- Exception Handling: Manages errors and exceptions during WebSocket communication.

### Configuring WebSocket Handlers
By using "get" as event name, the message to be sent using a socket io client would have the following payload :

```json
{ "method": "get", "headers": {}, "data": {}, "url": "/example?id=1" }
```

This will eventually trigger a event "hook:socket:request:get" which will be intercepted by the appropriate listener(s) detected by the SocketEventDispatcherService. Decorate service methods in your NestJS services using the SocketGet decorator to handle specific WebSocket events:

```typescript
  @SocketGet('/example')
  handleExample(
    @SocketReq() req: SocketRequest,
    @SocketRes() res: SocketResponse,
  ) {
    if (!req.query.id) {
        throw new NotFoundException('Id not found')
    }
    console.log('Received : ', req.body);
    res.status(200).send('Hello !');
  }
```
