/**
 * 
 */
Ext.define('Ck.map.action.measure.Length', {
	extend: 'Ck.map.action.Measure',
	alias: 'widget.ckmapMeasureLength',
	
	itemId: 'measurelength',
	text: '',
	iconCls: 'ck ck-measure-length',
	tooltip: 'Measure length',
		
	continueMsg: 'Click to continue measuring the length',

	/**
	 * length or area
	 */
	type: 'length'
});
