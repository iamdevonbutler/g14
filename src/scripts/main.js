'use strict';

var localstorage = require('local-storage');
var keyboardjs = require('keyboardjs');

;(function($, window, document, localstorage, keyboardjs, undefined) {

  var main = {

    cache() {
      this.$document = $(document);
      this.$content = $('#content');
      this.$tabs = $('#tabs');
      this.$add = $('#add');
      this.$remove = $('#remove');
      this.$activeTab = {};
    },

    bindEvents() {
      // Track and save content.
      this.$document.on('keyup', '#content', () => {
        var state, key, text;
        state = this.getState();
        key = this.getActiveKey();
        text = this.getText();
        state[key].text = text;
        this.setState(state);
        this.setTabName(this.$activeTab, text);
      });
      // Prevent g14 open in another window from overriding content. Sync windows.
      localstorage.on('content', content => {
        this.$tabs.html('');
        this.$content.val('');
        this.init(false);
      });

      // Listen for new tab click.
      this.$add.on('click', (e) => {
        // Add tab to DOM
        this.addTab();
      });

      // Listen for remove tab click.
      this.$remove.on('click', (e) => {
        if (this.confirmTabRemoval()) {
          this.removeTab();
        }
      });

      // Listen for change tab events.
      this.$tabs.on('click', 'li', (e, target) => {
        var $tab = $(e.target);
        this.changeTab($tab);
      });

      // Switch tab right.
      keyboardjs.bind('command+right', (e) => {
        var state, key, $tab;
        e.preventDefault();
        state = this.getState();
        key = this.getAdjacentTabKey(state, false);
        $tab = this.getTabElementByKey(key);
        this.changeTab($tab);
      });

      // Switch tab left.
      keyboardjs.bind('command+left', (e) => {
        var state, key, $tab;
        e.preventDefault();
        state = this.getState();
        key = this.getAdjacentTabKey(state, false);
        $tab = this.getTabElementByKey(key);
        this.changeTab($tab);
      });

      // Remove tab.
      keyboardjs.bind('command+d', (e) => {
        e.preventDefault();
        if (this.confirmTabRemoval()) {
          this.removeTab();
        }
      });

      // Add tab.
      keyboardjs.bind('command+e', (e) => {
        e.preventDefault();
        this.addTab();
      });

    },

    changeTab($tab) {
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

    addTab() {
      var state, newState, newStateKey,text;
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

    confirmTabRemoval() {
      var state, confirmed, activeKey;
      state = this.getState();
      activeKey = this.getActiveKey(state)
      // Don't delete the only tab.
      if (Object.keys(state).length <= 1) {
        return;
      }
      // Don't ask for confirmation if there is no content.
      return state[activeKey].text ? confirm('You sure bro?') : true;
    },

    removeTab() {
      var key, state, newKey;
      key = this.getActiveKey();
      state = this.getState();
      delete state[key];
      var newKey = Object.keys(state).reduce((prev, current) => {
        return current > prev ? current : prev;
      }, '0');
      state[newKey].active = true;
      this.setState(state);
      this.removeTabFromDOM(key);
      this.changeActiveTab(newKey);
      this.insertText(state[newKey].text);
      this.cacheActiveTab();
    },

    // Will return the first tab if nexted on the last tab.
    // Will return the last tab if prev on the first tab.
    getAdjacentTabKey(state, next = true) {
      var sorted, keys, nextKey, index;
      keys = Object.keys(state);
      sorted = next ? this.sortArray(keys) : this.sortArray(keys).reverse();

      var index;
      keys.forEach((key,i) => {
        if (state[key].active) {
          index = i;
        }
      });
      nextKey = index+1 == keys.length ? sorted[0] : sorted.slice(index+1, index+2);
      return nextKey;
    },

    appendTabsToDOM(obj) {
      Object.keys(obj).forEach((key) => {
        var html = (obj[key].active)
          ? '<li class="tab active" data-tab-id="'+key+'"></li>'
          : '<li class="tab" data-tab-id="'+key+'"></li>';
        this.$tabs.append(html);
      });
      return this;
    },

    removeTabFromDOM(key) {
      this.getTabElementByKey(key).remove();
      return this;
    },

    setTabName($tab, text) {
      var tabName = text.split('\n')
        .filter(Boolean)
        .filter(val => val.trim())
        .shift();
      tabName = tabName ? tabName.slice(0,13) : '...';
      $tab.text(tabName);
    },

    cacheActiveTab($obj) {
      if (!$obj) {
        this.$activeTab = $('#tabs .tab.active');
      }
      else {
        this.$activeTab = $obj;
      }
      return this;
    },

    changeActiveTab(key) {
      this.$tabs
        .find('.tab')
        .removeClass('active')
        .filter('[data-tab-id="'+key+'"]')
        .addClass('active');
      return this;
    },

    getText() {
      return this.$content.val();
    },

    insertText(content) {
      this.$content.val(content);
      return this;
    },

    setState(state, key = 'content') {
      localstorage.set(key, state);
      return this;
    },

    getState(key = 'content') {
      return localstorage.get(key);
    },

    getActiveState(state = this.getState()) {
      var key = this.getActiveKey(state);
      return state[key];
    },

    getActiveKey(state = this.getState()) {
      var activeKey = {};
      Object.keys(state).forEach((key) => {
        if (state[key].active) {
          activeKey = key;
        }
      });
      return activeKey;
    },

    getDefaultState() {
      var state = {};
      state[Date.now()] = { text: '', active: true };
      return state;
    },

    getTabElementByKey(key) {
      return this.$tabs.find('[data-tab-id="'+key+'"]')
    },

    replaceObjValues(obj, field, value) {
      // Not by ref.
      var o = {}, clone;
      clone = $.extend({}, obj);
      Object.keys(clone).forEach((key) => {
        clone[key][field] = value;
      });
      return clone;
    },

    sortArray(obj) {
      return obj.sort(function (a, b) {
         return a > b ? 1 : a < b ? -1 : 0;
      });
    },

    init(bindEvents = true) {
      var text, content, state, $el, key;
      this.cache();

      state = this.getState();
      if (!state)  {
        state = this.getDefaultState();
        this.setState(state);
      }

      // Modify DOM.
      this.appendTabsToDOM(state);
      this.$tabs.find('.tab').each((i, el) => {
        $el = $(el);
        key = $el.attr('data-tab-id');
        this.setTabName($el, state[key].text);
      });

      this.cacheActiveTab();
      if (bindEvents) {
        this.bindEvents();
      }
      text = this.getActiveState().text;
      this.insertText(text);
    }

  };

  $(document).ready(() => {
    main.init();
  });

})(jQuery, window, document, localstorage, keyboardjs);
