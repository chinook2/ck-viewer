/**
 * 
 */
Ext.define('Ck.map.action.measure.Radius', {
	extend: 'Ck.map.action.Measure',
	alias: 'widget.ckmapMeasureRadius',
	
	itemId: 'measurelength',
	text: '',
	iconCls: 'ckfont ck-measure-radius',
	tooltip: Ck.text('measure_radius'),
		
	continueMsg: Ck.text('measure_radius_msg'),

	/**
	 * length or area
	 */
	type: 'radius'
});
