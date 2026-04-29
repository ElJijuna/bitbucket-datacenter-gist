import { EventEmitter } from 'events';

const logEmitter = new EventEmitter();
logEmitter.setMaxListeners(100);

export { logEmitter };
