(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.Vuet = global.Vuet || {})));
}(this, (function (exports) { 'use strict';

var toString = Object.prototype.toString;
// Cached type string
var typeStrings = ['Object', 'Function', 'String', 'Undefined', 'Null'];

var utils = {
  getArgMerge: function getArgMerge() {
    var opt = {};
    var args = arguments;
    if (utils.isString(args[0])) {
      opt[args[0]] = args.length > 1 ? args[1] : args[0];
    } else if (args[0] && utils.isObject(args[0])) {
      opt = args[0];
    }
    return opt;
  },
  set: function set(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: false,
      writable: true,
      configurable: false
    });
  }
};

// Add isXXX function
typeStrings.forEach(function (type) {
  var typeString = '[object ' + type + ']';
  utils['is' + type] = function (obj) {
    return toString.call(obj) === typeString;
  };
});

var _name = 'route';
var _key = '__' + _name + '__';

var route = {
  init: function init(vuet) {
    utils.set(vuet, _key, {
      watchers: {},
      scrolls: {}
    });
    Object.keys(vuet.store).forEach(function (path) {
      utils.set(vuet[_key].watchers, path, []);
      utils.set(vuet[_key].scrolls, path, {});
    });
  },
  rule: function rule(_ref) {
    var path = _ref.path;

    // route-scroll
    function resetVuetScroll(vuet) {
      Object.keys(vuet[_key].scrolls[path]).forEach(function (k) {
        var scrolls = { scrollTop: 0, scrollLeft: 0 };
        vuet[_key].scrolls[path][k] = scrolls;
        var el = document.getElementById(k);
        if (el) {
          scrollTo(el, scrolls);
        }
      });
    }

    // route-watch
    function getVuetWatchs(vuet) {
      return vuet[_key].watchers[path];
    }
    function setVuetWatchs(vuet, val) {
      vuet[_key].watchers[path] = val;
    }
    function getWatchs(obj, list) {
      if (typeof list === 'string') {
        list = [list];
      }
      var getObjVal = function getObjVal(obj, str) {
        var arr = str.split('.');
        arr.forEach(function (k) {
          obj = obj[k];
        });
        return obj;
      };
      var arr = [];
      list.forEach(function (val) {
        var value = getObjVal(obj, val);
        if (!isNaN(value)) {
          value = String(value);
        }
        arr.push(JSON.stringify(value));
      });
      return arr;
    }

    function diffWatch(to, from) {
      for (var i = 0; i < to.length; i++) {
        if (to[i] !== from[i]) {
          return true;
        }
      }
      return false;
    }

    return {
      beforeCreate: function beforeCreate() {
        var _this = this;

        var _$vuet$_options$modul = this.$vuet._options.modules[path].routeWatch,
            routeWatch = _$vuet$_options$modul === undefined ? 'fullPath' : _$vuet$_options$modul;

        var toWatch = getWatchs(this.$route, routeWatch);
        if (diffWatch(toWatch, getVuetWatchs(this.$vuet))) {
          this.$vuet.reset(path);
          setVuetWatchs(this.$vuet, toWatch);
          resetVuetScroll(this.$vuet);
        }
        this.$vuet.fetch(path, { current: this }, false).then(function (res) {
          if (diffWatch(toWatch, getWatchs(_this.$route, routeWatch))) return;
          _this.$vuet.setState(path, res);
          setVuetWatchs(_this.$vuet, toWatch);
        });
      },

      watch: {
        $route: {
          deep: true,
          handler: function handler(to, from) {
            var _this2 = this;

            var _$vuet$_options$modul2 = this.$vuet._options.modules[path].routeWatch,
                routeWatch = _$vuet$_options$modul2 === undefined ? 'fullPath' : _$vuet$_options$modul2;

            var toWatch = getWatchs(to, routeWatch);
            var fromWatch = getWatchs(from, routeWatch);
            if (!diffWatch(toWatch, fromWatch)) return false;
            this.$vuet.fetch(path, { current: this }).then(function (res) {
              if (diffWatch(toWatch, getWatchs(_this2.$route, routeWatch))) return;
              resetVuetScroll(_this2.$vuet);
              _this2.$vuet.setState(path, res);
              setVuetWatchs(_this2.$vuet, toWatch);
            });
          }
        }
      }
    };
  }
};

function initScroll(el, vnode, path) {
  var id = el.id;
  var context = vnode.context;

  var scrollPath = context.$vuet[_key].scrolls[path];
  if (!id || !context) return;
  if (!scrollPath[id]) {
    scrollPath[id] = { scrollTop: 0, scrollLeft: 0 };
  }
  var scrolls = scrollPath[id];
  setTimeout(function () {
    scrollTo(el, scrolls);
  }, 0);
  return scrolls;
}

function scrollTo(el, scrolls) {
  if ('scrollTop' in el) {
    Object.assign(el, scrolls);
  } else {
    el.scrollTo(scrolls.scrollTop, scrolls.scrollLeft);
  }
}

var routeScroll = {
  inserted: function inserted(el, _ref, vnode) {
    var value = _ref.value;

    var scrolls = initScroll(el, vnode, value);
    el.__routeScroll__ = function (event) {
      var _event$target = event.target,
          scrollTop = _event$target.scrollTop,
          scrollLeft = _event$target.scrollLeft,
          pageXOffset = _event$target.pageXOffset,
          pageYOffset = _event$target.pageYOffset;

      scrolls.scrollTop = scrollTop || pageXOffset || scrollTop;
      scrolls.scrollLeft = scrollLeft || pageYOffset || scrollLeft;
    };
    el.addEventListener('scroll', el.__routeScroll__, false);
  },
  unbind: function unbind(el) {
    el.removeEventListener('scroll', el.__routeScroll__, false);
    delete el.__routeScroll__;
  }
};

var _Vue = null;

function install(Vue) {
  if (install.installed) return;
  install.installed = true;
  _Vue = Vue;
  Object.defineProperty(Vue.prototype, '$vuet', {
    get: function get() {
      return this.$root._vuet;
    }
  });
  Vue.mixin({
    beforeCreate: function beforeCreate() {
      if (!utils.isUndefined(this.$options.vuet)) {
        this._vuet = this.$options.vuet;
        this._vuet._init(this);
      }
    },
    destroyed: function destroyed() {
      if (!utils.isUndefined(this.$options.vuet)) {
        this._vuet = this.$options.vuet;
        this._vuet.destroy(this);
      }
    }
  });

  Vue.directive('route-scroll', routeScroll);
}

var debug = {
  error: function error(msg) {
    throw new Error('[vuet] ' + msg);
  },
  warn: function warn(msg) {
    if (process.env.NODE_ENV !== 'production') {
      typeof console !== 'undefined' && console.warn('[vuet] ' + msg);
    }
  }
};

var life = {
  rule: function rule(_ref) {
    var path = _ref.path;

    return {
      beforeCreate: function beforeCreate() {
        this.$vuet.fetch(path, { current: this });
      },
      destroyed: function destroyed() {
        this.$vuet.reset(path, { current: this });
      }
    };
  }
};

var manual = {
  rule: function rule(_ref) {
    var path = _ref.path,
        name = _ref.name;

    return {
      beforeCreate: function beforeCreate() {
        var _this = this;

        var manuals = this.$vuet._options.modules[path].manuals;

        var methods = {};
        Object.keys(manuals).forEach(function (k) {
          var fn = manuals[k];
          if (utils.isFunction(fn)) {
            methods['' + k] = function () {
              for (var _len = arguments.length, arg = Array(_len), _key = 0; _key < _len; _key++) {
                arg[_key] = arguments[_key];
              }

              fn.apply(methods, [{
                state: _this.$vuet.getState(path),
                vm: _this,
                vuet: _this.$vuet
              }].concat(arg));
            };
          }
        });
        methods.reset = function () {
          var _$vuet;

          for (var _len2 = arguments.length, arg = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            arg[_key2] = arguments[_key2];
          }

          (_$vuet = _this.$vuet).reset.apply(_$vuet, [path].concat(arg));
          return methods;
        };
        methods.fetch = function () {
          var _$vuet2;

          for (var _len3 = arguments.length, arg = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
            arg[_key3] = arguments[_key3];
          }

          (_$vuet2 = _this.$vuet).fetch.apply(_$vuet2, [path].concat(arg));
          return methods;
        };
        if (name) {
          this[name] = methods;
        } else if (manuals.name) {
          this[manuals.name] = methods;
        } else {
          var arr = path.split(this.$vuet._options.pathJoin);
          var _name = '$' + arr[arr.length - 1];
          var $methods = this[_name] = {};
          Object.assign($methods, methods);
        }
      }
    };
  }
};

var need = {
  rule: function rule(_ref) {
    var path = _ref.path;

    return {
      beforeCreate: function beforeCreate() {
        this.$vuet.fetch(path, { current: this });
      }
    };
  }
};

var name = 'once';
var key = '__' + name + '__';

var once = {
  init: function init(vuet) {
    utils.set(vuet, key, {});
    Object.keys(vuet.store).forEach(function (k) {
      utils.set(vuet[key], k, false);
    });
  },
  rule: function rule(_ref) {
    var path = _ref.path;

    return {
      beforeCreate: function beforeCreate() {
        var _this = this;

        if (this.$vuet[key][path] === false) {
          this.$vuet.fetch(path, { current: this }).then(function () {
            _this.$vuet[key][path] = true;
          });
        }
      }
    };
  }
};

function install$1(_Vue, Vuet) {
  Vuet.rule('life', life).rule('manual', manual).rule('need', need).rule('once', once).rule('route', route);
}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};



































