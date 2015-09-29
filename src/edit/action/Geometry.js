/**
 *
 */
Ext.define('Ck.edit.action.Geometry', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditGeometry',

	iconCls: 'fa fa-edit',
	tooltip: 'Edit geometry',

	toggleAction: function(btn, status) {
		this.used = true;
	},
	
	closeAction: function() {
		
	}
});