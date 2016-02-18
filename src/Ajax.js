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
		if (Ck.getOption('ajaxCache') !== false) {
			Ext.Ajax.on({
				beforerequest: this.onBeforeRequest,
				requestcomplete: this.onRequestComplete,
				requestexception: this.onRequestException,
				scope: this
			});
		}
		
		// Chinook header to detect Chinook request in server side
		Ext.Ajax.setDefaultHeaders({
			'Powered-By': 'Chinook'
		});
		
		// Ext.Ajax.setDefaultPostHeader('application/json; charset=UTF-8');
		// if (Ck.getOption('defaultPostHeader')) {
			// Ext.Ajax.setDefaultPostHeader(Ck.getOption('defaultPostHeader'));
		// }
		this.callParent(arguments);
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
	},
	
	/**
	 * Send WFS request to insert, update or delete features.
	 *
	 * @param {ol.layer.Base}
	 * @param {Object} Features to transac. Member name : inserts, updates, deletes
	 * @param {Function}
	 * @param {Function}
	 */
	sendTransaction: function(layer, features, success, failure) {
		var currSrs = Ck.getMap().getProjection().getCode();
		ope = layer.ckLayer.getOffering("wfs").getOperation("GetFeature");
			
		var f = Ck.create("ol.format.WFS", {
			featureNS: "http://mapserver.gis.umn.edu/mapserver",
			gmlFormat: Ck.create("ol.format.GML2"),
			featureType: ope.getLayers()
		});
		

		var lyr = ope.getLayers().split(":");

		transacOpt = {
			featureNS		: "feature",
			srsName			: currSrs,
			featureType		: lyr[0],
			gmlOptions: {
				schemaLocation: "wfs"
			}
		};

		if(!Ext.isEmpty(lyr[1])) {
			transacOpt.featurePrefix = lyr[1];
		}
		
		if(!Ext.isArray(features.inserts)) {
			features.inserts = features.inserts || [];
		}
		
		if(!Ext.isArray(features.updates)) {
			features.updates = features.updates || [];
		}
		
		if(!Ext.isArray(features.deletes)) {
			features.deletes = features.deletes || [];
		}

		var transac = f.writeTransaction(features.inserts, features.updates, features.deletes, transacOpt);

		// Temporary parent to get the whole innerHTML
		var pTemp = document.createElement("div");
		pTemp.appendChild(transac);
		
		// Defaults callbacks
		var defSucc = function(response) {
			var ins, upd, del;
			ins = response.responseXML.getElementsByTagName("totalInserted")[0];
			upd = response.responseXML.getElementsByTagName("totalUpdated")[0];
			del = response.responseXML.getElementsByTagName("totalDeleted")[0];

			if(ins || upd || del) {
				var msg = "Registration successfully : <br/>";
				if(ins && ins.innerHTML != "0") {
					msg += "Inserted : " + ins.innerHTML + "<br/>";
				}
				if(upd && upd.innerHTML != "0") {
					msg += "Updated : " + upd.innerHTML + "<br/>";
				}
				if(del && del.innerHTML != "0") {
					msg += "Deleted : " + del.innerHTML;
				}

				Ext.Msg.show({
					title: "Edition",
					message: msg,
					buttons: Ext.Msg.OK,
					icon: Ext.Msg.INFO
				});
			}
		};
		
		var defFail = function(response) {
			var exception = response.responseXML.getElementsByTagName("ServiceException")[0];
			var msg = "Layer edition failed";
			if(exception) {
				var pre = document.createElement('pre');
				var text = document.createTextNode(exception.innerHTML);
				pre.appendChild(text);
				msg += ". Error message : <br/>" + pre.innerHTML;
			}

			Ext.Msg.show({
				title: "Edition",
				message: msg,
				buttons: Ext.Msg.OK,
				icon: Ext.Msg.ERROR
			});
		};
		
		var successCallback, failureCallback;
		// Define callbacks
		if(Ext.isObject(success)) {
			successCallback = function(response) {
				if(success.showMsg !== false) {
					defSucc(response);
				}
				if(Ext.isFunction(success.fn)) {
					success.fn.call(success.scope || this, response);
				}
			}
		}
		if(Ext.isObject(failure)) {
			failureCallback = function(response) {
				if(failure.showMsg !== false) {
					defFail(response);
				}
				if(Ext.isFunction(failure.fn)) {
					failure.fn.call(failure.scope || this, response);
				}
			}
		}
		
		// Do the getFeature query
		Ck.Ajax.post({
			scope: this,
			url: ope.getUrl(),
			rawData: pTemp.innerHTML,
			success: successCallback || defSucc,
			failure: failureCallback || defFail
		});
	}
});
