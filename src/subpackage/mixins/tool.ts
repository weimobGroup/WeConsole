import { isEmptyObject, isFunc, isValidObject } from '@mpkit/util';
import { each } from '@/main/modules/util';
import { MpComponentMixin } from 'typescript-mp-component';
import type { AnyFunction, EventHandler } from '@/types/util';
import type { MpUIConfig } from '@/types/config';
import { getUIConfig } from '@/main/index';
import { once, emit, on, off } from '@/main/modules/ebus';
import { WeConsoleEvents } from '@/types/scope';
import type { IMpProductController } from '@/types/hook';
import { wcScope, wcScopeSingle } from '@/main/config';
import type { CrossMpClientRect } from 'cross-mp-power';
import { nextTick, showActionSheet } from 'cross-mp-power';
import { getBoundingClientRect } from '../modules/rect';
function OnProduct(type, data) {
    this && this.onWcProduct && this.onWcProduct(type, data);
}
const WcScope = wcScope();

const fireSetData = (vm: ToolMixin) => {
    const d = vm.waitingData;
    if (!d) {
        return;
    }
    if (!vm.$tlIsAttached) {
        nextTick(() => {
            fireSetData(vm);
        });
        return;
    }
    const cbs = vm.waitingDataCallbacks || [];
    delete vm.waitingDataCallbacks;
    delete vm.waitingData;
    vm.setData(d, () => {
        cbs.forEach((item) => {
            try {
                item();
            } catch (error) {
                console.error(error);
            }
        });
    });
};

export class ToolMixin<D extends object = any> extends MpComponentMixin {
    waitingData?: any;
    waitingDataCallbacks?: AnyFunction[];
    updateDataTimer?: ReturnType<typeof setTimeout>;
    $wcComponentIsDestroyed?: boolean;
    $wcEvents: Record<string, AnyFunction[]>;
    $wcCanvasContext: any;
    $wcCanvasContextResolves?: AnyFunction[];
    $wcProductControllerHandler: AnyFunction;
    $wcProductController: IMpProductController;
    readonly $wcUIConfig: MpUIConfig;
    $tlIsAttached: boolean;
    created() {
        Object.defineProperty(this, '$wcUIConfig', {
            get() {
                return getUIConfig();
            }
        });
        this.$wcOn(WeConsoleEvents.WcCanvasContextReady, (type, data) => {
            this.$wcCanvasContext = data;
            if (this.$wcCanvasContextResolves) {
                this.$wcCanvasContextResolves.forEach((item) => {
                    item?.();
                });
                delete this.$wcCanvasContextResolves;
            }
        });
        this.$wcOn(WeConsoleEvents.WcCanvasContextFail, () => {
            if (this.$wcCanvasContextResolves) {
                this.$wcCanvasContextResolves.forEach((item) => {
                    item?.(true);
                });
                delete this.$wcCanvasContextResolves;
            }
        });
        this.$wcOn(WeConsoleEvents.WcCanvasContextDestory, () => {
            delete this.$wcCanvasContext;
        });
        Object.defineProperty(this, '$wcProductController', {
            get() {
                return wcScopeSingle('ProductController');
            }
        });
        if (this.$wcProductController) {
            this.$wcProductControllerHandler = OnProduct.bind(this);
            this.$wcProductController.on('create', this.$wcProductControllerHandler);
            this.$wcProductController.on('change', this.$wcProductControllerHandler);
        }
    }
    attached() {
        this.$tlIsAttached = true;
    }
    detached() {
        if (this.$wcProductController && this.$wcProductControllerHandler) {
            this.$wcProductController.off('create', this.$wcProductControllerHandler);
            this.$wcProductController.off('change', this.$wcProductControllerHandler);
        }
        this.$wcComponentIsDestroyed = true;
        if (this?.$wcEvents) {
            each(this.$wcEvents, (name) => {
                this.$wcOff(name);
            });
        }
    }
    noop() {}
    $getCanvasContext(): Promise<void> {
        if (this.$wcCanvasContext) {
            return Promise.resolve();
        }
        if (WcScope.CanvasContextFail) {
            return Promise.reject(new Error('CanvasContext获取失败'));
        }
        const ctx = WcScope.CanvasContext;
        if (ctx) {
            this.$wcCanvasContext = ctx;
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            if (!this.$wcCanvasContextResolves) {
                this.$wcCanvasContextResolves = [];
            }
            this.$wcCanvasContextResolves.push(resolve);
        }).then((isFail) => {
            if (isFail) {
                return Promise.reject(new Error('CanvasContext获取失败'));
            }
        });
    }

    $getProp<T = any>(propName: string, defaultVal?: T): T {
        return this.data[propName] || defaultVal;
    }
    $addWaitingData(data: Partial<D>, cb?: () => void) {
        if (!this.waitingData) {
            this.waitingData = {};
        }
        this.waitingDataCallbacks = this.waitingDataCallbacks || [];
        if (isFunc(cb)) {
            this.waitingDataCallbacks.push(cb as AnyFunction);
        }
        Object.assign(this.waitingData, data);
        Object.assign(this.data, this.waitingData);
    }
    $forceData(data: Partial<D>, cb?: () => void) {
        if (!isValidObject(data) || isEmptyObject(data)) {
            cb?.();
            return;
        }
        this.$addWaitingData(data, cb);
        fireSetData(this);
    }
    $updateData(data: Partial<D>, cb?: () => void) {
        if (!isValidObject(data) || isEmptyObject(data)) {
            cb?.();
            return;
        }
        this.$addWaitingData(data, cb);
        if (this.updateDataTimer) {
            clearTimeout(this.updateDataTimer);
        }
        this.updateDataTimer = setTimeout(() => {
            fireSetData(this);
        }, 100);
    }
    $getBoundingClientRect(selector: string): Promise<CrossMpClientRect> {
        return getBoundingClientRect(this, selector);
    }
    $showActionSheet(items: string[], title?: string): Promise<number> {
        return showActionSheet(items, title);
    }
    $wcOn(name: string, handler: EventHandler) {
        if (!this.$wcEvents) {
            this.$wcEvents = {};
        }
        if (!this.$wcEvents[name]) {
            this.$wcEvents[name] = [];
        }
        this.$wcEvents[name].push(handler);
        on(name, handler);
    }
    $wcOnce(name: string, handler: EventHandler) {
        if (!this.$wcEvents) {
            this.$wcEvents = {};
        }
        if (!this.$wcEvents[name]) {
            this.$wcEvents[name] = [];
        }
        this.$wcEvents[name].push(handler);
        once(name, handler);
    }
    $wcEmit(name: string, data?: any) {
        emit(name, data);
    }
    $wcOff(name: string, handler?: EventHandler) {
        if (this?.$wcEvents && this.$wcEvents[name]) {
            if (handler) {
                const index = this.$wcEvents[name].indexOf(handler);
                this.$wcEvents[name].splice(index, 1);
                off(name, handler);
            } else {
                this.$wcEvents[name].forEach((item) => {
                    off(name, item);
                });
                delete this.$wcEvents[name];
            }
        }
    }
}
