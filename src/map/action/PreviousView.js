/**
 * Basic action to go back to previous view.
 *
 * Use on a {@link Ext.button.Button} in a {@link Ext.toolbar.Toolbar}.
 * 
 *		{
 *			xtype: "button",
 *			scale: "large",
 *         action: "ckmapPreviousview"
 *		}
 *
 * Use on item Menu.
 *
 */
Ext.define('Ck.map.action.PreviousView', {
	extend: 'Ck.Action',
	alias: "widget.ckmapPreviousview",
	
	itemId: 'previousview',
	text: '',
	iconCls: 'ckfont ck-undo2',
	tooltip: 'Previous view',
	
	/**
	 * Previous view if exists
	 */
	doAction: function(btn) {
		if(this.controller.currViewIdx - 1 >= 0) {
			this.controller.currViewIdx--;
			var view = this.controller.getOlView();
			var item = this.controller.viewStore.getAt(this.controller.currViewIdx);
			this.controller.ignoreViewRegister = true;
			view.setZoom(item.get("zoom"));
			view.setCenter(item.get("center"));			
		}
	}
});
