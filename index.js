//index.js
import serverless from 'serverless-http';
import bodyParser from 'body-parser';
import express from 'express';
import axios from 'axios';
import Redis from 'ioredis';
import cors from 'cors';
import util from 'util';
const GRAPHQL_SERVER = {
  host: 'http://takearea.me',
  port: 4000
};



const REDIS_SERVER = {
  host: 'elasticache.rb6gsb.ng.0001.apse1.cache.amazonaws.com',
  port: 6379,
  family: 4
};
const app = express();
const redis = new Redis(REDIS_SERVER);



function log(obj, depth = 4) {
  console.dir(obj, { depth });
}

app.use(bodyParser.json());
app.use(cors());


app.get('/version', async (req, res) => {


  try {
    await redis.set('hello', 'hello')
    const test =  await redis.get('hello')
    console.log('TEST: ', test)
    res.status(200).send('0.8')

  } catch(err) {
    console.log('Test failed: ', err)
  }

  axios.get('http://54.169.168.13:9111').then(res => {
    console.log('Success', res)
  }).catch(err => {
    console.log('Fail request', err)
  })
})
app.get('/', function(req, res) {
  res.send('Hello Codelynx team!!!');
});

app.post('/cache-graphql', async (req, res) => {
  console.log('---------------CACHE START-----------------');
  console.log(`---GRAPHQL_SERVER:`);
  log(GRAPHQL_SERVER);
  console.dir(`---REDIS_SERVER:`);
  // console.log(redis)
  log(REDIS_SERVER);
  if (req.method === 'OPTIONS') {
    console.log('CORS option request accepted');
    return res.status(200).send('OK');
  }
  let status = 400;
  let data = {};
  const key = JSON.stringify(req.body);
  console.log('key: ', key);

  try {
    //Get Item based on key from redis
    console.log('Fetch cache record')
    const cacheItem = await redis.get(key);
    console.log('---Cache Item: ');
    log(cacheItem);

    if (key.indexOf('mutation') > -1) {
      console.log('xxx2001', 'seems like a mutation, invalidate all cache.');
      await redis.flushdb();
      const response = await axios.post(
        `${GRAPHQL_SERVER.host}:${GRAPHQL_SERVER.port}`,
        req.body
      );
      return res.status(response.status).send(response.data);
    }

    if (cacheItem) {
      console.log('xxx2002', 'seems like a query');
      console.log('---Cache Item exists');
      return res.status(200).send(JSON.parse(cacheItem));
    } else {
      console.log('---Cache Item not exists');
      console.log(
        `---Forwarding request to GraphQL Server at ${GRAPHQL_SERVER.host}:${
          GRAPHQL_SERVER.port
        }`
      );
      try {
        const response = await axios.post(
          `${GRAPHQL_SERVER.host}:${GRAPHQL_SERVER.port}`,
          req.body
        );
        console.log('---Response received');
        const { data } = response;
        log(data);
        await redis.set(key, JSON.stringify(data)).then(() => {
          console.log('---Set Item to Elasticache');
        });
        return res.status(200).send(data);
      } catch(err) {
        console.log('Forwading request failed: ', err)
      }
    }
  } catch (error) {
    status = 400;
    console.log('---Error');
    console.log(error);
    return res.status(status).send({ errors: [{ message: error }] });
  }
});

exports.handler = serverless(app);
