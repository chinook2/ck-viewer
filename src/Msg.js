/**
 *	Class Ck.Msg
 *	Use this as you use Ext.Msg but allow to manage locale
 */
Ext.define('Ck.Msg', {
	singleton: true,

	show: function(config) {
		var msgBox = Ext.create('Ext.window.MessageBox', {
			closeAction: 'destroy'
		});
		
		if(Ck.Locale.get() == "fr") {
			msgBox.buttonText = {
				ok: 'OK',
				yes: 'Oui',
				no: 'Non',
				cancel: 'Annuler'
			};
		}
		
		msgBox.show(config);
	}
});
