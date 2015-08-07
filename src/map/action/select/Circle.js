/**
 * 
 */
Ext.define('Ck.map.action.select.Circle', {
	extend: 'Ck.map.action.Select',
	alias: 'widget.ckmapSelectCircle',
	
	itemId: 'selectcircle',
	text: '',
	iconCls: 'fa fa-asterisk',
	tooltip: 'Select by circle',
		
	continueMsg: 'Drag to draw a circle and select features',

	/**
	 * length or area
	 */
	type: 'circle'
});
