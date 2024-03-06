/** 提供向小程序项目所有页面注入weconsole标签的能力 */
import { readFile, writeFile, copyDir, rmDir } from './fs';
import { MpXmlFileSuffix, ROOT_DIR } from './vars';
import * as fs from 'fs';
import * as path from 'path';

interface InjectConfig {
    /** 要注入的小程序项目目录 */
    projectDir: string;
    /** 如果项目已经被注入过了，是否本次注入要进行替换？ */
    replace?: boolean;
    /** 本次注入强行显示weconsole入口图标 */
    forceShow?: boolean;
    /** 注入方式：
     * npm: 以引用npm包的方式注入，但注入后需要开发者工具主动编译才可使用，好处是如果有重复的依赖可以减少代码体积；
     * full: 以全依赖引用的方式注入，无需开发者工具主动编译就可使用，缺点是可能存在依赖包被重复打包代码的问题；
     */
    mode?: 'npm' | 'full';
    /** 注入的小程序项目属于哪个平台？ */
    platform?: 'wx' | 'alipay' | 'xhs';
    /** 注入weconsole标签时传入的fullTop属性值 */
    fullTop?: string;
    /** 注入weconsole标签时传入的adapFullTop属性值 */
    adapFullTop?: string;
    /** 注入weconsole标签时传入的zIndex属性值 */
    zIndex?: number;
    /** 是否在注入时将weconsole的所有JS及组件文件复制到项目根目录？ */
    copy?: boolean;
}

interface PlatformDir {
    initFile: string;
    indexFile: string;
    mainComponentFile: string;
}

const computeProjectPlatform = (projectDir: string): 'wx' | 'alipay' | 'xhs' | undefined => {
    if (fs.existsSync(path.join(projectDir, '.mini-ide'))) {
        return 'alipay';
    }
    if (fs.existsSync(path.join(projectDir, 'mini.project.json'))) {
        return 'alipay';
    }
    if (fs.existsSync(path.join(projectDir, 'xhs-sumi'))) {
        return 'xhs';
    }
    if (fs.existsSync(path.join(projectDir, 'project.config.json'))) {
        return 'wx';
    }
    return undefined;
};

const injectAppJs = (projectDir: string) => {
    const fileName = path.join(projectDir, 'app.js');
    const appJsContent = readFile(fileName).trim();
    if (appJsContent.includes('weconsole-inject.js')) {
        return;
    }
    // eslint-disable-next-line quotes
    if (appJsContent.startsWith('"use strict";') || appJsContent.startsWith("'use strict';")) {
        const len = '"use strict";'.length;
        const before = appJsContent.substring(0, len);
        const after = appJsContent.substring(len);
        writeFile(fileName, before + 'require("./weconsole-inject.js");' + after);
    }
};

const injectAppJSON = (projectDir: string, mainComponentFile: string) => {
    const fileName = path.join(projectDir, 'app.json');
    const appJSONContent = readFile(fileName).trim();
    const appJSON = JSON.parse(appJSONContent);
    const hasSpace = /\s/g.test(appJSONContent);
    appJSON.usingComponents = appJSON.usingComponents || {};
    appJSON.usingComponents.weconsole = mainComponentFile;
    writeFile(fileName, JSON.stringify(appJSON, null, hasSpace ? 4 : 0));
    return appJSON;
};

const injectPages = (config: InjectConfig, appJSON: any, platform: 'wx' | 'alipay' | 'xhs') => {
    const { projectDir } = config;
    if (Array.isArray(appJSON.subPackages)) {
        appJSON.subPackages.forEach((item) => {
            injectPages(config, item, platform);
        });
    }
    if (Array.isArray(appJSON.pages)) {
        let fullDir = projectDir;
        if (appJSON.root) {
            fullDir = path.join(projectDir, appJSON.root);
        }
        appJSON.pages.forEach((item) => {
            const xmlFile = path.join(fullDir, `${item}.${MpXmlFileSuffix[platform === 'alipay' ? 'my' : platform]}`);
            const xmlContent = readFile(xmlFile);
            const startIndex = xmlContent.indexOf('<weconsole');
            const endChar = '</weconsole>';
            const endIndex = xmlContent.indexOf(endChar);
            let before = '';
            let after = '';
            if (startIndex !== -1) {
                before = xmlContent.substring(0, startIndex);
                after = xmlContent.substring(endIndex + endChar.length);
            } else {
                before = xmlContent;
            }
            let tagContent = '<weconsole';
            if (config.fullTop) {
                tagContent += ` fullTop="${config.fullTop}"`;
            }
            if (config.adapFullTop) {
                tagContent += ` adapFullTop="${config.adapFullTop}"`;
            }
            if (config.zIndex) {
                tagContent += ` zIndex="{{${config.zIndex}}}"`;
            }
            tagContent += '></weconsole>';
            writeFile(xmlFile, before + tagContent + after);
        });
    }
};

