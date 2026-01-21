import express from "express";
import cors from "cors";
import AWS from "aws-sdk";
import { v4 as uuid } from "uuid";

AWS.config.update({ region: "ap-south-1" });
const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE = "Contacts";

const app = express();
app.use(express.json());
app.use(cors());

app.get("/health", (_, res) => res.send("ok"));

// ------------------------
// API ROUTES WITH PREFIX
// ------------------------
const router = express.Router();

router.get("/contacts", async (_, res) => {
  const data = await dynamo.scan({ TableName: TABLE }).promise();
  res.json(data.Items || []);
});

router.post("/contacts", async (req, res) => {
  const id = uuid();
  const item = { id, ...req.body };
  await dynamo.put({ TableName: TABLE, Item: item }).promise();
  res.json(item);
});

router.put("/contacts/:id", async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const keys = Object.keys(body);

  const UpdateExpression = "SET " + keys.map(k => `#${k}=:${k}`).join(", ");
  const ExpressionAttributeNames = Object.fromEntries(keys.map(k => [`#${k}`, k]));
  const ExpressionAttributeValues = Object.fromEntries(keys.map(k => [`:${k}`, body[k]]));

  await dynamo.update({
    TableName: TABLE,
    Key: { id },
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  }).promise();

  res.json({ id, ...body });
});

router.delete("/contacts/:id", async (req, res) => {
  await dynamo.delete({ TableName: TABLE, Key: { id: req.params.id } }).promise();
  res.json({ message: "deleted" });
});

// mount API prefix
app.use("/api", router);

// ------------------------

app.listen(3000, () => console.log("API running on 3000"));
