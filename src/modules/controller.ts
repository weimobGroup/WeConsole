import type { HookScope } from '../types/common';
import type { IMpProductController, MpProductFilter } from '../types/hook';
import type { MpProduct } from '../types/product';
import { EventEmitter } from './event-emitter';
import { filter as filterList } from './util';

export class MpProductController extends EventEmitter implements IMpProductController {
    private typeMap: Record<string, Record<string, MpProduct>>;
    private typeList: Record<string, MpProduct[]>;

    constructor() {
        super();
        this.typeMap = {};
        this.typeList = {};
    }

    remove(id: string) {
        const item = this.findById(id);
        if (!item) {
            return;
        }
        const type = item.type;
        const index = this.typeList[type].indexOf(this.typeMap[type][id]);
        if (index !== -1) {
            this.typeList[type].splice(index, 1);
        }
        delete this.typeMap[type][id];
    }

    clear(type: HookScope, keepSaveIdList?: string[]) {
        const newList = [];
        const newMap = {};
        if (keepSaveIdList) {
            keepSaveIdList.forEach((id) => {
                newList.push(this.typeMap[type][id]);
                newMap[id] = this.typeMap[type][id];
            });
        }
        delete this.typeMap[type];
        delete this.typeList[type];
        this.typeMap[type] = newMap;
        this.typeList[type] = newList;
    }

    findById(id: string): MpProduct | undefined {
        const type = id.split('-')[0];
        return this.typeMap[type]?.[id];
    }

    getList(type: HookScope, filter?: MpProductFilter): MpProduct[] {
        if (!type) {
            return [];
        }
        if (!filter) {
            return [].concat(this.typeList[type]);
        }
        return filterList(this.typeList[type], filter);
    }

    create(data: Partial<MpProduct> & Required<Pick<MpProduct, 'id' | 'type'>>): MpProduct {
        return this.push(data, 'create');
    }

    change(data: Partial<MpProduct> & Required<Pick<MpProduct, 'id' | 'type'>>): MpProduct {
        return this.push(data, 'change');
    }

    private push(data: Partial<MpProduct> & Required<Pick<MpProduct, 'id' | 'type'>>, eventType: string): MpProduct {
        if (!(data.type in this.typeMap)) {
            this.typeMap[data.type] = {};
        }
        if (!(data.type in this.typeList)) {
            this.typeList[data.type] = [];
        }
        if (!(data.id in this.typeMap[data.type])) {
            this.typeMap[data.type][data.id] = data as MpProduct;
            this.typeList[data.type].push(data as MpProduct);
            this.emit(eventType, this.typeMap[data.type][data.id]);
            return this.typeMap[data.type][data.id];
        }
        Object.assign(this.typeMap[data.type][data.id], data);
        this.emit(eventType, this.typeMap[data.type][data.id]);
        return this.typeMap[data.type][data.id];
    }
}
