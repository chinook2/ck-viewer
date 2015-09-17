/**
 * 
 */
Ext.define('Ck.legend.plugin.action.Edit', {
	extend: 'Ck.legend.plugin.Action',
	alias: 'plugin.legendlayeredit',
	
	iconCls: 'fa fa-pencil fa-lg ck-plugin',
	tooltip: 'Edit layer',
	
	doAction: function(layer) {		
		Ext.Msg.alert('Edit Layer : '+layer.get('title'), 'Work In Progress...');
	}
});
