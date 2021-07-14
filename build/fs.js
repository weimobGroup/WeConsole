const fs = require('fs');
const fse = require('fse');
const path = require('path');
const junk = require('junk');
const rmDir = (dir) => {
    if (!fs.existsSync(dir)) {
        return;
    }
    fs.readdirSync(dir).forEach((file) => {
        const fileName = path.join(dir, file);
        const stat = fs.statSync(fileName);
        if (stat.isFile()) {
            exports.removeFile(fileName);
        } else if (stat.isDirectory()) {
            exports.rmDir(fileName);
        }
    });
    fs.rmdirSync(dir);
};
exports.rmDir = rmDir;
const mkDir = (dir) => {
    if (!fs.existsSync(dir)) {
        let str = '/';
        dir.split(path.posix.sep).forEach((item) => {
            str = path.join(str, item);
            if (!fs.existsSync(str)) {
                fs.mkdirSync(str);
            }
        });
    }
};
exports.mkDir = mkDir;
const replaceDir = (source, target, targetNameFilter) => {
    if (!fs.existsSync(source)) {
        return;
    }
    target = targetNameFilter ? targetNameFilter(target, source) : target;
    mkDir(target);
    fs.readdirSync(source).forEach((item) => {
        const fileName = path.join(source, item);
        if (junk.is(item)) {
            return;
        }
        let targetFileName = path.join(target, item);
        targetFileName = targetNameFilter ? targetNameFilter(targetFileName, fileName) : targetFileName;
        const stat = fs.statSync(fileName);
        if (stat.isFile()) {
            if (fs.existsSync(targetFileName)) {
                exports.removeFile(targetFileName);
            }
            fse.copyFileSync(fileName, targetFileName);
        } else if (stat.isDirectory() && item !== '.git' && item !== '.vscode') {
            exports.replaceDir(fileName, targetFileName);
        }
    });
};
exports.replaceDir = replaceDir;

exports.readFile = (fileName) => {
    return fs.readFileSync(fileName, 'utf-8');
};
exports.writeFile = (fileName, content) => {
    const b = path.basename(fileName);
    const dir = fileName.substr(0, fileName.length - b.length);
    exports.mkDir(dir);
    return fs.writeFileSync(fileName, content, 'utf-8');
};

exports.removeFile = (fileName) => {
    fs['rmSync' in fs ? 'rmSync' : 'unlinkSync'](fileName);
};

exports.eachFile = (dir, eacher) => {
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach((item) => {
            const fileName = path.join(dir, item);
            const stat = fs.statSync(fileName);
            if (stat.isDirectory()) {
                if (eacher(fileName, false, item) === false) {
                    return;
                }
                return exports.eachFile(fileName, eacher);
            }
            if (stat.isFile()) {
                return eacher(fileName, true, item);
            }
        });
    }
};

exports.whereRemove = (dir, compare) => {
    exports.eachFile(dir, (fileName, isFile) => {
        const remove = compare(fileName);
        if (!isFile) {
            if (remove) {
                exports.rmDir(fileName);
            }
            return;
        }
        if (remove) {
            exports.removeFile(fileName);
            return false;
        }
    });
};
