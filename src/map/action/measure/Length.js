/**
 * 
 */
Ext.define('Ck.map.action.measure.Length', {
	extend: 'Ck.map.action.Measure',
	alias: 'widget.ckmapMeasureLength',
	
	itemId: 'measurelength',
	text: '',
	iconCls: 'ckfont ck-measure-length',
	tooltip: Ck.text('measure_length'),
		
	continueMsg: Ck.text('measure_length_msg'),

	/**
	 * length or area
	 */
	type: 'length'
});
