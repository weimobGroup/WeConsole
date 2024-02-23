/* eslint-disable no-return-assign */
import type { CrossSystemInfo } from '@/types/cross';

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
    return (): CrossSystemInfo => {
        if (!cache) {
            cache = (getApiVar() as any).getSystemInfoSync();
        }
        return JSON.parse(JSON.stringify(cache));
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

/** 获取小程序环境版本，可选值及含义：
 * develop=开发/预览环境版本;
 * trial=体验环境版本;
 * release=发布环境版本;
 * ?=未知环境版本;
 */
export const getEnvVersion = (() => {
    let res: 'develop' | 'trial' | 'release' | '?' | undefined;
    // eslint-disable-next-line complexity
    return (): 'develop' | 'trial' | 'release' | '?' => {
        if (res !== undefined) {
            return res;
        }
        if (BUILD_TARGET === 'wx') {
            if ('getAccountInfoSync' in wx) {
                res = wx.getAccountInfoSync()?.miniProgram?.envVersion;
            }
            if (!res && typeof __wxConfig === 'object' && __wxConfig.envVersion) {
                res = __wxConfig.envVersion;
            }
            return (res = res || '?');
        }

        if (BUILD_TARGET === 'my') {
            if ('getAccountInfoSync' in my) {
                res = my.getAccountInfoSync()?.miniProgram?.envVersion;
            }
            if (!res && typeof __appxStartupParams === 'object' && __appxStartupParams.envVersion) {
                res = __appxStartupParams.envVersion;
            }
            if (!res && (my as any).isIDE) {
                res = 'develop';
            }
            return (res = res || '?');
        }

        if (BUILD_TARGET === 'qq') {
            let cfg;
            if (
                (typeof __wxConfig === 'object' ? (cfg = __wxConfig) : false) ||
                (typeof __qqConfig === 'object' ? (cfg = __qqConfig) : false)
            ) {
                return (res = cfg.envVersion || '?');
            }
            return (res = '?');
        }
        return '?';
    };
})();
