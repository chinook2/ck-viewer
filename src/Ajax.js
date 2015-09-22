/**
 * 
 */
Ext.define('Ck.Ajax', {
	extend: 'Ext.data.Connection',
	alternateClassName: 'Cks',
	
	singleton: true,
	
	/**
	 * @ignore
	 */
	constructor: function() {
		this.ls = new Ext.util.LocalStorage({
			 id: 'Ck-'+Ext.manifest.name
		});
		
		Ext.Ajax.on({
			beforerequest: this.onBeforeRequest,
			requestcomplete: this.onRequestComplete,
			requestexception: this.onRequestException,
			scope: this
		});
	},
	
	get: function(options) {
		options.method = 'GET';
		this.request(options);
	},
	
	post: function() {
	},

	put: function() {
	},

	update: function() {
	},

	del: function() {
	},
	
	request: function(options) {
		options.disableCaching = false;		

		
		Ext.Ajax.request(options);	
	},
	
	onBeforeRequest: function(conn, options, eOpts) {
		// Disable Ajax cache (in production)
		if(Ck.params.hasOwnProperty('nocache')) {
			return true;
		}
		
		// Disable Ajax cache (in testing and development). Allow 'forcecache' for testing and development.
		if(Ck.getEnvironment() != 'production' && !Ck.params.hasOwnProperty('forcecache')) {
			return true;
		}
		
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
		
		this.ls.setItem(options.url, response.responseText);
	},
	
	onRequestException: function(conn, response, options, eOpts) {
		Ck.Notify.error('Request failure : ' + options.url);

		// TODO : parse error message ...
	}
});
