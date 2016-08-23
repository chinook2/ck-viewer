/**
* Basic action to show previous view in the map history.
*
* Use on a {@link Ext.button.Button} in a {@link Ext.toolbar.Toolbar}.
*
*		{
*			xtype: "button",
*			scale: "large",
*         action: "ckmapViewPrevious"
*		}
*
* Use on item Menu.
 *
 */
Ext.define('Ck.map.action.ViewPrevious', {
	extend: 'Ck.Action',
	alias: "widget.ckmapViewPrevious",

	itemId: 'viewprevious',
	text: '',
	iconCls: 'ckfont ck-previous',
	tooltip: 'Previous view',
	disabled: true,

	// Use ViewNext code to manage history
	// ckLoaded: function(map, config) {}

	/**
	* Show previous view on click.
	 */
	doAction: function(btn) {
		var map = this.getMap();

		if(map.historyIdx - 1 >= 0) {
			map.historyIdx--;
			map.setExtent(map.history[map.historyIdx]);
			map.historyIgnore = true;

			// update button status
			Ck.actions.ckmapViewNext.setDisabled(false);
			if(map.historyIdx === 0) this.setDisabled(true);
		}
	}
});
