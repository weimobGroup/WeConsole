import { isEmptyObject } from '@mpkit/util';
import { each } from '@/main/modules/util';
import type { RequireId } from '@/types/common';
import { MethodExecStatus } from '@/types/common';
import type { MpUIConfig } from '@/types/config';
import type { MpApiMaterial, MpConsoleMaterial, MpConsoleMaterialItem, MpProduct } from '@/types/product';
import { getCategoryValue } from '@/sub/modules/category';
import { computeTime, convertStockToInitiatorDesc, convertStockToInitiatorName, getStatusText } from './util';

export const getApiNameInfo = (product: Partial<MpProduct>): { name: string; desc: string } | undefined => {
    if ('category' in product) {
        let name = product.category as string;
        let desc = '';
        if (name.indexOf('Storage') !== -1) {
            const req = product.request ? product.request[0] : null;
            const t = typeof req;
            if (t === 'object') {
                if (req?.key) {
                    desc = req.key;
                }
            } else if (t !== 'undefined') {
                desc = req;
            }
        } else if (product.category === 'request' && product.request && product.request[0] && product.request[0].url) {
            let url = product.request[0].url as string;
            url = url.startsWith('//') ? `https:${url}` : url;
            url = url.startsWith('https:') ? url.substr(8) : url.substr(7);
            const [before, query] = url.split('?');
            const arr = before.split('/');
            name = (arr.length > 1 ? arr[arr.length - 1] : '/') + (query ? `?${query}` : '');
            desc = arr.slice(0, arr.length - 1).join('/');
        }
        return {
            name,
            desc
        };
    }
};

export const getApiStatusInfo = (
    product: Partial<MpProduct>
): { code?: number; status?: string; statusDesc?: string } => {
    let code = 0;
    let status = '';
    let statusDesc = '';
    if ('status' in product) {
        status = getStatusText(product.status as number);
        if (status === 'Fail') {
            code = 500;
        }
    }
    if (product.status === MethodExecStatus.Executed && product.category === 'request') {
        status = 'Pending';
    }
    if (
        product.status === MethodExecStatus.Fail &&
        product.response &&
        product.response.length &&
        product.response[0] &&
        product.response[0].errMsg
    ) {
        const arr = product.response[0].errMsg.split(':fail');
        if (arr.length > 1) {
            statusDesc = arr[1].trim();
        } else {
            statusDesc = product.response[0].errMsg;
        }
    }
    if (
        product?.response &&
        product.response.length &&
        product.response[0] &&
        typeof product.response[0].statusCode !== 'undefined'
    ) {
        code = product.response[0].statusCode as number;
        status = String(code);
        if (code === 200 && !statusDesc) {
            statusDesc = 'OK';
        }
    }
    return {
        code,
        status,
        statusDesc
    };
};

const passUndefined = (obj: any, prop: string, val: any) => {
    if (typeof val !== 'undefined') {
        obj[prop] = val;
    }
};

export const convertApiMaterial = (
    product: Partial<MpProduct>,
    mpRunConfig?: MpUIConfig
): Partial<MpApiMaterial> & RequireId => {
    const material: Partial<MpApiMaterial> & RequireId = {
        id: product.id as string
    };
    const categorys = getCategoryValue(product, mpRunConfig);
    if (categorys?.length) {
        material.categorys = categorys;
    }
    if ('category' in product) {
        material.method = product.category;
        const { name, desc } = getApiNameInfo(product) || {};
        material.name = name;
        material.nameDesc = desc;
    }
    if (product.time) {
        material.startTime = product.time;
    }
    if (product.endTime || product.execEndTime) {
        material.endTime = product.endTime || product.execEndTime;
    }
    if (material.endTime && material.startTime) {
        material.time = computeTime(material.endTime - material.startTime);
    }

    const { code, status, statusDesc } = getApiStatusInfo(product) || {};
    passUndefined(material, 'code', code);
    passUndefined(material, 'status', status);
    passUndefined(material, 'statusDesc', statusDesc);

    if ('stack' in product && product.stack && product.stack.length) {
        material.initiator = convertStockToInitiatorName(product.stack[0]);
        material.initiatorDesc = convertStockToInitiatorDesc(product.stack[0]);
    }
    return material;
};

