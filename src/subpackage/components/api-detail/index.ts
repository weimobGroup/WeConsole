import { convertApiDetail } from '@/sub/modules/detail';
import type { MpApiDetail, MpProduct } from '@/types/product';
import type { MpComponentProperties } from 'typescript-mp-component';
import { MpComponent } from 'typescript-mp-component';
import { ToolMixin } from '@/sub/mixins/tool';
import { registerClassComponent } from '@/sub/mixins/component';
import type { JsonViewer, MpJSONViewerComponentEbusDetail } from '@/sub/components/json-viewer/index';
import { uuid } from '@mpkit/util';

interface Data {
    loading: boolean;
    error: string;
    tabs: any[];
    detail: MpApiDetail | null;
    activeTabIndex: number;
    // stackHideHooks: boolean;
    selfHash: string;
}

class ApiDetailComponent extends MpComponent {
    JSONViewerMap?: Record<string, { target?: any; viewer?: JsonViewer }>;
    orgDetail?: MpProduct;
    apiOptinos?: any;
    apiRequestData?: any;
    apiResult?: any;
    apiResponse?: any;
    $mx = {
        Tool: new ToolMixin<Data>()
    };
    properties?: MpComponentProperties<{ tab: number; data: string }, ApiDetailComponent> = {
        data: {
            type: String,
            observer() {
                delete this.JSONViewerMap;
                this.setDetailData();
            }
        },
        tab: {
            type: Number,
            observer(val) {
                this.$mx.Tool.$updateData({
                    activeTabIndex: val
                });
            }
        }
    };
    initData: Data = {
        loading: true,
        error: '',
        tabs: [
            {
                name: 'Headers',
                value: 'headers'
            },
            {
                name: 'Preview',
                value: 'preview'
            },
            {
                name: 'Response',
                value: 'response'
            }
            // {
            //     name: "Initiator",
            //     value: "initiator",
            // },
        ],
        activeTabIndex: 0,
        detail: null,
        // stackHideHooks: true,
        selfHash: ''
    };
    created() {
        this.$mx.Tool.$forceData({
            selfHash: uuid()
        });
        this.$mx.Tool.$wcOn('JSONViewerReady', (type, data: MpJSONViewerComponentEbusDetail) => {
            if (!data.from.startsWith(this.data.selfHash)) {
                return;
            }
            const isFrom = (type: string) => {
                return data.from === `${this.data.selfHash}ApiDetail_${this.data.data}_${type}`;
            };
            const typeData = {
                Options: this.apiOptinos,
                RequestData: this.apiRequestData,
                PreviewResult: this.apiResult,
                Result: this.apiResult,
                PreviewResponse: this.apiResponse,
                Response: this.apiResponse
            };
            Object.keys(typeData).forEach((type) => {
                if (isFrom(type)) {
                    this.setJSONViewer(type, typeData[type], data.viewer);
                    data.viewer.init();
                }
            });
        });
    }
    // toggleVisibleStackHooks() {
    //     this.$mx.Tool.$updateData({
    //         stackHideHooks: !this.data.stackHideHooks,
    //     });
    //     this.setStackHooks();
    // }
    // setStackHooks() {
    //     const product: MpProduct = this.orgDetail;
    //     if (product && product.stack) {
    //         let stack: MpDetailKV[] = product.stack.map((item) => {
    //             const data: MpDetailKV = {
    //                 name: item.target || "",
    //             };
    //             if (item.fileName) {
    //                 data.value = convertStockToInitiatorName(item);
    //             }
    //             return data;
    //         }) as MpDetailKV[];
    //         if (this.data.stackHideHooks) {
    //             const index = stack.lastIndexOf(
    //                 (item) =>
    //                     item.name.indexOf(
    //                         "MkFuncHelperOfHookTarget"
    //                     ) !== -1
    //             );
    //             if (index !== -1) {
    //                 stack.splice(0, index + 2);
    //             }
    //         }
    //         this.$mx.Tool.$updateData({
    //             "detail.stack": stack,
    //         });
    //     }
    // }
    setTab(e) {
        this.triggerEvent('changeTab', e.detail);
    }
    close() {
        this.triggerEvent('close');
    }
    setDetailData(showLoading = true) {
        showLoading &&
            this.$mx.Tool.$updateData({
                loading: true,
                detail: null
            });
        const data = this.$mx.Tool.$getProp('data');
        if (typeof data === 'string') {
            if (!this.$mx.Tool.$wcProductController) {
                return (
                    showLoading &&
                    this.$mx.Tool.$forceData({
                        loading: false,
                        error: '未找到观察者，无法根据ID查询数据',
                        detail: null
                    })
                );
            }
            const apiProduct = this.$mx.Tool.$wcProductController.findById(data);
            if (this.$mx.Tool.$wcComponentIsDestroyed) {
                return;
            }
            if (apiProduct) {
                // this.$mx.Tool.$updateData({
                //     stack: apiProduct.stack
                // });
                this.orgDetail = apiProduct;

                this.apiOptinos = apiProduct?.request && apiProduct.request?.[0] ? apiProduct.request[0] : undefined;
                this.setJSONViewer('Options', this.apiOptinos);
                if (apiProduct.category === 'request' && this.apiOptinos) {
                    this.apiRequestData = this.apiOptinos.data;
                    this.setJSONViewer('RequestData', this.apiRequestData);
                }
                this.apiResult = apiProduct.result;
                this.setJSONViewer('Result', this.apiResult);
                this.setJSONViewer('PreviewResult', this.apiResult);

                this.apiResponse = apiProduct?.response && apiProduct.response[0] ? apiProduct.response[0] : undefined;
                this.setJSONViewer('Response', this.apiResponse);
                this.setJSONViewer('PreviewResponse', this.apiResponse);
                const detail = convertApiDetail(apiProduct);
                const tabs = this.data.tabs;
                if (detail?.cookies && detail.cookies.length && !tabs.find((item) => item.value === 'cookies')) {
                    tabs.push({
                        name: 'Cookies',
                        value: 'cookies'
                    });
                }
                this.$mx.Tool.$forceData({
                    tabs,
                    loading: false,
                    error: '',
                    detail
                });
                // this.setStackHooks();
                return;
            }
            this.$mx.Tool.$forceData({
                loading: false,
                error: '',
                detail: null
            });
            return;
        }
        if (data) {
            this.$mx.Tool.$forceData({
                loading: false,
                error: '',
                detail: data
            });
            return;
        }

        this.$mx.Tool.$forceData({
            loading: false,
            error: '请传递有效的数据',
            detail: null
        });
    }
    onWcProduct(type: string, data: MpProduct) {
        if (data.id === this.data.data) {
            this.setDetailData();
        }
    }
    setJSONViewer(type: string, target: any, viewer?: JsonViewer) {
        if (!this.JSONViewerMap) {
            this.JSONViewerMap = {};
        }
        if (!this.JSONViewerMap[type]) {
            this.JSONViewerMap[type] = {
                target,
                viewer
            };
        }
        this.JSONViewerMap[type].target = target;
        if (viewer) {
            this.JSONViewerMap[type].viewer = viewer;
        }
        if (this.JSONViewerMap[type].viewer) {
            const vw = this.JSONViewerMap[type].viewer;
            if (!vw) {
                return;
            }
            vw.setTarget(target);
            if (type === 'PreviewResponse') {
                vw.onInited((viewer: JsonViewer) => {
                    if (viewer.data.from === `${this.data.selfHash}ApiDetail_${this.data.data}_PreviewResponse`) {
                        viewer.openPath(this.orgDetail && this.orgDetail.category === 'request' ? ['data'] : []);
                    }
                });
            }
        }
    }
}

registerClassComponent(ApiDetailComponent);
