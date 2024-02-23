import type { MpStorageMaterial } from '@/types/product';
import type { AnyFunction } from '@/types/util';
import { uuid } from '@mpkit/util';
import { clearStorage, getStorage, getStorageInfo, removeStorage } from '@/main/modules/cross';
import type { MpStorageInfo } from '@/types/cross';

export const getStorageInfoAndList = (): Promise<[MpStorageInfo, MpStorageMaterial[]]> => {
    return getStorageInfo()
        .then((res) => {
            return Promise.all([res].concat(res.keys.map((key) => getStorageMaterial(key)) as any));
        })
        .then((res) => {
            return [res.splice(0, 1)[0], res as unknown as MpStorageMaterial[]];
        });
};

export const getStorageMaterial = (key: string, toString = true): Promise<MpStorageMaterial> => {
    return getStorage(key).then((res) => {
        return {
            id: uuid(),
            key,
            value: typeof res === 'string' ? res : toString ? JSON.stringify(res) : res
        };
    });
};

export const filterClearStorage = (ignore?: AnyFunction): Promise<void> => {
    if (!ignore) {
        return clearStorage();
    }
    return getStorageInfo()
        .then((res) => {
            return res.keys.map((item) => {
                if (ignore(item)) {
                    return Promise.resolve();
                } else {
                    return removeStorage(item);
                }
            });
        })
        .then(() => {});
};
