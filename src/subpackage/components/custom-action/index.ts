import type { MpComponentProperties } from 'typescript-mp-component';
import { MpComponent } from 'typescript-mp-component';
import { ToolMixin } from '@/sub/mixins/tool';
import { registerClassComponent } from '@/sub/mixins/component';
import type { WcCustomAction, WcCustomActionCase, WcCustomActionGrid } from '@/types/other';
import { WcCustomActionShowMode } from '@/types/other';
import type { MpEvent } from '@/types/view';
import { getCustomActions } from '@/sub/modules/custom-action';
import type { MpNameValue } from '@/types/common';
import type { JsonViewer, MpJSONViewerComponentEbusDetail } from '@/sub/components/json-viewer';
import type {
    DynamicTableComponentExports,
    RegularTableComponentExports,
    TableCell,
    TableComponentJSONViewerItem,
    TableComponentJSONViewerReadyEvent
} from '@/types/table';
import { uuid } from '@mpkit/util';
import { rpxToPx } from '@/main/modules/util';
import { toJSONString } from '@/sub/modules/util';
import { nextTick, setClipboardData } from 'cross-mp-power';
const NoUICaseId = '$$$NO_UI$$$';

interface Props {
    action: string;
}

interface TabInfo extends MpNameValue<number> {
    id: string;
    button?: string;
}

interface Data {
    selfHash: string;
    caseList: TabInfo[];
    noUICaseList: TabInfo[];
    caseValueMap: Record<number, string>;
    everyNoUI: boolean;
    activeCaseIndex: number;
    caseState: Record<string, any>;
    caseTabState: Record<string, 1>;
    gridSelected: Record<string, string[]>;
}

