const junk = require('junk');
const renderSass = require('./sass');
const path = require('path');
const relative = require('relative');
const fs = require('fs');
const { writeFile, readFile, mkDir } = require('./fs');

exports.renderSassFile = (srcFile, targetFile) => {
    return renderSass(srcFile).then((cssContent) => {
        writeFile(targetFile, cssContent);
        return cssContent;
    });
};

const _buildNpmComponents = (targetDir, srcDir) => {
    return Promise.all(
        fs.readdirSync(srcDir).map((item) => {
            if (junk.is(item)) {
                return Promise.resolve();
            }
            const srcFile = path.join(srcDir, item);
            const targetFile = path.join(targetDir, item);
            const stat = fs.statSync(srcFile);
            if (stat.isFile()) {
                if (item.endsWith('.scss')) {
                    return exports.renderSassFile(srcFile, targetFile.substr(0, targetFile.length - 5) + '.wxss');
                }
                if (item.endsWith('.wxml') || item.endsWith('.json') || item.endsWith('.wxs')) {
                    writeFile(targetFile, readFile(srcFile));
                }
                return Promise.resolve();
            } else if (stat.isDirectory() && item !== 'style') {
                return _buildNpmComponents(targetFile, srcFile);
            }
            return Promise.resolve();
        })
    );
};

exports.buildNpmComponents = (targetDir) =>
    _buildNpmComponents(targetDir, path.resolve(__dirname, '../src/components'));

const npmPacks = ['@mpkit/util', '@mpkit/types', '@mpkit/func-helper'];
const npmPackNames = ['util', 'types', 'func-helper'];
exports.rewriteNpmPackPath = (jsFileName, packRoot) => {
    let content = readFile(jsFileName);
    let needWrite;
    npmPacks.forEach((item, index) => {
        if (content.indexOf(item) !== -1) {
            needWrite = true;
            const p1 = path.join(packRoot, `${npmPackNames[index]}.js`);
            let p2 = relative(jsFileName, p1);
            p2 = p2.startsWith('.') ? p2 : `./${p2}`;
            // console.log(`p1=${p1}\np2=${p2}\njs=${jsFileName}\n\n`);
            content = content.replace(new RegExp(item, 'g'), p2);
        }
    });
    needWrite && writeFile(jsFileName, content);
    return Promise.resolve();
};
const npmPackPaths = [
    path.resolve(__dirname, '../node_modules/@mpkit/util/dist/index.esm.js'),
    path.resolve(__dirname, '../node_modules/@mpkit/types/dist/index.esm.js'),
    path.resolve(__dirname, '../node_modules/@mpkit/func-helper/dist/index.esm.js')
];

const _buildFull = (dir, mpkitRoot) => {
    return Promise.all(
        fs.readdirSync(dir).map((item) => {
            if (junk.is(item)) {
                return Promise.resolve();
            }
            const fileName = path.join(dir, item);
            const stat = fs.statSync(fileName);
            if (stat.isFile()) {
                if (item.endsWith('.js')) {
                    return exports.rewriteNpmPackPath(fileName, mpkitRoot);
                }
                return Promise.resolve();
            } else if (stat.isDirectory() && item !== 'style') {
                return _buildFull(fileName, mpkitRoot);
            }
            return Promise.resolve();
        })
    );
};

exports.buildFull = (targetDir) =>
    Promise.all([
        new Promise((resolve) => {
            const mpkitRoot = path.join(targetDir, 'mpkit');
            mkDir(mpkitRoot);
            npmPackPaths.forEach((item, index) => {
                const targetJs = path.join(mpkitRoot, `${npmPackNames[index]}.js`);
                writeFile(targetJs, readFile(item));
            });
            resolve();
        }),
        _buildNpmComponents(path.join(targetDir, 'components'), path.resolve(__dirname, '../src/components')),
        _buildFull(targetDir, path.join(targetDir, 'mpkit'))
    ]);
