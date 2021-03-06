import { HookScope, MpNameValue } from '../../types/common';
import { MpProductCategoryGetter, MpUIConfig } from '../../types/config';
import { MpProduct } from '../../types/product';

export const MpApiCategoryMap = {
    request: 'xhr',
    downloadFile: 'xhr',
    uploadFile: 'xhr',
    createUDPSocket: 'xhr',
    sendSocketMessage: 'ws',
    onSocketOpen: 'ws',
    onSocketMessage: 'ws',
    onSocketError: 'ws',
    onSocketClose: 'ws',
    connectSocket: 'ws',
    closeSocket: 'ws',
    canIUse: 'base',
    switchTab: 'navigate',
    navigateBack: 'navigate',
    navigateTo: 'navigate',
    redirectTo: 'navigate',
    reLaunch: 'navigate',
    showToast: 'ui',
    showModal: 'ui',
    showLoading: 'ui',
    showActionSheet: 'ui',
    hideToast: 'ui',
    hideLoading: 'ui',
    nextTick: 'ui',
    stopPullDownRefresh: 'scroll',
    startPullDownRefresh: 'scroll',
    pageScrollTo: 'scroll',
    setStorageSync: 'storage',
    setStorage: 'storage',
    removeStorageSync: 'storage',
    removeStorage: 'storage',
    getStorageSync: 'storage',
    getStorage: 'storage',
    getStorageInfo: 'storage',
    getStorageInfoSync: 'storage',
    clearStorageSync: 'storage',
    clearStorage: 'storage',
    login: 'user',
    checkSession: 'user',
    getAccountInfoSync: 'user',
    getUserProfile: 'user',
    getUserInfo: 'user',
    getLocation: 'user',
    openLocation: 'user'
};

export const reportCategoryMapToList = (categoryMap: { [prop: string]: string }): MpNameValue<string>[] => {
    return Object.keys(categoryMap).reduce(
        (sum, item) => {
            if (!sum.mark[categoryMap[item]]) {
                const categoryVal = categoryMap[item];
                sum.mark[categoryVal] = 1;
                let text;
                if (categoryVal === 'xhr') {
                    text = 'XHR';
                } else if (categoryVal === 'ws') {
                    text = 'WS';
                } else {
                    text = categoryVal[0].toUpperCase() + categoryVal.substr(1);
                }
                sum.list.push({
                    name: text,
                    value: categoryVal
                });
            }
            return sum;
        },
        {
            mark: {},
            list: [
                {
                    name: 'Cloud',
                    value: 'cloud'
                }
            ] as MpNameValue<string>[]
        }
    ).list;
};

/**
 * ???????????????Api????????????????????????
 */
export const getCategoryValue = (product: Partial<MpProduct>, runConfig?: MpUIConfig): string[] => {
    let res: string | string[] = product.category;
    if (runConfig && (runConfig.apiCategoryGetter || runConfig.consoleCategoryGetter)) {
        let getter;
        if (product.type === HookScope.Api && runConfig.apiCategoryGetter) {
            getter = runConfig.apiCategoryGetter;
        } else if (product.type === HookScope.Console && runConfig.consoleCategoryGetter) {
            getter = runConfig.consoleCategoryGetter;
        } else {
            getter = product.category;
        }
        const type = typeof getter;
        if (type === 'function') {
            res = (runConfig.apiCategoryGetter as MpProductCategoryGetter)(product);
        } else if (type === 'object' && runConfig.apiCategoryGetter[product.category]) {
            if (typeof runConfig.apiCategoryGetter[product.category] === 'function') {
                res = runConfig.apiCategoryGetter[product.category](product);
            } else {
                res = String(runConfig.apiCategoryGetter[product.category]);
            }
        } else {
            res = getter as string;
        }
    }
    return Array.isArray(res) && res.length ? (res as string[]) : [!res ? 'other' : (res as string)];
};

/**
 * ???????????????Api?????????????????????????????????
 */
export const getApiCategoryList = (runConfig?: MpUIConfig): MpNameValue<string>[] => {
    const res: MpNameValue<string>[] = [
        {
            name: 'All',
            value: 'all'
        },
        {
            name: 'Mark',
            value: 'mark'
        }
    ];
    if (runConfig && Array.isArray(runConfig.apiCategoryList) && runConfig.apiCategoryList.length) {
        runConfig.apiCategoryList.forEach((item) => {
            if (typeof item === 'string' && item) {
                if (!res.some((it) => it.value === item)) {
                    res.push({
                        name: item,
                        value: item
                    });
                }
            } else if (item && (item as MpNameValue<string>).value) {
                if (!res.some((it) => it.value === (item as MpNameValue<string>).value)) {
                    res.push(item as MpNameValue<string>);
                }
            }
        });
    }
    if (!res.some((item) => item.value === 'other')) {
        res.push({
            name: 'Other',
            value: 'other'
        });
    }
    return res;
};