class CustomActionComponent extends MpComponent<Data> {
    $mx = {
        Tool: new ToolMixin<Data>()
    };
    caseJSONViewer?: Record<string, JsonViewer>;
    actionDetail?: WcCustomAction;
    caseGrid?: Record<string, DynamicTableComponentExports | RegularTableComponentExports>;
    caseGridJSONSource?: Record<string, { value?: any; jsonViewer?: JsonViewer }>;
    caseGridSource?: Record<string, WcCustomActionGrid>;
    caseGridFinalList?: Record<string, any[]>;
    caseResultState?: Record<
        string,
        {
            res: any;
            err?: Error;
            JSONViewerMap?: Record<string, JsonViewer>;
        }
    >;
    properties: MpComponentProperties<Props, CustomActionComponent> = {
        action: {
            type: String,
            observer() {
                this.setAction();
            }
        }
    };
    initData: Data = {
        selfHash: '',
        caseList: [],
        caseValueMap: {},
        noUICaseList: [],
        everyNoUI: false,
        activeCaseIndex: 0,
        caseState: {},
        caseTabState: {
            s0: 1
        },
        gridSelected: {}
    };
    created() {
        this.$mx.Tool.$forceData({
            selfHash: uuid()
        });
        this.$mx.Tool.$wcOn('JSONViewerReady', (type, data: MpJSONViewerComponentEbusDetail) => {
            if (!data.from.startsWith(`${this.data.selfHash}`)) {
                return;
            }
            if (data.from.startsWith(`${this.data.selfHash}_CustomActionTable_${this.data.action}`)) {
                const [, , , caseId, , , rowType, rowKey, rowIndex, colIndex, blockIndex, jsonItemIndex] =
                    data.from.split('_');
                const caseItem = this.getCase(caseId);
                if (!caseItem) {
                    return;
                }

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
                this.setCaseTableJSONTarget(caseId, item);
                return;
            }
            if (data.from.startsWith(`${this.data.selfHash}_CustomAction_${this.data.action}`)) {
                const caseId = data.from.split('_')[3];
                const caseItem = this.getCase(caseId);
                if (!caseItem) {
                    return;
                }
                if (!this.caseJSONViewer) {
                    this.caseJSONViewer = {};
                }
                this.caseJSONViewer[caseId] = data.viewer;
                data.viewer.init().then(() => {
                    const caseItem = this.getCase(caseId);
                    if (!caseItem) {
                        return;
                    }
                    if (this.caseResultState?.[caseItem.id]) {
                        data.viewer.setTarget(this.caseResultState[caseItem.id].res);
                        data.viewer.openPath();
                    }
                });
            }
        });
    }
    attached() {
        this.setAction();
    }
    setAction() {
        const actions = getCustomActions();
        this.actionDetail = actions.find((item) => item.id === this.data.action);
        if (!this.actionDetail) {
            this.$mx.Tool.$updateData({
                caseList: [],
                noUICaseList: [],
                caseState: {},
                caseTabState: {
                    s0: 1
                }
            });
            delete this.caseResultState;
            return;
        }
        const action: WcCustomAction = this.actionDetail;
        const noneCases: WcCustomActionCase[] = [];
        const uiCases: WcCustomActionCase[] = [];
        const buttonTexts: [TabInfo[], TabInfo[]] = [[], []];
        action.cases.forEach((item, index) => {
            const nv: TabInfo = {
                name: item.title || item.button || item.id,
                id: item.id,
                value: index,
                button: item.button
            };
            if (!item.showMode || item.showMode === WcCustomActionShowMode.none) {
                noneCases.push(item);
                buttonTexts[0].push(nv);
            } else {
                uiCases.push(item);
                buttonTexts[1].push(nv);
            }
        });
        let caseList: TabInfo[];
        let noUICaseList: TabInfo[];
        const caseValueMap: Record<number, string> = {};
        const everyNoUI: boolean = noneCases.length === action.cases.length;
        if (noneCases.length <= 1) {
            caseList = buttonTexts[0].concat(buttonTexts[1]);
            noUICaseList = [];
        } else {
            noUICaseList = buttonTexts[0];
            caseList = buttonTexts[1];
            caseValueMap[caseList.length] = NoUICaseId;
            caseList.unshift({
                name: '无界面',
                id: NoUICaseId,
                value: caseList.length
            });
        }
        caseList.forEach((item) => {
            caseValueMap[item.value as number] = item.id;
        });
        this.$mx.Tool.$updateData({
            everyNoUI,
            caseList,
            caseValueMap,
            noUICaseList,
            activeCaseIndex: 0,
            caseTabState: {
                s0: 1
            },
            gridSelected: {}
        });
        if (action.autoCase) {
            this.changeCaseTab(action.autoCase);
            this.execCase(action.autoCase);
        }
    }
    tapCaseButton(e) {
        this.execCase(e.currentTarget.dataset.id);
    }
    changeCaseTab(e: MpEvent | string) {
        let caseId: string;
        let caseIndex = -1;
        if (typeof e === 'object' && e && e.currentTarget) {
            const item = this.data.caseList[e.detail];
            if (!item) {
                return;
            }
            caseIndex = e.detail;
        } else {
            caseId = String(e);
        }
        const action: WcCustomAction = this.actionDetail as WcCustomAction;
        if (!action) {
            return;
        }
        if (caseIndex === -1) {
            caseIndex = this.data.caseList.findIndex((item) => item.value === caseId);
            if (caseIndex === -1) {
                return;
            }
        }
        this.$mx.Tool.$updateData({
            activeCaseIndex: caseIndex,
            [`caseTabState.s${caseIndex}`]: 1
        });
    }
    execCase(id: string) {
        const action: WcCustomAction = this.actionDetail as WcCustomAction;
        if (!action) {
            return;
        }

        const caseIndex = action.cases.findIndex((item) => item.id === id);
        if (caseIndex === -1) {
            return;
        }
        const caseItem = action.cases[caseIndex];
        const show = (err?: Error, res?: any) => {
            if (!this.caseResultState) {
                this.caseResultState = {};
            }
            if (caseItem.showMode === WcCustomActionShowMode.grid) {
                if (!this.caseGridSource) {
                    this.caseGridSource = {};
                }
                this.caseGridSource[caseItem.id] = res;
                const gridResult = res as WcCustomActionGrid;
                const finalRes = { ...gridResult };
                finalRes.rowHeight =
                    typeof finalRes.rowHeight === 'number' && finalRes.rowHeight > 0 ? finalRes.rowHeight : rpxToPx(80);
                finalRes.rowHeightMode = finalRes.rowHeightMode || 'dynamic';
                finalRes.rowKeyField = finalRes.rowKeyField || 'id';
                res = finalRes;
                delete res.data;
                delete res.onReady;
            }
            this.caseResultState[caseItem.id] = {
                res,
                err
            };
            const state: any = {
                mode: caseItem.showMode,
                errMsg: err ? err.message : '',
                errStack: err ? err.stack : ''
            };
            if (!err) {
                if (caseItem.showMode === WcCustomActionShowMode.text) {
                    state.data = typeof res === 'object' ? JSON.stringify(res) : String(res);
                } else if (caseItem.showMode === WcCustomActionShowMode.component) {
                    state.data = res;
                } else if (caseItem.showMode === WcCustomActionShowMode.grid) {
                    Object.assign(state, res);
                    if (this.caseGrid?.[caseItem.id]) {
                        this.syncCaseTableData(caseItem.id);
                    }
                } else if (caseItem.showMode === WcCustomActionShowMode.json) {
                    if (this.caseJSONViewer?.[caseItem.id]) {
                        this.caseJSONViewer[caseItem.id].setTarget(res);
                        this.caseJSONViewer[caseItem.id].openPath();
                    }
                }
            }

            this.$mx.Tool.$forceData({
                [`caseLoading.${caseItem.id}`]: false,
                [`caseState.${caseItem.id}`]: state
            });
        };
        const res = caseItem.handler();
        if (typeof res === 'object' && res.then) {
            this.$mx.Tool.$forceData({
                [`caseLoading.${caseItem.id}`]: true
            });
            res.then((val) => show(undefined, val));
            res.catch((err) => show(err));
        } else {
            show(undefined, res);
        }
    }
    getCase(id: string) {
        const action: WcCustomAction = this.actionDetail as WcCustomAction;
        if (!action) {
            return;
        }
        return action.cases.find((item) => item.id === id);
    }
    convertCaseGridData(caseId: string, res: WcCustomActionGrid, list?: any[]) {
        if (!this.caseGridFinalList) {
            this.caseGridFinalList = {};
        }
        if (list) {
            delete this.caseGridFinalList[caseId];
        }
        if (!this.caseGridFinalList?.[caseId]) {
            const colIndexMap = res.cols.reduce((sum, col, index) => {
                sum[col.field] = index;
                return sum;
            }, {});
            this.caseGridFinalList[caseId] = (list || res.data || []).map((row, rowIndex) => {
                const rowId = row[res.rowKeyField || 'id'] || String(rowIndex);
                return Object.keys(row).reduce(
                    (sum, key) => {
                        const val = row[key];
                        if (typeof val === 'string' && val.includes('\n')) {
                            const cell: TableCell = {
                                tableCell: true,
                                blocks: val.split('\n').map((item) => {
                                    return {
                                        block: true,
                                        items: [item]
                                    };
                                })
                            };
                            sum[key] = cell;
                            return sum;
                        }
                        if (typeof val === 'object' && val?.tableCell && !res.autonomy) {
                            const cell = val as TableCell;
                            cell.blocks.forEach((block, blockIndex) => {
                                block.items.forEach((item, itemIndex) => {
                                    if (typeof item === 'object' && item?.type === 'json') {
                                        const jsonValue = item.value;
                                        if (!this.caseGridJSONSource) {
                                            this.caseGridJSONSource = {};
                                        }
                                        const sourceKey = `${caseId}_${rowId}_${colIndexMap[key]}_${blockIndex}_${itemIndex}`;
                                        this.caseGridJSONSource[sourceKey] = this.caseGridJSONSource[sourceKey] || {};
                                        this.caseGridJSONSource[sourceKey].value = jsonValue;
                                        // if (this.caseGridJSONSource[sourceKey].jsonViewer) {
                                        //     this.caseGridJSONSource[sourceKey].jsonViewer?.setTarget(jsonValue);
                                        //     this.caseGridJSONSource[sourceKey].jsonViewer?.init();
                                        // }
                                        delete item.value;
                                    }
                                });
                            });
                            sum[key] = cell;
                            return sum;
                        }
                        sum[key] = val;
                        return sum;
                    },
                    { [res.rowKeyField || 'id']: rowId }
                );
            });
        }
        return this.caseGridFinalList[caseId];
    }
    syncCaseTableData(caseId: string) {
        const gridResult = (this.caseGridSource as Record<string, WcCustomActionGrid>)[caseId];
        if (gridResult.autonomy) {
            return;
        }
        const tableExports = (
            this.caseGrid as Record<string, DynamicTableComponentExports | RegularTableComponentExports>
        )[caseId];
        const list = this.convertCaseGridData(caseId, gridResult);
        tableExports.setList(list);
        setTimeout(() => {
            const colIndexMap = gridResult.cols.reduce((sum, col, index) => {
                sum[col.field] = index;
                return sum;
            }, {});
            list.forEach((row) => {
                const rowId = row[gridResult.rowKeyField || 'id'];
                Object.keys(row).forEach((key) => {
                    const val = row[key];
                    if (typeof val === 'object' && val?.tableCell) {
                        const cell = val as TableCell;
                        cell.blocks.forEach((block, blockIndex) => {
                            block.items.forEach((item, itemIndex) => {
                                if (typeof item === 'object' && item?.type === 'json') {
                                    const sourceKey = `${caseId}_${rowId}_${colIndexMap[key]}_${blockIndex}_${itemIndex}`;
                                    const source = this.caseGridJSONSource?.[sourceKey];
                                    if (source?.value && source.jsonViewer) {
                                        source.jsonViewer.setTarget(source.value);
                                        source.jsonViewer.init();
                                    }
                                }
                            });
                        });
                    }
                });
            });
        }, 100);
    }
    setCaseTableJSONTarget(caseId: string, e: TableComponentJSONViewerItem) {
        const sourceKey = `${caseId}_${e.rowKey}_${e.colIndex}_${e.blockIndex}_${e.jsonItemIndex}`;
        if (!this.caseGridJSONSource) {
            this.caseGridJSONSource = {};
        }
        if (!(sourceKey in this.caseGridJSONSource)) {
            this.caseGridJSONSource[sourceKey] = {};
        }
        this.caseGridJSONSource[sourceKey].jsonViewer = e.viewer;
        const source = this.caseGridJSONSource[sourceKey];
        if (source.value) {
            e.viewer.setTarget(source.value);
            e.viewer.init();
            const ets = this.caseGrid?.[caseId] as DynamicTableComponentExports;
            if ('reQueryItemElementSizeByIndex' in ets) {
                setTimeout(() => {
                    ets.reQueryItemElementSizeByIndex(e.rowIndex);
                }, 120);
            }
        }
    }
    onItemInteractEvent(e: Required<MpEvent<{ type: string; id: string; detail?: any }>>) {
        const caseId = e.currentTarget.dataset.case;
        if (e.detail.type === 'onJSONViewerToggle') {
            nextTick(() => {
                const grid = this.caseGrid?.[caseId];
                if (grid && 'reQueryItemElementSizeByIndex' in grid) {
                    grid.reQueryItemElementSizeByKey(e.detail.id);
                }
            });
            return;
        }
        if (e.detail.type === 'tapRow') {
            this.$mx.Tool.$updateData({
                [`gridSelected.${caseId}`]: [e.detail.id]
            });
            return;
        }
        if (e.detail.type === 'longpressRow' || e.detail.type === 'longpressCell') {
            this.longpressGridCell(caseId, e.detail.id, (e.detail as any).colIndex);
            return;
        }
    }
    longpressGridCell(caseId: string, rowId: string, colIndex: number) {
        this.$mx.Tool.$updateData({
            [`gridSelected.${caseId}`]: [rowId]
        });
        this.$mx.Tool.$showActionSheet(['复制单元格内容', '复制整行内容', '复制整个表格内容']).then((res) => {
            const row = this.findFullGridRow(caseId, rowId);
            const gridSource = this.caseGridSource as Record<string, WcCustomActionGrid>;
            const gridResult = gridSource[caseId];
            if (res === 0) {
                setClipboardData(toJSONString(row[gridResult.cols[colIndex].field]));
                return;
            }

            if (res === 1) {
                setClipboardData(toJSONString(row));
                return;
            }
            setClipboardData(
                toJSONString(
                    (this.caseGridFinalList as Record<string, any[]>)[caseId].map((item) => {
                        return this.findFullGridRow(caseId, item[gridResult.rowKeyField || 'id']);
                    })
                )
            );
        });
    }
    findFullGridRow(caseId: string, rowId: string) {
        if (this.caseGridFinalList?.[caseId]) {
            const gridSource = this.caseGridSource as Record<string, WcCustomActionGrid>;
            const gridResult = gridSource[caseId];
            const rowKeyField = gridResult.rowKeyField || 'id';
            const row = this.caseGridFinalList[caseId].find((item) => item[rowKeyField] === rowId);
            if (!row) {
                return;
            }
            const fullRow: any = {};
            const colIndexMap = gridResult.cols.reduce((sum, col, index) => {
                sum[col.field] = index;
                return sum;
            }, {});
            Object.keys(row).forEach((key) => {
                const val = row[key];
                if (typeof val === 'object' && val?.tableCell) {
                    fullRow[key] = {
                        ...val
                    };
                    const cell = val as TableCell;
                    fullRow[key].blocks = cell.blocks.map((block, blockIndex) => {
                        return {
                            ...block,
                            items: block.items.map((item, itemIndex) => {
                                if (typeof item === 'object' && item?.type === 'json') {
                                    const sourceKey = `${caseId}_${rowId}_${colIndexMap[key]}_${blockIndex}_${itemIndex}`;
                                    const source = this.caseGridJSONSource?.[sourceKey];

                                    return {
                                        ...item,
                                        value: source?.value || item.value
                                    };
                                }
                                return item;
                            })
                        };
                    });
                    return;
                }
                fullRow[key] = val;
            });
            return fullRow;
        }
    }
    gridReady(e: Required<MpEvent<DynamicTableComponentExports | RegularTableComponentExports>>) {
        const caseId = e.currentTarget.dataset.case;
        const caseItem = this.getCase(caseId);
        if (!caseItem) {
            return;
        }
        if (!this.caseGrid) {
            this.caseGrid = {};
        }
        const grid = e.detail;
        this.caseGrid[caseId] = grid;
        grid.onJSONViewerReady((e: TableComponentJSONViewerReadyEvent) => {
            this.setCaseTableJSONTarget(caseId, e.current);
        });
        this.syncCaseTableData(caseId);
    }
}

registerClassComponent(CustomActionComponent);
