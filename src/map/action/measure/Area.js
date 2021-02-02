/**
 * 
 */
Ext.define('Ck.map.action.measure.Area', {
	extend: 'Ck.map.action.Measure',
	alias: 'widget.ckmapMeasureArea',
	
	itemId: 'measurearea',
	text: '',
	iconCls: 'ckfont ck-measure-area',
	tooltip: Ck.text('measure_area'),
		
	continueMsg: Ck.text('measure_area_msg'),
	
	/**
	 * length or area
	 */
	type: 'area'
});

