/*
 * @class ck
 * 
 * 
 * @singleton
 */

Ext.define('ck', {
	singleton: true,
	
	getVersion: function() {
		return '2.0.0';
	}
});

// Evite des erreur si on utilise un console.log() sur un navigateur qui ne le gère pas
if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function () { };
if (!window.console.info) window.console.info = function () { };
if (!window.console.warn) window.console.warn = function () { };
if (!window.console.error) window.console.error = function () { };
