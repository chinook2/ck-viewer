/**
 * 
 */
Ext.define('Ck.map.action.measure.Area', {
	extend: 'Ck.map.action.Measure',
	alias: 'widget.ckmapMeasureArea',
	
	itemId: 'measurearea',
	text: '',
	//iconCls: 'fa fa-gear',
	iconCls: 'ck ck-measure-area',
	tooltip: 'Measure area',
		
	continueMsg: 'Click to continue measuring the area',
	
	/**
	 * length or area
	 */
	type: 'area'
});

