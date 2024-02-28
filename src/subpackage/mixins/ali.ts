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

export const rewriteAliSpec = (spec) => {
    const noop = () => {};
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
            }
            const old = properties[k]?.observer;

            if (typeof old === 'function') {
                observers[k] = function observer(...args) {
                    if (
                        typeof args[0] !== 'function' &&
                        JSON.stringify(args[0] === undefined ? null : args[0]) !== JSON.stringify(this.data[k])
                    ) {
                        this.setData({
                            [k]: args[0] === undefined ? null : args[0]
                        });
                    }
                    return old?.apply(this, args);
                };
                needSetObservers = true;
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

    // 同步props到data
    spec.methods.$crossSyncPropsToData = function crossSyncPropsToData() {
        if (this.props) {
            const data: any = {};
            Object.keys(this.props).forEach((k) => {
                if (typeof this.props[k] !== 'function' && this.props[k] !== undefined && !k.startsWith('data-')) {
                    data[k] = this.props[k];
                }
            });
            this.setData(data);
        }
    };

    // 模拟wx的triggerEvent
    spec.methods.triggerEvent = function triggerEvent(name: string, detail) {
        if (!this.props) {
            return;
        }
        const e = createCustomEvent(this.props);
        e.type = name;
        e.detail = detail;
        const eName = name[0].toUpperCase() + name.substring(1);
        const onEvent = `on${eName}`;
        if (typeof this.props[onEvent] === 'function') {
            this.props[onEvent](e);
            return;
        }
        const catchEvent = `catch${eName}`;
        if (typeof this.props[catchEvent] === 'function') {
            this.props[catchEvent](e);
        }
    };

    // 将属性放到data里
    spec.onInit = function onInit() {
        this.$crossSyncPropsToData();
    };
    spec.deriveDataFromProps = function deriveDataFromProps(nextProps) {
        Object.keys(nextProps).forEach((k) => {
            if (
                typeof nextProps[k] !== 'function' &&
                JSON.stringify(nextProps[k] === undefined ? null : nextProps[k]) !== JSON.stringify(this.data[k])
            ) {
                this.setData({
                    [k]: nextProps[k] === undefined ? null : nextProps[k]
                });
            }
        });
    };

    // 处理pageLife
    if (spec.pageLifetimes) {
        const pageLifetimes = spec.pageLifetimes;
        spec.rootEvents = {
            onShow: pageLifetimes.show || noop,
            onHide: pageLifetimes.hide || noop,
            onResize: pageLifetimes.resize || noop()
        };
    }
};
