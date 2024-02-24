import { compileFile } from './sass';
import { copyPromise, getFiles, readFile, writeFile } from './fs';
import { renameSync } from 'fs';
import { toXhsML } from './translator/xhs';
import { toAliXml } from './translator/ali';

const cssFileSuffix = {
    wx: 'wxss',
    my: 'acss',
    xhs: 'css',
    qq: 'qss',
    swan: 'css',
    tt: 'ttss',
    ks: 'css'
};
const xmlFileSuffix = {
    wx: 'wxml',
    my: 'axml',
    xhs: 'xhsml',
    qq: 'qml',
    swan: 'swan',
    tt: 'ttml',
    ks: 'kxml'
};
const xjsFileSuffix = {
    wx: 'wxs',
    my: 'sjs',
    xhs: 'SJS',
    qq: 'qs',
    swan: 'sjs',
    tt: 'sjs',
    ks: 'sjs' // TODO: 待确认
};

export const compilerMpResource = (
    src: string,
    dist: string,
    targetPlatform: 'wx' | 'my' | 'xhs' | 'qq' | 'swan' | 'tt' | 'ks'
) => {
    return Promise.all([
        copyPromise(`${src}/**/*.png`, dist),
        copyPromise(`${src}/**/*.jpg`, dist),
        copyPromise(`${src}/**/*.jpeg`, dist),
        copyPromise(`${src}/**/*.gif`, dist),
        copyPromise(`${src}/**/*.wxs`, dist),
        copyPromise(`${src}/**/*.wxml`, dist),
        copyPromise(`${src}/**/*.wxss`, dist),
        copyPromise(`${src}/**/*.json`, dist),
        ...getFiles(src, true).reduce((sum: Array<Promise<void>>, fileName) => {
            if (fileName.endsWith('.scss')) {
                sum.push(
                    compileFile(
                        fileName,
                        dist + fileName.substring(src.length).replace('.scss', `.${cssFileSuffix[targetPlatform]}`)
                    )
                );
            }
            return sum;
        }, [])
    ]).then(() => {
        if (targetPlatform === 'wx') {
            return;
        }
        getFiles(dist, true).forEach((fileName) => {
            if (fileName.endsWith('.wxss')) {
                renameSync(fileName, fileName.substring(0, fileName.length - 5) + `.${cssFileSuffix[targetPlatform]}`);
                return;
            }
            if (fileName.endsWith('.wxml')) {
                const newFileName = fileName.substring(0, fileName.length - 5) + `.${xmlFileSuffix[targetPlatform]}`;
                renameSync(fileName, newFileName);
                const xml = readFile(newFileName);
                if (targetPlatform === 'xhs') {
                    writeFile(newFileName, toXhsML(xml));
                    return;
                }
                if (targetPlatform === 'my') {
                    writeFile(newFileName, toAliXml(xml));
                    return;
                }
                return;
            }
            if (fileName.endsWith('.wxs')) {
                renameSync(fileName, fileName.substring(0, fileName.length - 4) + `.${xjsFileSuffix[targetPlatform]}`);
                return;
            }
        });
    });
};
