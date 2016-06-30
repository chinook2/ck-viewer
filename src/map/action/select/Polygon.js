/**
 * Component used to select features with a polygon
 */
Ext.define('Ck.map.action.select.Polygon', {
	extend: 'Ck.map.action.Select',
	alias: 'widget.ckmapSelectPolygon',
	
	itemId: 'selectpolygon',
	text: '',
	iconCls: 'ckfont ck-select-box',
	tooltip: 'Select by polygon',
	
	continueMsg: 'Click on the map to start polygon selection',

	config: {
		/**
		 * Type of selection
		 */
		type: 'Polygon'
	}
});
