import {DATA_MODE} from './config';
import {localClient} from './localClient';
import {remoteClient} from './remoteClient';

export const appClient = DATA_MODE === 'remote' ? remoteClient : localClient;
