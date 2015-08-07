/**
 * 
 */
Ext.define('Ck.map.action.select.Box', {
	extend: 'Ck.map.action.Select',
	alias: 'widget.ckmapSelectBox',
	
	itemId: 'selectbox',
	text: '',
	iconCls: 'fa fa-asterisk',
	tooltip: 'Select by rectangle',
	
	continueMsg: 'Drag to draw a rectangle and select features',

	/**
	 * length or area
	 */
	type: 'box'
});
