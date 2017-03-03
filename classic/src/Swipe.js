/**
 * 
 */

Ext.define("Ck.Swipe", {
	extend: "Ext.slider.Single",
	alias: "widget.ckswipe",
	
	config: {
		map: null
	},
	
	useArrows: true,
	rootVisible: false,
	hideHeaders: true,
	
	cls: "ck-swipe",	
	value: 50,
	increment: 1,
	minValue: 0,
	maxValue: 100,
	useTips: false
});
