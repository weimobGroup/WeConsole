import { spawn } from 'child_process';

export const toCamelCase = (str: string): string => {
    const res = str.replace(/^-/, '').replace(/-(\w)(\w+)/g, (a, b, c) => {
        return b.toUpperCase() + c.toLowerCase();
    });
    return res[0].toUpperCase() + res.substr(1);
};

export const toJSON = (str: string): any => {
    try {
        return JSON.parse(str.trim());
    } catch (error) {
        try {
            // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
            return new Function(`return ${str.trim()}`)();
        } catch (error) {}
    }
};
/** 创建一个唯一的uuid */
export const uuid = (): string => {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        // tslint:disable-next-line:no-bitwise
        const r = (Math.random() * 16) | 0;
        // tslint:disable-next-line:no-bitwise
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

export const oneByOne = (promiseHandlers: Array<() => Promise<any>>, rejectBreak: boolean): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        let index = -1;
        const exec = () => {
            index++;
            if (index >= promiseHandlers.length) {
                resolve();
                return;
            }
            promiseHandlers[index]()
                .then(() => {
                    exec();
                })
                .catch((err) => {
                    rejectBreak ? reject(err) : exec();
                });
        };
        exec();
    });
};

const supportPadStart = 'padStart' in String.prototype;
export const padStart = (str: string, count: number, char: string): string => {
    if (supportPadStart) {
        return (str as any).padStart(count, char);
    }
    if (str.length >= count) {
        return str;
    }
    return new Array(count - str.length).fill(char).join('') + str;
};

export const runCommand = (command: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        console.log(`command=${command}`);
        const child = spawn(command, {
            shell: true,
            stdio: 'inherit'
        });

        child.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Command failed with exit code ${code}`));
                return;
            }
            resolve();
        });
    });
};
