/**
 *
 */
Ext.define('Ck.map.action.measure.Clear', {
	extend: 'Ck.Action',
	alias: 'widget.ckmapMeasureClear',

	itemId: 'measureclear',
	text: '',
	iconCls: 'ckfont ck-eraser',
	tooltip: 'Supprimer toutes les surfaces',

	toggleGroup: null,
	enableToggle: false,
	
	ckLoaded: function(map) {
		this.measure = Ck.Measure.getInstance({map: map});
	},
	
	/**
	 * 
	 */
	doAction: function(btn) {
		this.measure.clearMeasure();
	}
});
