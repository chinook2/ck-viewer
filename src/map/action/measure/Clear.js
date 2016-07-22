/**
 *
 */
Ext.define('Ck.map.action.measure.Clear', {
	extend: 'Ck.map.action.Measure',
	alias: 'widget.ckmapMeasureClear',

	itemId: 'measureclear',
	text: '',
	iconCls: 'ckfont ck-eraser',
	tooltip: 'Clear all measures',

	toggleGroup: null,
	enableToggle: false,
	type: null,

	doAction: function() {
		this.clearAll();
	}
});
