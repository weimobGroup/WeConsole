import { VERSION } from './vars';
import { parseInjectConfig, injectMpProject } from './inject';

const run = () => {
    if (process.argv[2] === 'inject') {
        const config = parseInjectConfig(process.argv, process.cwd());
        console.log('开始注入weconsole');
        injectMpProject(config);
        console.log('注入weconsole成功');
        return;
    }

    if (process.argv[2] === '-v' || process.argv[2] === 'version' || process.argv[2] === '-V') {
        console.log(VERSION);
        return;
    }

    console.error(
        `暂不支持${process.argv[2]}命令，注入项目请使用inject命令，其他请参考文档：https://github.com/weimob-tech/WeConsole`
    );
};

run();
