import type { MpCookie } from '../../types/common';

export const parseCookie = (content: string): MpCookie => {
    const arr = content.split(';');
    const [name, val] = arr[0].split('=');
    const res: MpCookie = {
        name,
        value: val || ''
    };
    // TODO:解析其他属性
    return res;
};
