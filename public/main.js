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

    var Keyboard = require('./lib/keyboard');
    var Locale = require('./lib/locale');
    var KeyCombo = require('./lib/key-combo');

    var keyboard = new Keyboard();

    keyboard.setLocale('us', require('./locales/us'));

    exports = module.exports = keyboard;
    exports.Keyboard = Keyboard;
    exports.Locale = Locale;
    exports.KeyCombo = KeyCombo;
  }, { "./lib/key-combo": 2, "./lib/keyboard": 3, "./lib/locale": 4, "./locales/us": 5 }], 2: [function (require, module, exports) {

    function KeyCombo(keyComboStr) {
      this.sourceStr = keyComboStr;
      this.subCombos = KeyCombo.parseComboStr(keyComboStr);
      this.keyNames = this.subCombos.reduce(function (memo, nextSubCombo) {
        return memo.concat(nextSubCombo);
      });
    }

    // TODO: Add support for key combo sequences
    KeyCombo.sequenceDeliminator = '>>';
    KeyCombo.comboDeliminator = '>';
    KeyCombo.keyDeliminator = '+';

    KeyCombo.parseComboStr = function (keyComboStr) {
      var subComboStrs = KeyCombo._splitStr(keyComboStr, KeyCombo.comboDeliminator);
      var combo = [];

      for (var i = 0; i < subComboStrs.length; i += 1) {
        combo.push(KeyCombo._splitStr(subComboStrs[i], KeyCombo.keyDeliminator));
      }
      return combo;
    };

    KeyCombo.prototype.check = function (pressedKeyNames) {
      var startingKeyNameIndex = 0;
      for (var i = 0; i < this.subCombos.length; i += 1) {
        startingKeyNameIndex = this._checkSubCombo(this.subCombos[i], startingKeyNameIndex, pressedKeyNames);
        if (startingKeyNameIndex === -1) {
          return false;
        }
      }
      return true;
    };

    KeyCombo.prototype.isEqual = function (otherKeyCombo) {
      if (!otherKeyCombo || typeof otherKeyCombo !== 'string' && typeof otherKeyCombo !== 'object') {
        return false;
      }

      if (typeof otherKeyCombo === 'string') {
        otherKeyCombo = new KeyCombo(otherKeyCombo);
      }

      if (this.subCombos.length !== otherKeyCombo.subCombos.length) {
        return false;
      }
      for (var i = 0; i < this.subCombos.length; i += 1) {
        if (this.subCombos[i].length !== otherKeyCombo.subCombos[i].length) {
          return false;
        }
      }

      for (var i = 0; i < this.subCombos.length; i += 1) {
        var subCombo = this.subCombos[i];
        var otherSubCombo = otherKeyCombo.subCombos[i].slice(0);

        for (var j = 0; j < subCombo.length; j += 1) {
          var keyName = subCombo[j];
          var index = otherSubCombo.indexOf(keyName);

          if (index > -1) {
            otherSubCombo.splice(index, 1);
          }
        }
        if (otherSubCombo.length !== 0) {
          return false;
        }
      }

      return true;
    };

    KeyCombo._splitStr = function (str, deliminator) {
      var s = str;
      var d = deliminator;
      var c = '';
      var ca = [];

      for (var ci = 0; ci < s.length; ci += 1) {
        if (ci > 0 && s[ci] === d && s[ci - 1] !== '\\') {
          ca.push(c.trim());
          c = '';
          ci += 1;
        }
        c += s[ci];
      }
      if (c) {
        ca.push(c.trim());
      }

      return ca;
    };

    KeyCombo.prototype._checkSubCombo = function (subCombo, startingKeyNameIndex, pressedKeyNames) {
      subCombo = subCombo.slice(0);
      pressedKeyNames = pressedKeyNames.slice(startingKeyNameIndex);

      var endIndex = startingKeyNameIndex;
      for (var i = 0; i < subCombo.length; i += 1) {

        var keyName = subCombo[i];
        if (keyName[0] === '\\') {
          var escapedKeyName = keyName.slice(1);
          if (escapedKeyName === KeyCombo.comboDeliminator || escapedKeyName === KeyCombo.keyDeliminator) {
            keyName = escapedKeyName;
          }
        }

        var index = pressedKeyNames.indexOf(keyName);
        if (index > -1) {
          subCombo.splice(i, 1);
          i -= 1;
          if (index > endIndex) {
            endIndex = index;
          }
          if (subCombo.length === 0) {
            return endIndex;
          }
        }
      }
      return -1;
    };

    module.exports = KeyCombo;
  }, {}], 3: [function (require, module, exports) {
    (function (global) {

      var Locale = require('./locale');
      var KeyCombo = require('./key-combo');

      function Keyboard(targetWindow, targetElement, platform, userAgent) {
        this._locale = null;
        this._currentContext = null;
        this._contexts = {};
        this._listeners = [];
        this._appliedListeners = [];
        this._locales = {};
        this._targetElement = null;
        this._targetWindow = null;
        this._targetPlatform = '';
        this._targetUserAgent = '';
        this._isModernBrowser = false;
        this._targetKeyDownBinding = null;
        this._targetKeyUpBinding = null;
        this._targetResetBinding = null;
        this._paused = false;

        this.setContext('global');
        this.watch(targetWindow, targetElement, platform, userAgent);
      }

      Keyboard.prototype.setLocale = function (localeName, localeBuilder) {
        var locale = null;
        if (typeof localeName === 'string') {

          if (localeBuilder) {
            locale = new Locale(localeName);
            localeBuilder(locale, this._targetPlatform, this._targetUserAgent);
          } else {
            locale = this._locales[localeName] || null;
          }
        } else {
          locale = localeName;
          localeName = locale._localeName;
        }

        this._locale = locale;
        this._locales[localeName] = locale;
        if (locale) {
          this._locale.pressedKeys = locale.pressedKeys;
        }
      };

      Keyboard.prototype.getLocale = function (localName) {
        localName || (localName = this._locale.localeName);
        return this._locales[localName] || null;
      };

      Keyboard.prototype.bind = function (keyComboStr, pressHandler, releaseHandler, preventRepeatByDefault) {
        if (keyComboStr === null || typeof keyComboStr === 'function') {
          preventRepeatByDefault = releaseHandler;
          releaseHandler = pressHandler;
          pressHandler = keyComboStr;
          keyComboStr = null;
        }

        if (keyComboStr && typeof keyComboStr === 'object' && typeof keyComboStr.length === 'number') {
          for (var i = 0; i < keyComboStr.length; i += 1) {
            this.bind(keyComboStr[i], pressHandler, releaseHandler);
          }
          return;
        }

        this._listeners.push({
          keyCombo: keyComboStr ? new KeyCombo(keyComboStr) : null,
          pressHandler: pressHandler || null,
          releaseHandler: releaseHandler || null,
          preventRepeat: preventRepeatByDefault || false,
          preventRepeatByDefault: preventRepeatByDefault || false
        });
      };
      Keyboard.prototype.addListener = Keyboard.prototype.bind;
      Keyboard.prototype.on = Keyboard.prototype.bind;

      Keyboard.prototype.unbind = function (keyComboStr, pressHandler, releaseHandler) {
        if (keyComboStr === null || typeof keyComboStr === 'function') {
          releaseHandler = pressHandler;
          pressHandler = keyComboStr;
          keyComboStr = null;
        }

        if (keyComboStr && typeof keyComboStr === 'object' && typeof keyComboStr.length === 'number') {
          for (var i = 0; i < keyComboStr.length; i += 1) {
            this.unbind(keyComboStr[i], pressHandler, releaseHandler);
          }
          return;
        }

        for (var i = 0; i < this._listeners.length; i += 1) {
          var listener = this._listeners[i];

          var comboMatches = !keyComboStr && !listener.keyCombo || listener.keyCombo.isEqual(keyComboStr);
          var pressHandlerMatches = !pressHandler && !releaseHandler || !pressHandler && !listener.pressHandler || pressHandler === listener.pressHandler;
          var releaseHandlerMatches = !pressHandler && !releaseHandler || !releaseHandler && !listener.releaseHandler || releaseHandler === listener.releaseHandler;

          if (comboMatches && pressHandlerMatches && releaseHandlerMatches) {
            this._listeners.splice(i, 1);
            i -= 1;
          }
        }
      };
      Keyboard.prototype.removeListener = Keyboard.prototype.unbind;
      Keyboard.prototype.off = Keyboard.prototype.unbind;

      Keyboard.prototype.setContext = function (contextName) {
        if (this._locale) {
          this.releaseAllKeys();
        }

        if (!this._contexts[contextName]) {
          this._contexts[contextName] = [];
        }
        this._listeners = this._contexts[contextName];
        this._currentContext = contextName;
      };

      Keyboard.prototype.getContext = function () {
        return this._currentContext;
      };

      Keyboard.prototype.watch = function (targetWindow, targetElement, targetPlatform, targetUserAgent) {
        var _this = this;

        this.stop();

        targetWindow && targetWindow !== null || (targetWindow = global);

        if (typeof targetWindow.nodeType === 'number') {
          targetUserAgent = targetPlatform;
          targetPlatform = targetElement;
          targetElement = targetWindow;
          targetWindow = global;
        }

        var userAgent = targetWindow.navigator && targetWindow.navigator.userAgent || '';
        var platform = targetWindow.navigator && targetWindow.navigator.platform || '';

        targetElement && targetElement !== null || (targetElement = targetWindow.document);
        targetPlatform && targetPlatform !== null || (targetPlatform = platform);
        targetUserAgent && targetUserAgent !== null || (targetUserAgent = userAgent);

        this._isModernBrowser = !!targetWindow.addEventListener;
        this._targetKeyDownBinding = function (event) {
          _this.pressKey(event.keyCode, event);
        };
        this._targetKeyUpBinding = function (event) {
          _this.releaseKey(event.keyCode, event);
        };
        this._targetResetBinding = function (event) {
          _this.releaseAllKeys(event);
        };

        this._bindEvent(targetElement, 'keydown', this._targetKeyDownBinding);
        this._bindEvent(targetElement, 'keyup', this._targetKeyUpBinding);
        this._bindEvent(targetWindow, 'focus', this._targetResetBinding);
        this._bindEvent(targetWindow, 'blur', this._targetResetBinding);

        this._targetElement = targetElement;
        this._targetWindow = targetWindow;
        this._targetPlatform = targetPlatform;
        this._targetUserAgent = targetUserAgent;
      };

      Keyboard.prototype.stop = function () {
        var _this = this;

        if (!this._targetElement || !this._targetWindow) {
          return;
        }

        this._unbindEvent(this._targetElement, 'keydown', this._targetKeyDownBinding);
        this._unbindEvent(this._targetElement, 'keyup', this._targetKeyUpBinding);
        this._unbindEvent(this._targetWindow, 'focus', this._targetResetBinding);
        this._unbindEvent(this._targetWindow, 'blur', this._targetResetBinding);

        this._targetWindow = null;
        this._targetElement = null;
      };

      Keyboard.prototype.pressKey = function (keyCode, event) {
        if (this._paused) {
          return;
        }
        if (!this._locale) {
          throw new Error('Locale not set');
        }

        this._locale.pressKey(keyCode);
        this._applyBindings(event);
      };

      Keyboard.prototype.releaseKey = function (keyCode, event) {
        if (this._paused) {
          return;
        }
        if (!this._locale) {
          throw new Error('Locale not set');
        }

        this._locale.releaseKey(keyCode);
        this._clearBindings(event);
      };

      Keyboard.prototype.releaseAllKeys = function (event) {
        if (this._paused) {
          return;
        }
        if (!this._locale) {
          throw new Error('Locale not set');
        }

        this._locale.pressedKeys.length = 0;
        this._clearBindings(event);
      };

      Keyboard.prototype.pause = function () {
        if (this._paused) {
          return;
        }
        if (this._locale) {
          this.releaseAllKeys();
        }
        this._paused = true;
      };

      Keyboard.prototype.resume = function () {
        this._paused = false;
      };

      Keyboard.prototype.reset = function () {
        this.releaseAllKeys();
        this._listeners.length = 0;
      };

      Keyboard.prototype._bindEvent = function (targetElement, eventName, handler) {
        return this._isModernBrowser ? targetElement.addEventListener(eventName, handler, false) : targetElement.attachEvent('on' + eventName, handler);
      };

      Keyboard.prototype._unbindEvent = function (targetElement, eventName, handler) {
        return this._isModernBrowser ? targetElement.removeEventListener(eventName, handler, false) : targetElement.detachEvent('on' + eventName, handler);
      };

      Keyboard.prototype._getGroupedListeners = function () {
        var listenerGroups = [];
        var listenerGroupMap = [];

        var listeners = this._listeners;
        if (this._currentContext !== 'global') {
          listeners = [].concat(listeners, this._contexts.global);
        }

        listeners.sort(function (a, b) {
          return a.keyCombo.keyNames.length < b.keyCombo.keyNames.length;
        }).forEach(function (l) {
          var mapIndex = -1;
          for (var i = 0; i < listenerGroupMap.length; i += 1) {
            if (listenerGroupMap[i].isEqual(l.keyCombo)) {
              mapIndex = i;
            }
          }
          if (mapIndex === -1) {
            mapIndex = listenerGroupMap.length;
            listenerGroupMap.push(l.keyCombo);
          }
          if (!listenerGroups[mapIndex]) {
            listenerGroups[mapIndex] = [];
          }
          listenerGroups[mapIndex].push(l);
        });
        return listenerGroups;
      };

      Keyboard.prototype._applyBindings = function (event) {
        var preventRepeat = false;

        event || (event = {});
        event.preventRepeat = function () {
          preventRepeat = true;
        };
        event.pressedKeys = this._locale.pressedKeys.slice(0);

        var pressedKeys = this._locale.pressedKeys.slice(0);
        var listenerGroups = this._getGroupedListeners();

        for (var i = 0; i < listenerGroups.length; i += 1) {
          var listeners = listenerGroups[i];
          var keyCombo = listeners[0].keyCombo;

          if (keyCombo === null || keyCombo.check(pressedKeys)) {
            for (var j = 0; j < listeners.length; j += 1) {
              var listener = listeners[j];
              var handler = listener.pressHandler;
              if (handler && !listener.preventRepeat) {
                handler.call(this, event);
                if (preventRepeat) {
                  listener.preventRepeat = preventRepeat;
                  preventRepeat = false;
                }
              }
              if (listener.releaseHandler) {
                var index = this._appliedListeners.indexOf(listener);
                if (index > -1 && keyCombo === null) {
                  listener.releaseHandler.call(this, event);
                  this._appliedListeners.splice(index, 1);
                  index = -1;
                }
                if (index === -1) {
                  this._appliedListeners.push(listener);
                }
              }
            }
            if (keyCombo) {
              for (var j = 0; j < keyCombo.keyNames.length; j += 1) {
                var index = pressedKeys.indexOf(keyCombo.keyNames[j]);
                if (index !== -1) {
                  pressedKeys.splice(index, 1);
                  j -= 1;
                }
              }
            }
          }
        }
      };

      Keyboard.prototype._clearBindings = function (event) {
        event || (event = {});

        for (var i = 0; i < this._appliedListeners.length; i += 1) {
          var listener = this._appliedListeners[i];
          var keyCombo = listener.keyCombo;
          var handler = listener.releaseHandler;
          if (keyCombo === null || !keyCombo.check(this._locale.pressedKeys)) {
            listener.preventRepeat = listener.preventRepeatByDefault;
            handler.call(this, event);
            this._appliedListeners.splice(i, 1);
            i -= 1;
          }
        }
      };

      module.exports = Keyboard;
    }).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
  }, { "./key-combo": 2, "./locale": 4 }], 4: [function (require, module, exports) {

    var KeyCombo = require('./key-combo');

    function Locale(name) {
      this.localeName = name;
      this.pressedKeys = [];
      this._appliedMacros = [];
      this._keyMap = {};
      this._killKeyCodes = [];
      this._macros = [];
    }

    Locale.prototype.bindKeyCode = function (keyCode, keyNames) {
      if (typeof keyNames === 'string') {
        keyNames = [keyNames];
      }

      this._keyMap[keyCode] = keyNames;
    };

    Locale.prototype.bindMacro = function (keyComboStr, keyNames) {
      if (typeof keyNames === 'string') {
        keyNames = [keyNames];
      }

      var handler = null;
      if (typeof keyNames === 'function') {
        handler = keyNames;
        keyNames = null;
      }

      var macro = {
        keyCombo: new KeyCombo(keyComboStr),
        keyNames: keyNames,
        handler: handler
      };

      this._macros.push(macro);
    };

    Locale.prototype.getKeyCodes = function (keyName) {
      var keyCodes = [];
      for (var keyCode in this._keyMap) {
        var index = this._keyMap[keyCode].indexOf(keyName);
        if (index > -1) {
          keyCodes.push(keyCode | 0);
        }
      }
      return keyCodes;
    };

    Locale.prototype.getKeyNames = function (keyCode) {
      return this._keyMap[keyCode] || [];
    };

    Locale.prototype.setKillKey = function (keyCode) {
      if (typeof keyCode === 'string') {
        var keyCodes = this.getKeyCodes(keyCode);
        for (var i = 0; i < keyCodes.length; i += 1) {
          this.setKillKey(keyCodes[i]);
        }
        return;
      }

      this._killKeyCodes.push(keyCode);
    };

    Locale.prototype.pressKey = function (keyCode) {
      if (typeof keyCode === 'string') {
        var keyCodes = this.getKeyCodes(keyCode);
        for (var i = 0; i < keyCodes.length; i += 1) {
          this.pressKey(keyCodes[i]);
        }
        return;
      }

      var keyNames = this.getKeyNames(keyCode);
      for (var i = 0; i < keyNames.length; i += 1) {
        if (this.pressedKeys.indexOf(keyNames[i]) === -1) {
          this.pressedKeys.push(keyNames[i]);
        }
      }

      this._applyMacros();
    };

    Locale.prototype.releaseKey = function (keyCode) {
      if (typeof keyCode === 'string') {
        var keyCodes = this.getKeyCodes(keyCode);
        for (var i = 0; i < keyCodes.length; i += 1) {
          this.releaseKey(keyCodes[i]);
        }
      } else {
        var keyNames = this.getKeyNames(keyCode);
        var killKeyCodeIndex = this._killKeyCodes.indexOf(keyCode);

        if (killKeyCodeIndex > -1) {
          this.pressedKeys.length = 0;
        } else {
          for (var i = 0; i < keyNames.length; i += 1) {
            var index = this.pressedKeys.indexOf(keyNames[i]);
            if (index > -1) {
              this.pressedKeys.splice(index, 1);
            }
          }
        }

        this._clearMacros();
      }
    };

    Locale.prototype._applyMacros = function () {
      var macros = this._macros.slice(0);
      for (var i = 0; i < macros.length; i += 1) {
        var macro = macros[i];
        if (macro.keyCombo.check(this.pressedKeys)) {
          if (macro.handler) {
            macro.keyNames = macro.handler(this.pressedKeys);
          }
          for (var j = 0; j < macro.keyNames.length; j += 1) {
            if (this.pressedKeys.indexOf(macro.keyNames[j]) === -1) {
              this.pressedKeys.push(macro.keyNames[j]);
            }
          }
          this._appliedMacros.push(macro);
        }
      }
    };

    Locale.prototype._clearMacros = function () {
      for (var i = 0; i < this._appliedMacros.length; i += 1) {
        var macro = this._appliedMacros[i];
        if (!macro.keyCombo.check(this.pressedKeys)) {
          for (var j = 0; j < macro.keyNames.length; j += 1) {
            var index = this.pressedKeys.indexOf(macro.keyNames[j]);
            if (index > -1) {
              this.pressedKeys.splice(index, 1);
            }
          }
          if (macro.handler) {
            macro.keyNames = null;
          }
          this._appliedMacros.splice(i, 1);
          i -= 1;
        }
      }
    };

    module.exports = Locale;
  }, { "./key-combo": 2 }], 5: [function (require, module, exports) {

    module.exports = function (locale, platform, userAgent) {

      // general
      locale.bindKeyCode(3, ['cancel']);
      locale.bindKeyCode(8, ['backspace']);
      locale.bindKeyCode(9, ['tab']);
      locale.bindKeyCode(12, ['clear']);
      locale.bindKeyCode(13, ['enter']);
      locale.bindKeyCode(16, ['shift']);
      locale.bindKeyCode(17, ['ctrl']);
      locale.bindKeyCode(18, ['alt', 'menu']);
      locale.bindKeyCode(19, ['pause', 'break']);
      locale.bindKeyCode(20, ['capslock']);
      locale.bindKeyCode(27, ['escape', 'esc']);
      locale.bindKeyCode(32, ['space', 'spacebar']);
      locale.bindKeyCode(33, ['pageup']);
      locale.bindKeyCode(34, ['pagedown']);
      locale.bindKeyCode(35, ['end']);
      locale.bindKeyCode(36, ['home']);
      locale.bindKeyCode(37, ['left']);
      locale.bindKeyCode(38, ['up']);
      locale.bindKeyCode(39, ['right']);
      locale.bindKeyCode(40, ['down']);
      locale.bindKeyCode(41, ['select']);
      locale.bindKeyCode(42, ['printscreen']);
      locale.bindKeyCode(43, ['execute']);
      locale.bindKeyCode(44, ['snapshot']);
      locale.bindKeyCode(45, ['insert', 'ins']);
      locale.bindKeyCode(46, ['delete', 'del']);
      locale.bindKeyCode(47, ['help']);
      locale.bindKeyCode(145, ['scrolllock', 'scroll']);
      locale.bindKeyCode(187, ['equal', 'equalsign', '=']);
      locale.bindKeyCode(188, ['comma', ',']);
      locale.bindKeyCode(190, ['period', '.']);
      locale.bindKeyCode(191, ['slash', 'forwardslash', '/']);
      locale.bindKeyCode(192, ['graveaccent', '`']);
      locale.bindKeyCode(219, ['openbracket', '[']);
      locale.bindKeyCode(220, ['backslash', '\\']);
      locale.bindKeyCode(221, ['closebracket', ']']);
      locale.bindKeyCode(222, ['apostrophe', '\'']);

      // 0-9
      locale.bindKeyCode(48, ['zero', '0']);
      locale.bindKeyCode(49, ['one', '1']);
      locale.bindKeyCode(50, ['two', '2']);
      locale.bindKeyCode(51, ['three', '3']);
      locale.bindKeyCode(52, ['four', '4']);
      locale.bindKeyCode(53, ['five', '5']);
      locale.bindKeyCode(54, ['six', '6']);
      locale.bindKeyCode(55, ['seven', '7']);
      locale.bindKeyCode(56, ['eight', '8']);
      locale.bindKeyCode(57, ['nine', '9']);

      // numpad
      locale.bindKeyCode(96, ['numzero', 'num0']);
      locale.bindKeyCode(97, ['numone', 'num1']);
      locale.bindKeyCode(98, ['numtwo', 'num2']);
      locale.bindKeyCode(99, ['numthree', 'num3']);
      locale.bindKeyCode(100, ['numfour', 'num4']);
      locale.bindKeyCode(101, ['numfive', 'num5']);
      locale.bindKeyCode(102, ['numsix', 'num6']);
      locale.bindKeyCode(103, ['numseven', 'num7']);
      locale.bindKeyCode(104, ['numeight', 'num8']);
      locale.bindKeyCode(105, ['numnine', 'num9']);
      locale.bindKeyCode(106, ['nummultiply', 'num*']);
      locale.bindKeyCode(107, ['numadd', 'num+']);
      locale.bindKeyCode(108, ['numenter']);
      locale.bindKeyCode(109, ['numsubtract', 'num-']);
      locale.bindKeyCode(110, ['numdecimal', 'num.']);
      locale.bindKeyCode(111, ['numdivide', 'num/']);
      locale.bindKeyCode(144, ['numlock', 'num']);

      // function keys
      locale.bindKeyCode(112, ['f1']);
      locale.bindKeyCode(113, ['f2']);
      locale.bindKeyCode(114, ['f3']);
      locale.bindKeyCode(115, ['f4']);
      locale.bindKeyCode(116, ['f5']);
      locale.bindKeyCode(117, ['f6']);
      locale.bindKeyCode(118, ['f7']);
      locale.bindKeyCode(119, ['f8']);
      locale.bindKeyCode(120, ['f9']);
      locale.bindKeyCode(121, ['f10']);
      locale.bindKeyCode(122, ['f11']);
      locale.bindKeyCode(123, ['f12']);

      // secondary key symbols
      locale.bindMacro('shift + `', ['tilde', '~']);
      locale.bindMacro('shift + 1', ['exclamation', 'exclamationpoint', '!']);
      locale.bindMacro('shift + 2', ['at', '@']);
      locale.bindMacro('shift + 3', ['number', '#']);
      locale.bindMacro('shift + 4', ['dollar', 'dollars', 'dollarsign', '$']);
      locale.bindMacro('shift + 5', ['percent', '%']);
      locale.bindMacro('shift + 6', ['caret', '^']);
      locale.bindMacro('shift + 7', ['ampersand', 'and', '&']);
      locale.bindMacro('shift + 8', ['asterisk', '*']);
      locale.bindMacro('shift + 9', ['openparen', '(']);
      locale.bindMacro('shift + 0', ['closeparen', ')']);
      locale.bindMacro('shift + -', ['underscore', '_']);
      locale.bindMacro('shift + =', ['plus', '+']);
      locale.bindMacro('shift + [', ['opencurlybrace', 'opencurlybracket', '{']);
      locale.bindMacro('shift + ]', ['closecurlybrace', 'closecurlybracket', '}']);
      locale.bindMacro('shift + \\', ['verticalbar', '|']);
      locale.bindMacro('shift + ;', ['colon', ':']);
      locale.bindMacro('shift + \'', ['quotationmark', '\'']);
      locale.bindMacro('shift + !,', ['openanglebracket', '<']);
      locale.bindMacro('shift + .', ['closeanglebracket', '>']);
      locale.bindMacro('shift + /', ['questionmark', '?']);

      //a-z and A-Z
      for (var keyCode = 65; keyCode <= 90; keyCode += 1) {
        var keyName = String.fromCharCode(keyCode + 32);
        var capitalKeyName = String.fromCharCode(keyCode);
        locale.bindKeyCode(keyCode, keyName);
        locale.bindMacro('shift + ' + keyName, capitalKeyName);
        locale.bindMacro('capslock + ' + keyName, capitalKeyName);
      }

      // browser caveats
      var semicolonKeyCode = userAgent.match('Firefox') ? 59 : 186;
      var dashKeyCode = userAgent.match('Firefox') ? 173 : 189;
      var leftCommandKeyCode;
      var rightCommandKeyCode;
      if (platform.match('Mac') && (userAgent.match('Safari') || userAgent.match('Chrome'))) {
        leftCommandKeyCode = 91;
        rightCommandKeyCode = 93;
      } else if (platform.match('Mac') && userAgent.match('Opera')) {
        leftCommandKeyCode = 17;
        rightCommandKeyCode = 17;
      } else if (platform.match('Mac') && userAgent.match('Firefox')) {
        leftCommandKeyCode = 224;
        rightCommandKeyCode = 224;
      }
      locale.bindKeyCode(semicolonKeyCode, ['semicolon', ';']);
      locale.bindKeyCode(dashKeyCode, ['dash', '-']);
      locale.bindKeyCode(leftCommandKeyCode, ['command', 'windows', 'win', 'super', 'leftcommand', 'leftwindows', 'leftwin', 'leftsuper']);
      locale.bindKeyCode(rightCommandKeyCode, ['command', 'windows', 'win', 'super', 'rightcommand', 'rightwindows', 'rightwin', 'rightsuper']);

      // kill keys
      locale.setKillKey('command');
    };
  }, {}], 6: [function (require, module, exports) {
    'use strict';

    var keyboardjs = require('keyboardjs');

    ;(function ($, window, document, localstorage, keyboardjs, undefined) {

      var main = {

        cache: function cache() {
          this.$window = $(window);
          this.$document = $(document);
          this.$text = $('#text');
          this.$tabs = $('#tabs');
          this.$add = $('#add');
          this.$remove = $('#remove');
          this.$activeTab = {};
        },

        bindEvents: function bindEvents() {
          var _this2 = this;

          // Track and save content.
          this.$document.on('keyup', '#text', function () {
            var state, key, text;
            state = _this2.getState();
            key = _this2.getActiveKey();
            text = _this2.getText();
            state[key].text = text;
            _this2.setState(state);
            _this2.setTabName(_this2.$activeTab, text);
          });

          // Prevent g14 open in another window from overriding content. Sync windows.
          this.$window.on('storage', function (content) {
            _this2.$tabs.html('');
            _this2.$text.val('');
            _this2.init(false);
          });

          // Listen for new tab click.
          this.$add.on('click', function (e) {
            // Add tab to DOM
            _this2.addTab();
            _this2.focusOnText();
          });

          // Listen for remove tab click.
          this.$remove.on('click', function (e) {
            if (_this2.confirmTabRemoval()) {
              _this2.removeTab();
            }
          });

          // Listen for change tab events.
          this.$tabs.on('click', 'li', function (e, target) {
            var $tab = $(e.target);
            _this2.changeTab($tab);
          });

          // Switch tab right.
          keyboardjs.bind('command+right', function (e) {
            var state, key, $tab;
            e.preventDefault();
            state = _this2.getState();
            key = _this2.getAdjacentTabKey(state, true);
            $tab = _this2.getTabElementByKey(key);
            _this2.changeTab($tab);
          });

          // Switch tab left.
          keyboardjs.bind('command+left', function (e) {
            var state, key, $tab;
            e.preventDefault();
            state = _this2.getState();
            key = _this2.getAdjacentTabKey(state, false);
            $tab = _this2.getTabElementByKey(key);
            _this2.changeTab($tab);
          });

          // Remove tab.
          keyboardjs.bind('command+d', function (e) {
            e.preventDefault();
            if (_this2.confirmTabRemoval()) {
              _this2.removeTab();
              _this2.focusOnText();
            }
          });

          // Add tab.
          keyboardjs.bind('command+e', function (e) {
            e.preventDefault();
            _this2.addTab();
            _this2.focusOnText();
          });
        },

        focusOnText: function focusOnText() {
          this.$text.focus();
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

        // @todo this method does too much.
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

        confirmTabRemoval: function confirmTabRemoval() {
          var state, confirmed, activeKey;
          state = this.getState();
          activeKey = this.getActiveKey(state);
          // Don't delete the only tab.
          if (Object.keys(state).length <= 1) {
            return false;
          }
          // Don't ask for confirmation if there is no content.
          return state[activeKey].text ? confirm('You sure bro?') : true;
        },

        // @todo this method does too much.
        removeTab: function removeTab() {
          var key, state, newKey;
          key = this.getActiveKey();
          state = this.getState();
          delete state[key];
          var newKey = Object.keys(state).reduce(function (prev, current) {
            return current > prev ? current : prev;
          }, '0');
          state[newKey].active = true;
          this.setState(state);
          this.removeTabFromDOM(key);
          this.changeActiveTab(newKey);
          this.insertText(state[newKey].text);
          this.cacheActiveTab();
        },

        // Set next to false to get the previous key.
        // Will return the first tab if nexted on the last tab.
        // Will return the last tab if prev on the first tab.
        getAdjacentTabKey: function getAdjacentTabKey() {
          var state = arguments.length <= 0 || arguments[0] === undefined ? this.getState() : arguments[0];
          var next = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

          var sorted, keys, nextKey, index;
          keys = Object.keys(state);
          sorted = next ? this.sortArray(keys) : this.sortArray(keys).reverse();
          var index;
          keys.forEach(function (key, i) {
            if (state[key].active) {
              index = i;
            }
          });
          nextKey = index + 1 == keys.length ? sorted[0] : sorted.slice(index + 1, index + 2);
          return nextKey;
        },

        appendTabsToDOM: function appendTabsToDOM(obj) {
          var _this3 = this;

          Object.keys(obj).forEach(function (key) {
            var html = obj[key].active ? '<li class="tab active" data-tab-id="' + key + '"></li>' : '<li class="tab" data-tab-id="' + key + '"></li>';
            _this3.$tabs.append(html);
          });
          return this;
        },

        removeTabFromDOM: function removeTabFromDOM(key) {
          this.getTabElementByKey(key).remove();
          return this;
        },

        setTabName: function setTabName($tab, text) {
          var tabName = text.split('\n').filter(Boolean).filter(function (val) {
            return val.trim();
          }).shift();
          tabName = tabName ? tabName.slice(0, 25) : '...';
          $tab.text(tabName);
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
          return this.$text.val();
        },

        insertText: function insertText(content) {
          this.$text.val(content);
          return this;
        },

        setState: function setState(state) {
          var key = arguments.length <= 1 || arguments[1] === undefined ? 'content' : arguments[1];

          var stringedState;
          try {
            stringedState = JSON.stringify(state);
            localStorage.setItem(key, stringedState);
          } catch (err) {
            alert('Something went down when trying to save your stuff');
            console.log(err);
          }
          return this;
        },

        getState: function getState() {
          var key = arguments.length <= 0 || arguments[0] === undefined ? 'content' : arguments[0];

          var state;
          try {
            state = localStorage.getItem(key);
            return JSON.parse(state);
          } catch (err) {
            alert('Something went down when trying to get your stuff');
            console.log(err);
          }
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

        // Returns state for a new/blank tab.
        getDefaultState: function getDefaultState() {
          var state = {};
          state[Date.now()] = { text: '', active: true };
          return state;
        },

        // Select tab from DOM. return jQuery element
        getTabElementByKey: function getTabElementByKey(key) {
          return this.$tabs.find('[data-tab-id="' + key + '"]');
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

        // Sort numbers asc order.
        sortArray: function sortArray(obj) {
          return obj.sort(function (a, b) {
            return a > b ? 1 : a < b ? -1 : 0;
          });
        },

        // Main method.
        init: function init() {
          var _this4 = this;

          var bindEvents = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

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
            _this4.setTabName($el, state[key].text);
          });

          this.cacheActiveTab();
          if (bindEvents) {
            this.bindEvents();
          }
          text = this.getActiveState().text;
          this.insertText(text);
        }

      };

      $(document).ready(function () {
        main.init();
      });
    })(jQuery, window, document, localStorage, keyboardjs);
  }, { "keyboardjs": 1 }] }, {}, [6]);