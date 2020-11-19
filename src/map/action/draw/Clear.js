/**
 */
Ext.define('Ck.map.action.draw.Clear', {
	extend: 'Ck.Action',
	alias: 'widget.ckmapDrawClear',
	itemId: 'drawClear',
	iconCls: 'ckfont ck-draw-clear',
	
	drawId: "default",
	requires: [
		'Ck.Draw'
	],
	
	/**
	 * [ckLoaded description]
	 * @param  {Ck.map} map [description]
	 */
	ckLoaded: function(map) {
		this.olMap = map.getOlMap();
		
		this.draw = Ck.Draw.getInstance({
			map: map,
			id: "default"
		});
	},
	
	/**
	 * [doAction description]
	 * @param  {Ext.button.Button} btn [description]
	 */
	doAction: function(btn) {
		this.draw.getSource().clear();
	}
});
