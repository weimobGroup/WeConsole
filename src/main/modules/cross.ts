/* eslint-disable no-return-assign */
import type { CrossEnvInfo, CrossEnvVersion, CrossSystemInfo } from '@/types/cross';

// eslint-disable-next-line complexity
export const getApiVar = () => {
    if (BUILD_TARGET === 'wx') {
        if (typeof wx === 'object' && wx && typeof wx.request === 'function') {
            return wx;
        }
    }

    if (BUILD_TARGET === 'my') {
        if (typeof my === 'object' && my && typeof my.request === 'function') {
            return my;
        }
    }

    if (BUILD_TARGET === 'swan') {
        if (typeof swan === 'object' && my && typeof swan.request === 'function') {
            return swan;
        }
    }

    if (BUILD_TARGET === 'tt') {
        if (typeof tt === 'object' && tt && typeof tt.request === 'function') {
            return tt;
        }
    }

    if (BUILD_TARGET === 'xhs') {
        if (typeof xhs === 'object' && xhs && typeof xhs.request === 'function') {
            return xhs;
        }
    }

    if (BUILD_TARGET === 'qq') {
        if (typeof qq === 'object' && qq && typeof qq.request === 'function') {
            return qq;
        }
    }

    if (BUILD_TARGET === 'ks') {
        if (typeof ks === 'object' && ks && typeof ks.request === 'function') {
            return ks;
        }
    }
};

export const getSystemInfo = (() => {
    let cache: CrossSystemInfo | undefined;
    return (): Readonly<CrossSystemInfo> => {
        if (!cache) {
            cache = (getApiVar() as any).getSystemInfoSync();
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