var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var Vuet$1 = function () {
  function Vuet(options) {
    classCallCheck(this, Vuet);

    if (!utils.isObject(options)) {
      debug.error('Parameter is the object type');
    }
    this.options = options || {};
    this.app = null;
    this.store = {};
    this.beforeHooks = []; // Before the request begins
    this.afterHooks = []; // After the request begins
    this.vm = null;
  }

  createClass(Vuet, [{
    key: 'beforeEach',
    value: function beforeEach(fn) {
      this.beforeHooks.push(fn);
      return this;
    }
  }, {
    key: 'afterEach',
    value: function afterEach(fn) {
      this.afterHooks.push(fn);
      return this;
    }
  }, {
    key: '_init',
    value: function _init(app) {
      var _this = this;

      if (this.app || !app) return;
      this.app = app;
      this.vm = new _Vue({
        data: {
          store: this.store
        }
      });
      this._options = _extends({
        data: function data() {
          return {};
        }
      }, this.options, {
        modules: {}
      });
      var keys = ['data', 'fetch', 'routeWatch', 'manuals'];
      var initModule = function initModule(path, modules) {
        Object.keys(modules).forEach(function (k) {
          var item = modules[k];
          var _path = [].concat(toConsumableArray(path), [k]);
          if (utils.isFunction(item.data)) {
            var newPath = [_path[0]];
            for (var i = 1; i < _path.length; i++) {
              newPath.push(_path[i].replace(/^(\w)/, function (v) {
                return v.toUpperCase();
              }));
            }
            newPath = newPath.join('');
            _this._options.modules[newPath] = item;
            _this.reset(newPath);
          }
          if (keys.indexOf(k) === -1 && utils.isObject(item)) {
            initModule(_path, item);
          }
        });
      };
      initModule([], this.options.modules);
      callRuleHook('init', this);
    }
  }, {
    key: 'getState',
    value: function getState(path) {
      return this.store[path] || {};
    }
  }, {
    key: 'setState',
    value: function setState(path, newState) {
      if (!this.store[path]) {
        _Vue.set(this.store, path, newState);
        return this;
      }
      Object.assign(this.store[path], newState);
      return this;
    }
  }, {
    key: 'fetch',
    value: function fetch(path, params, setStateBtn) {
      var _this2 = this;

      var module = this._options.modules[path];
      if (!utils.isFunction(module.fetch)) return Promise.resolve(this.getState(path));
      var data = {
        path: path,
        params: _extends({}, params),
        state: this.getState(path)
      };
      var callHook = function callHook(hook) {
        for (var _len = arguments.length, arg = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          arg[_key - 1] = arguments[_key];
        }

        for (var i = 0; i < _this2[hook].length; i++) {
          if (_this2[hook][i].apply(_this2, arg)) {
            return false;
          }
        }
      };
      if (callHook('beforeHooks', data) === false) return Promise.resolve(data.state);
      return module.fetch.call(this, data).then(function (res) {
        if (callHook('afterHooks', null, data, res) === false) return data.state;
        if (setStateBtn === false) return res;
        _this2.setState(path, res);
        return data.state;
      }).catch(function (e) {
        if (callHook('afterHooks', e, data) === false) return Promise.resolve(data.state);
        return Promise.reject(e);
      });
    }
  }, {
    key: 'reset',
    value: function reset(path) {
      var data = this._options.data.call(this);
      var module = this._options.modules[path];
      if (utils.isFunction(module.data)) {
        Object.assign(data, module.data.call(this, path));
      }
      this.setState(path, data);
      return this;
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.vm.$destroy();
      callRuleHook('destroy', this);
    }
  }]);
  return Vuet;
}();

