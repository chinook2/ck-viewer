/**
 */
Ext.define('Ck.map.action.draw.Line', {
	extend: 'Ck.map.action.draw.Action',
	alias: 'widget.ckmapDrawLine',
	
	itemId: 'drawLine',
	iconCls: 'ckfont ck-flow-line',
	
	tooltip: "Draw lines",

	type: "LineString"
});
