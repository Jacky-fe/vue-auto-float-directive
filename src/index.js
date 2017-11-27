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
};
const offset = function offset (node) {
  let doc = ownerDocument(node)
  let win = ownerWindow(doc)
  let box = { top: 0, left: 0, height: 0, width: 0 }
  let docElem = doc && doc.documentElement

  if (!doc || !docElem.contains(node) || !node || node.nodeType !== 1) {
    return box
  }
  box = node.getBoundingClientRect()

  let scrollTop = win.pageYOffset || doc.documentElement.scrollTop || doc.body.scrollTop
  let scrollLeft = win.pageXOffset || doc.documentElement.scrollLeft || doc.body.scrollLeft
  let clientTop = doc.documentElement.clientTop || doc.body.clientTop
  let clientLeft = doc.documentElement.clientLeft || doc.body.clientLeft

  box = {
    top: box.top + (scrollTop || 0) - (clientTop || 0),
    left: box.left + (scrollLeft || 0) - (clientLeft || 0),
    width: (box.width ? box.width : node.offsetWidth) || 0,
    height: (box.height ? box.height : node.offsetHeight) || 0
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
const createPlaceHolder = function (width, height, className) {
  const el = document.createElement('div')
  el.style.cssText = `height:${height}px;`
  el.className = className
  return el
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
        item.el.style.cssText = `position:fixed; top:0px; width:${item.rect.width}px;z-index: 100`
        // create a placeHolder to avoid the element jump up
        item.placeHolder = item.placeHolder || createPlaceHolder(item.rect.width, item.rect.height, item.el.className)
        item.el.parentElement.insertBefore(item.placeHolder, item.el.nextSibling)
      } else if (scrollTop < item.rect.top && item.hasFixed) {
        item.hasFixed = false
        item.el.style.cssText = ''
        item.el.parentElement.removeChild(item.placeHolder)
      }
    })
  })
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
          item.el.style.cssText = `position:fixed; top:0px; width:${placeHolderRect.width}px;z-index: 100`
          const orginRect = offset(item.el)
          item.placeHolder.style.cssText = `height:${orginRect.height}px;`
        }
      })
      timerId = window.clearTimeout(timerId)
    }, 100)
  })
}
const autoFloat = {
  inserted (el) {
    if (!isServer) {
      floatItemArray.push({el, rect: offset(el)})
    }
  },
  unbind (el) {
    if (!isServer) {
      const index = floatItemArray.findIndex(item => item.el === el)
      floatItemArray.splice(index, 1)
    }
  }
}
export default {
  install (Vue) {
    Vue.directive('AutoFloat', autoFloat)
  }
}
