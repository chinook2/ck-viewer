/**
 *
 */
Ext.define('Ck.map.action.Goto', {
	extend: 'Ck.Action',
	alias: "widget.ckOpenGoto",

	requires: [
		'Ck.Goto'
	],

	itemId: 'opengoto',
	text: '',

	// iconCls: 'fa fa-search',
	iconCls: 'fa fa-crosshairs',
	tooltip: 'Open go to coordinates panel',

	/**
	 * Create and display a windows with import form
	 */
	doAction: function(btn) {
		if(!this.win) {
			this.win = Ext.create(this.classWindow, {
				title: 'Coordinates',
				autoHeight: true,
				modal: false,
				width: 350,
				layout: 'fit',
				closeAction: 'hide',
				//collapsible: true,
				//resizable: true,
				items: {
					xtype: 'ckgoto',
					ckview: this.getCkView().getView(),
					openner: this
				}
			});
		}

		this.win.show();
	},

	close: function() {
		this.win.hide();
	}
});
