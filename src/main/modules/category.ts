import type { MpNameValue } from '@/types/common';

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
