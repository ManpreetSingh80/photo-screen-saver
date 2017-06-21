/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
window.app = window.app || {};

/**
 * A screensaver
 * @namespace
 */
app.Screensaver = (function() {
  'use strict';

  new ExceptionHandler();

  /**
   * Main auto-binding template
   * @typedef {Element} app.Screensaver.Template
   * @property {?Element} rep - repeat template
   * @property {?Element} p - animated-pages
   * @property {Array<app.SSView>} views - array of views
   * @property {int} photoSizing - the way the photos are rendered
   * @property {?string} sizingType - the way an image is rendered
   * @property {int} aniType - the animation type for photo transitions
   * @property {int} screenWidth - screen width in pixels
   * @property {int} screenHeight - screen height in pixels
   * @property {boolean} paused - true if slideshow paused
   * @property {boolean} noPhotos - true if there are no usable photos
   * @property {string} noPhotosLabel - label when no photos are usable
   * @property {string} timeLabel - current time label
   * @property {Function} set - Polymer setter
   * @property {Function} push - Polymer pusher
   * @memberOf app.Screensaver
   */

  /**
   * Main auto-binding template
   * @type {app.Screensaver.Template}
   * @const
   * @private
   * @memberOf app.Screensaver
   */
  const t = document.querySelector('#t');
  t.rep = null;
  t.p = null;
  t.photoSizing = 0;
  t.sizingType = null;
  t.screenWidth = screen.width;
  t.screenHeight = screen.height;
  t.aniType = 0;
  t.paused = false;
  t.noPhotos = false;
  t.noPhotosLabel = '';
  t.timeLabel = '';

  /**
   * Event: Template Bound, bindings have resolved and content has been
   * stamped to the page
   * @private
   * @memberOf app.Screensaver
   */
  function _onDomChange() {
    // set selected background image
    document.body.style.background =
        Chrome.Storage.get('background').substring(11);

    Chrome.GA.page('/screensaver.html');

    // register event listeners
    app.SSEvents.initialize();

    t.rep = t.$.repeatTemplate;
    t.p = t.$.pages;

    _setZoom();
    _setupPhotoSizing();
    _setupPhotoTransitions();

    app.Screensaver.launch();
  }

  /**
   * Process settings related to the photo's appearance
   * @private
   * @memberOf app.Screensaver
   */
  function _setupPhotoSizing() {
    t.photoSizing = Chrome.Storage.getInt('photoSizing', 0);
    if (t.photoSizing === 4) {
      // pick random sizing
      t.photoSizing = Chrome.Utils.getRandomInt(0, 3);
    }
    let type = 'contain';
    switch (t.photoSizing) {
      case 0:
        type = 'contain';
        break;
      case 1:
        type = 'cover';
        break;
      case 2:
      case 3:
        type = null;
        break;
    }
    t.set('sizingType', type);
  }

  /**
   * Process settings related to between photo transitions
   * @private
   * @memberOf app.Screensaver
   */
  function _setupPhotoTransitions() {
    let type = Chrome.Storage.getInt('photoTransition', 0);
    if (type === 8) {
      // pick random transition
      type = Chrome.Utils.getRandomInt(0, 7);
    }
    t.set('aniType', type);

    app.SSTime.initialize();
  }

  /**
   * Set the window zoom factor to 1.0
   * @private
   * @memberOf app.Screensaver
   */
  function _setZoom() {
    if (Chrome.Utils.getChromeVersion() >= 42) {
      // override zoom factor to 1.0 - chrome 42 and later
      const chromep = new ChromePromise();
      chromep.tabs.getZoom().then((zoomFactor) => {
        if ((zoomFactor <= 0.99) || (zoomFactor >= 1.01)) {
          chrome.tabs.setZoom(1.0);
        }
        return null;
      }).catch((err) => {
        Chrome.GA.error(err.message, 'chromep.tabs.getZoom');
      });
    }
  }

  // listen for dom-change
  t.addEventListener('dom-change', _onDomChange);

  return {
    /**
     * Launch the slide show
     * @param {int} [delay=2000] - delay before start
     * @memberOf app.Screensaver
     */
    launch: function(delay = 2000) {
      const hasPhotos = app.SSBuilder.build();
      if (hasPhotos) {
        // kick off the slide show if there are photos selected
        app.SSRunner.start(delay);
      }
    },

    /**
     * Create the {@link app.SSViews} that will be animated
     * @memberOf app.Screensaver
     */
    createPages: function() {
      app.SSViews.create(t);
    },

    /**
     * Get the type of view
     * @returns {int} The sizing type
     * @memberOf app.Screensaver
     */
    getViewType: function() {
      return t.photoSizing;
    },

    /**
     * Get the selected index
     * @returns {int|undefined} The index
     * @memberOf app.Screensaver
     */
    getSelected: function() {
      return t.p.selected;
    },

    /**
     * Set the selected index
     * @param {int} selected - The index
     * @memberOf app.Screensaver
     */
    setSelected: function(selected) {
      t.p.selected = selected;
    },

    /**
     * Is the given idx the selected index
     * @param {int} idx - index into [t.views]{@link app.Screensaver.t}
     * @returns {boolean} true if selected
     * @memberOf app.Screensaver
     */
    isSelected: function(idx) {
      return (idx === t.p.selected);
    },

    /**
     * Do we have usable photos
     * @returns {boolean} true if all photos are bad
     * @memberOf app.Screensaver
     */
    noPhotos: function() {
      return t.noPhotos;
    },

    /**
     * Set the state when no photos are available
     * @memberOf app.Screensaver
     */
    setNoPhotos: function() {
      t.set('noPhotos', true);
      t.noPhotosLabel = Chrome.Locale.localize('no_photos');
    },

    /**
     * Set the time label
     * @param {string} label - current time
     * @memberOf app.Screensaver
     */
    setTimeLabel: function(label) {
      t.timeLabel = label;
    },

    /**
     * Set the state when slideshow is paused
     * @param {boolean} paused - paused state
     * @memberOf app.Screensaver
     */
    setPaused: function(paused) {
      t.paused = paused;
      if (paused) {
        t.$.pauseImage.classList.add('fadeOut');
        t.$.playImage.classList.remove('fadeOut');
      } else {
        t.$.playImage.classList.add('fadeOut');
        t.$.pauseImage.classList.remove('fadeOut');
      }
    },
  };
})();
