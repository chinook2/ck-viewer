/**
 * Action for OpenStreetMap import.
 * Opens a panel to show the OSM Attributions.
 * @author Florent RICHARD
 */
Ext.define('Ck.map.action.osmimport.Attributions', {
	extend: 'Ck.map.action.OsmImport',
	alias: 'widget.ckmapOsmImportAttributions',
	
	itemId: 'osmimportattributions',
	text: '',
	iconCls: 'fa fa-info',
	tooltip: 'Attributions',
	toggleAction:  function(btn, pressed) {
		if(!this.win) {
			this.win = Ext.create('Ext.window.Window', {
				title: 'OSM Attributions',
				// height: 400,
				width: 400,
				layout: 'fit',
				items: [{
					xtype: "ckosmimportattributions"
				}],
				closeAction: 'hide',
				listeners: {
					close: function() {
						btn.setPressed(false);
						this.win.hide();
					},
					scope: this
				}
				
			});
		}
		if (pressed) {
			this.win.show();
		} else {
			this.win.hide()
		}
	}
});

