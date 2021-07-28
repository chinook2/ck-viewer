/**
 */
Ext.define('Ck.map.action.draw.Point', {
	extend: 'Ck.map.action.draw.Action',
	alias: 'widget.ckmapDrawPoint',
	
	itemId: 'drawPoint',
	iconCls: 'ckfont ck-map-marker2',
	
	tooltip: 'Dessinez des points',
	
	type: "Point",
	win: null
});
