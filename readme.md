# vue-auto-float-directive
## description
auto float the components when scroll over it, just like the good detail page tab of https://www.jd.com, it has these features:

当页面滚动过该组件时自动悬浮起来，类似京东商品详情页里的tab, 它有如下特征：

1. auto put a place holder after the origin element's to avoid the layout disorder

    自动放置占位元素，避免页面布局错乱或抖动

2. support width self-adaption component when resize the window 

    支持宽度自适应的组件，例如窗口大小调整的时候

3. support ssr

## install
npm install vue-auto-float-directive

## example
``` js
import Vue  from 'vue'
import  AutoFloat  from 'vue-auto-float-directive'
Vue.use(AutoFloat)
```
``` html
<div v-auto-float>
</div>
```
``` js
  methods: {
    noticeHeightChanged () {
      // when emit this event, the directive will recompute the height of origin component
      this.$emit('v-auto-float-height-change')
    }
  }
```
## notices
1. only support pc browsers

    只支持pc版本
2. it will overridethe style.cssText when the component float(before 0.0.5), so use className to set css, not style

    当组件悬浮时会覆盖cssText，所以使用class去设置样式，而不要用style

## plans
1. support mobile browsers
2. not override the style.cssText (completed @0.0.5)
3. use the vm.$nextTick to make sure the element has binded
4. support auto adjust size by emit event (completed @0.0.5)
