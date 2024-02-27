/** 重写属性的Observer，确保created在它之前执行 */
export const makeSureCreatedPriorPropObserver = (spec: any) => {
    if (spec.properties) {
        Object.keys(spec.properties).forEach((k) => {
            if (
                typeof spec.properties[k] === 'object' &&
                spec.properties[k] &&
                typeof spec.properties[k].observer === 'function'
            ) {
                const old = spec.properties[k].observer;
                spec.properties[k].observer = function observer(...args) {
                    if (this.__createdIsFired__) {
                        return old.apply(this, args);
                    }
                    this.__waitObserverQueue = this.__waitObserverQueue || [];
                    this.__waitObserverQueue.push(() => {
                        old.apply(this, args);
                    });
                };
            }
        });
        spec.lifetimes = spec.lifetimes || {};
        const old = spec.lifetimes.created;
        spec.lifetimes.created = function created() {
            old?.call(this);
            this.__createdIsFired__ = true;
            if (this.__waitObserverQueue) {
                this.__waitObserverQueue.forEach((item) => {
                    try {
                        item();
                    } catch (error) {
                        console.error(error);
                    }
                });
                delete this.__waitObserverQueue;
            }
        };
    }
};
