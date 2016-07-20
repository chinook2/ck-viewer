/**
 *
 */
Ext.define('Ck.Notify', {
	//alternateClassName: 'Ckn',
	singleton: true,

	align: 'tr',

	info: function(msg) {
		Ext.toast({
			html: msg,
			align: this.align,
			slideInDuration: 400
		});
	},

	error: function(msg) {
		Ext.toast({
			html: msg,
			autoClose: false,
			closable: true,
			headerPosition: 'right',
			align: this.align,
			bodyStyle: {
				'color': 'red',
				'font-weight': 'bold'
			}
		});
		Ck.error(msg);
	}
});
