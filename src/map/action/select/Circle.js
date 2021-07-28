/**
 * 
 */
Ext.define('Ck.map.action.select.Circle', {
	extend: 'Ck.map.action.Select',
	alias: 'widget.ckmapSelectCircle',
	
	itemId: 'selectcircle',
	text: '',
	iconCls: 'ckfont ck-select-circle',
	tooltip: 'Select by circle',
		
	continueMsg: 'Glissez pour dessiner un cercle et sélectionner des entités',

	/**
	 * length or area
	 */
	type: 'circle'
});
