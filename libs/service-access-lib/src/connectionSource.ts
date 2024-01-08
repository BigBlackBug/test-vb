// Vendor
import axios from 'axios';
import { aws4Interceptor, CredentialsProvider } from 'aws4-axios';
import * as AxiosLogger from 'axios-logger';

// Local
import { DEFAULT_REGION } from './constants';
import { SignedConnectionSource, SignedConnection, WaymarkIdentity } from 'libs/shared-types';

/**
 * A class for obtaining Axios client connections that can be used to make signed requests to
 * API Gateway services protected by IAM security.
 *
 * If no identity is provided, the connection source will use any credentials provided by the
 * environment in which this code is running, such as AWS_* environment variables, AWS_PROFILE
 * with a credential file, or credentials provided by the ec2 metadata service (these would
 * include intrinsic credentials for a Lambda function or ec2 group that are created with
 * attached policies).
 *
 * The client connection returned by `getSignedConnection` may be used in the same fashion as
 * the default `axios` import.
 */
export class AxiosSignedConnectionSource implements SignedConnectionSource {
  private identity?: WaymarkIdentity;

  constructor(identity?: WaymarkIdentity) {
    this.identity = identity;
  }

  async getSignedConnection(): Promise<SignedConnection> {
    let credentialsProvider: CredentialsProvider;
    if (this.identity) {
      const rcp = await import('./refreshingCredentialsProvider');
      credentialsProvider = new rcp.RefreshingCredentialsProvider(this.identity);
    } else {
      const aecp = await import('./awsEnvironmentCredentialsProvider');
      credentialsProvider = new aecp.AWSEnvironmentCredentialsProvider();
    }

    const interceptor = aws4Interceptor(
      {
        region: this.identity?.region || DEFAULT_REGION,
        service: 'execute-api',
      },
      credentialsProvider,
    );

    const client = axios.create();
    client.interceptors.request.use(interceptor, AxiosLogger.errorLogger);

    return client;
  }
}
