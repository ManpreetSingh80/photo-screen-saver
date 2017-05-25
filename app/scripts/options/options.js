/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
(function() {
	'use strict';

	/**
	 * Extension's Options page
	 * @namespace Options
	 */

	new ExceptionHandler();

	/**
	 * Manage an html page that is inserted on demand<br />
	 * May also be a url link to external site
	 * @typedef {{}} Options.Page
	 * @property {string} label - label for Nav menu
	 * @property {string} route - element name route to page
	 * @property {string} icon - icon for Nav Menu
	 * @property {?Object|Function} obj - something to be done when selected
	 * @property {boolean} ready - true if html is inserted
	 * @property {boolean} divider - true for divider before item
	 * @memberOf Options
	 */

	/**
	 * Path to the extension in the Web Store
	 * @type {string}
	 * @const
	 * @private
	 * @memberOf Options
	 */
	const EXT_URI =
		'https://chrome.google.com/webstore/detail/photo-screen-saver/' +
		chrome.runtime.id + '/';

	/**
	 * Path to my Pushy Clipboard extension
	 * @type {string}
	 * @const
	 * @default
	 * @private
	 * @memberOf Options
	 */
	const PUSHY_URI =
		'https://chrome.google.com/webstore/detail/pushy-clipboard/' +
		'jemdfhaheennfkehopbpkephjlednffd';

	/**
	 * auto-binding template
	 * @type {Object}
	 * @const
	 * @private
	 * @memberOf Options
	 */
	const t = document.querySelector('#t');

	/**
	 * Array of pages
	 * @type {Options.Page[]}
	 * @memberOf Options
	 */
	t.pages = [
		{
			label: app.Utils.localize('menu_settings'), route: 'page-settings',
			icon: 'myicons:settings', obj: null, ready: true, divider: false,
		},
		{
			label: app.Utils.localize('menu_google'),
			route: 'page-google-photos', icon: 'myicons:cloud',
			obj: _showGooglePhotosPage, ready: false, divider: false,
		},
		{
			label: app.Utils.localize('menu_preview'), route: 'page-preview',
			icon: 'myicons:pageview', obj: _showScreensaverPreview, ready: true,
			divider: false,
		},
		{
			label: app.Utils.localize('menu_help'), route: 'page-help',
			icon: 'myicons:help', obj: _showHelpPage, ready: false,
			divider: false,
		},
		{
			label: app.Utils.localize('menu_support'), route: 'page-support',
			icon: 'myicons:help', obj: `${EXT_URI}support`, ready: true,
			divider: true,
		},
		{
			label: app.Utils.localize('menu_rate'), route: 'page-rate',
			icon: 'myicons:grade', obj: `${EXT_URI}reviews`, ready: true,
			divider: false,
		},
		{
			label: app.Utils.localize('menu_pushy'), route: 'page-pushy',
			icon: 'myicons:extension', obj: PUSHY_URI, ready: true,
			divider: true,
		},
	];

	// Error dialog
	t.dialogTitle = '';
	t.dialogText = '';

	/**
	 * Current {@link Options.Page}
	 * @type {string}
	 * @memberOf Options
	 */
	t.route = 'page-settings';

	/**
	 * Event Listener for template bound event to know when bindings
	 * have resolved and content has been stamped to the page
	 * @memberOf Options
	 */
	t.addEventListener('dom-change', function() {
		app.GA.page('/options.html');
		// listen for chrome messages
		app.Msg.listen(_onMessage);
	});

	/**
	 * Event: navigation menu selected
	 * Route to proper page
	 * @param {Event} event - ClickEvent
	 * @memberOf Options
	 */
	t._onNavMenuItemTapped = function(event) {
		// Close drawer after menu item is selected if it is narrow
		const drawerPanel = document.querySelector('#paperDrawerPanel');
		if (drawerPanel && drawerPanel.narrow) {
			drawerPanel.closeDrawer();
		}

		const index = t.pages.findIndex((element) => {
			return element.route === event.currentTarget.id;
		});

		app.GA.event(app.GA.EVENT.MENU, t.pages[index].route);

		const prevRoute = t.route;

		if (!t.pages[index].obj) {
			// some pages are just pages
			t.route = t.pages[index].route;
			_scrollPageToTop();
		} else if (typeof t.pages[index].obj === 'string') {
			// some pages are url links
			t.$.mainMenu.select(prevRoute);
			chrome.tabs.create({url: t.pages[index].obj});
		} else {
			// some pages have functions to view them
			t.pages[index].obj(index, prevRoute);
		}
	};

	/**
	 * Computed property: Page title
	 * @returns {string} i18n title
	 * @memberOf Options
	 */
	t._computeTitle = function() {
		return app.Utils.localize('chrome_extension_name');
	};

	/**
	 * Computed property: Menu label
	 * @returns {string} i18n label
	 * @memberOf Options
	 */
	t._computeMenu = function() {
		return app.Utils.localize('menu');
	};

	/**
	 * Show the Google Photos page
	 * @param {int} index - index into [t.pages]{@link Options.t.pages}
	 * @memberOf Options
	 */
	function _showGooglePhotosPage(index) {
		if (!t.pages[index].ready) {
			// create the page the first time
			t.pages[index].ready = true;
			t.gPhotosPage =
				new app.GooglePhotosPage('gPhotosPage');
			Polymer.dom(t.$.googlePhotosInsertion).appendChild(t.gPhotosPage);
		} else {
			t.gPhotosPage.loadAlbumList();
		}
		t.route = t.pages[index].route;
		_scrollPageToTop();
	}

	/**
	 * Show the help page
	 * @param {int} index - index into [t.pages]{@link Options.t.pages}
	 * @private
	 * @memberOf Options
	 */
	function _showHelpPage(index) {
		if (!t.pages[index].ready) {
			// insert the page the first time
			t.pages[index].ready = true;
			const el = new app.HelpPageFactory();
			Polymer.dom(t.$.helpInsertion).appendChild(el);
		}
		t.route = t.pages[index].route;
		_scrollPageToTop();
	}

	// noinspection JSUnusedLocalSymbols
	/**
	 * Display a preview of the screen saver
	 * @param {int} index - index into [t.pages]{@link Options.t.pages}
	 * @param {string} prevRoute - last page selected
	 * @memberOf Options
	 */
	function _showScreensaverPreview(index, prevRoute) {
		// reselect previous page - need to delay so tap event is done
		t.async(function() {
			t.$.mainMenu.select(prevRoute);
		}, 500);
		app.Msg.send(app.Msg.SS_SHOW).catch(() => {});
	}

	/**
	 * Scroll page to top
	 * @memberOf Options
	 */
	function _scrollPageToTop() {
		t.$.scrollPanel.scrollToTop(true);
	}

	// noinspection JSUnusedLocalSymbols
	/**
	 * Event: Fired when a message is sent from either an extension process<br>
	 * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
	 * @see https://developer.chrome.com/extensions/runtime#event-onMessage
	 * @param {Object} request - details for the message
	 * @param {string} request.message - name of the message
	 * @param {Object} sender - MessageSender object
	 * @param {function} response - function to call once after processing
	 * @returns {boolean} true if asynchronous
	 * @private
	 * @memberOf Options
	 */
	function _onMessage(request, sender, response) {
		if (request.message === app.Msg.HIGHLIGHT.message) {
			// highlight ourselves and let the sender know we are here
			const chromep = new ChromePromise();
			chromep.tabs.getCurrent().then((t) => {
				chrome.tabs.update(t.id, {'highlighted': true});
				return null;
			}).catch((err) => {
				app.GA.error(err.message, 'chromep.tabs.getCurrent');
			});
			response(JSON.stringify({message: 'OK'}));
		} else if (request.message === app.Msg.STORAGE_EXCEEDED.message) {
			// Display Error Dialog if a save action exceeded the
			// localStorage limit
			t.dialogTitle = app.Utils.localize('err_storage_title');
			t.dialogText = app.Utils.localize('err_storage_desc');
			t.$.errorDialog.open();
		} else if (request.message === app.Msg.PHOTO_SOURCE_FAILED.message) {
			// failed to load
			t.$.settingsPage.deselectPhotoSource(request.type);
			t.dialogTitle = app.Utils.localize('err_photo_source_title');
			t.dialogText = request.error;
			t.$.errorDialog.open();
		}
		return false;
	}
})();
