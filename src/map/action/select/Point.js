/**
 * 
 */
Ext.define('Ck.map.action.select.Point', {
	extend: 'Ck.map.action.Select',
	alias: 'widget.ckmapSelectPoint',
	
	itemId: 'selectpoint',
	text: '',
	iconCls: 'ckfont ck-select-point',
	tooltip: 'Sélectionnez par un click',
	waitMsg: "Sélection en progression",
		
	//continueMsg: 'Click to select a feature',

	/**
	 * length or area
	 */
	type: 'point'
});
