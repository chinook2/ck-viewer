/**
 * 
 */
// @require Ck
Ext.define('Ck.Ajax', {
	extend: 'Ext.data.Connection',
	alternateClassName: 'Cks',
	
	singleton: true,
	
	/**
	 * @ignore
	 */
	constructor: function() {
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
				
		if(options.encode !== false) {
			options.params = Ext.encode(options.params);
			delete options.encode;
		}
		
		this.request(options);
	},

	put: function(options) {
		options.method = 'PUT';
		
		// TODO : chek if we have file to upload ...
		// application/x-www-form-urlencoded;charset=UTF-8
		options.headers = {
			'Content-Type': 'application/json; charset=UTF-8'
		};
		
		options.params = Ext.encode(options.params);
		this.request(options);
	},

	del: function(options) {
		options.method = 'DELETE';
		
		// TODO : chek if we have file to upload ...
		// application/x-www-form-urlencoded;charset=UTF-8
		options.headers = {
			'Content-Type': 'application/json; charset=UTF-8'
		};
		
		options.params = Ext.encode(options.params);
		this.request(options);
	},
	
	request: function(options) {
		options.disableCaching = false;		

		
		Ext.Ajax.request(options);	
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

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 0)) {
				options.success.call(options.scope, xhr);
			}
		};
		
		var fData = new FormData();
		for(var key in options.params) {
			fData.append(key, options.params[key]);
		}
		
		var f;
		for(var i in options.files) {
			f = options.files[i];
			fData.append(f.name, f.value, f.filename);
		}

		xhr.open(options.method, options.url, true);
		xhr.send(fData);
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
	
	onRequestComplete: function(conn, response, options, eOpts) {
		//<debug>
		Ck.Notify.info('Request success : '+ options.url);
		//</debug>
		
		if(!this.isCacheAvailable(options)) return true;
		
		this.ls.setItem(options.url, response.responseText);
	},
	
	onRequestException: function(conn, response, options, eOpts) {
		Ck.Notify.error('Request failure : ' + options.url);

		// TODO : parse error message ...
	}
});
