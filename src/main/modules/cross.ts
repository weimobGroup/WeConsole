/* eslint-disable no-return-assign */
import type { CrossEnvInfo, CrossEnvVersion, CrossSystemInfo, MpStorageInfo } from '@/types/cross';
import type { AnyFunction } from '@/types/util';

export const getApiVar = (): any => {
    if (BUILD_TARGET === 'wx') {
        return wx;
    }

    if (BUILD_TARGET === 'my') {
        return my;
    }

    if (BUILD_TARGET === 'swan') {
        return swan;
    }

    if (BUILD_TARGET === 'tt') {
        return tt;
    }

    if (BUILD_TARGET === 'xhs') {
        return xhs;
    }

    if (BUILD_TARGET === 'qq') {
        return qq;
    }

    if (BUILD_TARGET === 'ks') {
        return ks;
    }
};

export const getApiVarName = (): string => {
    if (BUILD_TARGET === 'wx') {
        return 'wx';
    }

    if (BUILD_TARGET === 'my') {
        return 'my';
    }

    if (BUILD_TARGET === 'swan') {
        return 'swan';
    }

    if (BUILD_TARGET === 'tt') {
        return 'tt';
    }

    if (BUILD_TARGET === 'xhs') {
        return 'xhs';
    }

    if (BUILD_TARGET === 'qq') {
        return 'qq';
    }

    if (BUILD_TARGET === 'ks') {
        return 'ks';
    }
    return '?';
};

export const getSystemInfo = (() => {
    let cache: CrossSystemInfo | undefined;
    return (ignoreCache?: boolean): Readonly<CrossSystemInfo> => {
        if (!cache || ignoreCache) {
            cache = getApiVar().getSystemInfoSync();
        }
        return cache as Readonly<CrossSystemInfo>;
    };
})();

/** 检查当前是否开启了调试 */
export const checkDebugEnabled = (() => {
    let res: boolean | undefined;
    return (): boolean => {
        if (res !== undefined) {
            return res;
        }
        if (BUILD_TARGET === 'wx') {
            if ('getAppBaseInfo' in wx) {
                res = wx.getAppBaseInfo()?.enableDebug;
            }
            if (typeof res !== 'boolean') {
                res = (getSystemInfo() as any).enableDebug;
            }
            if (typeof res !== 'boolean' && typeof __wxConfig === 'object') {
                res = !!__wxConfig.debug;
            }
            return (res = res || false);
        }
        if (BUILD_TARGET === 'qq') {
            return (res =
                (typeof __wxConfig === 'object' && !!__wxConfig.debug) ||
                (typeof __qqConfig === 'object' && !!__qqConfig.debug));
        }
        return (res = false);
    };
})();

const getEnvInfo = (() => {
    let res: CrossEnvInfo | undefined;
    const d = (val?: CrossEnvInfo): CrossEnvInfo => {
        if (val) {
            return (res = {
                appId: val.appId || '?',
                envVersion: val.envVersion || '?',
                version: val.version || '?'
            });
        }
        return (res = {
            appId: '?',
            envVersion: '?',
            version: '?'
        });
    };
    // eslint-disable-next-line complexity
    return (): CrossEnvInfo => {
        if (res !== undefined) {
            return res;
        }
        if (BUILD_TARGET === 'wx') {
            if ('getAccountInfoSync' in wx) {
                res = wx.getAccountInfoSync()?.miniProgram;
            }
            if (!res && typeof __wxConfig === 'object') {
                return d({
                    envVersion: __wxConfig.envVersion,
                    appId: __wxConfig.accountInfo?.appId || '?',
                    version: '?'
                });
            }
            return d(res);
        }

        if (BUILD_TARGET === 'qq') {
            if ('getAccountInfoSync' in qq) {
                res = qq.getAccountInfoSync()?.miniProgram;
            }
            if (!res && typeof __wxConfig === 'object') {
                let cfg;
                if (
                    (typeof __wxConfig === 'object' ? (cfg = __wxConfig) : false) ||
                    (typeof __qqConfig === 'object' ? (cfg = __qqConfig) : false)
                ) {
                    return d({
                        envVersion: cfg.envVersion,
                        appId: cfg.accountInfo?.appId || '?',
                        version: '?'
                    });
                }
            }
            return d(res);
        }

        if (BUILD_TARGET === 'my') {
            if ('getAccountInfoSync' in my) {
                res = my.getAccountInfoSync()?.miniProgram?.envVersion;
            }
            if (!res && typeof __appxStartupParams === 'object') {
                return d({
                    envVersion: __appxStartupParams.envVersion || ((my as any).isIDE ? 'develop' : '?'),
                    appId: __appxStartupParams.appId || '?',
                    version: '?'
                });
            }
            return d(res);
        }
        return d();
    };
})();

/** 获取小程序环境版本，可选值及含义：
 * develop=开发/预览环境版本;
 * trial=体验环境版本;
 * release=发布环境版本;
 * ?=未知环境版本;
 */
export const getCurrentEnvVersion = (() => {
    let res: CrossEnvVersion | undefined;
    return (): CrossEnvVersion => {
        if (res !== undefined) {
            return res;
        }
        return (res = getEnvInfo().envVersion);
    };
})();

export const getCurrentAppId = (() => {
    let res: string | undefined;
    return (): string => {
        if (res !== undefined) {
            return res;
        }
        return (res = getEnvInfo().appId);
    };
})();

export const getCurrentAppVersion = (() => {
    let res: string | undefined;
    return (): string => {
        if (res !== undefined) {
            return res;
        }
        return (res = getEnvInfo().version);
    };
})();