export const injectMpProject = (config: InjectConfig) => {
    if (!config?.projectDir) {
        throw new Error('请提供projectDir配置项');
    }
    if (!fs.existsSync(config.projectDir)) {
        throw new Error('projectDir配置项对应的目录不存在，无法注入');
    }
    if (!fs.existsSync(path.join(config.projectDir, 'app.json'))) {
        throw new Error('projectDir配置项对应的目录无app.json，无法注入');
    }
    if (!config.replace && fs.existsSync(path.join(config.projectDir, 'weconsole-inject.js'))) {
        throw new Error('projectDir配置项对应的目录已注入过weconsole，无需重复注入');
    }
    const platform = config.platform || computeProjectPlatform(config.projectDir);
    if (!platform) {
        throw new Error('无法确认projectDir配置项对应的目录的小程序平台类型，无法注入');
    }
    const platformDir: PlatformDir = {
        indexFile: '',
        initFile: '',
        mainComponentFile: ''
    };
    if (platform === 'wx') {
        if (config.mode === 'npm') {
            platformDir.initFile = path.join('weconsole', 'main', 'init.js');
            platformDir.indexFile = path.join('weconsole', 'main', 'index.js');
            platformDir.mainComponentFile = path.join('weconsole', 'subpackage', 'components', 'main', 'index');
        } else {
            platformDir.initFile = path.posix.sep + path.join('weconsole', 'dist', 'full', 'main', 'init.js');
            platformDir.indexFile = path.posix.sep + path.join('weconsole', 'dist', 'full', 'main', 'index.js');
            platformDir.mainComponentFile =
                path.posix.sep + path.join('weconsole', 'dist', 'full', 'subpackage', 'components', 'main', 'index');
        }
    } else {
        if (config.mode === 'npm') {
            platformDir.initFile = path.join('weconsole', 'dist', platform, 'npm', 'main', 'init.js');
            platformDir.indexFile = path.join('weconsole', 'dist', platform, 'npm', 'main', 'index.js');
            platformDir.mainComponentFile = path.join(
                'weconsole',
                'dist',
                platform,
                'npm',
                'subpackage',
                'components',
                'main',
                'index'
            );
        } else {
            platformDir.initFile = path.posix.sep + path.join('weconsole', 'dist', platform, 'full', 'main', 'init.js');
            platformDir.indexFile =
                path.posix.sep + path.join('weconsole', 'dist', platform, 'full', 'main', 'index.js');
            platformDir.mainComponentFile =
                path.posix.sep +
                path.join('weconsole', 'dist', platform, 'full', 'subpackage', 'components', 'main', 'index');
        }
    }
    let injectContent = `require("${platformDir.initFile}");`;
    if (config.forceShow) {
        injectContent += `\nrequire("${platformDir.indexFile}").showWeConsole();`;
    }
    writeFile(path.join(config.projectDir, 'weconsole-inject.js'), injectContent);
    injectAppJs(config.projectDir);
    injectPages(config, injectAppJSON(config.projectDir, platformDir.mainComponentFile), platform);
    if (config.mode === 'full' && config.copy) {
        const targetDir = path.join(config.projectDir, 'weconsole');
        rmDir(targetDir);
        const s = path.join(ROOT_DIR, 'dist', platform === 'wx' ? '' : platform, 'full');
        const t = path.join(targetDir, 'dist', platform === 'wx' ? '' : platform, 'full');
        copyDir(s, t, true);
    }
};

export const parseInjectConfig = (argv: string[], cwd: string) => {
    const config: InjectConfig = {
        projectDir: '',
        replace: false,
        forceShow: false,
        mode: 'full',
        copy: true,
        platform: 'wx',
        fullTop: '',
        adapFullTop: '',
        zIndex: 0
    };
    const keys = Object.keys(config);
    let hasPlatform;
    let dir = '';
    argv.slice(3).forEach((arg) => {
        const arr = arg.split('=');
        if (keys.includes(arr[0])) {
            hasPlatform = hasPlatform || arr[0] === 'mode';
            if (arr[1]) {
                config[arr[0]] = arr[1];
                config[arr[0]] =
                    arr[0] === 'replace' || arr[0] === 'forceShow' || arr[0] === 'copy' ? arr[1] === 'true' : arr[1];
                if (arr[0] === 'zIndex') {
                    config.zIndex = parseInt(arr[1]);
                }
            } else if (arr[0] === 'replace' || arr[0] === 'forceShow' || arr[0] === 'copy') {
                config[arr[0]] = true;
            }
        } else {
            dir = arr[0];
        }
    });
    if (!hasPlatform) {
        delete config.platform;
    }
    if (!config.projectDir && dir) {
        config.projectDir = dir;
    }
    if (!config.projectDir) {
        config.projectDir = cwd;
    }
    if (
        config.projectDir &&
        (config.projectDir.startsWith('.') || (!config.projectDir.startsWith('/') && !config.projectDir.includes(':')))
    ) {
        config.projectDir = path.resolve(cwd, config.projectDir);
    }
    if (config.mode !== 'full' && config.copy) {
        delete config.copy;
    }
    console.log(config);
    return config;
};
