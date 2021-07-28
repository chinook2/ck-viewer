/**
 * 
 */
Ext.define('Ck.map.action.measure.Radius', {
	extend: 'Ck.map.action.Measure',
	alias: 'widget.ckmapMeasureRadius',
	
	itemId: 'measurelength',
	text: '',
	iconCls: 'ckfont ck-measure-radius',
	tooltip: 'Mesurer un angle',
		
	continueMsg: "Cliquez pour continuer à mesurer l'angle",

	/**
	 * length or area
	 */
	type: 'radius'
});
