/**
 * Basic action to change language.
 *
 * Use on a {@link Ext.button.Button} in a {@link Ext.toolbar.Toolbar}.
 *
 *		{
 *			"xtype": "button",
 *		    "toLocale": "fr",
 *		    "itemId": "locale-fr",
 *          "action": "cklocaleSet"
 *		}
 *
 * Use on item Menu.
 *
 */
Ext.define('Ck.locale.action.Set', {
	extend: 'Ck.Action',
	alias: "widget.cklocaleSet",

	itemId: 'locale',
	text: '',
	iconCls: '',
	tooltip: 'Choose a language',

	/**
	 * Change locale Ck.Locale.set.
	 */
	doAction: function(btn) {
		if(btn.toLocale) {
			Ck.Locale.set(btn.toLocale);
		}
	}
});