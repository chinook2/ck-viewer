/**
 * été
 */
Ext.define("ck.View", {
	extend: 'Ext.Container',
	
	requires: [
		// 'Ext.plugin.Viewport',
		// 'Ext.window.MessageBox',
		
		'ck.view.*',
		'ck.Map',
		'ck.Legend'
	],
	
	controller: 'ckview',
	
	viewModel: {
		type: 'ckview'
	},
	
	layout: {
		type: 'fit'
	}

});


// Evite des erreur si on utilise un console.log() sur un navigateur qui ne le gère pas
if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function () { };
if (!window.console.info) window.console.info = function () { };
if (!window.console.warn) window.console.warn = function () { };
if (!window.console.error) window.console.error = function () { };
