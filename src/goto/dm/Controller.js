/**
 * Controller of the addlayer panel. An addlayer panel consists of :
 *
 * - AddLayer action add, delete, attribute...
 * - History grid to log modification (optionnal)
 * - Vertex grid to modify geometry accurately (optionnal)
 */
Ext.define('Ck.goto.dm.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckgoto.dm',
	
	setProjection: Ext.emptyFn,
	
	/**
	 * Set fields value
	 * @params {Float[]} Coordinates in decimal
	 */
	setCoordinates: function(c) {
		this.view.getComponent("xPanel").getComponent("x").setValue(c[0]);
		this.view.getComponent("yPanel").getComponent("y").setValue(c[1]);
		
		if(proj.getUnits() == "m") {
			this.view.getComponent("xPanel").getComponent("xUnit").setHtml("&nbsp;m");
			this.view.getComponent("yPanel").getComponent("yUnit").setHtml("&nbsp;m");
		} else {
			this.view.getComponent("xPanel").getComponent("xUnit").setHtml("&nbsp;°");
			this.view.getComponent("yPanel").getComponent("yUnit").setHtml("&nbsp;°");
		}
	},
	
	/**
	 * Return coordinates in decimal format
	 * @return {Float[]} Coordinates in decimal
	 */
	getCoordinates: Ext.emptyFn
});
