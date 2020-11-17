// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var ParseDashboard = require('parse-dashboard');
const bodyParser = require('body-parser');
const cors = require('cors');

require('dotenv').config()

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
    console.log('DATABASE_URI not specified, falling back to localhost.');
}

var allowInsecureHTTP = true;
var dashboard = new ParseDashboard({
    "allowInsecureHTTP": true,
    "apps": [{
        "serverURL": process.env.SERVER_URL,
        "appId": process.env.APP_ID,
        "masterKey": process.env.MASTER_KEY,
        "appName": process.env.APP_NAME
    }],
    "users": [{
        "user": process.env.ADMIN_USERNAME,
        "pass": process.env.ADMIN_PASSWORD
    }]
}, { allowInsecureHTTP: allowInsecureHTTP });

var api = new ParseServer({
    databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
    cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
    appId: process.env.APP_ID || 'myAppId',
    masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
    serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
    javascriptKey: process.env.JS_KEY,
    restAPIKey: process.env.REST_KEY,
    allowCustomObjectId: true,
    liveQuery: {
        classNames: ["User"] // List of classes to support for query subscriptions
    }
});
// Client-keys like the javascript key or the .NET key are not necessary with
// parse-server If you wish you require them, you can set them as options in the
// initialization above: javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();
app.use(bodyParser.json());
app.use(cors())
app.use('/parse-dashboard', dashboard);
app.use(express.static(__dirname + '/public'));

var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function () {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
