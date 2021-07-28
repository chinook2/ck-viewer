/**
 * 
 */
Ext.define('Ck.map.action.measure.Area', {
	extend: 'Ck.map.action.Measure',
	alias: 'widget.ckmapMeasureArea',
	
	itemId: 'measurearea',
	text: '',
	iconCls: 'ckfont ck-measure-area',
	tooltip: 'Mesurer une surface',
		
	continueMsg: 'Cliquez pour continuer à mesurer la surface',
	
	/**
	 * length or area
	 */
	type: 'area'
});