Object.assign(Vuet$1, {
  options: {
    rules: {}
  },
  install: install,
  rule: function rule(name, _rule) {
    if (this.options.rules[name]) return this;
    this.options.rules[name] = _rule;
    callRuleHook('install', _Vue, Vuet$1);
    return this;
  },
  mapRules: function mapRules() {
    for (var _len2 = arguments.length, paths = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      paths[_key2] = arguments[_key2];
    }

    var opt = utils.getArgMerge.apply(null, arguments);
    var vueRules = [];
    var addRule = function addRule(ruleName, any) {
      var rules = Vuet$1.options.rules[ruleName];
      if (typeof any === 'string') {
        vueRules.push(rules.rule({ path: any }));
      } else {
        vueRules.push(rules.rule(any));
      }
    };
    Object.keys(opt).forEach(function (ruleName) {
      var any = opt[ruleName];
      if (Array.isArray(any)) {
        return any.forEach(function (item) {
          addRule(ruleName, item);
        });
      }
      addRule(ruleName, any);
    });
    return {
      mixins: vueRules
    };
  },
  mapModules: function mapModules() {
    var opt = utils.getArgMerge.apply(null, arguments);
    var computed = {};
    Object.keys(opt).forEach(function (k) {
      var path = opt[k];
      computed[k] = {
        get: function get$$1() {
          return this.$vuet.store[path];
        },
        set: function set$$1(val) {
          this.$vuet.store[path] = val;
        }
      };
    });
    return { computed: computed };
  },
  use: function use(plugin, opt) {
    if (utils.isFunction(plugin)) {
      plugin(_Vue, Vuet$1, opt);
    } else if (utils.isFunction(plugin.install)) {
      plugin.install(_Vue, Vuet$1, opt);
    }
    return this;
  }
});

function callRuleHook(hook) {
  var rules = Vuet$1.options.rules;

  for (var _len3 = arguments.length, arg = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
    arg[_key3 - 1] = arguments[_key3];
  }

  for (var k in rules) {
    if (utils.isFunction(rules[k][hook])) {
      rules[k][hook].apply(rules[k], arg);
    }
  }
}

Vuet$1.use(install$1);

var mapRules = Vuet$1.mapRules.bind(Vuet$1);
var mapModules = Vuet$1.mapModules.bind(Vuet$1);

exports.mapRules = mapRules;
exports.mapModules = mapModules;
exports['default'] = Vuet$1;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=vuet.js.map
