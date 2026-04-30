import { BitbucketClient } from 'bitbucket-datacenter-api-client';

let clientInstance = null;

export function getBitbucketClient() {
  if (!clientInstance) {
    clientInstance = new BitbucketClient({
      apiUrl: process.env.BITBUCKET_SERVER_HOST,
      apiPath: 'rest/api/latest',
      user: process.env.BITBUCKET_USER,
      token: process.env.BITBUCKET_TOKEN,
    });
  }
  return clientInstance;
}

export default getBitbucketClient;
