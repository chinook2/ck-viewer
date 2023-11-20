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

	iconCls: 'ckfont ck-print',
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
			this.print = Ext.create(Ext.applyIf(this.printOpt, {
				xtype: 'ckprint',
				ckview: this.getCkView().getView(),
				openner: this
			}));

			this.winOpt = Ext.applyIf(this.winOpt, {
				title: 'Print',
				width: 400,
				layout: 'fit',
				modal: false,
				closeAction: 'hide',
				items: [this.print],
				parentMap: this.getMap(),
				listeners: {
					close: this.print.getController().hidePreview,
					show: this.print.getController().showPreview,
					scope: this.print.getController()
				},
				buttons: [{
					text: "Print",
					handler: this.print.getController().beforePrint.bind(this.print.getController()),
					scale : 'medium',
					cls : 'i-primary-btn i-upper-btn'
				},{
					text: "Cancel",
					handler: this.print.getController().cancel.bind(this.print.getController()),
					scale : 'medium',
					cls : 'i-upper-btn'
				}]
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
