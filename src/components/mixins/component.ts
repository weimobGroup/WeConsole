import { MkViewFormatSpec, MpViewType } from '@mpkit/types';
import { isNativeFunc, isFunc, isPlainObject, merge, isEmptyObject, uuid } from '@mpkit/util';
import { each, has, wcScope } from '../../modules/util';
import { MpComponentSpec, MpViewContext } from '../../types/view';
import ToolMixin from './tool';
export const formatViewSpecList = (viewType: MpViewType, ...specList): MkViewFormatSpec => {
    const result: MkViewFormatSpec = {};
    const specialProps: any = {};
    const methodMap: any = {};
    if (viewType === MpViewType.Component) {
        Object.assign(specialProps, {
            properties: [],
            methods: [],
            lifetimes: [],
            pageLifetimes: []
        });
    }
    specList.forEach((spec) => {
        Object.keys(spec).forEach((prop) => {
            const value = spec[prop];
            const valType = typeof value;
            if (prop in specialProps && viewType === MpViewType.Component) {
                specialProps[prop].push(value);
            } else if (valType === 'object' && value && isPlainObject(value)) {
                if (typeof result[prop] !== 'object') {
                    result[prop] = Array.isArray(value) ? [] : {};
                }
                merge(result[prop], value);
            } else if (valType === 'function') {
                if (isNativeFunc(value)) {
                    result[prop] = value;
                } else {
                    if (!methodMap[prop]) {
                        methodMap[prop] = [];
                    }
                    methodMap[prop].push(value);
                }
            } else {
                result[prop] = value;
            }
        });
    });
    if (!specialProps.methods || !specialProps.methods.length) {
        delete specialProps.methods;
    }
    if (!specialProps.properties || !specialProps.properties.length) {
        delete specialProps.properties;
    }
    if (!specialProps.lifetimes || !specialProps.lifetimes.length) {
        delete specialProps.lifetimes;
    }
    if (!specialProps.pageLifetimes || !specialProps.pageLifetimes.length) {
        delete specialProps.pageLifetimes;
    }
    if (!isEmptyObject(specialProps)) {
        result.specialProps = specialProps;
    }
    if (!isEmptyObject(methodMap)) {
        result.methodMap = methodMap;
    }
    return result;
};

// eslint-disable-next-line func-name-matching
export const fireViewMethod = function ViewMethod(methodHandlers: Array<Function | string>, ...args: any[]): any {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const ctx = this;
    let methodResult;
    methodHandlers.forEach((item) => {
        if (typeof item === 'function') {
            const res = item.apply(ctx, args);
            if (typeof res !== 'undefined') {
                methodResult = res;
            }
        } else if (typeof item === 'string' && ctx && ctx[item] && isFunc(ctx[item])) {
            const res = ctx[item].apply(this, args);
            if (typeof res !== 'undefined') {
                methodResult = res;
            }
        }
    });
    return methodResult;
};
const mergeProperties = (properties) => {
    const result = {};
    const observer = {};
    properties.forEach((item) => {
        each(item, (prop, val) => {
            if (!result[prop]) {
                result[prop] = {};
            }
            if (!observer[prop]) {
                observer[prop] = [];
            }
            if (isNativeFunc(val)) {
                result[prop].type = val;
            } else if (typeof val === 'object') {
                if (!val) {
                    result[prop].type = val;
                    result[prop].value = val;
                } else {
                    if (val && 'type' in val) {
                        result[prop].type = val.type;
                    }
                    if (val && 'value' in val) {
                        result[prop].value = val.value;
                    }
                    val?.observer && observer[prop].push(val.observer);
                }
            } else {
                result[prop].value = val;
            }
        });
    });
    each(result, (prop) => {
        if (observer?.[prop] && observer[prop].length) {
            result[prop].observer = function MergePropObserver(...args) {
                return fireViewMethod.apply(this, [observer[prop], ...args]);
            };
        }
    });
    return result;
};

const hookMethod = (map, target) => {
    each(map, (methodName, methodValues) => {
        if (methodValues.length) {
            target[methodName] = function MethodOriginal(...args) {
                return fireViewMethod.apply(this, [methodValues, ...args]);
            };
            target[methodName].displayName = methodName;
        }
    });
};

const mergeSpecialProps = (prop, values, target, removeMap = null) => {
    if (values.length) {
        const subMethodMap = {};
        values.forEach((item) => {
            Object.keys(item).forEach((key) => {
                if (prop === 'lifetimes' && removeMap && removeMap[key]) {
                    // lifetimes内声明的函数优先级比直接声明的created等要高，会被覆盖
                    // https://microapp.bytedance.com/docs/zh-CN/mini-app/develop/framework/custom-component/component-constructor
                    // https://smartprogram.baidu.com/docs/develop/framework/custom-component_comp/
                    // https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/component.html
                    delete removeMap[key];
                }
                if (!subMethodMap[key]) {
                    subMethodMap[key] = [];
                }
                subMethodMap[key].push(item[key]);
            });
        });
        target[prop] = {};
        hookMethod(subMethodMap, target[prop]);
    }
};

const WcScope = wcScope();

export const WeComponent = <T extends MpViewContext = MpViewContext>(...specList: MpComponentSpec<T>[]) => {
    const targetSpec: MpComponentSpec<T> = {};
    const precutLifes = {
        created() {
            this.$wcId = uuid();
            Object.defineProperty(this, '$FullSpec', {
                get() {
                    return targetSpec;
                }
            });
            Object.defineProperty(this, '$wcUIConfig', {
                get() {
                    return WcScope.UIConfig;
                }
            });
        },
        detached() {
            this.$wcComponentIsDeatoryed = true;
        }
    };
    const fullSpec = formatViewSpecList(
        MpViewType.Component,
        ...specList.concat([
            ToolMixin,
            {
                methods: {
                    $getProp<T = any>(propName: string, defaultVal?: T): T {
                        return this.data[propName] || defaultVal;
                    }
                },
                ...precutLifes
            }
        ])
    );
    if (fullSpec.specialProps) {
        if (fullSpec.specialProps.properties) {
            targetSpec.properties = mergeProperties(fullSpec.specialProps.properties);
        }
        if (fullSpec.specialProps.pageLifetimes) {
            mergeSpecialProps('pageLifetimes', fullSpec.specialProps.pageLifetimes, targetSpec);
        }
        if (fullSpec.specialProps.methods) {
            mergeSpecialProps('methods', fullSpec.specialProps.methods, targetSpec);
        }
        if (fullSpec.specialProps.lifetimes) {
            for (const prop in precutLifes) {
                if (has(precutLifes, prop)) {
                    fullSpec.specialProps.lifetimes[prop] = fullSpec.specialProps.lifetimes[prop] || [];
                    fullSpec.specialProps.lifetimes[prop].shift(precutLifes[prop]);
                }
            }
            mergeSpecialProps('lifetimes', fullSpec.specialProps.lifetimes, targetSpec, fullSpec.methodMap);
        }
        delete fullSpec.specialProps;
    }
    if (fullSpec.methodMap) {
        hookMethod(fullSpec.methodMap, targetSpec);
        delete fullSpec.methodMap;
    }
    Object.assign(targetSpec, fullSpec);
    if (isFunc(targetSpec.$mixinEnd)) {
        targetSpec.$mixinEnd(targetSpec);
        delete targetSpec.$mixinEnd;
    }
    targetSpec.$wcDisabled = true;
    return Component(targetSpec);
};
