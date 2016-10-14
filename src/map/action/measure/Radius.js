/**
 * 
 */
Ext.define('Ck.map.action.measure.Radius', {
	extend: 'Ck.map.action.Measure',
	alias: 'widget.ckmapMeasureRadius',
	
	itemId: 'measurelength',
	text: '',
	iconCls: 'ckfont ck-measure-radius',
	tooltip: 'Measure radius',
		
	continueMsg: 'Click to continue measuring the radius',

	/**
	 * length or area
	 */
	type: 'radius'
});
