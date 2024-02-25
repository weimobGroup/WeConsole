import { VlMixin } from '@/sub/mixins/vl';
import type {
    TableComponentProps,
    TableComponentData,
    TableCell,
    TableComponentJSONViewerReadyEvent,
    TableComponentJSONViewerItem,
    TableCellJsonItem,
    RegularTableComponentExports
} from '@/types/table';
import type { MpEvent } from '@/types/view';
import type { MpComponentProperties } from 'typescript-mp-component';
import { MpComponent } from 'typescript-mp-component';
import { ToolMixin } from '@/sub/mixins/tool';
import { registerClassComponent } from '@/sub/mixins/component';
import type { RequireId } from '@/types/common';
import { rpxToPx } from '@/main/modules/util';
import type { MpVirtualListComponentExports } from '@cross-virtual-list/types';
import { clone, uuid } from '@mpkit/util';
import type { MpJSONViewerComponentEbusDetail } from '../json-viewer';

export class TableComponent<
    T extends RequireId = RequireId,
    E extends MpVirtualListComponentExports<T> = MpVirtualListComponentExports<T>
> extends MpComponent<TableComponentData<T>, TableComponentProps<T>, TableComponent<T>> {
    computeColWidthTimer?: ReturnType<typeof setTimeout>;
    jsonViewReadyCallback?: Array<(e: TableComponentJSONViewerReadyEvent) => void>;
    jsonViewerMap?: Record<string, TableComponentJSONViewerItem>;
    jsonViewerMark?: Record<string, 1>;
    hasSelfSetList: boolean;
    $mx = {
        Tool: new ToolMixin<TableComponentData>(),
        Vl: new VlMixin<T, E>()
    };
    properties: MpComponentProperties<TableComponentProps<T>, TableComponent<T>> = {
        from: String,
        rowKeyField: {
            type: String,
            value: 'id'
        },
        selected: {
            type: Array
        },
        affixed: {
            type: Array,
            observer() {
                this.syncAffixList();
            }
        },
        rowHeight: {
            type: Number,
            value: rpxToPx(50)
        },
        rowHeightMode: {
            type: String,
            value: 'regular'
        },
        colMinWidth: {
            type: Number,
            optionalTypes: [String, Number],
            // 最小宽度 5%
            value: 5,
            observer() {
                this.computeColWidth();
            }
        },
        cols: {
            type: Array,
            observer() {
                this.computeColWidth();
                this.computeHeadRow();
            }
        },
        /** 尽量不要使用该属性进行数据更新，应该使用事件拿到本组件实例，然后手动$vlAddItem */
        data: {
            type: Array,
            observer(val) {
                this.$mx.Tool.$forceData({
                    hasData: !!val?.length
                });
            }
        }
    };
    initData: TableComponentData<T> = {
        colComputedWidth: [],
        lines: [],
        hasData: false,
        headRow: {},
        affixList: [],
        selfHash: ''
    };
    created() {
        this.$mx.Tool.$wcOn('JSONViewerReady', (type, data: MpJSONViewerComponentEbusDetail) => {
            if (!data.from.startsWith(`${this.data.from || ''}Table_${this.data.selfHash}`)) {
                return;
            }
            const [, , rowType, rowKey, rowIndex, colIndex, blockIndex, jsonItemIndex] = data.from
                .substring(this.data.from.length)
                .split('_');
            const item: TableComponentJSONViewerItem = {
                from: data.from,
                rowType,
                rowKey,
                rowIndex: parseInt(rowIndex),
                colIndex: parseInt(colIndex),
                blockIndex: parseInt(blockIndex),
                jsonItemIndex: parseInt(jsonItemIndex),
                viewer: data.viewer
            };
            if (!this.jsonViewerMap) {
                this.jsonViewerMap = {};
            }
            this.jsonViewerMap[data.from] = item;
            this.jsonViewReadyCallback?.forEach((handler) => {
                handler({
                    from: this.data.from,
                    current: item,
                    all: this.jsonViewerMap as Record<string, TableComponentJSONViewerItem>
                });
            });
            this.setJSONTarget(item);
        });
    }
    attached() {
        this.setData({
            selfHash: uuid()
        });
        this.computeColWidth();
        this.computeHeadRow();
        if (this.$mx.Vl.$vlAdapterExports) {
            this.syncAffixList();
        } else {
            setTimeout(() => {
                this.syncAffixList();
            }, 200);
        }
    }
    detached() {
        if (this.computeColWidthTimer) {
            clearTimeout(this.computeColWidthTimer);
        }
        delete this.computeColWidthTimer;
    }
    setJSONTarget(jsonEvent: TableComponentJSONViewerItem) {
        if (!this.hasSelfSetList && Array.isArray(this.data.data) && this.data.data.length) {
            const dataItem = this.data.data[jsonEvent.rowIndex]?.[this.data.cols[jsonEvent.colIndex]?.field] as
                | TableCell
                | undefined;
            if (
                dataItem &&
                typeof dataItem === 'object' &&
                jsonEvent.blockIndex in dataItem.blocks &&
                typeof dataItem.blocks[jsonEvent.blockIndex]?.items?.[jsonEvent.jsonItemIndex] === 'object'
            ) {
                const val = (dataItem.blocks[jsonEvent.blockIndex].items[jsonEvent.jsonItemIndex] as TableCellJsonItem)
                    .value;
                if (val !== undefined) {
                    jsonEvent.viewer.setTarget(val);
                    jsonEvent.viewer.init();
                }
            }
        }
    }
    syncAffixList() {
        this.setData({
            affixList: this.data.affixed.reduce((sum: T[], id) => {
                const item = this.$mx.Vl.$vlFindItemByKey(id);
                if (item) {
                    sum.push(clone(item[0]));
                }
                return sum;
            }, [])
        });
    }
    localVirtualListComponentReady(e: Required<MpEvent<E>>) {
        this.rewriteVlExports(e.detail);
        this.$mx.Vl.$vlOnVirtualListComponentReady(e);
        if (Array.isArray(this.data.data) && this.data.data.length) {
            this.$mx.Vl.$vlSetList(this.data.data);
        }
        this.triggerEvent('ready', e.detail);
    }
    rewriteVlExports(exports: E) {
        Object.keys(exports).forEach((k) => {
            const old = exports[k];
            if (k === 'setList') {
                exports[k] = (list) => {
                    this.setData({
                        hasData: !!list?.length
                    });
                    old(list);
                    this.hasSelfSetList = true;
                    this.syncAffixList();
                };
                return;
            }
            if (k === 'clear') {
                exports[k] = () => {
                    this.setData({
                        hasData: false,
                        affixList: []
                    });
                    old();
                };
                return;
            }
            if (k === 'appendItem' || k === 'appendItems') {
                exports[k] = (val) => {
                    this.setData({
                        hasData: true
                    });
                    old(val);
                    this.syncAffixList();
                };
                return;
            }
        });

        const tableExports = exports as unknown as RegularTableComponentExports<T>;
        tableExports.onJSONViewerReady = (handler) => {
            if (!this.jsonViewReadyCallback) {
                this.jsonViewReadyCallback = [];
            }
            this.jsonViewReadyCallback.push(handler);
        };
        tableExports.getJSONViewer = () => {
            if (!this.jsonViewerMap) {
                this.jsonViewerMap = {};
            }
            return this.jsonViewerMap;
        };
    }
    computeHeadRow() {
        const headRow = this.data.cols.reduce((sum: Record<string, string | TableCell>, col) => {
            sum[col.field] = col.title || col.field;
            return sum;
        }, {});
        this.setData({
            headRow
        });
    }
    computeColWidth() {
        if (this.computeColWidthTimer) {
            clearTimeout(this.computeColWidthTimer);
        }
        this.computeColWidthTimer = setTimeout(() => {
            const widthList: Array<number> = [];
            const cols = this.data.cols || [];
            let readyWidth = 0;
            const notReadyIndexs: number[] = [];
            const readyIndexs: number[] = [];
            cols.forEach((item, index) => {
                const width = typeof item.width === 'string' ? parseFloat(item.width) : item.width;
                if (typeof width === 'number') {
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
                let minWidth = this.data.colMinWidth;
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
            const colComputedWidth: number[] = [];
            widthList.forEach((item, index) => {
                colComputedWidth[index] = item;
            });
            let left = 0;
            this.$mx.Tool.$forceData({
                colComputedWidth,
                lines: this.data.cols.reduce((sum, item, i, arr) => {
                    left += colComputedWidth[i];
                    if (arr.length - 1 === i) {
                        return sum;
                    }
                    sum.push(left);
                    return sum;
                }, [] as number[])
            });
            delete this.computeColWidthTimer;
        }, 100);
    }
    onItemInteractEvent(e: MpEvent) {
        this.triggerEvent('interact', e.detail);
    }
}

registerClassComponent(TableComponent);
