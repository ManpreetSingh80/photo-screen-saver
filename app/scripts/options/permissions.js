/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
window.app = window.app || {};

/**
 * Handle optional permissions
 *  @namespace
 */
app.Permissions = (function() {
	'use strict';

	new ExceptionHandler();

	const chromep = new ChromePromise();

	/**
	 * A permission state enum
	 * @typedef {{}} app.Permissions.State
	 * @property {string} notSet - never been allowed or denied
	 * @property {string} allowed - user allowed
	 * @property {string} denied - user denied
	 * @memberOf app.Permissions
	 */

	/**
	 * A permission type
	 * @typedef {{}} app.Permissions.Type
	 * @property {string} name - name in localStorage
	 * @property {string[]} permissions - array of permissions
	 * @property {string[]} origins - array of origins
	 * @memberOf app.Permissions
	 */

	/**
	 * Possible states of an {@link app.Permissions.Type}
	 * @type {app.Permissions.State}
	 * @const
	 * @private
	 * @memberOf app.Permissions
	 */
	const _STATE = {
		notSet: 'notSet',
		allowed: 'allowed',
		denied: 'denied',
	};

	/**
	 * Permission for access to users' Google Photos
	 * @const
	 * @type {app.Permissions.Type}
	 * @memberOf app.Permissions
	 */
	const PICASA = {
		name: 'permPicasa',
		permissions: [],
		origins: ['https://picasaweb.google.com/'],
	};

	return {
		/** @memberOf app.Permissions */
		PICASA: PICASA,

		/**
		 * Has use made choice on permissions
		 * @param {app.Permissions.Type} type - permission type
		 * @returns {boolean} true if allowed or denied
		 * @memberOf app.Permissions
		 */
		notSet: function(type) {
			return app.Storage.get(type.name) === _STATE.notSet;
		},

		/**
		 * Has the user allowed the optional permissions
		 * @param {app.Permissions.Type} type - permission type
		 * @returns {boolean} true if allowed
		 * @memberOf app.Permissions
		 */
		isAllowed: function(type) {
			return app.Storage.get(type.name) === _STATE.allowed;
		},

		/**
		 * Prompt for the optional permissions
		 * @param {app.Permissions.Type} type - permission type
		 * @returns {Promise<boolean>} true if permission granted
		 * @memberOf app.Permissions
		 */
		request: function(type) {
			/**
			 * Grant permission if it has been allowed
			 * @param {app.Permissions.Type} type - permission type
			 * @param {boolean} isTrue true is permission was allowed
			 * @returns {Promise.<boolean>} true if removed
			 * @private
			 * @memberOf app.Permissions
			 */
			function ifGranted(type, isTrue) {
				if (isTrue) {
					app.Storage.set(type.name, _STATE.allowed);
					return Promise.resolve(isTrue);
				} else {
					// remove if it has been previously granted
					return app.Permissions.remove(type).then(() => {
						return Promise.resolve(isTrue);
					});
				}
			}

			return chromep.permissions.request({
				permissions: type.permissions,
				origins: type.origins,
			}).then((granted) => {
				return ifGranted(type, granted);
			});
		},

		/**
		 * Determine if we have the optional permissions
		 * @param {app.Permissions.Type} type - permission type
		 * @returns {Promise<boolean>} true if we have permissions
		 * @memberOf app.Permissions
		 */
		contains: function(type) {
			return chromep.permissions.contains({
				permissions: type.permissions,
				origins: type.origins,
			});
		},

		/**
		 * Remove the optional permissions
		 * @param {app.Permissions.Type} type - permission type
		 * @returns {Promise<boolean>} true if removed
		 * @memberOf app.Permissions
		 */
		remove: function(type) {
			/**
			 * Remove permission if it has been allowed at some point
			 * @param {app.Permissions.Type} type - permission type
			 * @param {boolean} isTrue true is permission was allowed
			 * @returns {Promise.<boolean>} true if removed
			 * @private
			 * @memberOf app.Permissions
			 */
			function _ifContains(type, isTrue) {
				if (isTrue) {
					// remove permission
					return chromep.permissions.remove({
						permissions: type.permissions,
						origins: type.origins,
					}).then((removed) => {
						if (removed) {
							app.Storage.set(type.name, _STATE.denied);
						}
						return Promise.resolve(removed);
					});
				} else {
					return Promise.resolve(false);
				}
			}

			return app.Permissions.contains(type).then((contains) => {
				return _ifContains(type, contains);
			});
		},
	};
})();
