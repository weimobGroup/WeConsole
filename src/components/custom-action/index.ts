import type { WcCustomAction, WcCustomActionCase, WcCustomActionGrid } from '../../types/other';
import { WcCustomActionShowMode } from '../../types/other';
import type { MpEvent, MpViewContext, MpViewContextAny } from '../../types/view';
import { WeComponent } from '../mixins/component';
import { getCustomActions } from '../modules/custom-action';
import EbusMixin from '../mixins/ebus';
import type { MpJSONViewerComponentEbusDetail } from '../../types/json-viewer';
import type { DataGridCol, MpDataGridComponentExports } from '../../types/data-grid';
import type { MpNameValue } from '../../types/common';
import { each } from '../../modules/util';
const NoUICaseId = '$$$NO_UI$$$';
WeComponent<MpViewContext & MpViewContextAny>(EbusMixin, {
    properties: {
        action: {
            type: String,
            observer() {
                this.setAction();
            }
        }
    },
    data: {
        caseList: [],
        noUICaseList: [],
        everyNoUI: false,
        activeCaseIndex: 0,
        caseState: {},
        caseTabState: {
            s0: 1
        },
        gridSelected: {}
    },
    methods: {
        setAction() {
            const actions = getCustomActions();
            this.actionDetail = actions.find((item) => item.id === this.data.action);
            if (!this.actionDetail) {
                this.$updateData({
                    caseList: null,
                    noUICaseList: null,
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
            const buttonTexts: [MpNameValue<string>[], MpNameValue<string>[]] = [[], []];
            action.cases.forEach((item) => {
                const nv = {
                    name: item.button || item.id,
                    value: item.id
                };
                if (!item.showMode || item.showMode === WcCustomActionShowMode.none) {
                    noneCases.push(item);
                    buttonTexts[0].push(nv);
                } else {
                    uiCases.push(item);
                    buttonTexts[1].push(nv);
                }
            });
            let caseList: MpNameValue<string>[];
            let noUICaseList: MpNameValue<string>[];
            const everyNoUI: boolean = noneCases.length === action.cases.length;
            if (noneCases.length <= 1) {
                caseList = buttonTexts[0].concat(buttonTexts[1]);
                noUICaseList = [];
            } else {
                noUICaseList = buttonTexts[0];
                caseList = buttonTexts[1];
                caseList.unshift({
                    name: '无界面',
                    value: NoUICaseId
                });
            }
            this.$updateData({
                everyNoUI,
                caseList,
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
        },
        tapCaseButton(e) {
            this.execCase(e.currentTarget.dataset.id);
        },
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
            this.$updateData({
                activeCaseIndex: caseIndex,
                [`caseTabState.s${caseIndex}`]: 1
            });
        },
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
            const show = (err: Error, res?: any) => {
                if (!this.caseResultState) {
                    this.caseResultState = {};
                }
                if (caseItem.showMode === WcCustomActionShowMode.grid) {
                    res = {
                        ...res
                    };
                    res.data = this.convertCaseGridData(res.data || []);
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
                        const options: WcCustomActionGrid = res as WcCustomActionGrid;
                        state.cols = options.cols;
                        this.appendDataToGrid(caseItem.id, options.data);
                    } else if (caseItem.showMode === WcCustomActionShowMode.json) {
                        if (this?.caseJSONViewer && this.caseJSONViewer[caseItem.id]) {
                            this.caseJSONViewer[caseItem.id].setTarget(res);
                            this.caseJSONViewer[caseItem.id].openPath();
                        }
                    }
                    // else if (
                    //     caseItem.showMode === WcCustomActionShowMode.jsonGrid
                    // ) {
                    //     const options: WcCustomActionGrid =
                    //         res as WcCustomActionGrid;
                    //     state.cols = options.cols;
                    //     const data: any[] = Array.isArray(options.data)
                    //         ? options.data
                    //         : [];
                    //     let list = data;
                    //     if (options.cols.some((item) => item.json)) {
                    //         list = data.map((item) =>
                    //             this.convertJSONGridItem(
                    //                 caseItem,
                    //                 item,
                    //                 options.cols
                    //             )
                    //         );
                    //     }

                    //     this.appendDataToGrid(caseItem.id, list);
                    // }
                }

                this.$updateData({
                    [`caseLoading.${caseItem.id}`]: false,
                    [`caseState.${caseItem.id}`]: state
                });
            };
            const res = caseItem.handler();
            if (typeof res === 'object' && res.then) {
                this.$updateData({
                    [`caseLoading.${caseItem.id}`]: true
                });
                res.then((val) => show(null, val));
                res.catch((err) => show(err));
            } else {
                show(null, res);
            }
        },
        getCase(id: string) {
            const action: WcCustomAction = this.actionDetail as WcCustomAction;
            if (!action) {
                return;
            }
            return action.cases.find((item) => item.id === id);
        },
        convertJSONGridItem(caseItem: WcCustomActionCase, item: any, cols: DataGridCol[]): any {
            const res: any = {};
            each(item, (prop, val) => {
                const col = cols.find((c) => c.field === prop);
                if (col?.json) {
                    res[prop] = {
                        json: 1,
                        key: `CustomAction_${caseItem.id}_${item.id}_${prop}`
                    };
                } else {
                    res[prop] = val;
                }
            });
            return res;
        },
        convertCaseGridData(list: any[]) {
            return list.map((data, i) =>
                Object.keys(data).reduce(
                    (sum, key) => {
                        const val = data[key];
                        if (typeof val === 'string' && val.includes('\n')) {
                            sum[key] = {
                                multiLine: true,
                                lines: val.split('\n').map((v, i) => {
                                    return {
                                        key: String(i),
                                        content: v,
                                        type: 'text'
                                    };
                                })
                            };
                            return sum;
                        }
                        sum[key] = val;
                        return sum;
                    },
                    { id: data.id || String(i) }
                )
            );
        },
        appendDataToGrid(caseId: string, list: any[]) {
            if (this.caseGrid?.[caseId]) {
                return (this.caseGrid[caseId] as MpDataGridComponentExports).replaceAllList(list);
            }
        },
        tapGridCell(e) {
            const caseId = e.currentTarget.dataset.case;
            this.$updateData({
                [`gridSelected.${caseId}`]: e.detail.rowId || ''
            });
        },
        gridReady(e: MpEvent<MpDataGridComponentExports>) {
            const caseId = e.currentTarget.dataset.case;
            const caseItem = this.getCase(caseId);
            if (!caseItem) {
                return;
            }
            if (!this.caseGrid) {
                this.caseGrid = {};
            }
            this.caseGrid[caseId] = e.detail;
            e.detail.onJSONReady((data: MpJSONViewerComponentEbusDetail) => {
                const { from, viewer } = data;
                if (from?.startsWith('GridCol_CustomAction')) {
                    const [, , caseId, itemId, field] = from.split('_');
                    const list = this.caseResultState?.[caseId]?.res?.data || [];
                    if (!this.caseResultState[caseId].JSONViewerMap) {
                        this.caseResultState[caseId].JSONViewerMap = {};
                    }
                    this.caseResultState[caseId].JSONViewerMap[field] = viewer;
                    const readyItem = list.find((item) => {
                        if (typeof item.id === 'number') {
                            return item.id === parseFloat(itemId);
                        }
                        return item.id === itemId;
                    });
                    if (readyItem) {
                        viewer.setTarget(readyItem[field]);
                        viewer.init();
                    }
                }
            });
            if (this.caseResultState?.[caseId]?.res?.data) {
                const list: any[] = this.caseResultState[caseId].res.data;
                e.detail.replaceAllList(list);
                // if (
                //     caseItem.showMode === WcCustomActionShowMode.jsonGrid &&
                //     this.data.caseState[caseItem.id].cols &&
                //     this.data.caseState[caseItem.id].cols.some(
                //         (item) => item.json
                //     )
                // ) {
                //     e.detail.replaceAllList(
                //         list.map((item) =>
                //             this.convertJSONGridItem(
                //                 caseItem,
                //                 item,
                //                 this.data.caseState[caseItem.id].cols
                //             )
                //         )
                //     );
                // } else {
                // }
            }
        }
    },
    attached() {
        this.setAction();
        // const action: WcCustomAction = {
        //     id: 'd1',
        //     cases: [
        //         {
        //             id: 'c1',
        //             showMode: WcCustomActionShowMode.none,
        //             handler: () => console.log('d1-c1')
        //         },
        //         {
        //             id: 'c2',
        //             showMode: WcCustomActionShowMode.none,
        //             handler: () => console.log('d1-c2')
        //         },
        //         {
        //             id: 'c2',
        //             showMode: WcCustomActionShowMode.json,
        //             handler: () => ({
        //                 name: 'Tom'
        //             })
        //         }
        //     ]
        // };
    },
    created() {
        this.$wcOn('JSONViewerReady', (type, data: MpJSONViewerComponentEbusDetail) => {
            if (
                data.from.startsWith(`CustomAction_${this.data.action}`) &&
                data.viewer.selectOwnerComponent &&
                data.viewer.selectOwnerComponent() === this
            ) {
                const caseId = data.from.split('_')[2];
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
                    if (this?.caseResultState && this.caseResultState[caseItem.id]) {
                        data.viewer.setTarget(this.caseResultState[caseItem.id].res);
                        data.viewer.openPath();
                    }
                });
            }
        });
    }
});
