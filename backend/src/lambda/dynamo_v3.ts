import {
  DeleteCommand,
  DeleteCommandInput,
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { logConsole } from "../utils";

interface QueryExpression {
  condition: string;
  values: Record<string, any>;
  filter?: string;
  attributeNames?: Record<string, string>;
}


interface ScanExpression {
  filter?: string;
  values?: Record<string, any>;
  attributeNames?: Record<string, string>;
}

export const query = async <T>(
  tableName: string,
  expression: QueryExpression,
  client: DynamoDBDocumentClient,
  indexName?: string,
  handlePagination: boolean = false,
  ascendingOrder: boolean = true,
  limit: number | undefined = undefined
): Promise<Array<T>> => {
  const queryInput: {
    TableName: string;
    KeyConditionExpression: string;
    ExpressionAttributeValues: Record<string, any>;
    FilterExpression?: string;
    ExpressionAttributeNames?: Record<string, string>;
    IndexName?: string;
    ExclusiveStartKey?: Record<string, any>;
    ScanIndexForward?: boolean;
    Limit?: number;
  } = {
    TableName: tableName,
    KeyConditionExpression: expression.condition,
    ExpressionAttributeValues: expression.values,
    ScanIndexForward: ascendingOrder
  };


  if (limit) {
    queryInput.Limit = limit;
  }
  if (expression.filter) {
    queryInput.FilterExpression = expression.filter;
  }
  if (expression.attributeNames) {
    queryInput.ExpressionAttributeNames = expression.attributeNames;
  }
  if (indexName) {
    queryInput.IndexName = indexName;
  }

  let allItems: Array<T> = [];
  let lastEvaluatedKey: Record<string, any> | undefined;

  do {
    // Set the ExclusiveStartKey for pagination
    if (lastEvaluatedKey) {
      queryInput.ExclusiveStartKey = lastEvaluatedKey;
    }

    const data = await client.send(new QueryCommand(queryInput));
    logConsole.info(data)
    allItems = allItems.concat(data.Items as Array<T>);

    lastEvaluatedKey = data.LastEvaluatedKey;

    // Continue looping if handlePagination is true and there is a LastEvaluatedKey
  } while (handlePagination && lastEvaluatedKey);

  logConsole.info(`Returning ${allItems.length} items`)
  return allItems;
};

export const scan = async <T>(
  tableName: string,
  expression: ScanExpression,
  client: DynamoDBDocumentClient,
  indexName?: string,
  handlePagination: boolean = false
): Promise<Array<T>> => {
  const scanInput: {
    TableName: string;
    FilterExpression?: string;
    ExpressionAttributeValues?: Record<string, any>;
    ExpressionAttributeNames?: Record<string, string>;
    IndexName?: string;
    ExclusiveStartKey?: Record<string, any>;
  } = {
    TableName: tableName,
  };

  // Optionally add FilterExpression, ExpressionAttributeNames, IndexName
  if (expression.filter) {
    scanInput.FilterExpression = expression.filter;
  }
  if (expression.values) {
    scanInput.ExpressionAttributeValues = expression.values;
  }
  if (expression.attributeNames) {
    scanInput.ExpressionAttributeNames = expression.attributeNames;
  }
  if (indexName) {
    scanInput.IndexName = indexName;
  }

  let allItems: Array<T> = [];
  let lastEvaluatedKey: Record<string, any> | undefined;

  do {
    // Set the ExclusiveStartKey for pagination
    if (lastEvaluatedKey) {
      scanInput.ExclusiveStartKey = lastEvaluatedKey;
    }

    const data = await client.send(new ScanCommand(scanInput));
    allItems = allItems.concat(data.Items as Array<T>);

    lastEvaluatedKey = data.LastEvaluatedKey;

    // Continue looping if handlePagination is true and there is a LastEvaluatedKey
  } while (handlePagination && lastEvaluatedKey);

  return allItems;
};

export const updateItem = async (
  key: any,  // Ensure this contains the primary key
  updateValues: any,
  tableName: string,
  client: DynamoDBDocumentClient,
  conditionExpression?: string,  // Optional condition expression
  expressionAttributeValuesSub?: { [key: string]: any }, // Optional substitution values for condition expression
  expressionAttributeNamesSub?: { [key: string]: any }  // Optional substitution names for condition expression
) => {
  let updateExpression = "set ";
  let expressionAttributeNames = {} as any;
  let expressionAttributeValues = {} as any;

  // Construct the update expression, attribute names, and values
  for (const [updateKey, value] of Object.entries(updateValues)) {
    updateExpression += `#${updateKey} = :${updateKey}, `;
    expressionAttributeNames[`#${updateKey}`] = updateKey;
    expressionAttributeValues[`:${updateKey}`] = value;
  }

  // Remove trailing comma and space
  updateExpression = updateExpression.slice(0, -2);

  // Define the parameters for the update command
  const params: UpdateCommandInput = {
    TableName: tableName,
    Key: key,
    ReturnValues: "ALL_NEW",
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  // Add condition expression and its substitutions if provided
  if (conditionExpression) {
    params.ConditionExpression = conditionExpression;
    if (expressionAttributeValuesSub) {
      params.ExpressionAttributeValues = { ...expressionAttributeValues, ...expressionAttributeValuesSub };
    }
    if (expressionAttributeNamesSub) {
      params.ExpressionAttributeNames = { ...expressionAttributeNames, ...expressionAttributeNamesSub };
    }
  }

  // Create and send the update command
  const command = new UpdateCommand(params);
  return await client.send(command);
};

export const getItem = async <T>(
  pk: string,
  sk: string,
  tableName: string,
  client: DynamoDBDocumentClient
) => {
  const params = {
    TableName: tableName,
    Key: {
      PK: pk,
      SK: sk,
    },
  } as GetCommandInput;
  return (await client.send(new GetCommand(params))).Item as T | null;
};

export const createItem = async (
  pk: string,
  sk: string,
  props: Partial<any>,
  tableName: string,
  client: DynamoDBDocumentClient
) => {
  const params = {
    TableName: tableName,
    Item: {
      PK: pk,
      SK: sk,
      ...props,
    },
  } as PutCommandInput;
  await client.send(new PutCommand(params));
  return { PK: pk, SK: sk };
};

export const deleteItem = async (
  id: string,
  tableName: string,
  client: DynamoDBDocumentClient
) => {
  const params = {
    TableName: tableName,
    Key: {
      id,
    },
  } as DeleteCommandInput;
  return await client.send(new DeleteCommand(params));
};
