const sass = require('node-sass');
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
// TODO:处理style文件夹中的公共样式，不应该以scss导入，而是以wxss的导入
module.exports = (filePath) => {
    return new Promise((resolve, reject) => {
        const res = !filePath
            ? ''
            : sass.renderSync({
                file: filePath,
                outputStyle: 'expanded'
            }).css;
        if (res) {
            postcss([autoprefixer]).process(res).then(result => {
                resolve(result.css)
            }).catch(err => {
                reject(err)
            })
        } else {
            resolve(res)
        }
    })
}
