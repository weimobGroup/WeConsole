import * as sass from 'node-sass';
import autoprefixer from 'autoprefixer';
import PostCSS from 'postcss';
import { writeFile } from './fs';
export const compileFile = (srcFile: string, targetFile: string): Promise<void> => {
    if (!srcFile) {
        return Promise.resolve();
    }
    const res = sass.renderSync({
        file: srcFile,
        outputStyle: 'expanded'
    }).css;
    return PostCSS([autoprefixer as any])
        .process(res, {
            from: srcFile
        })
        .then((result) => {
            writeFile(targetFile, result.css);
        });
};
