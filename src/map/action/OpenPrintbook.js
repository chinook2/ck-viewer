/**
 * Basic action to zoom in the map (zoom level + 1).
 *
 * Use on a {@link Ext.button.Button} in a {@link Ext.toolbar.Toolbar}.
 *
 *		{
 *			xtype: "button",
 *			scale: "large",
 *         action: "ckmapZoomin"
 *		}
 *
 * Use on item Menu.
 *
 */
Ext.define('Ck.map.action.OpenPrintbook', {
	extend: 'Ck.Action',
	alias: "widget.ckOpenPrintbook",

	requires: [
		'Ck.Printbook'
	],

	itemId: 'openprintbook',
	text: '',

	iconCls: 'ckfont ck-guide',
	tooltip: 'Open print book panel',

	/**
	 * Object to override window instanciation parameters
	 */
	winOpt: {},

	/**
	 * Object to override print instanciation parameters
	 */
	printbookOpt: {},

	/**
	 * Create and display a windows with print form
	 */
	doAction: function(btn) {
		if(!this.win) {
			this.printbook = Ext.create(Ext.applyIf(this.printbookOpt, {
				xtype: 'ckprintbook',
				ckview: this.getCkView().getView(),
				openner: this
			}));

			this.winOpt = Ext.applyIf(this.winOpt, {
				title: 'Print book',
				width: 600,
				layout: 'fit',
				modal: false,
				closeAction: 'hide',
				items: [this.printbook],
				parentMap: this.getMap(),
				listeners: {
					show: this.printbook.getController().composeCanvas,
					scope: this.printbook.getController()
				}
			});

			this.win = Ext.create(this.classWindow, this.winOpt);
		}

		this.win.show();
	},
	
	close: function() {
		this.win.close();
	},

	destroy: function() {
		if(this.win) this.win.destroy();
	}
});
