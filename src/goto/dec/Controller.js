/**
 * Controller of the addlayer panel. An addlayer panel consists of :
 *
 * - AddLayer action add, delete, attribute...
 * - History grid to log modification (optionnal)
 * - Vertex grid to modify geometry accurately (optionnal)
 */
Ext.define('Ck.goto.dec.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckgoto.dec',

	setProjection: function(proj) {
		if(proj.getUnits() == "m") {
			this.view.getComponent("xPanel").getComponent("xUnit").setHtml("&nbsp;m");
			this.view.getComponent("yPanel").getComponent("yUnit").setHtml("&nbsp;m");
		} else {
			this.view.getComponent("xPanel").getComponent("xUnit").setHtml("&nbsp;°");
			this.view.getComponent("yPanel").getComponent("yUnit").setHtml("&nbsp;°");
		}
	},

	setCoordinates: function(c) {
		if (c === null) {
			c = ['',''];
		}
		this.view.getComponent("xPanel").getComponent("x").setValue(c[0]);
		this.view.getComponent("yPanel").getComponent("y").setValue(c[1]);
	},

	getCoordinates: function() {
		var c = [];

		var x = this.view.getComponent("xPanel").getComponent("x").getValue();
		var y = this.view.getComponent("yPanel").getComponent("y").getValue();

		if (x === '' && y === '') {
			return null;
		}
		return [parseFloat(x), parseFloat(y)];
	}
});
