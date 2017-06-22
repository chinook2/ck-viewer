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

	iconCls: 'ckfont ck-crosshairs',
	tooltip: 'Open Go to Coordinates',
	config: {
		winWidth: 400,
		winHeight: 200,
		winTitle: 'Go to Coordinates',
		winCollapsible: true
	},

	/**
	 * Create and display a windows with import form
	 */
	doAction: function(btn) {
		if(!this.win) {
			this.win = Ext.create(this.classWindow, {
				title: this.getWinTitle(),
				width: this.getWinWidth(),
				height: this.getWinHeight(),
				autoHeight: true,
				modal: false,
				layout: 'fit',
				closeAction: 'hide',
				collapsible: this.getWinCollapsible(),
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
