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
		
	continueMsg: 'Drag to draw a circle and select features',

	config: {
		/**
		 * Type of selection
		 */
		type: 'Circle'
	}
});
