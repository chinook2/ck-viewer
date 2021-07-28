/**
 * Component used to select features with a box
 */
Ext.define('Ck.map.action.select.Box', {
	extend: 'Ck.map.action.Select',
	alias: 'widget.ckmapSelectBox',
	
	itemId: 'selectbox',
	text: '',
	iconCls: 'ckfont ck-select-box',
	tooltip: 'Select by rectangle',
	
	continueMsg: 'Glissez pour dessiner un rectange et sélectionner des entités',

	/**
	 * Type used in Selection
	 */
	type: 'Box'
});
