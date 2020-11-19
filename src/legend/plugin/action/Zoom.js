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
	
	iconCls: 'fa fa-search fa-lg fa-flip-horizontal ck-plugin',
	tooltip: 'Zoom on layer',
	
	setAction: function(action) {
		if(!action) {
			action = {
				tooltip: this.tooltip,
				handler: this.handlerAction,
				getClass: function(v, meta, rec) {
					var lyr = rec.get('layer');
					if(this.iszoomready(lyr)) {
						return this.iconCls;
					} else {
						return this.disableClass;
					}
				},
				scope: this
			}
		}
		
		this.actionColumn.items.push(action);
		this.actionColumn.width = this.actionColumn.items.length * 20;
		this.actionColumn.fireEvent('add', action);
	},
	
	
	doAction: function(layer) {		
		// var extent = layer.getExtent();
		// if(!extent) {
			// Ck.log("Layer '"+ layer.get('title') +"' has no extent !");
			// return;
		// }
		
		// this.getMap().setExtent(extent);
		
		varurl = Ck.getApi().replace('?','index.php');
		Ck.Ajax.request({
			url: varurl,
			params : {
				s:"recherche",
				r:"recupalllayerzoom",
				id:layer.get('id')
			},
			scope:this,
			success: function(res) {
				rep = Ext.decode(res.responseText);
				if(rep.data != 'non'){
					var minx = parseFloat(rep.data.minx);
					var miny = parseFloat(rep.data.miny);
					var maxx = parseFloat(rep.data.maxx);
					var maxy = parseFloat(rep.data.maxy);
					var bounds = [minx,miny,maxx,maxy];
					Ck.zoomToExtent(bounds);
				}else{
					var extent = layer.getExtent();
					if(!extent) {
						Ck.log("Layer '"+ layer.get('title') +"' has no extent !");
						return;
					}
					
					this.getMap().setExtent(extent);
				}
			}
		});
		
	},
	
	/**
	 * @param {ol.layer.Base}
	 */
	iszoomready: function(layer) {
		if(!Ext.isEmpty(layer) && !(layer instanceof ol.layer.Group)) {
			if(layer.getExtension("geometryType") && layer.getExtension("geometryType") != 'Raster') {
				return true;
			}
		}
		return false;
	},

});