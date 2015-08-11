'use strict';

var localstorage = require('local-storage');

;(function($, window, document, localstorage, undefined) {

  var main = {

    cache() {
      this.$document = $(document);
      this.$content = $('#content');
      this.$tabs = $('#tabs');
      this.$add = $('#add');
      this.$remove = $('#remove');
      this.$activeTab = {};
      this.state = {};
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
        // Update tab name.
        this.setTabName(this.$activeTab, text);

      });
      // Prevent g14 open in another window from overriding content. Sync windows.
      localstorage.on('content', content => {
        var activeTabKeys = [];
        var state = this.getState();
        var altKey = this.getActiveKey(content);
        var activeKey = this.getActiveKey();
        var text = content[altKey].text;
        var keys = Object.keys(content);

        // Add a tab.
        this.$tabs.find('.tab').each((i,el) => {
          var tid = $(el).attr('data-tab-id');
          activeTabKeys.push(tid);
        });
          //var diff = $(keys).not(activeTabKeys).get();
        if (keys.length > activeTabKeys.length) {
          this.appendTabsToDOM(this.getDefaultState());
        }

        // Remove a tab.
        if (keys.length < activeTabKeys.length) {
          console.log('remove tav')
          // this.removeTab();
        }

        // Update tab title.
        this.$tabs.find('.tab').each((i,el) => {
          var $el = $(el);
          var id = $el.attr('data-tab-id');
          this.setTabName($el, state[id].text);
        });

        // Update text if the other tab updated the same tab.
        if (activeKey == altKey) {
          this.insertText(text);
        }
      });

      // Listen for new tab click.
      this.$add.on('click', () => {
        // Add tab to DOM
        this.addTab();
      });

      // Listen for remove tab click.
      this.$remove.on('click', () => {
        this.removeTab();
      });

      // Listen for change tab events.
      this.$tabs.on('click', 'li', (e, target) => {
        var $tab = $(e.target);
        this.changeTab($tab);
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

    removeTab() {
      var key, state, newKey;
      key = this.getActiveKey();
      state = this.getState();
      if (Object.keys(state).length <= 1) {
        return;
      }
      delete state[key];
      var newKey = Object.keys(state).reduce((prev, current) => {
        return current > prev ? current : prev;
      }, '0');
      state[newKey].active = true;
      this.setState(state);
      this.removeTabFromDOM(key);
      this.changeActiveTab(newKey);
      this.cacheActiveTab();
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
      this.$tabs.find('.tab[data-tab-id="'+key+'"]').remove();
      return this;
    },

    setTabName($tab, text) {
      $tab.text(text.split('\n').shift().slice(0,15) || '...');
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

    replaceObjValues(obj, field, value) {
      // Not by ref.
      var o = {}, clone;
      clone = $.extend({}, obj);
      Object.keys(clone).forEach((key) => {
        clone[key][field] = value;
      });
      return clone;
    },

    init() {
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
      this.bindEvents();
      text = this.getActiveState().text;
      this.insertText(text);
    }

  };

  $(document).ready(() => {
    main.init();
  });

})(jQuery, window, document, localstorage);
