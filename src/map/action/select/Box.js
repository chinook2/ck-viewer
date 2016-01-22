/**
 * Component used to select features with a box
 */
Ext.define('Ck.map.action.select.Box', {
	extend: 'Ck.map.action.Select',
	alias: 'widget.ckmapSelectBox',
	
	itemId: 'selectbox',
	text: '',
	iconCls: 'ck ck-select-box',
	tooltip: 'Select by rectangle',
	
	continueMsg: 'Drag to draw a rectangle and select features',

	/**
	 * Type used in Selection
	 */
	type: 'Box'
});
