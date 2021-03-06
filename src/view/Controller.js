/**
 * 
 */
//<debug>
// Mini hack to load Ck.js main static class in dev mode
// Ext.manifest.paths doesn't in production and testing !!
if(Ext.manifest.paths) Ext.Loader.loadScriptsSync([Ext.manifest.paths.Ck + "/Ck.js"]);
//</debug>

Ext.define('Ck.view.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckview',
	maxAttempt: 3,
	attempt: 0,
	
	init: function() {
		if(Ck.params.app) {
			this.getView().setName(Ck.params.app);
		}
				
		this.initUi();				
	},
	
	/**
	 * Called before adding the UI to the view. To be overridden by the app in order to modify, control the UI.
	 */
	beforeAdd: function(ui) {
		return ui;
	},
	
	/**
	 * Add the UI in the view.
	 * @private
	 */
	initUi: function(ui) {
		if(!ui) {
			var uiName = this.getView().getName();
			this.getUi(uiName);
			return;
		}
		
		ui = this.beforeAdd(ui);
		
		if(this.fireEvent('beforeadd', ui) !== false) {
			this.view.add(ui);
		}
		
		// Init Locale (translate) when UI is ready
		Ck.Locale.init(this.view);

		return true;
	},
	
	/**
	 *	Get the json definition of the UI from the server (or localstorage).
	 * @private
	 */
	getUi: function(uiName) {
		Cks.get({
			url: this.getFullUrl(uiName),
			scope: this,
			success: function(response){
				var uiConfig = Ext.decode(response.responseText);
				this.initUi(uiConfig);
			},
			failure: function(response, opts) {
				// TODO : on Tablet when access local file via ajax, success pass here !!
				// var uiConfig = Ext.decode(response.responseText);
				// this.initUi(uiConfig);
				
				Ck.error('Error when loading "'+uiName+'" interface !. Loading the default interface...');
				this.attempt++;
				if(this.attempt <= this.maxAttempt) this.getUi('ck-default');
			}
		});
	},

	getCkMap: function () {
		return this.ckMap;
	},

	setCkMap: function (ckmap) {
		if(ckmap) {
			this.relayEvents(ckmap, ['ready', 'loaded'], 'map');
			this.getView().relayEvents(ckmap, ['ready', 'loaded'], 'map');
			this.ckMap = ckmap;
		}
	},

	onMapReady: function(fn, scope, options) {
		var m = this.getCkMap();
		if (m && m.ready === true) {
			fn.apply(scope, [m]);
		} else {
			this.on('mapready', fn, scope, options);
		}
	},

	onMapLoaded: function (fn, scope, options) {
		var m = this.getCkMap();
		if (m && m.loaded === true) {
			fn.apply(scope, [m]);
		} else {
			this.on('maploaded', fn, scope, options);
		}
	}
});
