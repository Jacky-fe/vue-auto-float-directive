const isServer = typeof window === 'undefined'
const on = (function () {
  if (!isServer && document.addEventListener) {
    return function (element, event, handler) {
      if (element && event && handler) {
        element.addEventListener(event, handler, false)
      }
    }
  } else {
    return function (element, event, handler) {
      if (element && event && handler) {
        element.attachEvent('on' + event, handler)
      }
    }
  }
})()
const ownerDocument = function ownerDocument (node) {
  return (node && node.ownerDocument) || document
}
const ownerWindow = function ownerDocument (node) {
  return node === node.window ? node : node.nodeType === 9 ? node.defaultView || node.parentWindow : window
}
const rect = function (node) {
  const box = node.getBoundingClientRect()
  return {
    width: (box.width ? box.width : node.offsetWidth) || 0,
    height: (box.height ? box.height : node.offsetHeight) || 0,
    top: box.top || 0,
    left: box.left || 0
  }
}
const offset = function (node) {
  let doc = ownerDocument(node)
  let win = ownerWindow(doc)
  let box = { top: 0, left: 0, height: 0, width: 0 }
  let docElem = doc && doc.documentElement

  if (!doc || !docElem.contains(node) || !node || node.nodeType !== 1) {
    return box
  }
  const nRect = rect(node)
  let scrollTop = win.pageYOffset || doc.documentElement.scrollTop || doc.body.scrollTop
  let scrollLeft = win.pageXOffset || doc.documentElement.scrollLeft || doc.body.scrollLeft
  let clientTop = doc.documentElement.clientTop || doc.body.clientTop
  let clientLeft = doc.documentElement.clientLeft || doc.body.clientLeft
  const nodeStyle = getComputedStyle(node)
  const marginLeft = parseInt((nodeStyle.marginLeft || '0').replace('px', ''))
  const marginTop = parseInt((nodeStyle.marginTop || '0').replace('px', ''))
  box = {
    top: nRect.top + (scrollTop || 0) - (clientTop || 0) - marginTop,
    left: nRect.left + (scrollLeft || 0) - (clientLeft || 0) - marginLeft,
    width: nRect.width,
    height: nRect.height
  }
  return box
}
const getScrollTop = function () {
  if (!isServer) {
    let scrollTop = 0
    if (document.documentElement && document.documentElement.scrollTop) {
      scrollTop = document.documentElement.scrollTop
    }
    else if (document.body) {
      scrollTop = document.body.scrollTop
    }
    return scrollTop
  }
  return 0
}
const floatItemArray = []
if (!isServer) {
  // when scroll over the element, push
  on(document, 'scroll', function () {
    const scrollTop = getScrollTop()
    floatItemArray.forEach((item) => {
      if (scrollTop >= item.rect.top && !item.hasFixed) {
        // recomputed the rect, maybe some elements changed
        item.rect = offset(item.el)
        item.hasFixed = true
        // create a placeHolder to avoid the element jump up
        item.placeHolder = item.placeHolder || createPlaceHolder(item.rect.width, item.rect.height, item.el)
        item.el.style.cssText = changeEleCssText(item.el, `position:fixed; top:0px;left:${item.rect.left}px;width:${item.rect.width}px;z-index: 100`)
        item.el.parentElement.insertBefore(item.placeHolder, item.el.nextSibling)
        document.body.appendChild(item.el)
      } else if (scrollTop < item.rect.top && item.hasFixed) {
        item.hasFixed = false
        item.el.style.cssText = item.originCssText
        item.placeHolder.parentElement.insertBefore(item.el, item.placeHolder)
        item.el.parentElement.removeChild(item.placeHolder)
      }
    })
  })
  const parseStyle = function (cssText) {
    if (cssText) {
      const ret = {}
      const styleArray = cssText.split(';')
      styleArray.forEach(item => {
        const nameValue = item.split(':')
        ret[nameValue[0]] = nameValue[1]
      })
      return ret
    }
    return {}
  }
  const toCssText = function (cssObj) {
    const ret = []
    for (const key in cssObj) {
      ret.push(`${key}:${cssObj[key]}`)
    }
    return ret.join(';')
  }
  const changeEleCssText = function (el, cssText) {
    const oldCssObj = parseStyle(el.style.cssText)
    const newCssObj = parseStyle(cssText)
    for (const key in newCssObj) {
      oldCssObj[key] = newCssObj[key]
    }
    return toCssText(oldCssObj)
  }
  const createPlaceHolder = function (width, height, origin) {
    const el = document.createElement(origin.tagName)
    el.style.cssText = changeEleCssText(origin, `height:${height}px;`)
    el.className = origin.className
    return el
  }
  let timerId = null
  // when resize recompute the width of placeHolder and height of origin
  on(window, 'resize', function () {
    if (timerId) {
      return
    }
    timerId = window.setTimeout(function () {
      floatItemArray.forEach(item => {
        if (item.hasFixed) {
          const placeHolderRect = offset(item.placeHolder)
          item.el.style.cssText = changeEleCssText(item.el, `position:fixed; top:0px; left:${placeHolderRect.left}px;width:${placeHolderRect.width}px;z-index: 100`)
          const originRect = rect(item.el)
          item.placeHolder.style.cssText = changeEleCssText(item.placeHolder, `height:${originRect.height}px;`)
        }
      })
      timerId = window.clearTimeout(timerId)
    }, 100)
  })
}
const autoFloat = {
  inserted (el, binding, vnode) {
    if (!isServer) {
      floatItemArray.push({el, rect: offset(el), originCssText: el.style.cssText})
      vnode.context.$on('v-auto-float-height-change', () => {
        const floatItem = floatItemArray.find(item => item.el === el)
        const height = rect(el).height
        if (height !== floatItem.height && floatItem.hasFixed && floatItem.placeHolder) {
          floatItem.placeHolder.style.cssText = `height:${height}px`
        }
      })
    }
  },
  unbind (el, binding, vnode) {
    if (!isServer) {
      const index = floatItemArray.findIndex(item => item.el === el)
      floatItemArray.splice(index, 1)
      vnode.context.$off('v-auto-float-height-change')
    }
  }
}
export default {
  install (Vue) {
    Vue.directive('AutoFloat', autoFloat)
  }
}
