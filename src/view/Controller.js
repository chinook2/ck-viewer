/**
 *
 */
Ext.define('Ck.view.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckview',

	ckMap: null,

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

				if(uiName != 'ck-default') this.getUi('ck-default');
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
	}
});
