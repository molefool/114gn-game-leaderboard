const express = require('express');
const session = require('cookie-session');
const path = require('path');
const db = require('./database');
const routes = require('./routes');

const app = express();
const port = 3001;

app.use(express.json());
app.use(express.static('public'));
app.use(session({
    name: 'session',
    keys: ['your-secret-key'],
    maxAge: 24 * 60 * 60 * 1000 // 24小时
}));

app.use('/', routes);

app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 