import { compileFile } from './sass';
import { getFiles, readFile, writeFile } from './fs';
import { copyPromise } from './_copy';
import { renameSync } from 'fs';
import { toXhsML } from './translator/xhs';
import { toAliXml } from './translator/ali';
import { MpXmlFileSuffix } from './vars';

const cssFileSuffix = {
    wx: 'wxss',
    my: 'acss',
    xhs: 'css',
    qq: 'qss',
    swan: 'css',
    tt: 'ttss',
    ks: 'css'
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
                const newFileName = fileName.substring(0, fileName.length - 5) + `.${cssFileSuffix[targetPlatform]}`;
                renameSync(fileName, newFileName);

                return;
            }
            if (fileName.endsWith('.wxml')) {
                const newFileName = fileName.substring(0, fileName.length - 5) + `.${MpXmlFileSuffix[targetPlatform]}`;
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
                const newFileName = fileName.substring(0, fileName.length - 4) + `.${xjsFileSuffix[targetPlatform]}`;
                renameSync(fileName, newFileName);
                if (targetPlatform === 'my') {
                    const content = readFile(newFileName);
                    writeFile(newFileName, content.replace('module.exports = ', 'export default'));
                }
                return;
            }
        });
    });
};
