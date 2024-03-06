import { getCustomActions } from '@/sub/modules/custom-action';
import { WeConsoleEvents } from '@/types/scope';
import { wcScope } from '@/main/config';
import { MpComponent } from 'typescript-mp-component';
import { ToolMixin } from '@/sub/mixins/tool';
import { MainStateController } from '@/main/modules/state-controller';
import { registerClassComponent } from '@/sub/mixins/component';
import {
    checkDebugEnabled,
    getCurrentEnvVersion,
    getStorage,
    getSystemInfo,
    setClipboardData,
    setStorage,
    showToast
} from 'cross-mp-power';
import { getElementId } from '@/sub/modules/element';
import type { MpEvent } from '@/types/view';

const WcScope = wcScope();

const getSysTabs = () =>
    getCustomActions().reduce(
        (sum, item, index) => {
            sum.map[String(index)] = item.id;
            sum.list.push({
                name: item.title || item.id,
                value: index,
                id: item.id
            });
            return sum;
        },
        { map: {}, list: [] as any[] }
    );

class MainComponent extends MpComponent {
    canvasCtx?: any;
    isCanvasReadyResolve?: boolean;
    onCanvasReadyResolve?: () => void;
    $mx = {
        Tool: new ToolMixin()
    };
    options = {
        multipleSlots: true
    };
    properties = {
        // 组件全屏化后，距离窗口顶部距离
        fullTop: String,
        // 刘海屏机型（如iphone12等）下组件全屏化后，距离窗口顶部距离
        adapFullTop: String,
        iconStyle: String,
        handStyle: String,
        customHand: Boolean,
        zIndex: {
            type: Number,
            value: 500
        },
        icon: {
            type: String,
            value: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjRweCIgaGVpZ2h0PSIyNHB4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+5byA5Y+RaWNvbjwvdGl0bGU+CiAgICA8ZyBpZD0i5pa55qGI5bCd6K+VIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0i55S75p2/IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzEuMDAwMDAwLCAtNzkuMDAwMDAwKSIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1ydWxlPSJub256ZXJvIj4KICAgICAgICAgICAgPGcgaWQ9Iue8lue7hC01IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzMS4wMDAwMDAsIDc5LjAwMDAwMCkiPgogICAgICAgICAgICAgICAgPHBhdGggZD0iTTEyLDEuMyBDMTcuOTA5NDQ2OCwxLjMgMjIuNyw2LjA5MDU1MzE4IDIyLjcsMTIgQzIyLjcsMTQuNDY5Nzg0NCAyMS44NTk4MTQ0LDE2LjgxMjg2OTYgMjAuMzQ0MzkzMywxOC42OTg0MTE0IEMyMC4xMDIyMDYzLDE4Ljk5OTc0OTMgMTkuNjYxNTkyMywxOS4wNDc3MDA1IDE5LjM2MDI1NDUsMTguODA1NTEzNSBDMTkuMDU4OTE2NywxOC41NjMzMjY1IDE5LjAxMDk2NTQsMTguMTIyNzEyNSAxOS4yNTMxNTI0LDE3LjgyMTM3NDcgQzIwLjU3MDUwOTUsMTYuMTgyMjcxMyAyMS4zLDE0LjE0Nzg4OTUgMjEuMywxMiBDMjEuMyw2Ljg2Mzc1MTgzIDE3LjEzNjI0ODIsMi43IDEyLDIuNyBDNi44NjM3NTE4MywyLjcgMi43LDYuODYzNzUxODMgMi43LDEyIEMyLjcsMTcuMTM2MjQ4MiA2Ljg2Mzc1MTgzLDIxLjMgMTIsMjEuMyBDMTMuMzEzNDk3NywyMS4zIDE0LjU4NzQ0MTMsMjEuMDI3OTU5MSAxNS43NjEzNjc0LDIwLjUwODE1NTcgQzE2LjExNDg2MjksMjAuMzUxNjMxMiAxNi41MjgzMTU5LDIwLjUxMTMwNzggMTYuNjg0ODQwNCwyMC44NjQ4MDM0IEMxNi44NDEzNjQ5LDIxLjIxODI5OSAxNi42ODE2ODgzLDIxLjYzMTc1MTkgMTYuMzI4MTkyNywyMS43ODgyNzY0IEMxNC45NzY1OTc2LDIyLjM4Njc0OTkgMTMuNTA5Njc1NCwyMi43IDEyLDIyLjcgQzYuMDkwNTUzMTgsMjIuNyAxLjMsMTcuOTA5NDQ2OCAxLjMsMTIgQzEuMyw2LjA5MDU1MzE4IDYuMDkwNTUzMTgsMS4zIDEyLDEuMyBaIE0xMi45NDY3MDA0LDguMTgxMTczMzMgQzEzLjMyMDEyNjcsOC4yODEyMzI2IDEzLjU0MTczNDUsOC42NjUwNjg0NyAxMy40NDE2NzUyLDkuMDM4NDk0NzQgTDExLjczMzQ2OTUsMTUuNDEzNjA1MiBDMTEuNjMzNDEwMiwxNS43ODcwMzE1IDExLjI0OTU3NDQsMTYuMDA4NjM5MiAxMC44NzYxNDgxLDE1LjkwODU3OTkgQzEwLjUwMjcyMTgsMTUuODA4NTIwNyAxMC4yODExMTQxLDE1LjQyNDY4NDggMTAuMzgxMTczMywxNS4wNTEyNTg1IEwxMi4wODkzNzksOC42NzYxNDgwOCBDMTIuMTg5NDM4Myw4LjMwMjcyMTgxIDEyLjU3MzI3NDIsOC4wODExMTQwNiAxMi45NDY3MDA0LDguMTgxMTczMzMgWiBNOC43MjM0MDE4Nyw4LjcyMTQ3NDc3IEM4Ljk2OTQzMjE4LDguOTY3NTA1MDcgOC45OTQwMzUyMSw5LjM1MTExMjY0IDguNzk3MjEwOTYsOS42MjQ2NTg0IEw4LjcyMzQwMTg3LDkuNzExNDI0MjYgTDYuMzg5LDEyLjA0NCBMOC43MjM0MDE4NywxNC4zNzgzMjkgQzguOTY5NDMyMTgsMTQuNjI0MzU5MyA4Ljk5NDAzNTIxLDE1LjAwNzk2NjkgOC43OTcyMTA5NiwxNS4yODE1MTI2IEw4LjcyMzQwMTg3LDE1LjM2ODI3ODUgQzguNDc3MzcxNTcsMTUuNjE0MzA4OCA4LjA5Mzc2Mzk5LDE1LjYzODkxMTggNy44MjAyMTgyNCwxNS40NDIwODc2IEw3LjczMzQ1MjM4LDE1LjM2ODI3ODUgTDQuOTA1MDI1MjUsMTIuNTM5ODUxNCBDNC42NTg5OTQ5NSwxMi4yOTM4MjExIDQuNjM0MzkxOTIsMTEuOTEwMjEzNSA0LjgzMTIxNjE2LDExLjYzNjY2NzcgTDQuOTA1MDI1MjUsMTEuNTQ5OTAxOSBMNy43MzM0NTIzOCw4LjcyMTQ3NDc3IEM4LjAwNjgxOTM4LDguNDQ4MTA3NzYgOC40NTAwMzQ4Nyw4LjQ0ODEwNzc2IDguNzIzNDAxODcsOC43MjE0NzQ3NyBaIE0xNi4xMDgyMDg5LDguNjQ3NjY1NjcgTDE2LjE5NDk3NDcsOC43MjE0NzQ3NyBMMTkuMDIzNDAxOSwxMS41NDk5MDE5IEMxOS4yNjk0MzIyLDExLjc5NTkzMjIgMTkuMjk0MDM1MiwxMi4xNzk1Mzk4IDE5LjA5NzIxMSwxMi40NTMwODU1IEwxOS4wMjM0MDE5LDEyLjUzOTg1MTQgTDE2LjE5NDk3NDcsMTUuMzY4Mjc4NSBDMTUuOTIxNjA3NywxNS42NDE2NDU1IDE1LjQ3ODM5MjMsMTUuNjQxNjQ1NSAxNS4yMDUwMjUzLDE1LjM2ODI3ODUgQzE0Ljk1ODk5NDksMTUuMTIyMjQ4MiAxNC45MzQzOTE5LDE0LjczODY0MDYgMTUuMTMxMjE2MiwxNC40NjUwOTQ5IEwxNS4yMDUwMjUzLDE0LjM3ODMyOSBMMTcuNTM4LDEyLjA0NCBMMTUuMjA1MDI1Myw5LjcxMTQyNDI2IEMxNC45NTg5OTQ5LDkuNDY1MzkzOTYgMTQuOTM0MzkxOSw5LjA4MTc4NjM4IDE1LjEzMTIxNjIsOC44MDgyNDA2MiBMMTUuMjA1MDI1Myw4LjcyMTQ3NDc3IEMxNS40NTEwNTU2LDguNDc1NDQ0NDYgMTUuODM0NjYzMSw4LjQ1MDg0MTQzIDE2LjEwODIwODksOC42NDc2NjU2NyBaIiBpZD0i5b2i54q257uT5ZCIIj48L3BhdGg+CiAgICAgICAgICAgIDwvZz4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg=='
        }
    };
    initData = {
        disabled: true,
        showIcon: false,
        inited: false,
        handX: MainStateController.getState('handX') || '',
        handY: MainStateController.getState('handY') || '',
        visible: false,
        mounted: false,
        pageVisible: true,
        fullScreen: MainStateController.getState('fullScreen') || false,
        activeTabIndex: MainStateController.getState('activeTabIndex') || 0,
        isFullScreenPhone: MainStateController.getState('isFullScreenPhone') || false,
        tabMountState: MainStateController.getState('tabMountState', {
            [`s${MainStateController.getState('activeTabIndex') || 0}`]: 1
        }),
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
        sysTabMountState: MainStateController.getState('sysTabMountState', {
            [`s${MainStateController.getState('activeSysTab') || 0}`]: 1
        })
    };
    attached() {
        const selfId = getElementId(this);
        const belongPage = this.getCurrentPageId();
        if (!belongPage || WcScope[belongPage] !== selfId) {
            // 保证一个页面不能有两个weconsole组件
            WcScope[belongPage] = selfId;
            this.$mx.Tool.$updateData({
                disabled: false
            });
        }
        this.$mx.Tool.$wcOn(WeConsoleEvents.WcVisibleChange, (type, data) => {
            MainStateController.setState('showIcon', !!data);
            this.$mx.Tool.$updateData({
                showIcon: !!data
            });
        });
        this.$mx.Tool.$wcOn(WeConsoleEvents.WcUIConfigChange, () => {
            // 刷新其他选项卡中的数据
            this.$mx.Tool.$updateData({
                sysTabs: getSysTabs()
            });
        });

        this.init();
    }
    detached() {
        this.$mx.Tool.$wcEmit(WeConsoleEvents.WcCanvasContextDestory);
        delete WcScope.CanvasContext;
    }
    onPageLifeShow() {
        this.syncState();
        this.$mx.Tool.$updateData({
            pageVisible: true
        });
    }
    onPageLifeHide() {
        this.$mx.Tool.$updateData({
            pageVisible: false
        });
    }
    getCurrentPageId() {
        if (BUILD_TARGET === 'wx') {
            return this.getPageId();
        }
        if (BUILD_TARGET === 'my') {
            return (this as any).$page?.$id || '';
        }
        return '';
    }
    copyAd() {
        setClipboardData('https://github.com/weimob-tech/WeConsole').then(() => {
            showToast('已复制Github项目地址');
        });
    }
    syncState() {
        const data = {};
        [
            'showIcon',
            'inited',
            'handX',
            'handY',
            'visible',
            'mounted',
            'fullScreen',
            'activeTabIndex',
            'isFullScreenPhone',
            'tabMountState',
            'activeSysTab',
            'sysTabMountState'
        ].forEach((prop) => {
            data[prop] =
                typeof MainStateController.getState(prop) !== 'undefined'
                    ? MainStateController.getState(prop)
                    : this.data[prop];
        });
        this.$mx.Tool.$updateData(data);
        this.getCanvasCtx()
            .then((ctx) => {
                if (this.$mx.Tool.$wcComponentIsDestroyed) {
                    return;
                }
                delete WcScope.CanvasContextFail;
                WcScope.CanvasContext = ctx;
                this.$mx.Tool.$wcEmit(WeConsoleEvents.WcCanvasContextReady, ctx);
            })
            .catch(() => {
                this.$mx.Tool.$wcEmit(WeConsoleEvents.WcCanvasContextFail);
                WcScope.CanvasContextFail = true;
            });
    }
    changeSysTab(e) {
        this.$mx.Tool.$forceData({
            activeSysTab: e.detail,
            [`sysTabMountState.s${e.detail}`]: 1
        });
        MainStateController.setState('activeSysTab', e.detail);
        MainStateController.setState('sysTabMountState', JSON.parse(JSON.stringify(this.data.sysTabMountState)));
    }
    handMovableEnd(e: Required<MpEvent<{ x: number; y: number }>>) {
        const state = e.detail;
        setStorage('wcconsole_xy', {
            x: state.x,
            y: state.y
        });
        MainStateController.setState('handX', state.x + 'px');
        MainStateController.setState('handY', state.y + 'px');
        this.$mx.Tool.$updateData({
            handX: state.x + 'px',
            handY: state.y + 'px'
        });
    }
    toggleVisible() {
        this.$mx.Tool.$updateData({
            visible: !this.data.visible,
            mounted: true
        });
        MainStateController.setState('visible', this.data.visible);
        MainStateController.setState('mounted', this.data.mounted);
    }
    toggleZoom() {
        this.$mx.Tool.$forceData({
            fullScreen: !this.data.fullScreen
        });
        MainStateController.setState('fullScreen', this.data.fullScreen);
        this.$mx.Tool.$wcEmit(WeConsoleEvents.WcMainComponentSizeChange);
    }
    close() {
        this.$mx.Tool.$forceData({
            visible: false
        });
        MainStateController.setState('visible', this.data.visible);
    }
    setTab(e) {
        const activeTabIndex = parseInt(e.detail);
        this.$mx.Tool.$forceData({
            activeTabIndex,
            [`tabMountState.s${activeTabIndex}`]: 1
        });
        MainStateController.setState('activeTabIndex', activeTabIndex);
        MainStateController.setState('tabMountState', JSON.parse(JSON.stringify(this.data.tabMountState)));
    }
    onCanvasReady() {
        this.isCanvasReadyResolve = true;
        this.onCanvasReadyResolve?.();
    }
    getCanvasCtx() {
        if (this.canvasCtx) {
            return Promise.resolve(this.canvasCtx);
        }

        return new Promise((resolve, reject) => {
            let retryCount = 0;
            const fromQuery = (cb: (val?: any) => void) => {
                const exec = () => {
                    (this as any)
                        .createSelectorQuery()
                        .select('#canvas')
                        .node()
                        .exec((res) => {
                            if (res?.[0]?.node?.getContext) {
                                try {
                                    const ctx = res[0].node.getContext('2d');
                                    cb(ctx);
                                } catch (error) {
                                    cb();
                                }
                            } else {
                                cb();
                            }
                        });
                };
                if (BUILD_TARGET !== 'my') {
                    exec();
                    return;
                }
                if (!this.isCanvasReadyResolve) {
                    this.onCanvasReadyResolve = exec;
                } else {
                    exec();
                }
            };
            const fromApi = (cb: (val?: any) => void) => {
                if (BUILD_TARGET === 'my') {
                    try {
                        const ctx = my.createCanvasContext('canvas');
                        cb(ctx);
                    } catch (error) {
                        cb();
                    }
                    return;
                }
                cb();
            };
            const fire = () => {
                let ctx;
                let count = 0;
                const done = () => {
                    if (count < 2) {
                        return;
                    }
                    if (ctx) {
                        resolve(ctx);
                        return;
                    }
                    retryCount++;
                    if (retryCount > 3 || this.$mx.Tool.$wcComponentIsDestroyed) {
                        return reject(new Error('无法获得canvas context'));
                    }
                    setTimeout(() => {
                        fire();
                    }, 200);
                };
                fromApi((res) => {
                    count++;
                    ctx = ctx || res;
                    done();
                });
                fromQuery((res) => {
                    count++;
                    ctx = ctx || res;
                    done();
                });
            };
            fire();
        });
    }
    init() {
        const res = getSystemInfo();
        this.$mx.Tool.$updateData({
            isFullScreenPhone: res.statusBarHeight && res.statusBarHeight > 20
        });
        // 默认情况下，如果是打开调试时，才显示icon
        if (!('visible' in WcScope)) {
            MainStateController.setState(
                'showIcon',
                checkDebugEnabled() || (getCurrentEnvVersion() !== '?' && getCurrentEnvVersion() !== 'release')
            );
        } else {
            MainStateController.setState('showIcon', WcScope.visible);
        }
        MainStateController.setState('isFullScreenPhone', this.data.isFullScreenPhone);
        let handPromise = Promise.resolve();
        if (!MainStateController.getState('handX')) {
            handPromise = getStorage<{ x: number; y: number }>('wcconsole_xy')
                .catch(() => Promise.resolve())
                .then((res) => {
                    if (res) {
                        this.$mx.Tool.$updateData({
                            inited: true,
                            handX: res.x + 'px',
                            handY: res.y + 'px'
                        });
                        MainStateController.setState('handX', this.data.handX);
                        MainStateController.setState('handY', this.data.handY);
                        MainStateController.setState('inited', this.data.inited);
                        return;
                    }
                    this.$mx.Tool.$updateData({
                        inited: true
                    });
                    MainStateController.setState('inited', this.data.inited);
                });
        }
        return handPromise.then(() => {
            this.syncState();
        });
    }
}

registerClassComponent(MainComponent);
