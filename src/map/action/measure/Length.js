/**
 * 
 */
Ext.define('Ck.map.action.measure.Length', {
	extend: 'Ck.map.action.Measure',
	alias: 'widget.ckmapMeasureLength',
	
	itemId: 'measurelength',
	text: '',
	iconCls: 'ckfont ck-measure-length',
	tooltip: 'Mesurer une distance',
		
	continueMsg: 'Cliquez pour continuer à mesurer le tracé',

	/**
	 * length or area
	 */
	type: 'length'
});
