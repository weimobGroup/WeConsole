import { VirtualListMixin } from '@/sub/mixins/virtual-list';
import { ItemsMixin } from '@/sub/mixins/items';
import type { MpDataGridComponentProps, MpDataGridComponentData } from '@/types/data-grid';
import type { MpEvent } from '@/types/view';
import type { MpComponentProperties } from 'typescript-mp-component';
import { MpComponent } from 'typescript-mp-component';
import { ToolMixin } from '@/sub/mixins/tool';
import { registerComponent } from '@/sub/mixins/component';
import type { MpJSONViewerComponentEbusDetail } from '@/sub/components/json-viewer';

export class DataGrid extends MpComponent {
    computeColWidthTimer?: ReturnType<typeof setTimeout>;
    outerScollerHandler?: (top: number) => void;
    outerJSONViewerHandler?: (detail: MpJSONViewerComponentEbusDetail) => void;
    JSONViewerReadyList?: MpJSONViewerComponentEbusDetail[];
    $mx = {
        Tool: new ToolMixin(),
        VirtualList: new VirtualListMixin(),
        Items: new ItemsMixin()
    };
    properties: MpComponentProperties<MpDataGridComponentProps, DataGrid> = {
        from: String,
        outerClass: String,
        rowClass: String,
        selected: {
            type: null,
            observer() {
                this.$mx.Items.computeSelectMap();
            }
        },
        vlPageSize: {
            type: Number,
            value: 20,
            observer(val) {
                this.$mx.Tool.$forceData({
                    $vlPageSize: val
                });
                this.$mx.VirtualList.$vlComputeShowList();
            }
        },
        vlItemHeight: {
            type: null,
            observer(val) {
                this.$mx.Tool.$forceData({
                    $vlItemStaticHeight: val
                });
                this.$mx.VirtualList.$vlComputeShowList();
            }
        },
        affixable: {
            type: Boolean
        },
        affixIds: {
            type: Array,
            observer() {
                this.$mx.Items.computeAffixList();
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
                this.$mx.VirtualList.$vlAllList = list || [];
                this.$mx.VirtualList.$vlListChange();
            }
        }
    };
    initData: MpDataGridComponentData = {
        columnWidthMap: {},
        lineLefts: []
    };
    detached() {
        if (this.computeColWidthTimer) {
            clearTimeout(this.computeColWidthTimer);
        }
        delete this.computeColWidthTimer;
    }
    attached() {
        this.$mx.Tool.$updateData({
            $vlPageSize: this.$mx.Tool.$getProp('vlPageSize'),
            $vlItemStaticHeight: this.$mx.Tool.$getProp('vlItemHeight')
        });
        this.$mx.Items.triggerReady(true, {
            scrollTo: (top: number) => {
                this.$mx.VirtualList.$vlLockScrollTo(top);
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
    localOnScroll(e) {
        this.$mx.VirtualList.$vlOnScroll(e);
        this.outerScollerHandler?.(this.$mx.VirtualList.$vlScrollTop as number);
    }
    computeColWidth() {
        if (this.computeColWidthTimer) {
            clearTimeout(this.computeColWidthTimer);
        }
        this.computeColWidthTimer = setTimeout(() => {
            const widthList: Array<number> = [];
            const cols = this.$mx.Tool.$getProp('cols');
            let readyWidth = 0;
            const notReadyIndexs: number[] = [];
            const readyIndexs: number[] = [];
            cols.forEach((item, index) => {
                const width = typeof item.width === 'string' ? parseFloat(item.width) : item.width;
                const widType = typeof width;
                if (widType === 'number') {
                    if (isNaN(width) || width <= 0 || width > 100) {
                        notReadyIndexs.push(index);
                        widthList.push(0);
                    } else if (readyWidth + width > 100) {
                        notReadyIndexs.push(index);
                        widthList.push(0);
                    } else {
                        readyWidth += width;
                        widthList.push(width);
                        readyIndexs.push(index);
                    }
                } else {
                    notReadyIndexs.push(index);
                    widthList.push(0);
                }
            });
            if (readyWidth !== 100 || notReadyIndexs.length) {
                const surplusWidth = 100 - readyWidth;
                let minWidth = this.$mx.Tool.$getProp('colMinWidth');
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
            this.$mx.Tool.$updateData({
                columnWidthMap,
                lineLefts: this.data.cols.map((item) => {
                    left += columnWidthMap[item.field];
                    return left + '%';
                })
            });
            delete this.computeColWidthTimer;
        }, 100);
    }
    tapCell(e: MpEvent) {
        this.$mx.Items.fireCellEvent('tapCell', e);
    }
}

registerComponent(DataGrid);
