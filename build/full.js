const { buildFull } = require('./build');
const path = require('path');

const targetDir = path.resolve(__dirname, '../dist/full');
console.log('开始编译');
buildFull(targetDir)
    .then(() => {
        console.log('编译成功');
    })
    .catch((err) => {
        console.log(`编译失败：${err.message}`);
        console.error(err);
    });
