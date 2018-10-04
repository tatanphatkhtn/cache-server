//index.js
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');
const axios = require('axios')
const CACHE_TABLE = process.env.CACHE_TABLE;
const crypto = require('crypto');
const IS_OFFLINE = process.env.IS_OFFLINE;
const dynamoDBConverter = AWS.DynamoDB.Converter
let dynamoDb;

var Redis = require('ioredis');
var redis = new Redis({
    port: 6379,
    host: '127.0.0.1',
    family: 4,
});



// if (IS_OFFLINE === 'true') {
//     dynamoDb = new AWS.DynamoDB.DocumentClient({
//         region: 'localhost',
//         endpoint: 'http://localhost:8000'
//     })
//     // console.log(dynamoDb);
// } else {
//     dynamoDb = new AWS.DynamoDB.DocumentClient();
// };

const GRAPH_API_URL = 'http://takearea.me:4000'
const secret = 'shhhhhhh!secret';
// const hash = crypto.createHmac('sha256', secret)
//                    .update('I love cupcakes')
//                    .digest('hex');

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('Hello Codelynx team!!!')
})

app.get('/cache-graphql', (req,res) => {
    res.send('hi! use POST on this route instead of GET')
})

app.post('/cache-graphql', async (req, res) => {

    console.log('Body: ', req.body)
    const queryBody = JSON.stringify(req.body)
    const key = crypto.createHmac('sha256', secret).update(queryBody).digest('hex');

    let status = 400;
    let data = {};

    console.log('key: ', key)


    const cacheRecord = await redis.get('hello')

    return console.log(cacheRecord)

    const params = {
        TableName: CACHE_TABLE,
        Key: {
            key
        }
    }

    dynamoDb.get(params,  (error, cache) => {
        // return console.log('Scan result: ', result)
        console.log(cache)
        if (error) {
            console.log(error);
            return res.status(400).json({ error: 'Could not get cache' });
        }
        if (cache.Item) {
            console.log("xxx1006", "found in cache.")
            const data = cache.Item.result
            //TODO: subscibe to dynamoDB changes or retry promise
            if(data !== 'pending') return res.json(data)
            console.log('retry request after 1 second')
            setTimeout(() => {
                const params = {
                    TableName: CACHE_TABLE,
                    Key: {
                        key
                    },
                };
                dynamoDb.get(params, (error, data) => {
                    // console.log('get: ',data)
                    if (error) {
                        return res.status(400).json({ error: 'Could not create cache' });
                    }
                    return res.json(data.Item.result);
                });
            }, 1000)
        } else {
            try {
                console.log("xxx1001", `posting to ${GRAPH_API_URL}`);
                // console.log("xxx1002", req.body);
                const response = axios.post(GRAPH_API_URL, req.body);

                response.then((gqlRes) => {
                    

                    const convertedObject = dynamoDBConverter.input(gqlRes.data)
                    const params = {
                        TableName: CACHE_TABLE,
                        Key :{
                            key
                        },
                        UpdateExpression: "set #r = :gqldata",
                        ExpressionAttributeNames: {
                            '#r': 'result'
                        },
                        ExpressionAttributeValues: {
                            ':gqldata': convertedObject
                        }
                    };
                    console.log('Converted: ', JSON.stringify(convertedObject))
                    console.log('Unconverted: ', JSON.stringify(dynamoDBConverter.output(convertedObject)))
                    dynamoDb.update(params, (error) => {
                        console.log('Write new cache',error)
                    });
                    res.json(gqlRes.data)
                }).catch((err) => {
                    console.log('Query to galaxy failed: ', err)
                })
                const params = {
                    TableName: CACHE_TABLE,
                    Item: {
                        key,
                        // query: queryBody,
                        result: 'pending'
                    },
                };
                dynamoDb.put(params, (error) => {
                    if (error) {
                        console.log(error);
                        return res.status(400).json({ error: 'Could not create cache' });
                    }
                });
            }
            catch (e) { 
                console.log("xxx3001 maybe an exception ", e);
                if (e.response) {
                    data = e.response.data;
                    status = e.response.status;
                }
            }
        }
    });
})

module.exports.handler = serverless(app);