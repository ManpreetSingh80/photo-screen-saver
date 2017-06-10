/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
window.app = window.app || {};

/**
 * Control the running of a {@link app.Screensaver}
 * @namespace
 */
app.SSRunner = (function() {
  'use strict';

  new ExceptionHandler();

  /**
   * Instance variables
   * @type {Object}
   * @property {boolean} firstAni - true after first animation cycle
   * @property {int} lastSelected - last selected page
   * @property {int} waitTime - wait time when looking for photo in milliSecs
   * @private
   * @memberOf app.SSRunner
   */
  const _VARS = {
    firstAni: false,
    lastSelected: -1,
    waitTime: 30000,
  };

  /**
   * Called at fixed time intervals to cycle through the photos
   * Potentially runs forever
   * @private
   * @memberOf app.SSRunner
   */
  function _runShow() {
    const t = app.Screensaver.getTemplate();
    if (t.noPhotos) {
      // no usable photos to show
      return;
    }

    const curIdx = !t.started ? 0 : t.p.selected;
    const prevIdx = (curIdx > 0) ? curIdx - 1 : t.views.length - 1;
    let nextIdx = (curIdx === t.views.length - 1) ? 0 : curIdx + 1;

    if (!t.started) {
      // special case for first page. neon-animated-pages is configured
      // to run the entry animation for the first selection
      nextIdx = curIdx;
    } else if (!_VARS.firstAni) {
      // special case for first full animation. next time ready to start
      // splicing in the new images
      _VARS.firstAni = true;
    }

    nextIdx = app.SSFinder.getNext(nextIdx, _VARS.lastSelected, prevIdx);
    if (nextIdx !== -1) {
      // the next photo is ready
      if (!t.started) {
        t.started = true;
        app.SSTime.setTime();
      }

      // update t.p.selected so the animation runs
      _VARS.lastSelected = t.p.selected;
      t.p.selected = nextIdx;

      // setup photo
      t.views[nextIdx].render();
    }

    // set the next timeout, then call ourselves - runs unless interrupted
    window.setTimeout(() => {
      _runShow();
    }, _VARS.waitTime);
  }

  return {
    /**
     * Start the slideshow
     * @memberOf app.SSRunner
     */
    start: function() {
      const transTime = Chrome.Storage.get('transitionTime');
      if (transTime) {
        app.SSRunner.setWaitTime(transTime.base * 1000);
      }

      // slight delay at beginning so we have a smooth start
      window.setTimeout(_runShow, 2000);
    },

    /**
     * Get wait time between _runShow calls
     * @returns {int} current wait time
     * @memberOf app.SSRunner
     */
    getWaitTime: function() {
      return _VARS.waitTime;
    },

    /**
     * Set wait time between _runShow calls in milliSecs
     * @param {int} waitTime - wait time for next attempt to get photo
     * @memberOf app.SSRunner
     */
    setWaitTime: function(waitTime) {
      _VARS.waitTime = waitTime;
    },

    /**
     * Set state when there are no usable photos
     * @memberOf app.SSRunner
     */
    setNoPhotos: function() {
      window.clearTimeout(_VARS.timeOutId);
      _VARS.noPhotos = true;
      const label = Chrome.Locale.localize('no_photos');
      app.Screensaver.setNoPhotosLabel(label);
    },

    /**
     * Has the first page run
     * @returns {boolean} if animation has started
     * @memberOf app.SSRunner
     */
    isStarted: function() {
      // todo use this - return _VARS.started;
      const t = app.Screensaver.getTemplate();
      return t.started;
    },

    /**
     * Has the first animation cycle run
     * @returns {boolean} if first animation cycle has run
     * @memberOf app.SSRunner
     */
    isAnimating: function() {
      return _VARS.firstAni;
    },

    /**
     * Is the given idx a part of the current animation pair
     * @param {int} idx - index into [t.views]{@link app.Screensaver.t}
     * @returns {boolean} if selected or last selected
     * @memberOf app.SSRunner
     */
    isCurrentPair: function(idx) {
      const t = app.Screensaver.getTemplate();
      return ((idx === t.p.selected) || (idx === _VARS.lastSelected));
    },
  };
})();