export const setStorage = (key: string, data: any): Promise<void> => {
    return promisifyApi('setStorage', {
        key,
        data
    }).then(() => {});
};

export const getStorage = <T>(key: string): Promise<T> => {
    return promisifyApi('getStorage', {
        key
    }).then((res) => res.data);
};

export const removeStorage = (key: string): Promise<void> => {
    return promisifyApi('removeStorage', {
        key
    }).then(() => {});
};

export const clearStorage = (): Promise<void> => {
    return promisifyApi('clearStorage').then(() => {});
};

export const getStorageInfo = (): Promise<MpStorageInfo> => {
    return promisifyApi('getStorageInfo').then((res) => {
        if (BUILD_TARGET === 'my' && (!res || ('success' in res && !res.success))) {
            return Promise.reject(new Error('支付宝平台getStorageInfo返回值success=false'));
        }
        return res;
    });
};

export const hookApiMethodCallback = (apiName: string, onSuccess: AnyFunction, onFail: AnyFunction, args: any[]) => {
    if (!apiName.endsWith('Sync') && (!args.length || args[0] === null)) {
        args[0] = {};
    }
    if (typeof args[0] === 'object' && args[0]) {
        const { success, fail } = args[0];
        args[0].success = function HookApiSuccessCallback(...params) {
            onSuccess(...params);
            return success?.apply(this, params);
        };
        args[0].fail = function HookApiFailCallback(...params) {
            onFail(...params);
            return fail?.apply(this, params);
        };
    }
    return args;
};

const promisifyApi = (apiName: string, ...apiArgs: any[]): Promise<any> => {
    return new Promise((resolve, reject) => {
        const apiVar = getApiVar();
        if (typeof apiVar[apiName] === 'function') {
            if (apiName.indexOf('Sync') !== -1) {
                let res;
                try {
                    res = apiVar[apiName](...apiArgs);
                    const apiOptions = apiArgs[0];
                    if (apiOptions && typeof apiOptions.onResultReady === 'function') {
                        apiOptions.onResultReady(res);
                    }
                } catch (error) {
                    reject(error);
                    return;
                }

                resolve(res);
                return;
            }
            hookApiMethodCallback(
                apiName,
                (...args) => {
                    if (args.length < 2) {
                        resolve(args[0]);
                    } else {
                        resolve(args);
                    }
                },
                (...args) => {
                    const err = new Error('未知错误');
                    if (args.length < 2 && args[0] && args[0].errMsg) {
                        err.message = args[0].errMsg;
                    }
                    (err as any).failResult = args;
                    reject(err);
                },
                apiArgs
            );
            try {
                const apiOptions = apiArgs[0];
                const res = apiVar[apiName](...apiArgs);
                if (apiOptions && typeof apiOptions.onResultReady === 'function') {
                    apiOptions.onResultReady(res);
                }
            } catch (error) {
                reject(error);
            }
            return;
        }
        resolve(apiVar[apiName]);
    });
};

export const showToast = (msg: string, duration = 2000) => {
    const config: any = {
        duration
    };
    if (BUILD_TARGET === 'my') {
        config.content = msg;
        config.type = 'none';
    } else {
        config.icon = 'none';
        config.title = msg;
    }
    getApiVar().showToast(config);
};

export const showActionSheet = (items: string[], title?: string): Promise<number> => {
    const config: any = {};
    if (
        BUILD_TARGET === 'wx' ||
        BUILD_TARGET === 'swan' ||
        BUILD_TARGET === 'tt' ||
        BUILD_TARGET === 'ks' ||
        BUILD_TARGET === 'qq' ||
        BUILD_TARGET === 'xhs'
    ) {
        config.itemList = items;
        config.alertText = title;
    }
    if (BUILD_TARGET === 'my') {
        config.items = items;
        config.title = title;
    }
    return promisifyApi('showActionSheet', config).then((res) => {
        if (
            BUILD_TARGET === 'wx' ||
            BUILD_TARGET === 'swan' ||
            BUILD_TARGET === 'tt' ||
            BUILD_TARGET === 'ks' ||
            BUILD_TARGET === 'qq' ||
            BUILD_TARGET === 'xhs'
        ) {
            return res.tapIndex;
        }
        if (BUILD_TARGET === 'my') {
            if (res.index === -1) {
                return Promise.reject(new Error('已取消选择'));
            }
            return res.index;
        }
    });
};

export const setClipboardData = (data: string, showFailToast = true): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        getApiVar()[BUILD_TARGET === 'my' ? 'setClipboard' : 'setClipboardData']({
            [BUILD_TARGET === 'my' ? 'text' : 'data']: data,
            success: () => {
                resolve();
            },
            fail: (res) => {
                const msg =
                    res?.errMsg?.indexOf('permission') !== -1
                        ? '未配置隐私保护指引，无法复制，请参考小程序官方文档'
                        : `复制失败：${res?.errMsg || '未知错误'}`;
                if (!showFailToast) {
                    return reject(new Error(msg));
                }
                if (res?.errMsg?.indexOf('permission') !== -1) {
                    showToast(msg);
                    return reject(new Error(msg));
                }
                showToast(`复制失败：${res?.errMsg}`);
                return reject(new Error(msg));
            }
        });
    });
};

export const nextTick = (cb: AnyFunction) => {
    const apiVar = getApiVar();
    if ('nextTick' in apiVar) {
        apiVar.nextTick(cb);
        return;
    }
    setTimeout(cb, 120);
};

export const supportSelectOwnerComponent = () => {
    return BUILD_TARGET === 'wx' || BUILD_TARGET === 'my';
};
