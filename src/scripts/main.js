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
      // Prevent g14 open in another tab from overriding content.
      localstorage.on('content', content => {
        var altActiveKey, activeKey;
        altActiveKey = this.getActiveKey(content);
        activeKey = this.getActiveKey();
        if (activeKey == altActiveKey) {
          this.insertText(content[altActiveKey].text);
        }
      });
      // Listen for new tab click.
      this.$add.on('click', () => {
        // Add tab to DOM
        var state, newState, newStateKey,text;
        state = this.getState();
        newState = this.getDefaultState();
        newStateKey = Object.keys(newState).toString();
        state = this.replaceObjValues(state, 'active', false);
        $.extend(state, newState);
        text = newState[newStateKey].text;
        this.setState(state);
        this.addTabs(newState);
        this.changeActiveTab(newStateKey);
        this.insertText(text);
        this.cacheActiveTab();
        this.setTabName(this.$activeTab, text);
      });
      // Listen for remove tab click.
      this.$remove.on('click', () => {
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
        this.removeTab(key);
        this.changeActiveTab(newKey);
        this.cacheActiveTab();
      });
      // Listen for change tab events.
      this.$tabs.on('click', 'li', (e, target) => {
        var $tab, activeKey, newActiveKey, state;
        $tab = $(e.target);
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
      });
    },

    addTabs(state = this.getState()) {
      Object.keys(state).forEach((key) => {
        var html = (state[key].active)
          ? '<li class="tab active" data-tab-id="'+key+'"></li>'
          : '<li class="tab" data-tab-id="'+key+'"></li>';
        this.$tabs.append(html);
      });
      return this;
    },

    setTabName($tab, text) {
      $tab.text(text.split('\n').shift().slice(0,15) || '...');
    },

    removeTab(key) {
      this.$tabs.find('.tab[data-tab-id="'+key+'"]').remove();
      return this;
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
      this.addTabs();
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
