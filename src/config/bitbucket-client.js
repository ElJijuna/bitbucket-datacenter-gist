import BitbucketDataCenterClient from 'bitbucket-datacenter-api-client';

export function initializeBitbucketClient() {
    const client = new BitbucketDataCenterClient({
        baseUrl: process.env.BITBUCKET_API_HOST,
        username: process.env.BITBUCKET_USER,
        password: process.env.BITBUCKET_TOKEN,
    });

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
