/**
 *
 */
Ext.define('Ck.Notify', {
	//alternateClassName: 'Ckn',
	singleton: true,

    requires: [
		'Ck'
	],
	
	align: 'tr',

	info: function(msg, e) {
		Ext.toast({
			html: msg,
			align: this.align,
			hideDuration: 1500,
			slideInDuration: 400
		});
		Ck.log(msg);
		if(e && e.stack) Ck.log(e.stack);
	},

	error: function(msg, e) {
		var cfg = {
			html: msg,
			autoClose: false,
			closable: true,
			minHeight: 60,
			headerPosition: 'right',
			align: this.align,
			bodyStyle: {
				'color': 'red',
				'font-weight': 'bold'
			}
		};
		if(e) {
			cfg.tools = [{
			    type:'help',
			    tooltip: 'Show details',
			    callback: function(panel, tool, event) {
			        // show help here
			        this.eventDetails(e);
			    },
				scope: this
			}];
		}

		Ext.toast(cfg);
		Ck.error(msg);
		if(e && e.stack) Ck.log(e.stack);
	},

	eventDetails: function (e) {
		if(e && e.stack) Ext.Msg.alert('Ck.Notify error details',  Ext.util.Format.nl2br(e.stack));
	}
});