export const convertConsoleMaterial = (product: Partial<MpProduct>, mpRunConfig?: MpUIConfig): MpConsoleMaterial => {
    return {
        id: product.id as string,
        categorys: getCategoryValue(product, mpRunConfig),
        method: product.category as string,
        items: product.request?.reduce((sum: MpConsoleMaterialItem[], item, index, arr) => {
            if (typeof item === 'string') {
                if (item.indexOf('\n') === -1) {
                    sum.push({
                        type: 'str',
                        index,
                        content: item
                    });
                } else {
                    item.split('\n').forEach((str) => {
                        sum.push({
                            type: 'str',
                            index,
                            content: str
                        });
                        sum.push({
                            type: 'br',
                            index
                        });
                    });
                    sum.pop();
                }
            } else {
                sum.push({
                    type: 'json',
                    index
                });
            }
            if (index !== arr.length - 1) {
                sum.push({
                    type: 'division',
                    index
                });
            }

            return sum;
        }, [])
    };
};

export const requestProductToString = (product: MpProduct): string => {
    const options = product.request ? product.request[0] || {} : {};
    const response = product.response ? product.response[0] : null;
    const m = getApiStatusInfo(product);
    const data: string[] = [];
    data.push(`URL: ${options.url}`);
    data.push(`Status: ${m.status}${m.statusDesc ? '(' + m.statusDesc + ')' : ''}`);
    data.push('Request:');
    data.push(`\tMethod: ${(options.method || 'POST').toUpperCase()}`);

    if (options.timeout) {
        data.push(`\tTimeout: ${options.timeout}ms`);
    }

    if (options.header && !isEmptyObject(options.header)) {
        data.push('\tHeaders:');
        each(options.header, (prop, val) => {
            data.push(`\t\t${prop}: ${val}`);
        });
    }
    if (options.data) {
        data.push(`\tData: \n\t\t${typeof options.data === 'string' ? options.data : JSON.stringify(options.data)}`);
    }
    if (response) {
        data.push('Response:');
        if (response instanceof Error) {
            data.push(`\tError: ${response.message}`);
        } else {
            if (response.header) {
                data.push('\tHeaders:');
                each(response.header, (prop, val) => {
                    data.push(`\t\t${prop}: ${val}`);
                });
            }
            if (response.data) {
                data.push(
                    `\tData: \n\t\t${typeof response.data === 'string' ? response.data : JSON.stringify(response.data)}`
                );
            }
            if (response?.cookies.length) {
                data.push('\tCookies:');
                response.cookies.forEach((item) => {
                    data.push(`\t\t${item}`);
                });
            }
        }
    }
    return data.join('\n');
};

export const productToString = (product: MpProduct): string => {
    const category = product.category as string;
    if (category === 'request') {
        return requestProductToString(product);
    }
    const options = product.request ? product.request[0] || {} : {};
    const response = product.response ? product.response[0] : null;
    const m = getApiStatusInfo(product);
    const result = product.result;
    const data: string[] = [];
    data.push(`ApiName: wx.${category}`);
    data.push(`Status: ${m.status}${m.statusDesc ? '(' + m.statusDesc + ')' : ''}`);
    const d2 = JSON.stringify(options);
    if (!isEmptyObject(JSON.parse(d2))) {
        data.push(`Data: ${d2}`);
    }
    if (category.indexOf('Sync') !== -1) {
        if (result) {
            data.push(`Result: ${typeof result === 'string' ? result : JSON.stringify(result)}`);
        }
    } else if (response) {
        if (response instanceof Error) {
            data.push(`Error: ${response.message}`);
        } else {
            data.push(`Result: ${JSON.stringify(response)}`);
        }
    }
    return data.join('\n');
};
