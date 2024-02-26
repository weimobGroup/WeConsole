import type { MpComponent } from 'typescript-mp-component';
import { toMpComponentConfig } from 'typescript-mp-component';

export const registerClassComponent = (constructor: new () => MpComponent) => {
    registerComponent(toMpComponentConfig(constructor));
};

export const registerComponent = (spec: any) => {
    spec.$wcDisabled = true;
    if (BUILD_TARGET === 'my') {
        rewriteAliSpec(spec);
    }
    Component(spec);
};

function createCustomEvent(props) {
    const e = {
        target: {
            dataset: {}
        },
        currentTarget: {
            dataset: {},
            // 组件的id
            id: props.id
        }
    };

    Object.keys(props).forEach((prop) => {
        if (prop.match(/^data-/)) {
            const originProp = prop;
            prop = prop.replace(/^data-/, '').replace(/-(\w)/g, (e, r) => r[0].toUpperCase() + r.slice(1));
            e.target.dataset[prop] = props[originProp];
            e.currentTarget.dataset[prop] = props[originProp];
        }
    });
    return e as any;
}

const rewriteAliSpec = (spec) => {
    // TODO: 支付宝属性的检测器函数优先于created等生命周期执行，需要添加额外的判断或适配
    spec.options = spec.options || {};
    spec.options.lifetimes = true;

    // 处理属性
    const properties = spec.properties;
    if (properties) {
        delete spec.properties;
        const props = {};
        const observers = {};
        let needSetProps;
        let needSetObservers;
        Object.keys(properties).forEach((k) => {
            if (typeof properties[k] === 'object' && properties[k]) {
                if ('value' in properties[k]) {
                    needSetProps = true;
                    props[k] = properties[k].value;
                }
                if (typeof properties[k].observer === 'function') {
                    observers[k] = properties[k].observer;
                    needSetObservers = true;
                }
            }
        });
        if (needSetProps) {
            spec.props = props;
        }
        if (needSetObservers) {
            spec.options.observers = true;
            spec.observers = observers;
        }
    }

    spec.methods = spec.methods || {};
    // 模拟wx的triggerEvent
    spec.methods.triggerEvent = function triggerEvent(name: string, detail) {
        if (!this.props) {
            return;
        }
        const e = createCustomEvent(this.props);
        e.type = name;
        e.detail = detail;
        const onEvent = `on${name[0].toUpperCase()}${name.substring(1)}`;
        if (typeof this.props[onEvent] === 'function') {
            this.props[onEvent](e);
            return;
        }
        const catchEvent = `catch${name[0].toUpperCase()}${name.substring(1)}`;
        if (typeof this.props[catchEvent] === 'function') {
            this.props[catchEvent](e);
        }
    };
};
