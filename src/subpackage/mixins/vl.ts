import type { RequireId } from '@/types/common';
import { MpComponentMixin } from 'typescript-mp-component';
import type {
    MpDynamicSizeVirtualListComponentExports,
    MpVirtualListComponentExports
} from '@cross-virtual-list/types';
import type { MpEvent } from '@/types/view';

type AdapterExportsMethodCallQueue<T = any> = {
    [K in keyof MpVirtualListComponentExports<T>]: Array<Parameters<MpVirtualListComponentExports<T>[K]>>;
};

export class VlMixin<
    T extends RequireId = RequireId,
    E extends MpVirtualListComponentExports<T> = MpVirtualListComponentExports<T>
> extends MpComponentMixin {
    $vlAdapterExports?: E;
    $vlAdapterExportsMethodCallQueue?: AdapterExportsMethodCallQueue;
    $vlItemState?: Record<string, any>;

    $vlOnVirtualListComponentReady(e: Required<MpEvent<E>>) {
        this.$vlAdapterExports = e.detail;
        if (this.$vlAdapterExportsMethodCallQueue) {
            Object.keys(this.$vlAdapterExportsMethodCallQueue).forEach((k) => {
                this.$vlAdapterExportsMethodCallQueue?.[k].forEach((args) => {
                    this.$vlCallExportsMethod(k as any, ...args);
                });
                delete (this.$vlAdapterExportsMethodCallQueue as any)[k];
            });
            delete this.$vlAdapterExportsMethodCallQueue;
        }
    }
    $vlCallExportsMethod<K extends keyof MpVirtualListComponentExports<T>>(
        name: K,
        ...args: Parameters<MpVirtualListComponentExports<T>[K]>
    ) {
        if (this.$vlAdapterExports) {
            (this.$vlAdapterExports[name] as any)(...args);
            return;
        }
        if (!this.$vlAdapterExportsMethodCallQueue) {
            this.$vlAdapterExportsMethodCallQueue = {
                appendItem: [],
                clear: [],
                appendItems: [],
                setList: [],
                findItemByKey: []
            };
        }
        this.$vlAdapterExportsMethodCallQueue[name].push(args);
    }
    $vlClear() {
        this.$vlCallExportsMethod('clear');
    }
    $vlSetList(val: T[]) {
        this.$vlCallExportsMethod('setList', val);
    }
    $vlAppendItem(item: T) {
        this.$vlCallExportsMethod('appendItem', item);
    }
    $vlAppendItems(items: T[]) {
        this.$vlCallExportsMethod('appendItems', items);
    }

    $vlItemSizeChange(itemId: string) {
        if (this.$vlAdapterExports) {
            (this.$vlAdapterExports as unknown as MpDynamicSizeVirtualListComponentExports).reQueryItemElementSizeByKey(
                itemId
            );
            return;
        }
        if (!this.$vlAdapterExportsMethodCallQueue) {
            this.$vlAdapterExportsMethodCallQueue = {
                appendItem: [],
                clear: [],
                appendItems: [],
                setList: [],
                findItemByKey: []
            };
        }
        (this.$vlAdapterExportsMethodCallQueue as any).reQueryItemElementSizeByKey =
            (this.$vlAdapterExportsMethodCallQueue as any).reQueryItemElementSizeByKey || [];
        (this.$vlAdapterExportsMethodCallQueue as any).reQueryItemElementSizeByKey.push([itemId]);
    }

    $vlSaveItemState(itemId: string, state: any, replace = false) {
        if (!this.$vlItemState) {
            this.$vlItemState = {};
        }
        if (replace || !this.$vlItemState[itemId]) {
            this.$vlItemState[itemId] = state;
        } else {
            this.$vlItemState[itemId] = {
                ...this.$vlItemState[itemId],
                ...state
            };
        }
    }
}
