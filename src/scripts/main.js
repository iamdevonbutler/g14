'use strict';

var keyboardjs = require('keyboardjs');

;(function($, window, document, localstorage, Modernizr, Sortable, keyboardjs, undefined) {

  var main = {

    cache() {
      this.$window = $(window);
      this.$document = $(document);
      this.$text = $('#text');
      this.$tabs = $('#tabs');
      this.$add = $('#add');
      this.$remove = $('#remove');
      this.$activeTab = {};
    },

    bindEvents() {
      // Track and save content.
      this.$document.on('keyup', '#text', () => {
        var state, key, text;
        state = this.getState();
        key = this.getActiveIndex();
        text = this.getText();
        state[key].text = text;
        this.setState(state);
        this.setTabName(this.$activeTab, text);
      });

      // Prevent g14 open in another window from overriding content. Sync windows.
      this.$window.on('storage', content => {
        this.$tabs.html('');
        this.$text.val('');
        this.init(false);
      });

      // Listen for new tab click.
      this.$add.on('click', (e) => {
        // Add tab to DOM
        this.addTab();
        this.focusOnText();
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
        var state, index, $tab;
        e.preventDefault();
        state = this.getState();
        index = this.getAdjacentTabIndex(state, true);
        $tab = this.getTabElementByIndex(index);
        this.changeTab($tab);
      });

      // Switch tab left.
      keyboardjs.bind('command+left', (e) => {
        var state, index, $tab;
        e.preventDefault();
        state = this.getState();
        index = this.getAdjacentTabIndex(state, false);
        $tab = this.getTabElementByIndex(index);
        this.changeTab($tab);
      });

      // Remove tab.
      keyboardjs.bind('command+d', (e) => {
        e.preventDefault();
        if (this.confirmTabRemoval()) {
          this.removeTab();
          this.focusOnText();
        }
      });

      // Add tab.
      keyboardjs.bind('command+e', (e) => {
        e.preventDefault();
        this.addTab();
        this.focusOnText();
      });

    },

    focusOnText() {
      this.$text.focus();
    },

    changeTab($tab) {
      var index, newIndex, state;
      index = this.getActiveIndex();
      newIndex = $tab.attr('data-tab-order');
      if (index != newIndex) {
        state = this.getState();
        state = this.changeObjInArrayValue(state, 'active', false);
        state[newIndex].active = true;
        this.setState(state);
        this.updateActiveTabDOMAttr(newIndex);
        this.insertText(state[newIndex].text);
        this.cacheActiveTab($tab);
      }
    },

    // @todo this method does too much.
    addTab() {
      var state, newState, newStateIndex, text;
      state = this.getState();
      newState = this.getDefaultState()[0]; // Array /w obj.
      newStateIndex = state.length;
      state = this.changeObjInArrayValue(state, 'active', false);
      state.push(newState);
      text = newState.text;
      this.setState(state);
      this.appendTabsToDOM([newState], newStateIndex);
      this.updateActiveTabDOMAttr(newStateIndex);
      this.cacheActiveTab();
      this.insertText(text);
      this.setTabName(this.$activeTab, text);
    },

    confirmTabRemoval() {
      var state, confirmed, activeIndex;
      state = this.getState();
      activeIndex = this.getActiveIndex(state);
      // Don't delete the only tab.
      if (state.length <= 1) {
        return false;
      }
      // Don't ask for confirmation if there is no content.
      return state[activeIndex].text ? confirm('You sure bro?') : true;
    },

    // @todo this method does too much.
    removeTab() {
      var index, state, newIndex;
      index = this.getActiveIndex();
      state = this.getState();
      state.splice(index, 1);
      newIndex = state.length == index ? index - 1 : index;
      state[newIndex].active = true;
      this.setState(state);
      this.removeTabFromDOM(index);
      this.updateTabIndexInDOM();
      this.updateActiveTabDOMAttr(newIndex);
      this.insertText(state[newIndex].text);
      this.cacheActiveTab();
    },

    updateTabIndexInDOM() {
      this.$tabs.find('.tab').each((index, el) => {
        $(el).attr('data-tab-order', index);
      });
    },

    // Set next to false to get the previous key.
    // Will return the first tab if nexted on the last tab.
    // Will return the last tab if prev on the first tab.
    getAdjacentTabIndex(state = this.getState(), next) {
      var index = this.getActiveIndex(state);

      if (next) {
        return index + 1 == state.length ? 0 : index + 1;
      }
      else {
        return index == 0 ? state.length - 1 : index - 1;
      }
    },

    appendTabsToDOM(state, pos) {
      state.forEach((obj, index) => {
        var html = (obj.active)
          ? '<li class="tab active" data-tab-order="'+(pos||index)+'"></li>'
          : '<li class="tab" data-tab-order="'+(pos||index)+'"></li>';
        this.$tabs.append(html);
      });
      return this;
    },

    removeTabFromDOM(index) {
      this.getTabElementByIndex(index).remove();
      return this;
    },

    setTabName($tab, text) {
      var tabName = text.split('\n')
        .filter(Boolean)
        .filter(val => val.trim())
        .shift();
      tabName = tabName ? tabName.slice(0,25) : '...';
      $tab.text(tabName);
    },

    cacheActiveTab($obj = $('#tabs .tab.active')) {
      this.$activeTab = $obj;
      return this;
    },

    updateActiveTabDOMAttr(index) {
      this.$tabs
        .find('.tab')
        .removeClass('active')
        .filter('[data-tab-order="'+index+'"]')
        .addClass('active');
      return this;
    },

    getText() {
      return this.$text.val();
    },

    insertText(text) {
      this.$text.val(text);
      return this;
    },

    setState(state, key = 'content') {
      var stringedState;
      try {
        stringedState = JSON.stringify(state);
        localStorage.setItem(key, stringedState);
      }
      catch (err) {
        alert('Something went down when trying to save your stuff');
        console.log(err);
      }
      return this;
    },

    getState(key = 'content') {
      var state;
      try {
        state = localStorage.getItem(key);
        state = JSON.parse(state);
        // Normalize state from an object to array if exists.
        // For compatibility reasons.
        state = $.isPlainObject(state) ? this.normalizeLegacyState(state) : state;
        return state;
      }
      catch (err) {
        alert('Something went down when trying to get your stuff');
        console.log(err);
      }
    },

    getActiveState(state = this.getState()) {
      var index = this.getActiveIndex(state);
      return state[index];
    },

    getActiveIndex(state = this.getState()) {
      var activeIndex;
      state.forEach((obj, index) => {
        if (obj.active) {
          activeIndex = index;
        }
      });
      return activeIndex;
    },

    // Returns state for a new/blank tab.
    getDefaultState() {
      var state = [];
      state.push({ text: '', active: true });
      return state;
    },

    // Select tab from DOM. return jQuery element
    getTabElementByIndex(index) {
      return this.$tabs.find('[data-tab-order="'+index+'"]')
    },

    changeObjInArrayValue(array, field, value) {
      // Not by ref.
      var o = [], clone;
      clone = $.extend([], array);
      clone.forEach((obj, index) => {
        obj[field] = value;
      });
      return clone;
    },

    detectLocalStorage() {
      return !!Modernizr.localstorage;
    },

    initTabSorting() {
      Sortable.create(this.$tabs[0], {
        animation: 300,
        onUpdate: evt => {
          var right, state, array = [];
          this.updateTabIndexInDOM();
          state = this.getState();
          // If the item was moved to the right.
          state.forEach((obj, index) => {
            right = evt.newIndex > evt.oldIndex ? true : false;
            // Reorder item that was moved.
            if (evt.oldIndex == index) {
              array[evt.newIndex] = obj;
            }
            // Reorder item(s) that took moved items's place.
            // If the item was moved to the right.
            else if (right && evt.newIndex >= index &&  index > evt.oldIndex) {
              array[index - 1] = obj;
            }
            // If the item was moved to the left.
            else if (!right && evt.newIndex <= index && index < evt.oldIndex) {
              array[index + 1] = obj;
            }
            // If the item was not moved at all.
            else {
               array[index] = obj
            }
          });
          this.setState(array);
        },
      });
    },

    moveArrayItems(array, from, to) {
      array.splice(to, 0, array.splice(from, 1)[0]);
      return this;
    },

    normalizeLegacyState(obj) {
      var array = [];
      Object.keys(obj).forEach((key, index) => {
        array.push(obj[key]);
      });
      return array;
    },

    // Main method.
    init(bindEvents = true) {
      var text, content, state, $el, tabIndex;

      if (!this.detectLocalStorage()) {
        alert('Your browser does not support localStorage and thus cannot function in this application.');
        return false;
      }

      // Cache DOM elements.
      this.cache();

      // Get state or set default state.
      state = this.getState();

      if (!state)  {
        state = this.getDefaultState();
        this.setState(state);
      }

      // Modify DOM w/ tabs.
      this.appendTabsToDOM(state);
      // Set tabnames.
      this.$tabs.find('.tab').each((i, el) => {
        $el = $(el);
        tabIndex = $el.attr('data-tab-order');
        this.setTabName($el, state[tabIndex].text);
      });
      this.initTabSorting();

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

})(jQuery, window, document, localStorage, Modernizr, Sortable, keyboardjs);
