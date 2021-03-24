/**
 *
 */
Ext.define('Ck.legend.plugin.action.Zoom', {
	extend: 'Ck.legend.plugin.Action',
	alias: 'plugin.legendlayerzoom',

	/*
	init: function(cmp) {
		this.callParent(arguments);

		this.setAction({
			iconCls: 'fa fa-search fa-lg fa-flip-horizontal',
			tooltip: 'Zoom on layer',
			...
		})
	},
	*/

	iconCls: 'ck-zoom ck-plugin',
	tooltip: Ck.text('zoom_on_layer'),

	doAction: function(layer) {
		var extent = layer.getExtent();
		if(!extent) {
			Ck.log("Layer '"+ layer.get('title') +"' has no extent !");
			return;
		}

		this.getMap().setExtent(extent);
	}

});
