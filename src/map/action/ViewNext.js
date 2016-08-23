/**
 * Basic action to show next view in the map history.
 *
 * Use on a {@link Ext.button.Button} in a {@link Ext.toolbar.Toolbar}.
 *
 *		{
 *			xtype: "button",
 *			scale: "large",
 *         action: "ckmapViewNext"
 *		}
 *
 * Use on item Menu.
 *
 */
Ext.define('Ck.map.action.ViewNext', {
	extend: 'Ck.Action',
	alias: "widget.ckmapViewNext",

	itemId: 'viewnext',
	text: '',
	iconCls: 'ckfont ck-next',
	tooltip: 'Next view',
	disabled: true,

	ckLoaded: function(map, config) {
		var olMap = map.getOlMap();
		if(!map.history) {
			map.history = [];
			map.historyIdx = 0;
			map.historyIgnore = false;
		}

		olMap.on("moveend", function(mapEvt) {
			// Limit history size
			if(map.history.length > 250) map.history.shift();
			if(!map.historyIgnore) {
				// remove unused history when move map from history index
				if(map.historyIdx < map.history.length - 1) map.history.splice(map.historyIdx + 1);

				map.history.push(map.getExtent());
				map.historyIdx = map.history.length - 1;

				// update button status
				this.setDisabled(true);
				if(map.historyIdx > 0) Ck.actions.ckmapViewPrevious.setDisabled(false);
			}
			map.historyIgnore = false;
		}, this);
	},

	/**
	 * Show next view on click.
	 */
	doAction: function(btn) {
		var map = this.getMap();
		if(map.historyIdx + 1 < map.history.length) {
			map.historyIdx++;
			map.setExtent(map.history[map.historyIdx]);
			map.historyIgnore = true;

			// update button status
			Ck.actions.ckmapViewPrevious.setDisabled(false);
			if(map.historyIdx === map.history.length-1) this.setDisabled(true);
		}
	}
});
