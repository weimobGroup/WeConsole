import * as path from 'path';
import { readFile } from './fs';
import { toJSON } from './other';

export const ROOT_DIR = path.resolve(__dirname, '../');
export const VERSION = toJSON(readFile(ROOT_DIR + '/package.json')).version;
export const MpXmlFileSuffix = {
    wx: 'wxml',
    my: 'axml',
    xhs: 'xhsml',
    qq: 'qml',
    swan: 'swan',
    tt: 'ttml',
    ks: 'kxml'
};
