/**
 * This is the layer loading element manager
 */
Ext.define('Ck.context.plugin.Load', {
	extend: 'Ext.AbstractPlugin',
	alias: 'plugin.context.load',
	
	/**
	 * On select context, load it on the map
	 * @protected
	 * @param {Ck.Context}
	 */
	init: function(ckContext) {
		ckContext.on("select", this.onContextSelect);
	},
	
	onContextSelect: function(cbx, rcd) {
		url = Ck.Controller.prototype.getFullUrl(Ck.getApi()) + "service=wmc&request=getContext&format=json&context=" + rcd.get("Name")
		Ck.getMap().getContext(url);
	}
});
