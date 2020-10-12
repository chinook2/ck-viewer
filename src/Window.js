/**
 *
 */
Ext.define('Ck.Window', {
	extend: 'Ext.window.Window',
	alternateClassName: 'CkWin',

	tmpHide: false,
		
	initComponent: function() {
		this.callParent(arguments);
		
		if(this.parentMap && this.parentMap.bindVisibility) {
			this.parentMap.bindVisibility(this);
		}

		// When loading context (change context) close all Windows
		Ext.on('ckmapLoading', function() {
			this.close();
		}, this);
	}
});
