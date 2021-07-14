const path = require('path');
const { rmDir, replaceDir, whereRemove, eachFile, readFile, writeFile, removeFile } = require('./fs');
const terser = require('terser');
const cssnano = require('cssnano');
const postcss = require('postcss');
const WxmlHelper = require('./mini-wxml.js');
const minifyJS = terser.minify;

const distDir = path.resolve(__dirname, '../dist');
const fullDir = path.join(distDir, 'full');
const fullMiniDir = path.join(distDir, 'full-mini');
const npmDir = path.join(distDir, 'npm');
const npmMiniDir = path.join(distDir, 'npm-mini');

rmDir(fullMiniDir);
rmDir(npmMiniDir);

// 复制到mini目录
replaceDir(fullDir, fullMiniDir);
replaceDir(npmDir, npmMiniDir);

// 删除types文件夹
rmDir(path.join(fullMiniDir, 'types'));
removeFile(path.join(fullMiniDir, 'mpkit') + '/types.js');
rmDir(path.join(npmMiniDir, 'types'));

// 删除所有*.d.ts
const removeDTS = (filename) => filename.endsWith('.d.ts');
whereRemove(fullMiniDir, removeDTS);
whereRemove(npmMiniDir, removeDTS);

// 压缩js/json/wxml/wxss
const miniFile = async(filePath, isFile, fileName) => {
    if (isFile) {
        const code = readFile(filePath);
        if (fileName.endsWith('.js') || fileName.endsWith('.wxs')) {
            const res = await minifyJS(code, {
                sourceMap: false
            });
            writeFile(filePath, res.code);
            // writeFile(filePath + '.map', res.map.replace(`"sources":["0"]`,`"sources":["${fileName}"]`));
            return;
        }
        if (fileName.endsWith('.json')) {
            writeFile(filePath, JSON.stringify(JSON.parse(code)));
            return;
        }
        if (fileName.endsWith('.wxml')) {
            writeFile(filePath, WxmlHelper.minify(code));
            return;
        }
        if (fileName.endsWith('.wxss')) {
            postcss([cssnano])
                .process(code)
                .then((res) => {
                    writeFile(filePath, res.css);
                });
        }
    }
};
eachFile(fullMiniDir, miniFile);
eachFile(npmMiniDir, miniFile);
