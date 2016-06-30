/**
 *
 */

Ext.define("Ck.addlayer.SourceSelector", {
	extend: "Ext.form.ComboBox",
	alias: "widget.ckaddlayer-sourceselector",

	controller: "ckaddlayer.sourceselector",

	config: {
		bodyPadding: 10,
		defaultType: "combo",
		defaults: {
			width: "100%"
		}
	}
});
