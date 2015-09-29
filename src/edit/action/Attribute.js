/**
 *
 */
Ext.define('Ck.edit.action.Attribute', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditAttribute',

	iconCls: 'fa fa-align-justify',
	tooltip: 'Edit attribute',

	toggleAction: function(btn, status) {
		this.used = true;
	},
	
	closeAction: function() {
		
	}
});