import type { MpStackInfo } from '@/types/common';
import type { TableCell, TableCellTextItem } from '@/types/table';

export const removeEndZero = (num: number | string): string => {
    const str = String(num);
    if (str.indexOf('.') === -1) {
        return str;
    }
    const [before, after] = str.split('.');
    const af = parseInt(after);
    return before + (af === 0 ? '' : `.${af}`);
};

export const getStatusText = (status: number): string => {
    if (status === 1) {
        return 'Executed';
    }
    if (status === 2) {
        return 'Success';
    }
    if (status === 3) {
        return 'Fail';
    }
    return 'Unknown';
};

export const computeTime = (total: number): string => {
    let timeUnit;
    let timeVal;
    if (total < 1000) {
        timeUnit = 'ms';
        timeVal = removeEndZero(total.toFixed(1));
    } else if (total < 60 * 1000) {
        timeUnit = 's';
        timeVal = removeEndZero((total / 1000).toFixed(1));
    } else if (total < 60 * 60 * 1000) {
        timeUnit = 'm';
        timeVal = removeEndZero((total / (60 * 1000)).toFixed(1));
    } else {
        timeUnit = 'h';
        timeVal = removeEndZero((total / (60 * 60 * 1000)).toFixed(1));
    }
    return `${timeVal}${timeUnit}`;
};

export const computeTimeCell = (total: number): TableCell => {
    const text = computeTime(total);
    const textItem: TableCellTextItem = {
        type: 'text',
        content: text,
        style: ''
    };
    if (text.includes('ms')) {
        if (parseFloat(text) > 500) {
            textItem.style = 'color:#ffa400;';
        } else if (parseFloat(text) < 100) {
            textItem.style = 'color:green;';
        }
    } else {
        textItem.style = 'color:red;';
    }
    return {
        tableCell: true,
        blocks: [
            {
                block: true,
                items: [textItem]
            }
        ]
    };
};

export const findValue = (obj: any, prop: string): any => {
    for (const key in obj) {
        if (key === prop || key.toLowerCase() === prop.toLowerCase()) {
            return obj[prop];
        }
    }
};

export const convertStockToInitiatorName = (stock: MpStackInfo): string => {
    if (stock.fileName) {
        let fileName = stock.fileName
            .split('appservice')
            .slice(1)
            .map((item) => (item.startsWith('/') ? item : `/${item}`))
            .join('')
            .substr(1);
        fileName = fileName.startsWith('miniprogram_npm') ? fileName.substr('miniprogram_npm'.length + 1) : fileName;
        if (stock.lineNumebr) {
            return `${fileName}:${stock.lineNumebr}`;
        }
        if (fileName) {
            return fileName;
        }
    }
    return stock.original;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const convertStockToInitiatorDesc = (stock: MpStackInfo): string => {
    return 'Script';
};

export const uniq = <T = any>(list: T[]): T[] => {
    return list.reduce((sum: T[], item) => {
        if (sum.indexOf(item) === -1) {
            sum.push(item);
        }
        return sum;
    }, []);
};

export const toJSONString = (obj: any, space?: string | number) => {
    const set = new WeakSet();
    return JSON.stringify(
        obj,
        (key, val) => {
            if (typeof val === 'object' && val !== null) {
                if (set.has(val)) {
                    return '$$$存在循环引用，该属性无法被复制$$$';
                }
                set.add(val);
            }
            return val;
        },
        space
    );
};
