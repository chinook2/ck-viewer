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

	/**
	 * Create and display a windows with import form
	 */
	doAction: function(btn) {
		if(!this.win) {
			this.win = Ext.create(this.classWindow, {
				title: 'Add Layer',
				height: 250,
				width: 400,
				minHeight: 250,
				minWidth: 300,
				layout: 'fit',
				closeAction: 'hide',
				collapsible: true,
				maximizable: true,
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
