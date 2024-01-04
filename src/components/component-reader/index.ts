import type { MpJSONViewerComponentEbusDetail } from '../../types/json-viewer';
import { WeComponent } from '../mixins/component';
import { findComponentIns, findPageIns, getChildrenElements, getElement } from '../modules/element';
import EbusMixin from '../mixins/ebus';

WeComponent(EbusMixin, {
    data: {
        root: null,
        selectId: ''
    },
    methods: {
        buildPath(open: boolean, path?: string[]): Promise<any> {
            return new Promise((resolve) => {
                const mpData: any = {};
                if (!path) {
                    if (!open) {
                        mpData['root.children'] = null;
                        mpData['root.open'] = false;
                        resolve(mpData);
                        return;
                    }
                    getChildrenElements(getApp()).then((children) => {
                        children.forEach((item) => {
                            (item as any).path = [item.id];
                        });
                        mpData['root.children'] = children;
                        mpData['root.open'] = true;
                        return resolve(mpData);
                    });
                    return;
                }
                let currentChildren: any[];
                let rootChildren: any[];
                const initRootChildren = () => {
                    if (rootChildren) {
                        return Promise.resolve();
                    }
                    if (this.data?.root && this.data.root.children) {
                        rootChildren = this.data.root.children;
                        return Promise.resolve();
                    }
                    return getChildrenElements(getApp()).then((children) => {
                        children.forEach((item) => {
                            (item as any).path = [item.id];
                        });
                        rootChildren = children;
                        mpData['root.children'] = children;
                        mpData['root.open'] = true;
                    });
                };
                let mpPath = 'root.children';
                let index = 0;
                const readyPath = [];
                const loop = () => {
                    const p = path[index];
                    const isLast = index === path.length - 1;
                    readyPath.push(p);
                    initRootChildren().then(() => {
                        if (!index) {
                            currentChildren = rootChildren;
                        }
                        const readyIndex = currentChildren.findIndex((item) => item.id === p);
                        if (readyIndex === -1) {
                            return resolve(mpData);
                        }
                        const readyItem = currentChildren[readyIndex];
                        const ins = readyItem.group ? {} : !index ? findPageIns(p) : findComponentIns(p);
                        if (!ins) {
                            return resolve(mpData);
                        }
                        if (isLast && !open) {
                            mpPath += `[${readyIndex}].children`;
                            mpData[mpPath] = null;
                            mpData[mpPath.substr(0, mpPath.length - 9) + '.open'] = false;
                            return resolve(mpData);
                        }

                        getChildrenElements(
                            ins,
                            readyItem.group ? readyItem.attrs.find((at) => at.name === 'is').content : ''
                        ).then((children) => {
                            mpPath += `[${readyIndex}].children`;
                            if (!children.length) {
                                resolve(mpData);
                                return;
                            }
                            children.forEach((item) => {
                                (item as any).path = readyPath.concat([item.id]);
                            });
                            currentChildren = children;
                            mpData[mpPath] = children;
                            mpData[mpPath.substr(0, mpPath.length - 9) + '.open'] = true;
                            if (isLast) {
                                resolve(mpData);
                                return;
                            }
                            index++;
                            loop();
                        });
                    });
                };
                loop();
            });
        },
        toggle(e) {
            const { path, open, id } = e.detail;
            this.buildPath(open, path).then((res) => {
                this.$updateData(res);
                this.$updateData({
                    selectId: id
                });
            });
        },
        showJSON(e) {
            const { path, id } = e.detail;
            let target;
            let mpData;
            if (!path || !path.length) {
                target = getApp();
                mpData = {
                    detailId: 'app',
                    detailLable: '',
                    detailAlive: true
                };
            } else if (path.length === 1) {
                target = findPageIns(id);
            } else {
                target = findComponentIns(id);
            }
            if (!mpData) {
                mpData = {
                    detailId: id,
                    detailAlive: !target.__wcDestoryed__,
                    detailLable: target.is
                };
            }
            const fire = () => {
                this.$updateData(mpData);
                this.detailTarget = target;
                if (this.detailJSONViewer) {
                    this.detailJSONViewer.setTarget(target);
                    this.detailJSONViewer.openPath();
                }
            };
            if (this.data.detailId) {
                this.clearDetail(fire);
            } else {
                fire();
            }
        },
        clearDetail(cb) {
            delete this.detailTarget;
            delete this.detailJSONViewer;
            this.$updateData(
                {
                    detailId: null,
                    detailAlive: null,
                    detailLable: ''
                },
                cb
            );
        }
    },
    created() {
        this.$wcOn('JSONViewerReady', (type, data: MpJSONViewerComponentEbusDetail) => {
            if (
                data.from === `View_${this.data.detailId}` &&
                data.viewer.selectOwnerComponent &&
                data.viewer.selectOwnerComponent() === this
            ) {
                (this as any).detailJSONViewer = data.viewer;
                data.viewer.init().then(() => {
                    if (data.from === `View_${this.data.detailId}`) {
                        if ((this as any).detailTarget) {
                            data.viewer.setTarget((this as any).detailTarget);
                            data.viewer.openPath();
                        }
                    }
                });
            }
        });
    },
    attached() {
        getElement(getApp()).then((res) => {
            this.$updateData({
                root: res
            });
        });
    }
});
