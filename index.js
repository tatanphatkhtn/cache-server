//index.js
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const AWS = require('aws-sdk');
const axios = require('axios');
const CACHE_TABLE = process.env.CACHE_TABLE;

const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDb;
if (IS_OFFLINE === 'true') {
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  });
} else {
  dynamoDb = new AWS.DynamoDB.DocumentClient();
}

app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.send('Hello Codelynx team!!!');
});

app.post('/cache-graphql', async (req, res) => {
  console.log('---------------CACHE START-----------------');
  console.log('body: ', req.body);
  const key = JSON.stringify(req.body);
  let status = 400;
  let data = {};

  console.log('key: ', key);

  try {
    //Get Item based on key
    const params = {
      KeyConditions: {
        key: {
          ComparisonOperator: 'EQ',
          AttributeValueList: [key]
        }
      },
      TableName: CACHE_TABLE
    };
    let result = null;
    result = await dynamoDb.query(params).promise();
    console.log('Get item successfully');
    console.log(result);

    if (result.Items.length > 0) {
      //Item exists
      console.log('--------Item exists---------');
      const item = result.Items[0];
      console.log('item');
      console.log(item);
      return res.status(200).send({ data: item.value });
    } else {
      console.log('--------Item not exists--------');
      //Item not exists
      //Proxy to API
      const response = await axios.post(
        'http://master.take247.co.il/graphql',
        req.body
      );
      const { status, data } = response;

      console.log('---------Cache Update----------');
      //Update cache
      const params = {
        Key: {
          key: key
        },
        UpdateExpression: 'set #value = :value',
        ExpressionAttributeNames: {
          '#value': 'value'
        },
        ExpressionAttributeValues: {
          ':value': data
        },
        TableName: CACHE_TABLE
      };
      dynamoDb.update(params).promise();
      return res.status(status).send(data);
    }
  } catch (error) {
    status = 400;
    console.error('Error');
    console.error(error);
    return res.status(status).send({ errors: [{ message: error }] });
  }

  /* dynamoDb.scan(params, (error, result) => {
    console.log("Scan result: ", result);
    if (error) {
      console.log(error);
      return res.status(400).json({ error: "Could not get allcache" });
    }
    if (result.Items) {
      const cache = result.Items.reduce((acc, cur) => {
        console.log("acc", acc);
        console.log("cur", cur);
        acc[cur.key] = cur.result;
        return acc;
      }, {});
      console.log("Cache: ", cache);
      if (cache[key]) {
        console.log("xxx1006", "found in cache.");
        data = cache[key];

        //TODO: subscibe to dynamoDB changes or retry promise
        if (data === "pending") {
          console.log("retry request");
          setTimeout(() => {
            const params = {
              TableName: CACHE_TABLE,
              Key: {
                key
              }
            };
            dynamoDb.get(params, (error, data) => {
              if (error) {
                return res
                  .status(400)
                  .json({ error: "Could not create cache" });
              }
              res.json({ key, result: data });
            });
          }, 1000);
        }
      } else {
        try {
          console.log("xxx1001", "posting to master.take247.co.il/graphql");
          console.log("xxx1002", req.body);
          const response = axios.post(
            "http://master.take247.co.il/graphql",
            req.body
          );

          response
            .then(res => {
              console.log("Response data: ", res.data);

              const params = {
                TableName: CACHE_TABLE,
                UpdateExpression: "set result = :data",
                ExpressionAttributeValues: {
                  ":data": res.data
                }
              };

              dynamoDb.update(params, error => {
                console.log("Write new cache");
              });
            })
            .catch(err => {
              console.log("Query to galaxy failed: ", err);
            });
          const params = {
            TableName: CACHE_TABLE,
            Item: {
              key,
              result: "pending"
            }
          };

          dynamoDb.put(params, error => {
            if (error) {
              console.log(error);
              return res.status(400).json({ error: "Could not create cache" });
            }
          });

          // cache[key] = response;
          // data = (await cache[key]).data;
          // status = (await cache[key]).status;
          // console.log("xxx1003", status)
        } catch (e) {
          console.log("xxx3001 maybe an exception ", e);
          if (e.response) {
            data = e.response.data;
            status = e.response.status;
          }
        }
      }
      console.log("xxx4001", status, JSON.stringify(data).length);
      return res.status(status).send({ key, result: "pending" });
    } else {
      res.status(404).json({ error: "cache not found" });
    }
  }); */
});

// app.get('/gqlcache', function (req, res) {

// })

// app.post('/gqlcache', function (req, res) {
//     const { query, result } = req.body;

//     if (typeof query !== 'string') {
//         res.status(400).json({ error: '"query" must be a string', data: { query, result } });
//     }

// })

module.exports.handler = serverless(app);
