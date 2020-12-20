// IMPORTS
const express = require('express')
const { Tracer } = require('zipkin');
const { BatchRecorder, jsonEncoder: {JSON_V2} } = require('zipkin');
const { HttpLogger } = require('zipkin-transport-http');
const CLSContext = require('zipkin-context-cls');

// CRIA SERVIDOR HTTP
server = express();
// RETORNO FORMATO JSON
server.use(express.json());

// TRACER
const ctxImpl = new CLSContext();
const recorder = new BatchRecorder({
  logger: new HttpLogger({
    endpoint: `http://localhost:9411/api/v2/spans`,
    jsonEncoder: JSON_V2
  })
});

const tracer = new Tracer({ ctxImpl, recorder, localServiceName:'SERVICE-A'});

// MIDDLEWARE
const zipkinMiddleware = require('zipkin-instrumentation-express').expressMiddleware;

server.use(zipkinMiddleware({tracer}));

// CONTROLLERS
function sleep(milliseconds) {
    const start = new Date().getTime();
    while(true) 
        if ((new Date().getTime() - start) > milliseconds) break;
}

function HelloWorld() {
    return { Message: "Hello World  (SERVICE A)" };
}

function HelloWorldTrack() {
    let ret;
    tracer.local('hello', function() {
        ret = HelloWorld();
    });
    return ret;
}


// ROTAS
server.get('/', (request, response) => {
    const ret = HelloWorldTrack();
    return response.json(ret);
});

// RODA SERVIDOR
server.listen(9000, () => {
    console.log('📢️ Service A running at 9000');
});