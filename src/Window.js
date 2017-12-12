/**
 *
 */
Ext.define('Ck.Window', {
	extend: 'Ext.window.Window',
	alternateClassName: 'CkWin',

	tmpHide: false,
		
	initComponent: function() {
		this.callParent(arguments);
		
		if(this.parentContainer) {
			this.parentContainer.on("hide", function() {
					this.tmpHide = this.isVisible();
					if(this.tmpHide) {
						this.hide();
					}
				}.bind(this)
			);

			this.parentContainer.on("show", function() {
					if(this.tmpHide) {
						this.show();
					}
				}.bind(this)
			);
		}
	}
});
