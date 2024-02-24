import type { FxNode } from 'forgiving-xml-parser';
import { parse } from 'forgiving-xml-parser';
export const parseXML = (xml: string) => {
    const res = parse(xml, {
        allowStartTagBoundaryNearSpace: true,
        allowEndTagBoundaryNearSpace: true,
        allowTagNameHasSpace: false
    });
    if (res.error) {
        throw res.error;
    }
    return res.nodes as FxNode[];
};
