/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
window.app = window.app || {};

/**
 * Time handling for an {@link app.Screensaver}
 * @namespace
 */
app.SSTime = (function() {
  'use strict';

  new ExceptionHandler();

  return {
    /**
     * Initialize the time display
     * @memberOf app.SSTime
     */
    initialize: function() {
      const showTime = Chrome.Storage.getInt('showTime', 0);
      if (showTime > 0) {
        setInterval(app.SSTime.setTime, 61 * 1000);
      }
    },

    /**
     * Set the time label
     * @memberOf app.SSTime
     */
    setTime: function() {
      const t = app.Screensaver.getTemplate();
      const showTime = Chrome.Storage.getInt('showTime', 0);
      if ((showTime !== 0) && t.started) {
        t.set('time', app.Time.getStringShort());
      } else {
        t.set('time', '');
      }
    },
  };
})();
