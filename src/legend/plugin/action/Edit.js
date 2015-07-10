/*
 */

Ext.define('ck.legend.plugin.action.edit', {
	extend: 'ck.legend.plugin.action',
	alias: 'plugin.legendlayeredit',
	
	iconCls: 'fa fa-pencil fa-lg',
	tooltip: 'Edit layer',
	
	doAction: function(layer) {		
		Ext.Msg.alert('Edit Layer : '+layer.get('title'), 'Work In Progress...');
	}
});
