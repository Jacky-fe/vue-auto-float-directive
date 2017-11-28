'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var isServer = typeof window === 'undefined';
var on = function () {
  if (!isServer && document.addEventListener) {
    return function (element, event, handler) {
      if (element && event && handler) {
        element.addEventListener(event, handler, false);
      }
    };
  } else {
    return function (element, event, handler) {
      if (element && event && handler) {
        element.attachEvent('on' + event, handler);
      }
    };
  }
}();
var ownerDocument = function ownerDocument(node) {
  return node && node.ownerDocument || document;
};
var ownerWindow = function ownerDocument(node) {
  return node === node.window ? node : node.nodeType === 9 ? node.defaultView || node.parentWindow : window;
};
var rect = function rect(node) {
  var box = node.getBoundingClientRect();
  return {
    width: (box.width ? box.width : node.offsetWidth) || 0,
    height: (box.height ? box.height : node.offsetHeight) || 0,
    top: box.top || 0,
    left: box.left || 0
  };
};
var offset = function offset(node) {
  var doc = ownerDocument(node);
  var win = ownerWindow(doc);
  var box = { top: 0, left: 0, height: 0, width: 0 };
  var docElem = doc && doc.documentElement;

  if (!doc || !docElem.contains(node) || !node || node.nodeType !== 1) {
    return box;
  }
  var nRect = rect(node);
  var scrollTop = win.pageYOffset || doc.documentElement.scrollTop || doc.body.scrollTop;
  var scrollLeft = win.pageXOffset || doc.documentElement.scrollLeft || doc.body.scrollLeft;
  var clientTop = doc.documentElement.clientTop || doc.body.clientTop;
  var clientLeft = doc.documentElement.clientLeft || doc.body.clientLeft;
  var nodeStyle = getComputedStyle(node);
  var marginLeft = parseInt((nodeStyle.marginLeft || '0').replace('px', ''));
  var marginTop = parseInt((nodeStyle.marginTop || '0').replace('px', ''));
  box = {
    top: nRect.top + (scrollTop || 0) - (clientTop || 0) - marginTop,
    left: nRect.left + (scrollLeft || 0) - (clientLeft || 0) - marginLeft,
    width: nRect.width,
    height: nRect.height
  };
  return box;
};
var getScrollTop = function getScrollTop() {
  if (!isServer) {
    var scrollTop = 0;
    if (document.documentElement && document.documentElement.scrollTop) {
      scrollTop = document.documentElement.scrollTop;
    } else if (document.body) {
      scrollTop = document.body.scrollTop;
    }
    return scrollTop;
  }
  return 0;
};
var createPlaceHolder = function createPlaceHolder(width, height, className) {
  var el = document.createElement('div');
  el.style.cssText = 'height:' + height + 'px;';
  el.className = className;
  return el;
};
var floatItemArray = [];
if (!isServer) {
  // when scroll over the element, push
  on(document, 'scroll', function () {
    var scrollTop = getScrollTop();
    floatItemArray.forEach(function (item) {
      if (scrollTop >= item.rect.top && !item.hasFixed) {
        // recomputed the rect, maybe some elements changed
        item.rect = offset(item.el);
        item.hasFixed = true;
        item.el.style.cssText = changeEleCssText(item.el, 'position:fixed; top:0px;left:' + item.rect.left + 'px;width:' + item.rect.width + 'px;z-index: 100');
        // create a placeHolder to avoid the element jump up
        item.placeHolder = item.placeHolder || createPlaceHolder(item.rect.width, item.rect.height, item.el.className);
        item.el.parentElement.insertBefore(item.placeHolder, item.el.nextSibling);
        document.body.appendChild(item.el);
      } else if (scrollTop < item.rect.top && item.hasFixed) {
        item.hasFixed = false;
        item.el.style.cssText = item.originCssText;
        item.placeHolder.parentElement.insertBefore(item.el, item.placeHolder);
        item.el.parentElement.removeChild(item.placeHolder);
      }
    });
  });
  var parseStyle = function parseStyle(cssText) {
    if (cssText) {
      var ret = {};
      var styleArray = cssText.split(';');
      styleArray.forEach(function (item) {
        var nameValue = item.split(':');
        ret[nameValue[0]] = nameValue[1];
      });
      return ret;
    }
    return {};
  };
  var toCssText = function toCssText(cssObj) {
    var ret = [];
    for (var key in cssObj) {
      ret.push(key + ':' + cssObj[key]);
    }
    return ret.join(';');
  };
  var changeEleCssText = function changeEleCssText(el, cssText) {
    var oldCssObj = parseStyle(el.style.cssText);
    var newCssObj = parseStyle(cssText);
    for (var key in newCssObj) {
      oldCssObj[key] = newCssObj[key];
    }
    return toCssText(oldCssObj);
  };
  var timerId = null;
  // when resize recompute the width of placeHolder and height of origin
  on(window, 'resize', function () {
    if (timerId) {
      return;
    }
    timerId = window.setTimeout(function () {
      floatItemArray.forEach(function (item) {
        if (item.hasFixed) {
          var placeHolderRect = offset(item.placeHolder);
          item.el.style.cssText = changeEleCssText(item.el, 'position:fixed; top:0px; left:' + placeHolderRect.left + 'px;width:' + placeHolderRect.width + 'px;z-index: 100');
          var originRect = rect(item.el);
          item.placeHolder.style.cssText = 'height:' + originRect.height + 'px;';
        }
      });
      timerId = window.clearTimeout(timerId);
    }, 100);
  });
}
var autoFloat = {
  inserted: function inserted(el, binding, vnode) {
    if (!isServer) {
      floatItemArray.push({ el: el, rect: offset(el), originCssText: el.style.cssText });
      vnode.context.$on('v-auto-float-height-change', function () {
        var floatItem = floatItemArray.find(function (item) {
          return item.el === el;
        });
        var height = rect(el).height;
        if (height !== floatItem.height && floatItem.hasFixed && floatItem.placeHolder) {
          floatItem.placeHolder.style.cssText = 'height:' + height + 'px';
        }
      });
    }
  },
  unbind: function unbind(el, binding, vnode) {
    if (!isServer) {
      var index = floatItemArray.findIndex(function (item) {
        return item.el === el;
      });
      floatItemArray.splice(index, 1);
      vnode.context.$off('v-auto-float-height-change');
    }
  }
};
exports.default = {
  install: function install(Vue) {
    Vue.directive('AutoFloat', autoFloat);
  }
};