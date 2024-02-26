import type { FxNode } from 'forgiving-xml-parser';
import { serialize } from 'forgiving-xml-parser';
import { parseXML } from './parse';

const translatorAttr = (attr: FxNode, node: FxNode) => {
    if (!attr.name) {
        return;
    }
    if (attr.name.startsWith('wx:')) {
        attr.name = `a:${attr.name.substring(3)}`;
        return;
    }
    if ((node.name === 'include' || node.name === 'import') && attr.name === 'src' && attr.content) {
        attr.content = `${attr.content.substring(0, attr.content.length - 5)}.axml`;
        return;
    }

    if (node.name === 'wxs' && attr.name === 'src' && attr.content) {
        attr.name = 'from';
        attr.content = `${attr.content.substring(0, attr.content.length - 4)}.sjs`;
        return;
    }
    if (node.name === 'wxs' && attr.name === 'module' && attr.content) {
        attr.name = 'name';
        return;
    }
    if (attr.name.startsWith('bind:')) {
        attr.name = attr.name.substring(5);
        attr.name = 'on' + attr.name[0].toUpperCase() + attr.name.substring(1);
    } else if (attr.name.startsWith('bind')) {
        attr.name = attr.name.substring(4);
        attr.name = 'on' + attr.name[0].toUpperCase() + attr.name.substring(1);
    }
};

const loopTranslator = (nodes: FxNode[]) => {
    nodes.forEach((node) => {
        let notAttr = true;
        let hasSrcAttr = false;
        if (node.attrs) {
            notAttr = node.attrs.length === 0;
            node.attrs.forEach((attr) => {
                hasSrcAttr = hasSrcAttr || attr.name === 'src';
                translatorAttr(attr, node);
            });
        }
        if (node.name === 'wxs') {
            if (notAttr || !hasSrcAttr) {
                throw new Error('转换支付宝小程序不支持内联的wxs');
            }
            node.name = 'import-sjs';
        }
        if (node.children) {
            loopTranslator(node.children);
        }
    });
};

export const toAliXml = (wxml: string): string => {
    const wxmlNodes = parseXML(wxml);
    loopTranslator(wxmlNodes);
    return serialize(wxmlNodes);
};
