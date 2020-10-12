/**
 */
Ext.define('Ck.map.action.draw.Clear', {
	extend: 'Ck.Action',
	alias: 'widget.ckmapDrawClear',
	itemId: 'drawClear',
	iconCls: 'ckfont ck-eraser',
	
	tooltip: "Remove all drawings",
	
	drawId: "default",

	requires: [
		'Ck.Draw'
	],
	
	
	/**
	 * [doAction description]
	 * @param  {Ext.button.Button} btn [description]
	 */
	doAction: function(btn) {
		this.getDraw();
		this.draw.getSource().clear();
	},

	/**
	 * [getDraw description]
	 * @param  {[type]} map [description]
	 */
	getDraw: function(map) {
		if(!map) map = this.getMap();
		this.draw = Ck.Draw.getInstance({
			map: map,
			id: this.drawId
		});
		this.draw.win = this.win;
	}
});
