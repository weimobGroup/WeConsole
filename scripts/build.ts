/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
import type { RollupOptions, OutputOptions } from 'rollup';
import { rollup } from 'rollup';
import NodeResolve from '@rollup/plugin-node-resolve';
import { ROOT_DIR, VERSION } from './vars';
import * as fs from 'fs';
// import swc from 'unplugin-swc';
import { getFiles, copyPromise } from './fs';
// import alias from '@rollup/plugin-alias';
import typescript from '@rollup/plugin-typescript';
import { compileFile } from './sass';

const RollupReplace = require('@rollup/plugin-replace');
// const { babel } = require('@rollup/plugin-babel');
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
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        },
        preventAssignment: true
    }),
    // alias({
    //     entries: [
    //         {
    //             find: '@/types',
    //             replacement: ROOT_DIR + '/src/types'
    //         },
    //         {
    //             find: '@/main',
    //             replacement: ROOT_DIR + '/src/weconsole-main'
    //         },
    //         {
    //             find: '@/sub',
    //             replacement: ROOT_DIR + '/src/weconsole-subpackage'
    //         }
    //     ]
    // }),
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
    return [
        {
            external: mode === 'full' ? [] : [/mpkit/, /typescript-mp-component/, /@@cross-virtual-list/],
            plugins: getPlugins(),
            input,
            output: [
                {
                    dir: `${ROOT_DIR}/dist/${mode}`,
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
            return Promise.all([
                copyPromise(ROOT_DIR + '/src/subpackage/mpxs/**/*.*', ROOT_DIR + '/dist/' + mode + '/subpackage/mpxs'),
                copyPromise(
                    ROOT_DIR + '/src/subpackage/components/**/*.wxml',
                    ROOT_DIR + '/dist/' + mode + '/subpackage/components'
                ),
                copyPromise(
                    ROOT_DIR + '/src/subpackage/components/**/*.wxss',
                    ROOT_DIR + '/dist/' + mode + '/subpackage/components'
                ),
                copyPromise(
                    ROOT_DIR + '/src/subpackage/components/**/*.json',
                    ROOT_DIR + '/dist/' + mode + '/subpackage/components'
                ),
                ...Object.keys(components).reduce((sum: Promise<void>[], k) => {
                    const fileName = components[k].replace('.ts', '.scss');
                    if (fs.existsSync(fileName)) {
                        sum.push(
                            compileFile(
                                fileName,
                                ROOT_DIR +
                                    '/dist/' +
                                    mode +
                                    '/subpackage/components' +
                                    fileName.split('components')[1].replace('.scss', '.wxss')
                            )
                        );
                    }
                    return sum;
                }, [])
            ])
                .then(() => {
                    if (mode === 'full') {
                        return Promise.all([
                            copyPromise(
                                ROOT_DIR + '/node_modules/@cross-virtual-list/mp-wx/dist/npm/components/**/*.wxml',
                                ROOT_DIR + '/dist/' + mode + '/subpackage/components'
                            ),
                            copyPromise(
                                ROOT_DIR + '/node_modules/@cross-virtual-list/mp-wx/dist/npm/components/**/*.wxss',
                                ROOT_DIR + '/dist/' + mode + '/subpackage/components'
                            ),
                            copyPromise(
                                ROOT_DIR + '/node_modules/@cross-virtual-list/mp-wx/dist/npm/components/**/*.json',
                                ROOT_DIR + '/dist/' + mode + '/subpackage/components'
                            )
                        ]);
                    }
                })
                .then(() => {
                    if (mode === 'full') {
                        return copyPromise(ROOT_DIR + '/dist/' + mode + '/**/*', ROOT_DIR + '/examples/weconsole');
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
