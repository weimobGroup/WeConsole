import type { FxNode } from 'forgiving-xml-parser';
import { serialize } from 'forgiving-xml-parser';
import { parseXML } from './parse';

const translatorAttr = (attr: FxNode, node: FxNode) => {
    if (attr.name?.startsWith('wx:')) {
        attr.name = `xhs:${attr.name.substring(3)}`;
        return;
    }
    if ((node.name === 'include' || node.name === 'import') && attr.name === 'src' && attr.content) {
        attr.content = `${attr.content.substring(0, attr.content.length - 5)}.xhsml`;
        return;
    }

    if (node.name === 'wxs' && attr.name === 'src' && attr.content) {
        attr.content = `${attr.content.substring(0, attr.content.length - 4)}.SJS`;
        return;
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
                throw new Error('转换xhs不支持内联的wxs');
            }
            node.name = 'sjs';
        }
        if (node.children) {
            loopTranslator(node.children);
        }
    });
};

export const toXhsML = (wxml: string): string => {
    const wxmlNodes = parseXML(wxml);
    loopTranslator(wxmlNodes);
    return serialize(wxmlNodes);
};
