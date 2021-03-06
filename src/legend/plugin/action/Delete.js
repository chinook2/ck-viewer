/**
 * 
 */
Ext.define('Ck.legend.plugin.action.Remove', {
	extend: 'Ck.legend.plugin.Action',
	alias: 'plugin.legendlayerremove',
	
	iconCls: 'fa fa-remove fa-lg fa-flip-horizontal ck-plugin',
	tooltip: 'Remove layer from map',
	
	setAction: function() {
		var action = {
			tooltip: this.tooltip,
			handler: this.handlerAction,
			isDisabled: function(v, r, c, i, rec) {
				var lyr = rec.get('layer');
				if(Ext.isEmpty(lyr)) {
					return true
				} else {
					return !lyr.get("removable");
				}
			},
			getClass: function(v, meta, rec) {
				var lyr = rec.get('layer');
				if(Ext.isEmpty(lyr)) {
					return "";
				} else {
					return (lyr.get("removable"))? this.iconCls : this.disableClass;
				}
				
			},
			scope: this
		}
		
		this.actionColumn.items.push(action);
		this.actionColumn.width = this.actionColumn.items.length * 20;
	},
	
	doAction: function(layer) {		
		var olMap = Ck.getMap().getOlMap();
		olMap.removeLayer(layer);
	}

});