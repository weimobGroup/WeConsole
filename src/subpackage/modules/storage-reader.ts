import type { MpStorageInfo } from '@/types/storage-reader';
import type { MpStorageMaterial } from '@/types/product';
import { promisifyApi } from '@/main/modules/util';
import type { AnyFunction } from '@/types/util';
import { uuid } from '@mpkit/util';

export const getStorageInfoAndList = (): Promise<[MpStorageInfo, MpStorageMaterial[]]> => {
    return promisifyApi('getStorageInfo')
        .then((res) => {
            const info = res as MpStorageInfo;
            return Promise.all([info].concat(info.keys.map((key) => getStorage(key)) as any));
        })
        .then((res) => {
            return [res.splice(0, 1)[0], res as unknown as MpStorageMaterial[]];
        });
};

export const getStorageInfo = (): Promise<MpStorageInfo> => {
    return promisifyApi('getStorageInfo');
};

export const getStorage = (key: string, toString = true): Promise<MpStorageMaterial> => {
    return promisifyApi('getStorage', {
        key
    }).then((res) => {
        return {
            id: uuid(),
            key,
            value: typeof res.data === 'string' ? res.data : toString ? JSON.stringify(res.data) : res.data
        };
    });
};

export const removeStorage = (key: string): Promise<void> => {
    return promisifyApi('removeStorage', {
        key
    });
};

export const clearStorage = (ignore?: AnyFunction): Promise<void> => {
    if (!ignore) {
        return promisifyApi('clearStorage');
    }
    return promisifyApi('getStorageInfo').then((res) => {
        return res.keys.map((item) => {
            if (ignore(item)) {
                return Promise.resolve();
            } else {
                return removeStorage(item);
            }
        });
    });
};
