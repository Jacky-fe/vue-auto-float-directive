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
var offset = function offset(node) {
  var doc = ownerDocument(node);
  var win = ownerWindow(doc);
  var box = { top: 0, left: 0, height: 0, width: 0 };
  var docElem = doc && doc.documentElement;

  if (!doc || !docElem.contains(node) || !node || node.nodeType !== 1) {
    return box;
  }
  box = node.getBoundingClientRect();

  var scrollTop = win.pageYOffset || doc.documentElement.scrollTop || doc.body.scrollTop;
  var scrollLeft = win.pageXOffset || doc.documentElement.scrollLeft || doc.body.scrollLeft;
  var clientTop = doc.documentElement.clientTop || doc.body.clientTop;
  var clientLeft = doc.documentElement.clientLeft || doc.body.clientLeft;

  box = {
    top: box.top + (scrollTop || 0) - (clientTop || 0),
    left: box.left + (scrollLeft || 0) - (clientLeft || 0),
    width: (box.width ? box.width : node.offsetWidth) || 0,
    height: (box.height ? box.height : node.offsetHeight) || 0
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
        item.el.style.cssText = 'position:fixed; top:0px; width:' + item.rect.width + 'px;z-index: 100';
        // create a placeHolder to avoid the element jump up
        item.placeHolder = item.placeHolder || createPlaceHolder(item.rect.width, item.rect.height, item.el.className);
        item.el.parentElement.insertBefore(item.placeHolder, item.el.nextSibling);
      } else if (scrollTop < item.rect.top && item.hasFixed) {
        item.hasFixed = false;
        item.el.style.cssText = '';
        item.el.parentElement.removeChild(item.placeHolder);
      }
    });
  });
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
          item.el.style.cssText = 'position:fixed; top:0px; width:' + placeHolderRect.width + 'px;z-index: 100';
          var orginRect = offset(item.el);
          item.placeHolder.style.cssText = 'height:' + orginRect.height + 'px;';
        }
      });
      timerId = window.clearTimeout(timerId);
    }, 100);
  });
}
var autoFloat = {
  inserted: function inserted(el) {
    if (!isServer) {
      floatItemArray.push({ el: el, rect: offset(el) });
    }
  },
  unbind: function unbind(el) {
    if (!isServer) {
      var index = floatItemArray.findIndex(function (item) {
        return item.el === el;
      });
      floatItemArray.splice(index, 1);
    }
  }
};
exports.default = {
  install: function install(Vue) {
    Vue.directive('AutoFloat', autoFloat);
  }
};