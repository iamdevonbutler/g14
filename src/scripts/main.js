'use strict';

var localstorage = require('local-storage');

;(function($, window, document, localstorage, undefined) {

  var main = {

    cache() {
      this.$content = $('#content');
      this.state = '';
    },

    bindEvents() {
      // Track and save content.
      this.$content.on('keyup', () => {
        var content = this.getContent();
        this.setState(content);
        this.setContent(content);
      });
      // Prevent multiple tabs from overriding content.
      localstorage.on('content', content => {
        this.setState(content);
        this.setContent(content);
      });
    },

    getContent() {
      return this.$content.val();
    },

    setContent(content) {
      this.$content.val(content);
      return this;
    },

    setState(content) {
      localstorage.set('content', content);
      this.state = content;
      return this;
    },

    getState() {
      return localstorage.get('content');
    },

    restoreState() {
      var content = this.getState();
      if (content) {
        this.setContent(content);
      }
    },

    init() {
      this.cache();
      this.bindEvents();
      this.restoreState();
    }

  };


  $(document).ready(() => {
    main.init();
  });

})(jQuery, window, document, localstorage);
