const express = require('express');
const cors = require('cors');
const app  = express();
const request = require('axios');
const { token, url } = require('./config');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

app.use(express.static('mocks'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({credentials: true, origin: '*'}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-XSRF-TOKEN, credentials");

    const urlConfig = req._parsedUrl;
    const pathName = urlConfig.pathname;
    const params = urlConfig.query;
    const method = req.method.toLocaleLowerCase();
    const urlMain = `${url}${pathName}?${params}`;

    request({
        method: method,
        url: urlMain,
        params: {},
        data: req.body,
        headers: {
            'authentication': `Bearer ${token}`
        }
    })
        .then(async response => {
            const file = urlMain.replace('?null', '');
            const splitFile = file.split('/');
            const name = splitFile[splitFile.length - 1];

            if (file.includes('/js/')) {
                fs.writeFileSync(
                    path.resolve(__dirname, '../salesmessage/chrome-extension/build/static/js', name),
                    response.data,
                );
            }

            res.send(response.data);
            next();
        })
        .catch((err) => {
            res.statusCode = 200;

            if(err.response.data.status === 404) {
                readFile(pathName, next, res);
            } else {
                res.send(err.response.data);
                next();
            }
        });
});

function readFile(fileName, next, res) {
    let length = fileName.length;
    let array = fileName.split('');

    if(array[length-1] === '/') {
        delete array[length-1];

        fileName = array.join('');
    }

    fs.readFile(
        path.resolve(__dirname, `mocks/${fileName}.json`),
        {},
        (err, data) => {
            if(err) throw err;

            res.send(data.toString());
            next();
        }
    );
}

app.listen(8080, () => {
    console.log('Opened http://localhost:8080 :)');
});
