

import express from "express";

import cors from "cors";

import AWS from "aws-sdk";

import { v4 as uuid } from "uuid";
 
/* ------------------------

   AWS CONFIG

------------------------ */

AWS.config.update({

  region: process.env.AWS_REGION || "eu-north-1",

});
 
const dynamo = new AWS.DynamoDB.DocumentClient();

const TABLE = process.env.CONTACTS_TABLE || "Contacts";
 
/* ------------------------

   APP SETUP

------------------------ */

const app = express();

app.use(express.json());

app.use(cors());
 
/* ------------------------

   HEALTH & ROOT

------------------------ */

app.get("/", (req, res) => {

  res.send("Backend API is running 🚀");

});
 
app.get("/health", (req, res) => {

  res.status(200).send("ok");

});
 
/* ------------------------

   API ROUTES

------------------------ */

const router = express.Router();
 
router.get("/contacts", async (req, res) => {

  try {

    const data = await dynamo.scan({ TableName: TABLE }).promise();

    res.json(data.Items || []);

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});
 
router.post("/contacts", async (req, res) => {

  try {

    const id = uuid();

    const item = { id, ...req.body };
 
    await dynamo.put({

      TableName: TABLE,

      Item: item,

    }).promise();
 
    res.json(item);

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});
 
router.put("/contacts/:id", async (req, res) => {

  try {

    const { id } = req.params;

    const body = req.body;

    const keys = Object.keys(body);
 
    const UpdateExpression =

      "SET " + keys.map(k => `#${k} = :${k}`).join(", ");
 
    const ExpressionAttributeNames =

      Object.fromEntries(keys.map(k => [`#${k}`, k]));
 
    const ExpressionAttributeValues =

      Object.fromEntries(keys.map(k => [`:${k}`, body[k]]));
 
    await dynamo.update({

      TableName: TABLE,

      Key: { id },

      UpdateExpression,

      ExpressionAttributeNames,

      ExpressionAttributeValues,

    }).promise();
 
    res.json({ id, ...body });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});
 
router.delete("/contacts/:id", async (req, res) => {

  try {

    await dynamo.delete({

      TableName: TABLE,

      Key: { id: req.params.id },

    }).promise();
 
    res.json({ message: "deleted" });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});
 
/* ------------------------

   MOUNT ROUTER

------------------------ */

app.use("/api", router);
 
/* ------------------------

   START SERVER (IMPORTANT)

------------------------ */

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () =>

  console.log(`API running on ${PORT}`)

);

 
