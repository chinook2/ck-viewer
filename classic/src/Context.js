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
		defaults: {
			width: "100%"
		}
	}
});
