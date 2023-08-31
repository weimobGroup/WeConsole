const { parseMpXml, serialize } = require('@mpkit/mpxml-parser');
const { uuid } = require('@mpkit/util');

exports.minify = (wxmlCode) => {
    const parseResult = parseMpXml(wxmlCode);
    if (parseResult.nodes) {
        const ids = [];
        let res = serialize(parseResult.nodes, {
            // eslint-disable-next-line max-params
            nodeSerializeHandler(node, siblingNodes, rootNodes, rootSerialer, parent, adapter, content) {
                if (node.type === 'text') {
                    if (!node.content.trim()) {
                        ids.push(uuid());
                        return `<!--${ids[ids.length - 1]}-->`;
                    }
                    return node.content.trim();
                }
                if (node.type === 'comment') {
                    ids.push(uuid());
                    return `<!--${ids[ids.length - 1]}-->`;
                }
                return content;
            }
        });
        ids.forEach((item) => {
            res = res.replace(new RegExp(`<!--${item}-->`), '');
        });
        return res;
    }
    return wxmlCode;
};

exports.minify(`<view class="wc-el">
<view class="wc-el-head {{!data.alive?'death':''}} {{data.id==selectId?'selected':''}} {{data.hasChild?'has-child':''}} {{data.open?'open':''}}" bind:tap="tap">
    <view class="wc-el-boundary">{{'<'}}</view>
    <view class="wc-el-name {{data.group?'':'tapable'}}" catch:tap="tapName">{{data.name}}</view>
    <block wx:if="{{data.attrs}}">
        <block wx:for="{{data.attrs}}" wx:key="name">
            <view class="wc-el-attr wc-el-name">{{item.name}}</view>
            <block wx:if="{{item.content}}">
                <view class="wc-el-attr wc-el-equal">=</view>
                <view class="wc-el-attr wc-el-boundary">{{'"'}}</view>
                <view class="wc-el-attr wc-el-content">{{item.content}}</view>
                <view class="wc-el-attr wc-el-boundary">{{'"'}}</view>
            </block>
        </block>
    </block>
    <block wx:if="{{!data.open}}">
        <block wx:if="{{data.hasChild}}">
            <view class="wc-el-boundary">{{'>'}}</view>
            <view class="wc-el-ellipsis">{{'…'}}</view>
            <view class="wc-el-boundary">{{'</'}}</view>
            <view class="wc-el-name">{{data.name}}</view>
            <view class="wc-el-boundary">{{'>'}}</view>
        </block>
        <view wx:else class="wc-el-boundary">{{' />'}}</view>
    </block>
    <view wx:else class="wc-el-boundary">{{'>'}}</view>
</view>
<block wx:if="{{data.open}}">
    <view class="wc-el-body">
        <wc-element wx:for="{{data.children}}" wx:key="id" data="{{item}}" selectId="{{selectId}}" bind:toggle="toggle" bind:tapName="childTapName"></wc-element>
    </view>
    <view class="wc-el-footer">
        <view class="wc-el-boundary">{{'</'}}</view>
        <view class="wc-el-name">{{data.name}}</view>
        <view class="wc-el-boundary">{{'>'}}</view>
    </view>
</block>
</view>`);
