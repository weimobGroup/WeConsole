import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import copy from 'copy';

export const isDir = (fileName: string): boolean => {
    return fs.statSync(fileName).isDirectory();
};
export const isFile = (fileName: string): boolean => {
    return fs.statSync(fileName).isFile();
};

/** 清空目录中的所有文件和文件夹，如果指定deep则递归删除，默认deep=true */
export const clearDir = (dirName: string, deep = true) => {
    fs.readdirSync(dirName).forEach((fileName) => {
        const fullName = path.join(dirName, fileName);
        const stat = fs.statSync(fullName);
        if (stat.isFile()) {
            rmFile(fullName);
        } else if (stat.isDirectory() && deep) {
            clearDir(fullName);
            fs.rmdirSync(fullName);
        }
    });
    return true;
};

/** 删除目录 */
export const rmDir = (dirName: string, checkExists = true) => {
    ((checkExists && fs.existsSync(dirName)) || !checkExists) && rimraf.sync(dirName);
};

/** 创建目录 */
export const mkDir = (dir: string) => {
    if (!fs.existsSync(dir)) {
        let str = dir.indexOf(':') !== -1 ? '' : '/';
        dir.split(path.posix.sep).forEach((item) => {
            str = path.join(str, item);
            if (!fs.existsSync(str)) {
                fs.mkdirSync(str);
            }
        });
    }
};

/** 删除文件 */
export const rmFile = (fileName: string, checkExists = true) => {
    ((checkExists && fs.existsSync(fileName)) || !checkExists) && fs.unlinkSync(fileName);
};

/** 读取文件内容 */
export const readFile = (fileName: string, checkExists = true): string => {
    if ((checkExists && fs.existsSync(fileName)) || !checkExists) {
        return fs.readFileSync(fileName, 'utf-8');
    }
    return '';
};

/** 浏览文件，返回文件内容 */
export const browseFile = (() => {
    const store: { [prop: string]: string | false } = {};
    return (fileName: string, checkExists = true, cache = true): string => {
        if (cache && typeof store[fileName] === 'string') {
            return store[fileName] as string;
        }
        if ((checkExists && fs.existsSync(fileName)) || !checkExists) {
            store[fileName] = fs.readFileSync(fileName, 'utf-8');
            return store[fileName] as string;
        }
        store[fileName] = false;
        return '';
    };
})();

/** 向文件写入内容 */
export const writeFile = (fileName: string, content: string) => {
    const b = path.basename(fileName);
    const dir = fileName.substr(0, fileName.length - b.length);
    mkDir(dir);
    fs.writeFileSync(fileName, content, 'utf-8');
};

/** 复制文件 */
export const copyFile = (srcFile: string, targetFile: string) => {
    if (!fs.existsSync(srcFile)) {
        return;
    }
    const b = path.basename(targetFile);
    const dir = targetFile.substr(0, targetFile.length - b.length);
    mkDir(dir);
    fs.copyFileSync(srcFile, targetFile);
};

export const getFiles = (() => {
    const getter = (
        dir: string,
        deep: ((fileName: string, isDir: boolean) => boolean) | boolean,
        list: string[]
    ): string[] => {
        !dir.endsWith('/node_modules') &&
            fs.existsSync(dir) &&
            fs.readdirSync(dir).forEach((item) => {
                const fullName = path.join(dir, item);
                const stat = fs.statSync(fullName);
                if (stat.isFile()) {
                    if (typeof deep !== 'function' || deep(fullName, false)) {
                        list.push(fullName);
                    }
                } else if (stat.isDirectory() && deep && (typeof deep !== 'function' || deep(fullName, true))) {
                    getter(fullName, deep, list);
                }
            });
        return list;
    };
    const cacheMap: any = {};
    return (
        dir: string,
        deep?: ((fileName: string, isDir: boolean) => boolean) | boolean,
        cache?: boolean
    ): string[] => {
        if (cache && cacheMap[dir]) {
            return JSON.parse(JSON.stringify(cacheMap[dir]));
        }
        const res = getter(dir, typeof deep === 'undefined' ? true : deep, []);
        if (cache) {
            cacheMap[dir] = res;
            return JSON.parse(JSON.stringify(res));
        }
        return res;
    };
})();

export const getDirs = (dir: string): string[] => {
    const list: string[] = [];
    fs.existsSync(dir) &&
        fs.readdirSync(dir).forEach((item) => {
            const fullName = path.join(dir, item);
            const stat = fs.statSync(fullName);
            if (stat.isDirectory()) {
                list.push(fullName);
            }
        });
    return list;
};

export const isEmptyDir = (p: string): boolean => {
    return fs.existsSync(p) ? !fs.readdirSync(p).length : true;
};

/** 复制目录 */
export const copyDir = (
    srcDir: string,
    targetDir: string,
    deep?: ((fileName: string, isDir: boolean) => boolean) | boolean
) => {
    if (!fs.existsSync(srcDir)) {
        return;
    }
    if (!fs.existsSync(targetDir)) {
        mkDir(targetDir);
    }
    getFiles(srcDir, deep).forEach((item) => {
        copyFile(item, path.join(targetDir, item.substring(srcDir.length)));
    });
};

export const replaceFileExt = (fileName: string, ext: string): string => {
    return fileName.substr(0, fileName.lastIndexOf('.')) + `.${ext}`;
};
export const getFileExt = (fileName: string): string => {
    return fileName.substr(fileName.lastIndexOf('.'));
};

export const copyPromise = (source: string, target: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        copy(source, target, (err) => {
            err ? reject(err) : resolve();
        });
    });
};
