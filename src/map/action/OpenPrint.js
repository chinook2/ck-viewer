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
Ext.define('Ck.map.action.OpenPrint', {
	extend: 'Ck.Action',
	alias: "widget.ckOpenPrint",

	requires: [
		'Ck.Print'
	],

	itemId: 'openprint',
	text: '',
	
	iconCls: 'fa fa-print',
	tooltip: 'Open print panel',
	
	/**
	 * Object to override window instanciation parameters
	 */
	winOpt: {},
	
	/**
	 * Object to override print instanciation parameters
	 */
	printOpt: {},

	/**
	 * Create and display a windows with print form
	 */
	doAction: function(btn) {
		if(!this.win) {
			this.printOpt = Ext.applyIf(this.printOpt, {
				xtype: 'ckprint',
				ckview: this.getCkView().getView(),
				openner: this
			});
			
			this.winOpt = Ext.applyIf(this.winOpt, {
				title: 'Print',
				width: 400,
				layout: 'fit',
				modal: false,
				closeAction: 'hide',
				items: [this.printOpt]
			});
			
			this.win = Ext.create(this.classWindow, this.winOpt);
		}

		this.win.show();
	},

	close: function() {
		this.win.hide();
	}
});
