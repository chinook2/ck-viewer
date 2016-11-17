/**
 *
 */
Ext.define('Ck.map.action.OpenAddLayer', {
	extend: 'Ck.Action',
	alias: "widget.ckOpenAddLayer",

	requires: [
		'Ck.AddLayer'
	],

	itemId: 'openaddlayer',
	text: '',

	iconCls: 'fa fa-download',
	tooltip: 'Open add layer panel',

	config: {
		winWidth: 400,
		winHeight: 250,
		winCollapsible: true,
		winMaximizable: true
	},

	/**
	 * Create and display a windows with import form
	 */
	doAction: function(btn) {
		if(!this.win) {
			this.win = Ext.create(this.classWindow, {
				title: 'Add Layer',
				height: this.getWinHeight(),
				width: this.getWinWidth(),
				minHeight: 250,
				minWidth: 300,
				layout: 'fit',
				closeAction: 'hide',
				collapsible: this.getWinCollapsible(),
				maximizable: this.getWinMaximizable(),
				items: {
					xtype: 'ckaddlayer',
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
