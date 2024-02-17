import type { MpNameValue } from '@/types/common';
import { HookScope } from '@/types/common';
import type { MpProductCategoryGetter, MpUIConfig } from '@/types/config';
import type { MpProduct } from '@/types/product';

/**
 * 获取小程序Api数据原料的分类值
 */
export const getCategoryValue = (product: Partial<MpProduct>, runConfig?: MpUIConfig): string[] => {
    let res: string | string[] | undefined = product.category;
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
        } else if (type === 'object' && runConfig.apiCategoryGetter?.[product.category as string]) {
            if (typeof runConfig.apiCategoryGetter[product.category as string] === 'function') {
                res = runConfig.apiCategoryGetter[product.category as string](product);
            } else {
                res = String(runConfig.apiCategoryGetter[product.category as string]);
            }
        } else {
            res = getter as string;
        }
    }
    return Array.isArray(res) && res.length ? res : [!res ? 'other' : (res as string)];
};

/**
 * 获取小程序Api数据原料的分类信息列表
 */
export const getApiCategoryList = (runConfig?: MpUIConfig) => {
    const res: Required<MpNameValue<string>>[] = [
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
                    res.push(item as Required<MpNameValue<string>>);
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
