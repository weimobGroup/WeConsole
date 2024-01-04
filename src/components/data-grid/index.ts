import { WeComponent } from '../mixins/component';
import VirtualListMixin from '../mixins/virtual-list';
import ItemsMixin from '../mixins/items';
import EbusMixin from '../mixins/ebus';
import type { MpDataGridComponentSpec } from '../../types/data-grid';
import type { MpEvent } from '../../types/view';
import type { MpJSONViewerComponentEbusDetail } from '../../types/json-viewer';
const Spec: MpDataGridComponentSpec = {
    properties: {
        from: String,
        outerClass: String,
        rowClass: String,
        selected: {
            type: null,
            observer() {
                this.computeSelectMap();
            }
        },
        vlPageSize: {
            type: Number,
            value: 20,
            observer(val) {
                this.$forceData({
                    $vlPageSize: val
                });
                this.$vlComputeShowList();
            }
        },
        vlItemHeight: {
            type: null,
            observer(val) {
                this.$forceData({
                    $vlItemStaticHeight: val
                });
                this.$vlComputeShowList();
            }
        },
        affixable: {
            type: Boolean
        },
        affixIds: {
            type: Array,
            observer() {
                this.computeAffixList();
            }
        },
        colMinWidth: {
            type: Number,
            // 最小宽度 5%
            value: 5
        },
        cols: {
            type: Array,
            observer() {
                this.computeColWidth();
            }
        },
        /** 尽量不要使用该属性进行数据更新，应该使用事件拿到本组件实例，然后手动$vlAddItem */
        data: {
            type: Array,
            observer(list) {
                this.$vlAllList = list || [];
                this.$vlListChange();
            }
        }
    },
    data: {
        columnWidthMap: {},
        lineLefts: []
    },
    methods: {
        localOnScroll(e) {
            this.$vlOnScroll(e);
            this?.outerScollerHandler(this.$vlScrollTop);
        },
        computeColWidth() {
            if (this.computeColWidthTimer) {
                clearTimeout(this.computeColWidthTimer);
            }
            this.computeColWidthTimer = setTimeout(() => {
                const widthList: Array<number> = [];
                const cols = this.$getProp('cols');
                let readyWidth = 0;
                const notReadyIndexs: number[] = [];
                const readyIndexs: number[] = [];
                cols.forEach((item, index) => {
                    const widType = typeof item.width;
                    if (widType === 'number') {
                        if (isNaN(item.width as number) || item.width <= 0 || item.width > 100) {
                            notReadyIndexs.push(index);
                            widthList.push(0);
                        } else if (readyWidth + item.width > 100) {
                            notReadyIndexs.push(index);
                            widthList.push(0);
                        } else {
                            readyWidth += item.width;
                            widthList.push(item.width);
                            readyIndexs.push(index);
                        }
                    } else {
                        notReadyIndexs.push(index);
                        widthList.push(0);
                    }
                });
                if (readyWidth !== 100 || notReadyIndexs.length) {
                    const surplusWidth = 100 - readyWidth;
                    let minWidth = this.$getProp('colMinWidth');
                    if (typeof minWidth !== 'number' || !minWidth) {
                        minWidth = 5;
                    }
                    if (notReadyIndexs.length * minWidth <= surplusWidth) {
                        notReadyIndexs.forEach((item, index) => {
                            readyWidth += 5;
                            widthList[item] = 5;
                            if (index === notReadyIndexs.length - 1) {
                                widthList[item] = 100 - readyWidth;
                            }
                        });
                    } else {
                        notReadyIndexs.forEach((item) => {
                            readyWidth += 5;
                            widthList[item] = 5;
                        });
                        const kfpWidth = 100 - notReadyIndexs.length * minWidth;
                        const oneWidth = parseInt((kfpWidth / readyIndexs.length).toString());
                        readyIndexs.forEach((item, index) => {
                            if (readyIndexs.length - 1 === index) {
                                widthList[item] = 100 - readyWidth;
                            } else {
                                widthList[item] -= oneWidth;
                                readyWidth -= oneWidth;
                            }
                        });
                    }
                }
                const columnWidthMap = {};
                widthList.forEach((item, index) => {
                    columnWidthMap[cols[index].field] = item;
                });
                let left = 0;
                this.$updateData({
                    columnWidthMap,
                    lineLefts: this.data.cols.map((item) => {
                        left += columnWidthMap[item.field];
                        return left + '%';
                    })
                });
                delete this.computeColWidthTimer;
            }, 100);
        },
        tapCell(e: MpEvent) {
            this.fireCellEvent('tapCell', e);
        }
    },
    created() {
        this.$wcOn('JSONViewerReady', (type, data: MpJSONViewerComponentEbusDetail) => {
            if (
                data.from.startsWith('GridCol_') &&
                data.viewer.selectOwnerComponent &&
                data.viewer.selectOwnerComponent() === this
            ) {
                if (this.outerJSONViewerHandler) {
                    this.outerJSONViewerHandler(data);
                } else {
                    if (!this.JSONViewerReadyList) {
                        this.JSONViewerReadyList = [];
                    }
                    this.JSONViewerReadyList.push(data);
                }
            }
        });
    },
    detached() {
        if (this.computeColWidthTimer) {
            clearTimeout(this.computeColWidthTimer);
        }
        delete this.computeColWidthTimer;
    },
    attached() {
        this.$updateData({
            $vlPageSize: this.$getProp('vlPageSize'),
            $vlItemStaticHeight: this.$getProp('vlItemHeight')
        });
        this.triggerReady(true, {
            scrollTo: (top: number) => {
                this.$vlLockScrollTo(top);
            },
            onScroll: (handler) => {
                this.outerScollerHandler = handler;
            },
            onJSONReady: (handler) => {
                this.outerJSONViewerHandler = handler;
                if (this.JSONViewerReadyList) {
                    this.JSONViewerReadyList.forEach((item) => handler(item));
                }
            }
        });
    }
};
WeComponent(VirtualListMixin as any, ItemsMixin as any, EbusMixin, Spec as any);
