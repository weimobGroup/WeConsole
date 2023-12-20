import type { RequireId } from '../types/common';
import type { IMpProductController, MpProductFilter } from '../types/hook';
import type { MpProduct } from '../types/product';
import { EventEmitter } from './event-emitter';
import { filter as filterList } from './util';

export class MpProductController extends EventEmitter implements IMpProductController {
    private map: { [prop: string]: MpProduct };
    private list: MpProduct[];
    constructor() {
        super();
        this.map = {};
        this.list = [];
    }

    getList(filter?: MpProductFilter): MpProduct[] {
        if (!filter) {
            return [].concat(this.list);
        }
        return filterList(this.list, filter);
    }

    create(data: Partial<MpProduct> & RequireId<string>): MpProduct {
        if (!this.map[data.id]) {
            this.map[data.id] = data as MpProduct;
            this.list.push(data as MpProduct);
        }
        Object.assign(this.map[data.id], data);
        this.emit('create', this.map[data.id]);
        return this.map[data.id];
    }

    change(data: Partial<MpProduct> & RequireId<string>): MpProduct {
        if (!this.map[data.id]) {
            this.map[data.id] = data as MpProduct;
            this.list.push(data as MpProduct);
        }
        Object.assign(this.map[data.id], data);
        this.emit('change', this.map[data.id]);
        return this.map[data.id];
    }
}
