/**
 * 
 */
Ext.define('Ck.map.action.measure.Length', {
	extend: 'Ck.map.action.Measure',
	alias: 'widget.ckmapMeasureLength',
	
	itemId: 'measurelength',
	text: '',
	iconCls: 'fa fa-gear',
	tooltip: 'Measure length',
		
	continueMsg: 'Click to continue measuring the length',

	/**
	 * length or area
	 */
	type: 'length'
});
