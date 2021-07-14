const { buildNpmComponents } = require('./build');
const path = require('path');

const targetDir = path.resolve(__dirname, '../dist/npm');
console.log('开始编译');
buildNpmComponents(path.join(targetDir, 'components'))
    .then(() => {
        console.log('编译成功');
    })
    .catch((err) => {
        console.log(`编译失败：${err.message}`);
        console.error(err);
    });
