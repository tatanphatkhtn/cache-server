//index.js
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');
const axios = require('axios')
const CACHE_TABLE = process.env.CACHE_TABLE;

const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDb;
if (IS_OFFLINE === 'true') {
    dynamoDb = new AWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
    })
    // console.log(dynamoDb);
} else {
    dynamoDb = new AWS.DynamoDB.DocumentClient();
};

app.use(bodyParser.json({ strict: false }));

app.get('/', function (req, res) {
    res.send('Hello Codelynx team!!!')
})


app.post('/cache-graphql',  (req, res) => {

    console.log('Body: ', req.body)
    const key = JSON.stringify(req.body);
    let status = 400;
    let data = {};

    console.log('key: ', key)

    const params = {
        TableName: CACHE_TABLE
    }

    dynamoDb.scan(params,  (error, result) => {
        console.log('Scan result: ', result)
        if (error) {
            console.log(error);
            return res.status(400).json({ error: 'Could not get allcache' });
        }
        if (result.Items) {
            const cache = result.Items.reduce((acc, cur) => {
                return acc[cur.key] = cur.result
            }, {})
            console.log('Cache: ', cache)
            if (cache[key]) {
                console.log("xxx1006", "found in cache.")
                data = cache[key]
                
                //TODO: subscibe to dynamoDB changes or retry promise
                if(data === 'pending') {
                    setTimeout(1000, () => {
                        const params = {
                            TableName: CACHE_TABLE,
                            Key: {
                                key
                            },
                        };

                        dynamoDb.get(params, (error, data) => {
                            if (error) {
                                // console.log(error);
                                return res.status(400).json({ error: 'Could not create cache' });
                            }
                            res.json({ key, result: data });
                        });
                    })
                }

                // status = (await cache[key]).status;
            } else {
                try {
                    console.log("xxx1001", "posting to master.take247.co.il/graphql");
                    console.log("xxx1002", req.body);
                    const response = axios.post('http://master.take247.co.il/graphql', req.body);

                    response.then((data) => {
                        console.log('Response data: ', data)

                        const params = {
                            TableName: CACHE_TABLE,
                            Item: {
                                key,
                                result: JSON.stringify(data)
                            },
                        };

                        dynamoDb.put(params, (error) => {
                            console.log('Write new cache')
                        });
                    })
                    const params = {
                        TableName: CACHE_TABLE,
                        Item: {
                            key,
                            result: 'pending'
                        },
                    };

                    dynamoDb.put(params, (error) => {
                        if (error) {
                            console.log(error);
                            return res.status(400).json({ error: 'Could not create cache' });
                        }
                    });

                    // cache[key] = response;
                    // data = (await cache[key]).data;
                    // status = (await cache[key]).status;
                    // console.log("xxx1003", status)
                }
                catch (e) {
                    console.log("xxx3001 maybe an exception ", e);
                    if (e.response) {
                        data = e.response.data;
                        status = e.response.status;
                    }
                }
            }
            console.log("xxx4001", status, JSON.stringify(data).length)
            return res.status(status).send({key, result: "pending"});
        } else {
            res.status(404).json({ error: "cache not found" });
        }
    });


 
})


// app.get('/gqlcache', function (req, res) {

// })


// app.post('/gqlcache', function (req, res) {
//     const { query, result } = req.body;

//     if (typeof query !== 'string') {
//         res.status(400).json({ error: '"query" must be a string', data: { query, result } });
//     }



// })

module.exports.handler = serverless(app);