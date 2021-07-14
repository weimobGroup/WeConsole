import { EventEmitter } from './event-emitter';
import { wcScopeSingle } from './util';

const ev = wcScopeSingle<EventEmitter>('Ebus', () => new EventEmitter()) as EventEmitter;
export const on = ev.on;
export const off = ev.off;
export const emit = ev.emit;
export const once = ev.once;
export const ebus = ev;
