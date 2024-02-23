export interface CrossSystemInfo {
    /** 可使用窗口宽度，单位px */
    windowWidth: number;
    /** 可使用窗口高度，单位px */
    windowHeight: number;
    /** 状态栏的高度，单位px */
    statusBarHeight: number;
}

/** 小程序的环境版本 */
export type CrossEnvVersion = 'develop' | 'trial' | 'release' | '?';

/** 小程序环境信息 */
export interface CrossEnvInfo {
    /** 小程序的appId */
    appId: string;
    /** 小程序的环境版本 */
    envVersion: CrossEnvVersion;
    /** 小程序的版本号 */
    version: string;
}
