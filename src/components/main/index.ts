import { promiseifyApi, wcScope } from '../../modules/util';
import { WeComponent } from '../mixins/component';
import EbusMixin from '../mixins/ebus';
import { getSystemInfo } from '../modules/util';
import { MpNameValue } from '../../types/common';
import { getCustomActions } from '../modules/custom-action';
import { MainStateController } from './init';
import { WeConsoleEvents } from '../../types/scope';

const WcScope = wcScope();

const getSysTabs = (): MpNameValue<string>[] =>
    getCustomActions().map((item) => ({
        name: item.title || item.id,
        value: item.id
    }));

WeComponent(EbusMixin, {
    properties: {
        // 组件全屏化后，距离窗口顶部距离
        fullTop: String,
        // 刘海屏机型（如iphone12等）下组件全屏化后，距离窗口顶部距离
        adapFullTop: String
    },
    data: {
        showIcon: MainStateController.getState('showIcon') ? true : WcScope.visable || false,
        inited: !!MainStateController.getState('handX'),
        handX: MainStateController.getState('handX') || '',
        handY: MainStateController.getState('handY') || '',
        visable: MainStateController.getState('visable') || false,
        mounted: MainStateController.getState('mounted') || false,
        pageVisable: true,
        fullScreen: MainStateController.getState('fullScreen') || false,
        activeTabIndex: MainStateController.getState('activeTabIndex') || 0,
        isFullScreenPhone: MainStateController.getState('isFullScreenPhone') || false,
        winWidth: MainStateController.getState('winWidth') || 0,
        winHeight: MainStateController.getState('winHeight') || 0,
        tabMountState: MainStateController.getState('tabMountState') || {
            s1: 1
        },
        tabs: [
            {
                name: 'Console',
                value: 'console'
            },
            {
                name: 'Api',
                value: 'api'
            },
            {
                name: 'Component',
                value: 'component'
            },
            {
                name: 'Storage',
                value: 'storage'
            },
            {
                name: 'Other',
                value: 'other'
            }
        ],
        sysTabs: getSysTabs(),
        activeSysTab: MainStateController.getState('activeSysTab') || 0,
        sysTabMountState: MainStateController.getState('sysTabMountState') || {
            s0: 1
        }
    },
    methods: {
        noop() {},
        syncState() {
            const data = {
                showIcon: MainStateController.getState('showIcon') ? true : this.data.showIcon,
                inited: MainStateController.getState('inited') ? true : this.data.inited,
                handX: MainStateController.getState('handX') || this.data.handX,
                handY: MainStateController.getState('handY') || this.data.handY,
                visable:
                    typeof MainStateController.getState('visable') !== 'undefined'
                        ? MainStateController.getState('visable')
                        : this.data.visable,
                mounted:
                    typeof MainStateController.getState('mounted') !== 'undefined'
                        ? MainStateController.getState('mounted')
                        : this.data.mounted,
                fullScreen:
                    typeof MainStateController.getState('fullScreen') !== 'undefined'
                        ? MainStateController.getState('fullScreen')
                        : this.data.fullScreen,
                activeTabIndex:
                    typeof MainStateController.getState('activeTabIndex') !== 'undefined'
                        ? MainStateController.getState('activeTabIndex')
                        : this.data.activeTabIndex,
                isFullScreenPhone:
                    typeof MainStateController.getState('isFullScreenPhone') !== 'undefined'
                        ? MainStateController.getState('isFullScreenPhone')
                        : this.data.isFullScreenPhone,
                winWidth: MainStateController.getState('winWidth') || this.data.winWidth,
                winHeight: MainStateController.getState('winHeight') || this.data.winHeight,
                tabMountState: MainStateController.getState('tabMountState') || this.data.tabMountState,
                activeSysTab:
                    typeof MainStateController.getState('activeSysTab') !== 'undefined'
                        ? MainStateController.getState('activeSysTab')
                        : this.data.activeSysTab,
                sysTabMountState: MainStateController.getState('sysTabMountState') || this.data.sysTabMountState
            };
            this.setData(data);
            this.getCanvasCtx().then((ctx) => {
                if (this.$wcComponentIsDeatoryed) {
                    return;
                }
                WcScope.CanvasContext = ctx;
                this.$wcEmit(WeConsoleEvents.WcCanvasContextReady, ctx);
            });
        },
        changeSysTab(e) {
            this.setData({
                activeSysTab: e.detail,
                [`sysTabMountState.s${e.detail}`]: 1
            });
            MainStateController.setState('activeSysTab', e.detail);
            MainStateController.setState('sysTabMountState', JSON.parse(JSON.stringify(this.data.sysTabMountState)));
        },
        handMovableEnd(e) {
            const state = JSON.parse(e);
            wx.setStorage({
                key: 'wcconsole_xy',
                data: {
                    x: state.x,
                    y: state.y
                }
            });
            MainStateController.setState('handX', state.x + 'px');
            MainStateController.setState('handY', state.y + 'px');
            this.setData({
                handX: state.x + 'px',
                handY: state.y + 'px'
            });
        },
        toggleVisable() {
            this.setData({
                visable: !this.data.visable,
                mounted: true
            });
            MainStateController.setState('visable', this.data.visable);
            MainStateController.setState('mounted', this.data.mounted);
        },
        toggleZoom() {
            this.setData({
                fullScreen: !this.data.fullScreen
            });
            MainStateController.setState('fullScreen', this.data.fullScreen);
            this.$wcEmit(WeConsoleEvents.WcMainComponentSizeChange);
        },
        close() {
            this.setData({
                visable: false
            });
            MainStateController.setState('visable', this.data.visable);
        },
        setTab(e) {
            const activeTabIndex = parseInt(e.detail);
            this.setData({
                activeTabIndex,
                [`tabMountState.s${activeTabIndex}`]: 1
            });
            MainStateController.setState('activeTabIndex', activeTabIndex);
            MainStateController.setState('tabMountState', JSON.parse(JSON.stringify(this.data.tabMountState)));
        },
        getCanvasCtx() {
            if (this.canvasCtx) {
                return Promise.resolve(this.canvasCtx);
            }

            return new Promise((resolve, reject) => {
                let retryCount = 0;
                const fire = () => {
                    this.createSelectorQuery()
                        .select('#canvas')
                        .fields({ node: true })
                        .exec((res) => {
                            if (res?.[0] && res?.[0]?.node) {
                                const canvas = res[0].node;
                                this.canvasCtx = canvas.getContext('2d');
                                resolve(this.canvasCtx);
                            } else {
                                retryCount++;
                                if (retryCount > 3 || this.$wcComponentIsDeatoryed) {
                                    return reject(new Error('无法获得canvas context'));
                                }
                                setTimeout(() => {
                                    fire();
                                }, 200);
                            }
                        });
                };
                fire();
            });
        },
        init() {
            let winPromise = Promise.resolve();
            if (!MainStateController.getState('winHeight')) {
                winPromise = getSystemInfo().then((res) => {
                    this.setData({
                        isFullScreenPhone: res.statusBarHeight && res.statusBarHeight > 20,
                        winWidth: res.windowWidth - 20,
                        winHeight: res.windowHeight - 20
                    });
                    // 默认情况下，如果是打开调试时，才显示icon
                    if (!('visable' in WcScope)) {
                        MainStateController.setState('showIcon', !!(res as any).enableDebug);
                    } else {
                        MainStateController.setState('showIcon', WcScope.visable);
                    }
                    MainStateController.setState('winHeight', this.data.winHeight);
                    MainStateController.setState('winWidth', this.data.winWidth);
                    MainStateController.setState('isFullScreenPhone', this.data.isFullScreenPhone);
                });
            }
            let handPromise = Promise.resolve();
            if (!MainStateController.getState('handX')) {
                handPromise = promiseifyApi('getStorage', {
                    key: 'wcconsole_xy'
                })
                    .catch(() => Promise.resolve())
                    .then((res) => {
                        if (res?.data) {
                            this.setData({
                                inited: true,
                                handX: res.data.x + 'px',
                                handY: res.data.y + 'px'
                            });
                            MainStateController.setState('handX', this.data.handX);
                            MainStateController.setState('handY', this.data.handY);
                            MainStateController.setState('inited', this.data.inited);
                            return;
                        }
                        this.setData({
                            inited: true
                        });
                        MainStateController.setState('inited', this.data.inited);
                    });
            }
            return Promise.all([winPromise, handPromise]).then(() => {
                this.syncState();
            });
        }
    },
    attached() {
        this.$wcOn(WeConsoleEvents.WcVisableChange, (type, data) => {
            MainStateController.setState('showIcon', !!data);
            this.setData({
                showIcon: !!data
            });
        });
        this.$wcOn(WeConsoleEvents.WcUIConfigChange, () => {
            // 刷新其他选项卡中的数据
            this.setData({
                sysTabs: getSysTabs()
            });
        });

        (this as any).init();
    },
    detached() {
        this.$wcEmit(WeConsoleEvents.WcCanvasContextDestory);
        delete WcScope.CanvasContext;
    },
    pageLifetimes: {
        show() {
            this.syncState();
            this.setData({
                pageVisable: true
            });
        },
        hide() {
            this.setData({
                pageVisable: false
            });
        }
    }
});
