/* eslint-disable no-useless-call */
/* eslint-disable @typescript-eslint/member-ordering */
import type { IMpProductController } from '../../types/hook';
import { EventEmitter } from '../../modules/event-emitter';
import { getMultiplePageSyncState } from '../../modules/util';
import { HookScope } from '../../types/common';
import type { MpReaderState, ProductControllerGetter } from '../../types/reader-state';

export class ReaderStateController extends EventEmitter {
    private state: MpReaderState;
    private recording = true;
    constructor(private name: string, private productController?: IMpProductController | ProductControllerGetter) {
        super();
        this.state = {
            state: {},
            productIdList: [],
            productIdMap: {},
            keepSaveMap: {},
            topList: [],
            markMap: {}
        };
        if ((name === 'Api' || name === 'Console') && productController) {
            if (typeof productController === 'function') {
                const promise = productController();
                if (promise && (promise as Promise<IMpProductController>).then) {
                    (promise as Promise<IMpProductController>).then((res) => {
                        this.bind(res);
                    });
                } else {
                    this.bind(promise as IMpProductController);
                }
            } else {
                this.bind(productController);
            }
        }
    }

    private bind(productController: IMpProductController) {
        const name = this.name;
        const addMaterial = (id: string) => {
            const { productIdList, productIdMap } = this.state;
            if (!productIdMap[id]) {
                productIdList.push(id);
            }
        };
        const list = productController.getList();
        list.forEach((item) => {
            if (
                (item.type === HookScope.Api && name === 'Api') ||
                (item.type === HookScope.Console && name === 'Console')
            ) {
                addMaterial(item.id);
            }
        });
        const handler = (type, data) => {
            if (!this.recording) {
                return;
            }
            if (
                (data.type === HookScope.Api && name === 'Api') ||
                (data.type === HookScope.Console && name === 'Console')
            ) {
                addMaterial(data.id);
            }
        };
        productController.on('create', handler);
        productController.on('change', handler);
    }

    clearProducts() {
        this.state.productIdList = [];
        this.state.productIdMap = {};
        if (this.state.keepSaveMap) {
            this.state.productIdList = Object.keys(this.state.keepSaveMap);
        }
    }

    getProductIdList(): string[] {
        return this.state.productIdList.concat([]);
    }

    record(recording: boolean) {
        this.recording = recording;
    }

    getState(key: string, defaultVal?: any): any {
        return key in this.state.state ? this.state.state[key] : defaultVal;
    }

    setState(key: string, val: any) {
        if (!getMultiplePageSyncState().value && key !== 'showIcon') {
            return;
        }
        this.state.state[key] = val;
        this.emit('setState', {
            key,
            val,
            state: this.state.state
        });
    }

    removeState(key: string) {
        if (!getMultiplePageSyncState().value) {
            return;
        }
        const val = this.state.state[key];
        delete this.state.state[key];
        this.emit('removeState', {
            key,
            oldVal: val,
            state: this.state.state
        });
    }

    private handMap(type: string, ...args): string[] | undefined {
        const argLen = args.length;
        let map: any;
        let cancelAll: string;
        let cancel: string;
        if (type === 'keepSave') {
            map = this.state.keepSaveMap;
            cancelAll = 'cancelAllKeepSave';
            cancel = 'cancelKeepSave';
        } else if (type === 'mark') {
            map = this.state.markMap;
            cancelAll = 'cancelAllMark';
            cancel = 'cancelMark';
        } else if (type === 'top') {
            map = this.state.topList;
            cancelAll = 'cancelAllTop';
            cancel = 'cancelTop';
        }
        if (!argLen) {
            // 拿所有id
            return type === 'top' ? map : Object.keys(map);
        }
        const [id, save] = args;
        if (!id) {
            if (argLen < 2 || save !== false) {
                // 拿所有id
                return type === 'top' ? map : Object.keys(map);
            }
            if (type !== 'top') {
                // 取消全部
                // eslint-disable-next-line guard-for-in
                for (const prop in map) {
                    delete map[prop];
                }
                this.emit(cancelAll);
                return;
            }
            map.splice(0, map.length);
            this.emit(cancelAll);
            return;
        }
        if (save) {
            if (type !== 'top') {
                map[id] = 1;
                this.emit(type, {
                    id,
                    map: map
                });
                return;
            }
            (map as any[]).unshift(id);
            if (map.length > 3) {
                map.pop();
            }
            this.emit(type, {
                id,
                map
            });
        }
        if (type !== 'top') {
            delete map[id];
            this.emit(cancel, {
                id,
                map: map
            });
            return;
        }
        const index = (map as any[]).findIndex((item) => item === id);
        if (index !== -1) {
            map.splice(index, 1);
            this.emit(cancel, {
                id,
                map: map
            });
        }
    }

    keepSave(id?: string, save?: boolean): string[] | undefined {
        return this.handMap.apply(this, ['keepSave', id, save]);
    }

    mark(id?: string, save?: boolean): string[] | undefined {
        return this.handMap.apply(this, ['mark', id, save]);
    }

    top(id?: string, save?: boolean): string[] | undefined {
        return this.handMap.apply(this, ['top', id, save]);
    }
}
