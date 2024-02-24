/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
import type { RollupOptions, OutputOptions } from 'rollup';
import { rollup } from 'rollup';
import NodeResolve from '@rollup/plugin-node-resolve';
import { ROOT_DIR, VERSION } from './vars';
import { getFiles, copyPromise, readFile, writeFile } from './fs';
import typescript from '@rollup/plugin-typescript';
import { compilerMpResource } from './mp';

const RollupReplace = require('@rollup/plugin-replace');
const commonjs = require('@rollup/plugin-commonjs');

const getPlugins = () => [
    NodeResolve({
        extensions: ['.jsx', '.js', '.ts']
    }),
    commonjs(),
    RollupReplace({
        delimiters: ['', ''],
        values: {
            VERSION: VERSION,
            BUILD_TARGET: JSON.stringify(process.env.BUILD_TARGET),
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        },
        preventAssignment: true
    }),
    typescript({
        tsconfig: ROOT_DIR + '/tsconfig.json',
        typescript: require('typescript')
    })
];

const getComponents = () => {
    return getFiles(ROOT_DIR + '/src/subpackage/components', true)
        .filter((item) => item.endsWith('.ts'))
        .reduce((sum: Record<string, string>, item) => {
            const name = item.split('subpackage')[1].substring(1).replace('.ts', '');
            sum[`subpackage/${name}`] = item;
            return sum;
        }, {});
};

const getBuildOptions = (mode: 'full' | 'npm'): [RollupOptions, () => void] => {
    const components = getComponents();
    const input = {
        'main/index': ROOT_DIR + '/src/main/index.ts',
        'main/init': ROOT_DIR + '/src/main/init.ts',
        ...components
    };
    if (mode === 'full') {
        input['subpackage/components/dynamic/index'] =
            ROOT_DIR + '/node_modules/@cross-virtual-list/mp-wx/dist/npm/components/dynamic/index.js';
        input['subpackage/components/regular/index'] =
            ROOT_DIR + '/node_modules/@cross-virtual-list/mp-wx/dist/npm/components/regular/index.js';
    }
    const distDir = process.env.BUILD_TARGET && process.env.BUILD_TARGET !== 'wx' ? `${process.env.BUILD_TARGET}/` : '';

    return [
        {
            external: mode === 'full' ? [] : [/mpkit/, /typescript-mp-component/, /@@cross-virtual-list/],
            plugins: getPlugins(),
            input,
            output: [
                {
                    dir: `${ROOT_DIR}/dist/${distDir}${mode}`,
                    format: 'esm',
                    chunkFileNames: '[name].js',
                    hoistTransitiveImports: false,
                    manualChunks: (id) => {
                        if (id.includes('node_modules') && !id.includes('components')) {
                            if (id.includes('typescript-mp-component') || id.includes('@cross-virtual-list')) {
                                return 'subpackage/vender';
                            }
                            const name = 'main/vender';
                            return name;
                        }
                        if (id.includes('main') && !id.includes('main/index') && !id.includes('main/init')) {
                            return 'main/common';
                        }
                        if (!id.includes('components') && !id.includes('node_modules')) {
                            return id.includes('subpackage') ? 'subpackage/common' : 'main/common';
                        }
                    }
                }
            ]
        },
        () => {
            return compilerMpResource(
                `${ROOT_DIR}/src`,
                `${ROOT_DIR}/dist/${distDir}${mode}`,
                process.env.BUILD_TARGET as any
            )
                .then(() => {
                    if (mode === 'full') {
                        return Promise.all([
                            new Promise<void>((resolve) => {
                                getFiles(`${ROOT_DIR}/dist/${distDir}${mode}/subpackage/components`, true).forEach(
                                    (jsonFile) => {
                                        if (!jsonFile.endsWith('.json')) {
                                            return;
                                        }
                                        const json = JSON.parse(readFile(jsonFile).trim());
                                        let needChange;
                                        if (json.usingComponents) {
                                            Object.keys(json.usingComponents).forEach((k) => {
                                                const val = json.usingComponents[k];
                                                if (val === '@cross-virtual-list/mp-wx/components/dynamic/index') {
                                                    needChange = true;
                                                    json.usingComponents[k] = '../dynamic/index';
                                                    return;
                                                }
                                                if (val === '@cross-virtual-list/mp-wx/components/regular/index') {
                                                    needChange = true;
                                                    json.usingComponents[k] = '../regular/index';
                                                    return;
                                                }
                                            });
                                        }
                                        needChange && writeFile(jsonFile, JSON.stringify(json, null, 4));
                                    }
                                );
                                resolve();
                            }),
                            compilerMpResource(
                                `${ROOT_DIR}/node_modules/@cross-virtual-list/mp-wx/dist/npm/components`,
                                `${ROOT_DIR}/dist/${distDir}${mode}/subpackage/components`,
                                process.env.BUILD_TARGET as any
                            )
                        ]);
                    }
                })
                .then(() => {
                    if (mode === 'full') {
                        return copyPromise(
                            `${ROOT_DIR}/dist/${distDir}${mode}/**/*`,
                            `${ROOT_DIR}/examples/${process.env.BUILD_TARGET}/full/weconsole`
                        );
                    }
                });
        }
    ];
};

const fireRollup = (task: [RollupOptions, () => void]): Promise<void> => {
    const options = task[0];
    return rollup(options)
        .then((res) => {
            return Promise.all(
                [res].concat(
                    (options.output as OutputOptions[]).map((item: OutputOptions) => {
                        return res.write(item);
                    }) as any
                )
            );
        })
        .then(([res]) => {
            return res.close();
        })
        .then(() => {
            return task[1]();
        });
};

export const build = () => {
    const fullTask = getBuildOptions('full');
    const npmTask = getBuildOptions('npm');
    return fireRollup(fullTask).then(() => fireRollup(npmTask));
};
