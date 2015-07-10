/*
 */

Ext.define('ck.legend.plugin.action.zoom', {
	extend: 'ck.legend.plugin.action',
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
	
	iconCls: 'fa fa-search fa-lg fa-flip-horizontal',
	tooltip: 'Zoom on layer',
	
	doAction: function(layer) {		
		var extent = layer.getExtent();
		if(!extent) {
			Ext.log("Layer ''"+ layer.get('title') +"' have no extent !");
			return;
		}
		
		this.getMap().setExtent(extent);
	}

});