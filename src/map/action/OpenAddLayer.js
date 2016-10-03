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
			this.win = Ext.create('Ext.window.Window', {
				title: 'Add Layer',
				width: 400,
				layout: 'fit',
				closeAction: 'hide',
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
