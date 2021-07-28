/**
 * Component used to select features with a polygon
 */
Ext.define('Ck.map.action.select.Polygon', {
	extend: 'Ck.map.action.Select',
	alias: 'widget.ckmapSelectPolygon',
	
	itemId: 'selectpolygon',
	text: '',
	iconCls: 'ckfont ck-select_polygon',
	tooltip: 'Select by polygon',
	
	continueMsg: "Clickez sur la carte pour commencer la sélection à partir d'un rectangle",

	/**
	 * Type used in Selection
	 */
	type: 'Polygon'
});
