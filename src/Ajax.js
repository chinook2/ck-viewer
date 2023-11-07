/**
 *
 */
Ext.define('Ck.Ajax', {
	extend: 'Ext.data.Connection',
	alternateClassName: 'Cks',
	singleton: true,

	requires: [
		'Ck'
	],

	/**
	 * @ignore
	 */
	constructor: function() {
		this.callParent(arguments);

		this.ls = new Ext.util.LocalStorage({
			id: 'Ck-' + Ext.manifest.name
		});

		// Global disable ajax cache and ajax global events
		// By default disabled.
		if (Ck.getOption('ajaxCache') === true) {
			Ext.Ajax.on({
				beforerequest: this.onBeforeRequest,
				requestcomplete: this.onRequestComplete,
				requestexception: this.onRequestException,
				scope: this
			});
		}


		// Ext.Ajax.setDefaultPostHeader('application/json; charset=UTF-8');
		// if (Ck.getOption('defaultPostHeader')) {
			// Ext.Ajax.setDefaultPostHeader(Ck.getOption('defaultPostHeader'));
		// }
	},

	get: function(options) {
		options.method = 'GET';

		// Prod caching with unique build timestamp param (force reload for new build only)
		if(Ck.getEnvironment() == 'production'){
			if(Ext.manifest.loader && Ext.manifest.loader.cache){
				options.url = Ext.urlAppend(options.url, Ext.Ajax.getDisableCachingParam() + '=' + Ext.manifest.loader.cache);
			}
		}

		this.request(options);
	},

	/**
	 * Perform a POST request
	 * @param {Object}
	 * @todo Chek if we have file to upload. Use this if yes : application/x-www-form-urlencoded;charset=UTF-8
	 */
	post: function(options) {
		Ext.applyIf(options, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json; charset=UTF-8'
			}
		});

		if(options.encode !== false && options.params) {
			options.params = Ext.encode(options.params);
			delete options.encode;
		}

		this.request(options);
	},

	put: function(options) {
		Ext.applyIf(options, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json; charset=UTF-8'
			}
		});

		if(options.encode !== false && options.params) {
			options.params = Ext.encode(options.params);
			delete options.encode;
		}

		this.request(options);
	},

	del: function(options) {
		Ext.applyIf(options, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json; charset=UTF-8'
			}
		});

		if(options.encode !== false && options.params) {
			options.params = Ext.encode(options.params);
			delete options.encode;
		}

		this.request(options);
	},

	request: function(options) {
		options.disableCaching = false;
		//<debug>
		// Dev Mode use standard disable cache system : each call is unique
		options.disableCaching = true;
		//</debug>

		this.callParent(arguments);
	},

	/**
	 * Perform an AJAX request using XHR Level 2.
	 * @param {Object}
	 */
	xhr: function(options) {
		Ext.applyIf(options, {
			method	: "POST",
			url		: "index.php",
			params	: {},
			files	: [],
			scope	: this,
			success	: Ext.emptyFn,
			failure	: Ext.emptyFn
		});

		var xhr = new XMLHttpRequest();
		var _async = (options.async !== false) ? true : false;

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if(xhr.status == 200 || xhr.status == 0) {
					options.success.call(options.scope, xhr);
				} else {
					options.failure.call(options.scope, xhr);
				}
			}
		};

		var fData;
		if(Ext.isObject(options.params)) {
			fData = new FormData();
			for(var key in options.params) {
				fData.append(key, options.params[key]);
			}

			var f;
			for(var i in options.files) {
				f = options.files[i];
				fData.append(f.name, f.value, f.filename);
			}
		} else {
			fData = options.params;
		}

		xhr.open(options.method, options.url, _async);

		if(Ext.isObject(options.headers)) {
			for(var h in options.headers) {
				var v = options.headers[h];
				xhr.setRequestHeader(h, v);
			}
		}
		xhr.send(fData);
	},
    
    xhrBinaryData: function(options) {
        var xhr = new XMLHttpRequest();
        xhr.open(options.method || 'POST', options.url);
        xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if(xhr.status == 200 || xhr.status == 201 || xhr.status == 0) {
					options.success.call(options.scope, xhr);
				} else {
					options.failure.call(options.scope, xhr);
				}
			}
		};
        if(Ext.isObject(options.headers)) {
			for(var h in options.headers) {
				var v = options.headers[h];
				xhr.setRequestHeader(h, v);
			}
		}
        xhr.send(options.file);
    },

	isCacheAvailable: function(options) {
		// Only cache GET request
		if(options.method != 'GET') {
			return false;
		}

		// Disable Ajax cache for a specific call
		if(options.nocache===true) {
			return false;
		}

		// Disable Ajax cache by URL param (in production)
		if(Ck.params.hasOwnProperty('nocache')) {
			return false;
		}

		// Disable Ajax cache (in testing and development). Allow 'forcecache' for testing and development.
		if(Ck.getEnvironment() != 'production' && !Ck.params.hasOwnProperty('forcecache')) {
			return false;
		}

		return true;
	},

	onBeforeRequest: function(conn, options, eOpts) {
		if(!this.isCacheAvailable(options)) return true;
		// TODO : test cache validity

		var res = this.ls.getItem(options.url);
		if(res) {
			//<debug>
			Ck.Notify.info('Request from Cache : '+ options.url);
			//</debug>

			var response = {
				responseText: res
			}

			Ext.callback(options.success, options.scope, [response, options]);
			return false;
		}
	},

		onRequestComplete: function(conn) {
		var options = conn.options;
		var response = conn.result;
		//<debug>
		//Ck.Notify.info('Request success : '+ options.url);
		//</debug>

		if(!this.isCacheAvailable(options)) return true;

		this.ls.setItem(options.url, response.responseText);
	},

	onRequestException: function(conn) {
		var options = conn.options;
		var response = conn.result;
		Ck.Notify.error('Request failure : ' + options.url, response);
		// TODO : parse error message ...
	}
});
