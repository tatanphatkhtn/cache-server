//index.js
import serverless from 'serverless-http';
import bodyParser from 'body-parser';
import express from 'express';
import axios from 'axios';
import Redis from 'ioredis';
import cors from 'cors';

const GRAPHQL_SERVER = {
  host: 'http://takearea.me',
  port: 4000
};
const REDIS_SERVER = {
  host: '54.169.168.13',
  port: 6379
};
const app = express();
const redis = new Redis(REDIS_SERVER);

app.use(cors());
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.send('Hello Codelynx team!!!');
});

app.post('/cache-graphql', async (req, res) => {
  console.log('---------------CACHE START-----------------');
  console.log(`GRAPHQL_SERVER: ${GRAPHQL_SERVER}`);
  console.log(`REDIS_SERVER: ${REDIS_SERVER}`);
  let status = 400;
  let data = {};
  const key = JSON.stringify(req.body);
  console.log('key: ', key);

  try {
    //Get Item based on key from redis
    const cacheItem = await redis.get(key);
    console.log('Cache Item: ', cacheItem);

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
      console.log('Cache Item exists');
      return res.status(200).send(JSON.parse(cacheItem));
    } else {
      console.log('Cache Item not exists');
      console.log('Forwarding request to GraphQL Server');
      const response = await axios.post(
        `${GRAPHQL_SERVER.host}:${GRAPHQL_SERVER.port}`,
        req.body
      );
      const { data } = response;
      console.log(data);
      redis.set(key, JSON.stringify(data));
      return res.status(200).send(data);
    }
  } catch (error) {
    status = 400;
    console.error('Error');
    console.error(error);
    return res.status(status).send({ errors: [{ message: error }] });
  }
});

exports.handler = serverless(app);
