/**
 * Basic action to go back to next view.
 *
 * Use on a {@link Ext.button.Button} in a {@link Ext.toolbar.Toolbar}.
 * 
 *		{
 *			xtype: "button",
 *			scale: "large",
 *         action: "ckmapNextview"
 *		}
 *
 * Use on item Menu.
 *
 */
Ext.define('Ck.map.action.NextView', {
	extend: 'Ck.Action',
	alias: "widget.ckmapNextview",
	
	itemId: 'nextview',
	text: '',
	iconCls: 'ckfont ck-redo2',
	tooltip: 'Next view',
	
	/**
	 * Nex view if exists
	 */
	doAction: function(btn) {
		if(this.controller.currViewIdx + 1 < this.controller.viewStore.getCount()) {
			this.controller.currViewIdx++;
			var view = this.controller.getOlView();
			var item = this.controller.viewStore.getAt(this.controller.currViewIdx);
			this.controller.ignoreViewRegister = true;
			view.setZoom(item.get("zoom"));
			view.setCenter(item.get("center"));			
		}
	}
});
