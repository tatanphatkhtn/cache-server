//index.js
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');
const axios = require('axios')
const crypto = require('crypto');
const cors = require('cors');

var Redis = require('ioredis');
var redis = new Redis({
    port: 6379,
    host: '54.169.168.13',
    family: 4,
});
const GRAPH_API_URL = 'http://takearea.me:4000'
const secret = 'shhhhhhh!secret';

app.use(bodyParser.json());
app.use(cors())
app.get('/', function (req, res) {
    res.send('Hello Codelynx team!!!')
})

app.get('/version', (req,res) => {
    res.send('0.3')
})
app.get('/cache-graphql', (req,res) => {
    res.send('hi! use POST on this route instead of GET')
})

app.post('/cache-graphql', async (req, res) => {
    if(req.method === 'OPTIONS') {
        console.log('CORS option request accepted')
        return res.status(200).send('OK')
    }
    console.log('Body: ', req.body)
    const queryBody = JSON.stringify(req.body)
    const key = crypto.createHmac('sha256', secret).update(queryBody).digest('hex');

    let status = 400;
    let data = {};

    console.log('key: ', key)

    const cacheRecord = await redis.hgetall(key)
    // console.log('Cache record: ', cacheRecord)
    if (cacheRecord && Object.keys(cacheRecord).length > 0) {
        const queryResult = cacheRecord.result
        console.log("HIT cache.")
        if(queryResult !== 'pending') return res.json(queryResult)
        console.log('retry request after 1 second')
        
        setTimeout(async () => {
            const refetchedCache = await redis.hgetall(key)
            if(refetchedCache.result) res.status(500).json({
                err:"Failed to fetch cache, try to refesh page"
            })
            res.json(JSON.parse(refetchedCache.result))
        }, 1300)

    } else {
        try {
            console.log('MISS cache')
            console.log("xxx1001", `posting to ${GRAPH_API_URL}`);
            // console.log("xxx1002", req.body);
            await redis.hmset(key, {
                query: queryBody,
                result: 'pending'
            })
            const response = axios.post(GRAPH_API_URL, req.body);
            response.then((gqlRes) => {
                res.json(gqlRes.data)
                redis.hset(key, 'result', JSON.stringify(gqlRes.data)).then(() => {
                    console.log('Update pending cache: ' + key)
                }).catch(err => {
                    console.log(`Update pending key ${key} error: `, err)
                })
            }).catch(err => {
                console.log(`Failed to post to ${GRAPH_API_URL}`,err)
            })
            // res.json()
        }
        catch (e) { 
            console.log("xxx3001 maybe an exception ", e);
            if (e.response) {
                data = e.response.data;
                status = e.response.status;
            }
            res.status(500).json('Internal error')
        }
    }
})

module.exports.handler = serverless(app);