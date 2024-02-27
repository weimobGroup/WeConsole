import type { FxNode } from 'forgiving-xml-parser';
import { serialize } from 'forgiving-xml-parser';
import { parseXML } from './parse';

const EventMap = {
    touchstart: 'TouchStart',
    touchmove: 'TouchMove',
    touchcancel: 'TouchCancel',
    touchend: 'TouchEnd',
    tap: 'Tap',
    longpress: 'LongTap',
    longtap: 'LongTap',
    scroll: 'Scroll',
    scrolltolower: 'ScrollToLower'
};

const BlockEvent = {
    transitionend: 1,
    animationstart: 1,
    animationiteration: 1,
    animationend: 1,
    touchforcechange: 1,
    dragstart: 1,
    dragging: 1,
    dragend: 1,
    refresherpulling: 1,
    refresherrefresh: 1,
    refresherrestore: 1,
    refresherabort: 1,
    scrollstart: 1,
    scrollend: 1,
    refresherwillrefresh: 1,
    refresherstatuschange: true
};

const convertEventName = (attr: Required<FxNode>, prefix: string, replacement: string): boolean => {
    if (attr.name.startsWith(prefix)) {
        const name = attr.name.substring(prefix.length);
        if (BlockEvent[name]) {
            throw new Error(`暂不支持${name}事件的转换`);
        }
        attr.name = replacement + (EventMap[name] || name[0].toUpperCase() + name.substring(1));
        return true;
    }
    return false;
};

const translatorEventAttr = (attr: Required<FxNode>): boolean => {
    if (attr.name.startsWith('worklet')) {
        throw new Error(`不支持worklet事件${attr.name}的转换`);
    }
    if (attr.name.startsWith('mut-bind') || attr.name.startsWith('mut-bind:')) {
        throw new Error(`不支持互斥事件${attr.name}的转换`);
    }
    return [
        ['bind:', 'on'],
        ['bind', 'on'],
        ['catch:', 'catch'],
        ['catch', 'catch'],
        ['capture-bind:', 'capture-on'],
        ['capture-bind', 'capture-on'],
        ['capture-catch:', 'capture-catch'],
        ['capture-catch', 'capture-catch']
    ].some((item) => {
        return convertEventName(attr, item[0], item[1]);
    });
};

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
    if (translatorEventAttr(attr as Required<FxNode>)) {
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
