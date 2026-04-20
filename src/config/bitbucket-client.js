import { BitbucketClient, Security } from 'bitbucket-datacenter-api-client';

export function initializeBitbucketClient() {
    const security = new Security(
        process.env.BITBUCKET_API_HOST,
        process.env.BITBUCKET_USER,
        process.env.BITBUCKET_TOKEN,
    );
    const client = new BitbucketClient(security);

    return client;
}

let clientInstance = null;

export function getBitbucketClient() {
    if (!clientInstance) {
        clientInstance = initializeBitbucketClient();
    }
    return clientInstance;
}

export default getBitbucketClient;
