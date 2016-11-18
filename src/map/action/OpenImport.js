/**
 *
 */
Ext.define('Ck.map.action.OpenImport', {
	extend: 'Ck.Action',
	alias: "widget.ckOpenImport",

	requires: [
		'Ck.ImportVector'
	],

	itemId: 'openimport',
	text: '',

	iconCls: 'fa fa-download',
	tooltip: 'Open import panel',

	/**
	 * Create and display a windows with import form
	 */
	doAction: function(btn) {
		if(!this.win) {
			this.win = Ext.create(this.classWindow, {
				title: 'Import',
				// height: 400,
				width: 400,
				layout: 'fit',
				closeAction: 'hide',
				items: {
					xtype: 'ckimportvector',
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
