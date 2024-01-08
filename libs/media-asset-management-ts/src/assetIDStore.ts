import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

import { getLogger } from 'libs/logging-ts';

import { AssetLicense } from './asset';

export class AssetStoreError extends Error {}

export type AssetIDStoreKey = Pick<AssetLicense, 'assetType' | 'source' | 'sourceAssetID'>;

export type AssetIDStoreItem = AssetIDStoreKey & {
  partitionKey: string;
  assetID: string;
};

export abstract class AssetIDStore {
  abstract delete(key: AssetIDStoreKey): Promise<void>;
  abstract retrieve(key: AssetIDStoreKey): Promise<AssetIDStoreItem>;
  abstract store(item: AssetIDStoreKey, assetID: string): Promise<void>;
}

export class DynamoDBAssetIDStore extends AssetIDStore {
  private docClient: DynamoDBDocumentClient;

  constructor(public tableName: string) {
    super();
    const thing1 = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(thing1);
  }

  protected makePartitionKey(key: AssetIDStoreKey): string {
    return `${key.source}-${key.assetType}-${key.sourceAssetID}`;
  }

  async store(key: AssetIDStoreKey, assetID: string): Promise<void> {
    const logger = getLogger({
      metadata: { service: 'DynamoDBAssetIDStore.store' },
    });
    const item = {
      ...key,
      partitionKey: this.makePartitionKey(key),
      assetID: assetID,
    };

    logger.debug('Storing asset', { table: this.tableName, item });

    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
    });

    try {
      await this.docClient.send(command);
    } catch (error) {
      throw new AssetStoreError('Could not store asset ID', { cause: error });
    }
  }

  async retrieve(key: AssetIDStoreKey): Promise<AssetIDStoreItem> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        partitionKey: this.makePartitionKey(key),
      },
    });

    try {
      const response = await this.docClient.send(command);

      return response.Item as AssetIDStoreItem;
    } catch (error) {
      throw new AssetStoreError('Could not retrieve asset ID', { cause: error });
    }
  }

  async delete(key: AssetIDStoreKey): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        partitionKey: this.makePartitionKey(key),
      },
    });

    try {
      await this.docClient.send(command);
    } catch (error) {
      throw new AssetStoreError('Could not delete asset ID', { cause: error });
    }
  }
}
