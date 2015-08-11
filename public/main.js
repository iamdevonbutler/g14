"use strict";!function t(e,n,a){function i(c,s){if(!n[c]){if(!e[c]){var o="function"==typeof require&&require;if(!s&&o)return o(c,!0);if(r)return r(c,!0);throw new Error("Cannot find module '"+c+"'")}var u=n[c]={exports:{}};e[c][0].call(u.exports,function(t){var n=e[c][1][t];return i(n?n:t)},u,u.exports,t,e,n,a)}return n[c].exports}for(var r="function"==typeof require&&require,c=0;c<a.length;c++)i(a[c]);return i}({1:[function(t,e,n){(function(n){function a(t,e){return 1===arguments.length?i(t):r(t,e)}function i(t){return JSON.parse(f.getItem(t))}function r(t,e){try{return f.setItem(t,JSON.stringify(e)),!0}catch(n){return!1}}function c(t){return f.removeItem(t)}function s(){return f.clear()}var o=t("./stub"),u=t("./tracking"),f="localStorage"in n&&n.localStorage?n.localStorage:o;a.set=r,a.get=i,a.remove=c,a.clear=s,a.on=u.on,a.off=u.off,e.exports=a}).call(this,"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"./stub":2,"./tracking":3}],2:[function(t,e,n){function a(t){return t in s?s[t]:null}function i(t,e){return s[t]=e,!0}function r(t){var e=t in s;return e?delete s[t]:!1}function c(){return s={},!0}var s={};e.exports={getItem:a,setItem:i,removeItem:r,clear:c}},{}],3:[function(t,e,n){(function(t){function n(){t.addEventListener?t.addEventListener("storage",a,!1):t.attachEvent?t.attachEvent("onstorage",a):t.onstorage=a}function a(e){function n(t){t(JSON.parse(e.newValue),JSON.parse(e.oldValue),e.url||e.uri)}e||(e=t.event);var a=c[e.key];a&&a.forEach(n)}function i(t,e){c[t]?c[t].push(e):c[t]=[e],s===!1&&n()}function r(t,e){var n=c[t];n.length>1?n.splice(n.indexOf(e),1):c[t]=[]}var c={},s=!1;e.exports={on:i,off:r}}).call(this,"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],4:[function(t,e,n){var a=t("local-storage");!function(t,e,n,a,i){var r={cache:function(){this.$document=t(n),this.$content=t("#content"),this.$tabs=t("#tabs"),this.$add=t("#add"),this.$remove=t("#remove"),this.$activeTab={},this.state={}},bindEvents:function(){var e=this;this.$document.on("keyup","#content",function(){var t,n,a;t=e.getState(),n=e.getActiveKey(),a=e.getText(),t[n].text=a,e.setState(t),e.setTabName(e.$activeTab,a)}),a.on("content",function(t){var n,a;n=e.getActiveKey(t),a=e.getActiveKey(),a==n&&e.insertText(t[n].text)}),this.$add.on("click",function(){var n,a,i,r;n=e.getState(),a=e.getDefaultState(),i=Object.keys(a).toString(),n=e.replaceObjValues(n,"active",!1),t.extend(n,a),r=a[i].text,e.setState(n),e.addTabs(a),e.changeActiveTab(i),e.insertText(r),e.cacheActiveTab(),e.setTabName(e.$activeTab,r)}),this.$remove.on("click",function(){var t,n,a;if(t=e.getActiveKey(),n=e.getState(),!(Object.keys(n).length<=1)){delete n[t];var a=Object.keys(n).reduce(function(t,e){return e>t?e:t},"0");n[a].active=!0,e.setState(n),e.removeTab(t),e.changeActiveTab(a),e.cacheActiveTab()}}),this.$tabs.on("click","li",function(n,a){var i,r,c,s;i=t(n.target),r=e.getActiveKey(),c=i.attr("data-tab-id"),r!=c&&(s=e.getState(),s=e.replaceObjValues(s,"active",!1),s[c].active=!0,e.setState(s),e.changeActiveTab(c),e.insertText(s[c].text),e.cacheActiveTab(i))})},addTabs:function(){var t=this,e=arguments.length<=0||arguments[0]===i?this.getState():arguments[0];return Object.keys(e).forEach(function(n){var a=e[n].active?'<li class="tab active" data-tab-id="'+n+'"></li>':'<li class="tab" data-tab-id="'+n+'"></li>';t.$tabs.append(a)}),this},setTabName:function(t,e){t.text(e.split("\n").shift().slice(0,15)||"...")},removeTab:function(t){return this.$tabs.find('.tab[data-tab-id="'+t+'"]').remove(),this},cacheActiveTab:function(e){return this.$activeTab=e?e:t("#tabs .tab.active"),this},changeActiveTab:function(t){return this.$tabs.find(".tab").removeClass("active").filter('[data-tab-id="'+t+'"]').addClass("active"),this},getText:function(){return this.$content.val()},insertText:function(t){return this.$content.val(t),this},setState:function(t){var e=arguments.length<=1||arguments[1]===i?"content":arguments[1];return a.set(e,t),this},getState:function(){var t=arguments.length<=0||arguments[0]===i?"content":arguments[0];return a.get(t)},getActiveState:function(){var t=arguments.length<=0||arguments[0]===i?this.getState():arguments[0],e=this.getActiveKey(t);return t[e]},getActiveKey:function(){var t=arguments.length<=0||arguments[0]===i?this.getState():arguments[0],e={};return Object.keys(t).forEach(function(n){t[n].active&&(e=n)}),e},getDefaultState:function(){var t={};return t[Date.now()]={text:"",active:!0},t},replaceObjValues:function(e,n,a){var i;return i=t.extend({},e),Object.keys(i).forEach(function(t){i[t][n]=a}),i},init:function(){var e,n,a,i,r=this;this.cache(),n=this.getState(),n||(n=this.getDefaultState(),this.setState(n)),this.addTabs(),this.$tabs.find(".tab").each(function(e,c){a=t(c),i=a.attr("data-tab-id"),r.setTabName(a,n[i].text)}),this.cacheActiveTab(),this.bindEvents(),e=this.getActiveState().text,this.insertText(e)}};t(n).ready(function(){r.init()})}(jQuery,window,document,a)},{"local-storage":1}]},{},[4]);