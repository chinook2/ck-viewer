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

	isPrintWindowValid: function() {
		return this.win && !this.win.destroyed && this.print && !this.print.destroyed;
	},

	resetPrintWindow: function() {
		if (this.win && !this.win.destroyed) {
			this.win.destroy();
		}
		this.win = null;
		this.print = null;
	},

	createPrintWindow: function() {
		var printOpt = Ext.apply({
			xtype: 'ckprint',
			ckview: this.getCkView().getView(),
			openner: this
		}, this.printOpt || {});

		this.print = Ext.create(printOpt);

		var controller = this.print.getController();
		var winConfig = Ext.apply({
			title: 'Print',
			width: 400,
			layout: 'fit',
			modal: false,
			closeAction: 'hide',
			parentMap: this.getMap()
		}, this.winOpt || {});

		// Never reuse a destroyed print component from a previous winOpt.
		winConfig.items = [this.print];
		winConfig.listeners = Ext.apply({}, winConfig.listeners, {
			close: { fn: controller.hidePreview, scope: controller },
			show: { fn: controller.showPreview, scope: controller },
			hide: { fn: controller.hidePreview, scope: controller },
			destroy: { fn: this.onPrintWindowDestroy, scope: this }
		});

		this.win = Ext.create(this.classWindow, winConfig);
	},

	onPrintWindowDestroy: function() {
		this.win = null;
		if (this.print && this.print.destroyed) {
			this.print = null;
		}
	},

	ckLoaded: function(mapController) {
		mapController.on("loading", this.resetPrintWindow, this);
	},

	/**
	 * Create and display a windows with print form
	 */
	doAction: function(btn) {
		if (!this.isPrintWindowValid()) {
			this.resetPrintWindow();
			this.createPrintWindow();
		}

		this.win.show();
	},
	
	close: function() {
		if (this.win && !this.win.destroyed) {
			this.win.close();
		}
	},

	destroy: function() {
		this.resetPrintWindow();
	}
});
