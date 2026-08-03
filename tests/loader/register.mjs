/** Registra il resolve hook dei test. Usato con `node --import`. */

import { register } from 'node:module';

register('./ts-extension-resolve.mjs', import.meta.url);
