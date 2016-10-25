/**
 *
 */

Ext.define("Ck.Toolbar", {
	extend: "Ext.toolbar.Toolbar",
	alias: "widget.cktoolbar",
	
	requires: [
		'Ck.toolbar.*',
		'Ck.button.Group'
	],

	controller: "cktoolbar",

	viewModel: {
		type: "cktoolbar"
	},

	config: {
		map: null,

		// If docked toolbar : default over map.
		overlay: true
	},
	
	style: {
		overflow: "visible"
	},

	cls: 'ck-toolbar'
});
