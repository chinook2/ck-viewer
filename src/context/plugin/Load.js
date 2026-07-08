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
		ckContext.on("change", this.onContextSelect);
	},
	
	/**
	 * On select context, call context service
	 * @protected
	 * @param {Ck.Context}
	 * @param {Ext.data.Record}
	 */
	onContextSelect: function(cbx, value) {
		if (!value) {
			return;
		}
		Ck.getMap().getContext(value);
	}
});
