/**
 *
 */

Ext.define("Ck.Context", {
	extend: "Ext.form.ComboBox",
	alias: "widget.context",

	controller: "context",

	config: {
		displayField: "Text",
		valueField: "Name",
		queryMode: "local",
		bodyPadding: 10,
		editable: false,
		defaults: {
			width: "100%"
		}
	},

	tpl: Ext.create('Ext.XTemplate',
		'<ul class="x-list-plain"><tpl for=".">',
			'<li role="option" class="x-boundlist-item ck-private-context-{private}">{Title}</li>',
		'</tpl></ul>'
	)
});
