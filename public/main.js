"use strict";

(function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);throw new Error("Cannot find module '" + o + "'");
      }var f = n[o] = { exports: {} };t[o][0].call(f.exports, function (e) {
        var n = t[o][1][e];return s(n ? n : e);
      }, f, f.exports, e, t, n, r);
    }return n[o].exports;
  }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) s(r[o]);return s;
})({ 1: [function (require, module, exports) {
    (function (global) {
      'use strict';

      var stub = require('./stub');
      var tracking = require('./tracking');
      var ls = 'localStorage' in global && global.localStorage ? global.localStorage : stub;

      function accessor(key, value) {
        if (arguments.length === 1) {
          return get(key);
        }
        return set(key, value);
      }

      function get(key) {
        return JSON.parse(ls.getItem(key));
      }

      function set(key, value) {
        try {
          ls.setItem(key, JSON.stringify(value));
          return true;
        } catch (e) {
          return false;
        }
      }

      function remove(key) {
        return ls.removeItem(key);
      }

      function clear() {
        return ls.clear();
      }

      accessor.set = set;
      accessor.get = get;
      accessor.remove = remove;
      accessor.clear = clear;
      accessor.on = tracking.on;
      accessor.off = tracking.off;

      module.exports = accessor;
    }).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
  }, { "./stub": 2, "./tracking": 3 }], 2: [function (require, module, exports) {
    'use strict';

    var ms = {};

    function getItem(key) {
      return key in ms ? ms[key] : null;
    }

    function setItem(key, value) {
      ms[key] = value;
      return true;
    }

    function removeItem(key) {
      var found = (key in ms);
      if (found) {
        return delete ms[key];
      }
      return false;
    }

    function clear() {
      ms = {};
      return true;
    }

    module.exports = {
      getItem: getItem,
      setItem: setItem,
      removeItem: removeItem,
      clear: clear
    };
  }, {}], 3: [function (require, module, exports) {
    (function (global) {
      'use strict';

      var listeners = {};
      var listening = false;

      function listen() {
        if (global.addEventListener) {
          global.addEventListener('storage', change, false);
        } else if (global.attachEvent) {
          global.attachEvent('onstorage', change);
        } else {
          global.onstorage = change;
        }
      }

      function change(e) {
        if (!e) {
          e = global.event;
        }
        var all = listeners[e.key];
        if (all) {
          all.forEach(fire);
        }

        function fire(listener) {
          listener(JSON.parse(e.newValue), JSON.parse(e.oldValue), e.url || e.uri);
        }
      }

      function on(key, fn) {
        if (listeners[key]) {
          listeners[key].push(fn);
        } else {
          listeners[key] = [fn];
        }
        if (listening === false) {
          listen();
        }
      }

      function off(key, fn) {
        var ns = listeners[key];
        if (ns.length > 1) {
          ns.splice(ns.indexOf(fn), 1);
        } else {
          listeners[key] = [];
        }
      }

      module.exports = {
        on: on,
        off: off
      };
    }).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
  }, {}], 4: [function (require, module, exports) {
    'use strict';

    var localstorage = require('local-storage');

    ;(function ($, window, document, localstorage, undefined) {

      var main = {

        cache: function cache() {
          this.$document = $(document);
          this.$content = $('#content');
          this.$tabs = $('#tabs');
          this.$add = $('#add');
          this.$remove = $('#remove');
          this.$activeTab = {};
        },

        bindEvents: function bindEvents() {
          var _this = this;

          // Track and save content.
          this.$document.on('keyup', '#content', function () {

            var state, key, text;
            state = _this.getState();
            key = _this.getActiveKey();
            text = _this.getText();
            state[key].text = text;
            _this.setState(state);
            // Update tab name.
            _this.setTabName(_this.$activeTab, text);
          });
          // Prevent g14 open in another window from overriding content. Sync windows.
          localstorage.on('content', function (content) {
            _this.$tabs.html('');
            _this.$content.val('');
            _this.init();
          });

          // Listen for new tab click.
          this.$add.on('click', function () {
            // Add tab to DOM
            _this.addTab();
          });

          // Listen for remove tab click.
          this.$remove.on('click', function () {
            _this.removeTab();
          });

          // Listen for change tab events.
          this.$tabs.on('click', 'li', function (e, target) {
            var $tab = $(e.target);
            _this.changeTab($tab);
          });
        },

        changeTab: function changeTab($tab) {
          var activeKey, newActiveKey, state;
          activeKey = this.getActiveKey();
          newActiveKey = $tab.attr('data-tab-id');
          if (activeKey != newActiveKey) {
            state = this.getState();
            state = this.replaceObjValues(state, 'active', false);
            state[newActiveKey].active = true;
            this.setState(state);
            this.changeActiveTab(newActiveKey);
            this.insertText(state[newActiveKey].text);
            this.cacheActiveTab($tab);
          }
        },

        addTab: function addTab() {
          var state, newState, newStateKey, text;
          state = this.getState();
          newState = this.getDefaultState();
          newStateKey = Object.keys(newState).toString();
          state = this.replaceObjValues(state, 'active', false);
          $.extend(state, newState);
          text = newState[newStateKey].text;
          this.setState(state);
          this.appendTabsToDOM(newState);
          this.changeActiveTab(newStateKey);
          this.insertText(text);
          this.cacheActiveTab();
          this.setTabName(this.$activeTab, text);
        },

        removeTab: function removeTab() {
          var key, state, newKey;
          key = this.getActiveKey();
          state = this.getState();
          if (Object.keys(state).length <= 1) {
            return;
          }
          delete state[key];
          var newKey = Object.keys(state).reduce(function (prev, current) {
            return current > prev ? current : prev;
          }, '0');
          state[newKey].active = true;
          this.setState(state);
          this.removeTabFromDOM(key);
          this.changeActiveTab(newKey);
          this.cacheActiveTab();
        },

        appendTabsToDOM: function appendTabsToDOM(obj) {
          var _this2 = this;

          Object.keys(obj).forEach(function (key) {
            var html = obj[key].active ? '<li class="tab active" data-tab-id="' + key + '"></li>' : '<li class="tab" data-tab-id="' + key + '"></li>';
            _this2.$tabs.append(html);
          });
          return this;
        },

        removeTabFromDOM: function removeTabFromDOM(key) {
          this.$tabs.find('.tab[data-tab-id="' + key + '"]').remove();
          return this;
        },

        setTabName: function setTabName($tab, text) {
          $tab.text(text.split('\n').shift().slice(0, 15) || '...');
        },

        cacheActiveTab: function cacheActiveTab($obj) {
          if (!$obj) {
            this.$activeTab = $('#tabs .tab.active');
          } else {
            this.$activeTab = $obj;
          }
          return this;
        },

        changeActiveTab: function changeActiveTab(key) {
          this.$tabs.find('.tab').removeClass('active').filter('[data-tab-id="' + key + '"]').addClass('active');
          return this;
        },

        getText: function getText() {
          return this.$content.val();
        },

        insertText: function insertText(content) {
          this.$content.val(content);
          return this;
        },

        setState: function setState(state) {
          var key = arguments.length <= 1 || arguments[1] === undefined ? 'content' : arguments[1];

          localstorage.set(key, state);
          return this;
        },

        getState: function getState() {
          var key = arguments.length <= 0 || arguments[0] === undefined ? 'content' : arguments[0];

          return localstorage.get(key);
        },

        getActiveState: function getActiveState() {
          var state = arguments.length <= 0 || arguments[0] === undefined ? this.getState() : arguments[0];

          var key = this.getActiveKey(state);
          return state[key];
        },

        getActiveKey: function getActiveKey() {
          var state = arguments.length <= 0 || arguments[0] === undefined ? this.getState() : arguments[0];

          var activeKey = {};
          Object.keys(state).forEach(function (key) {
            if (state[key].active) {
              activeKey = key;
            }
          });
          return activeKey;
        },

        getDefaultState: function getDefaultState() {
          var state = {};
          state[Date.now()] = { text: '', active: true };
          return state;
        },

        replaceObjValues: function replaceObjValues(obj, field, value) {
          // Not by ref.
          var o = {},
              clone;
          clone = $.extend({}, obj);
          Object.keys(clone).forEach(function (key) {
            clone[key][field] = value;
          });
          return clone;
        },

        init: function init() {
          var _this3 = this;

          var text, content, state, $el, key;
          this.cache();

          state = this.getState();
          if (!state) {
            state = this.getDefaultState();
            this.setState(state);
          }

          // Modify DOM.
          this.appendTabsToDOM(state);
          this.$tabs.find('.tab').each(function (i, el) {
            $el = $(el);
            key = $el.attr('data-tab-id');
            _this3.setTabName($el, state[key].text);
          });

          this.cacheActiveTab();
          this.bindEvents();
          text = this.getActiveState().text;
          this.insertText(text);
        }

      };

      $(document).ready(function () {
        main.init();
      });
    })(jQuery, window, document, localstorage);
  }, { "local-storage": 1 }] }, {}, [4]);