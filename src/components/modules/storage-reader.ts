import { MpStorageInfo } from '../../types/storage-reader';
import { MpStorageMaterial } from '../../types/product';
import { promiseifyApi } from '../../modules/util';
import { AnyFunction } from '../../types/util';

export const getStorageInfoAndList = (): Promise<[MpStorageInfo, MpStorageMaterial[]]> => {
    return promiseifyApi('getStorageInfo')
        .then((res) => {
            const info = res as MpStorageInfo;
            return Promise.all([info].concat(info.keys.map((key) => getStorage(key)) as any));
        })
        .then((res) => {
            return [res.splice(0, 1)[0], res as unknown as MpStorageMaterial[]];
        });
};

export const getStorageInfo = (): Promise<MpStorageInfo> => {
    return promiseifyApi('getStorageInfo');
};

export const getStorage = (key: string, toString = true): Promise<MpStorageMaterial> => {
    return promiseifyApi('getStorage', {
        key
    }).then((res) => {
        return {
            id: key,
            key,
            value: typeof res.data === 'string' ? res.data : toString ? JSON.stringify(res.data) : res.data
        };
    });
};

export const removeStorage = (key: string): Promise<void> => {
    return promiseifyApi('removeStorage', {
        key
    });
};

export const clearStorage = (ignore?: AnyFunction): Promise<void> => {
    if (!ignore) {
        return promiseifyApi('clearStorage');
    }
    return promiseifyApi('getStorageInfo').then((res) => {
        return res.keys.map((item) => {
            if (ignore(item)) {
                return Promise.resolve();
            } else {
                return removeStorage(item);
            }
        });
    });
};
