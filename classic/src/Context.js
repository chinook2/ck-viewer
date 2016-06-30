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
	}
});
