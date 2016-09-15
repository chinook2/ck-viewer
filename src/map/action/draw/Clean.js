/**
 */
Ext.define('Ck.map.action.draw.Clean', {
	extend: 'Ck.Action',
	alias: 'widget.ckmapDrawClean',
	itemId: 'drawClean',
	
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
