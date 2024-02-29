import copy from 'copy';

export const copyPromise = (source: string, target: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        copy(source, target, (err) => {
            err ? reject(err) : resolve();
        });
    });
};
