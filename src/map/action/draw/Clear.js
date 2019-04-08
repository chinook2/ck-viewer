/**
 */
Ext.define('Ck.map.action.draw.Clear', {
	extend: 'Ck.Action',
	alias: 'widget.ckmapDrawClear',
	itemId: 'drawClear',
	iconCls: 'ckfont ck-eraser',
	
	drawId: "default",
	requires: [
		'Ck.Draw'
	],
	
	/**
	 *
	 */
	ckLoaded: function(map) {
		this.olMap = map.getOlMap();
		
		this.draw = Ck.Draw.getInstance({
			map: map,
			id: "default"
		});
	},
	
	/**
	 * 
	 */
	doAction: function(btn) {
		this.draw.getSource().clear();
	}
});