/**
 *
 */
Ext.define('Ck.map.action.OpenAddLayer', {
	extend: 'Ck.Action',
	alias: "widget.ckOpenAddLayer",

	requires: [
		'Ck.AddLayer'
	],

	itemId: 'openaddlayer',
	text: '',

	iconCls: 'fa fa-download',
	tooltip: 'Open add layer panel',

	config: {
		winWidth: 400,
		winHeight: 250,
		winCollapsible: true,
		winMaximizable: true
	},

	/**
	 * Create and display a windows with import form
	 */
	doAction: function(btn) {
		var defaultVectorConf = {
			visible: true,
			type: ['shapefile', 'mapinfo', 'gpx'],
			projection: [
				{id: "4326", label: "WGS 84"},
				{id: "2154", label: "Lambert 93"}
			]
		};
		if(!this.win) {
			this.win = Ext.create(this.classWindow, {
				title: 'Add Layer',
				height: this.getWinHeight(),
				width: this.getWinWidth(),
				minHeight: 250,
				minWidth: 300,
				layout: 'fit',
				closeAction: 'hide',
				collapsible: this.getWinCollapsible(),
				maximizable: this.getWinMaximizable(),
				ckview: this.getCkView().getView(),
				parentMap: this.getMap(),
				items: {
					xtype: 'ckaddlayer',
					openner: this,
					wms: typeof this.wms !== "undefined" ? this.wms : true,
					wfs: typeof this.wfs !== "undefined" ? this.wfs : true,
					vector: typeof this.vector !== "undefined" ? this.vector : defaultVectorConf,
					activeTab: typeof this.activateTab !== "undefined" ? this.activateTab : 0
				}
			});
		}

		this.win.show();
	},

	close: function() {
		this.win.hide();
	}
});
