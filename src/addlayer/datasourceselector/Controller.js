/**
 * Controller of the addlayer panel. An addlayer panel consists of :
 *
 * - AddLayer action add, delete, attribute...
 * - History grid to log modification (optionnal)
 * - Vertex grid to modify geometry accurately (optionnal)
 */
Ext.define('Ck.addlayer.datasourceselector.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckaddlayer.datasourceselector',
	
	/**
	 * @protected
	 */
	init: function(view) {
		var sources = view.getRefOwner().sources;
		view.getStore().loadData(sources);
		if(sources.length < 2 && !view.editable) {
			view.hide();
			view.getRefOwner().on("afterrender", function() {
				view.select(view.getStore().getAt(0));
				view.fireEvent("select", view, view.getStore().getAt(0));
			});
		}
		this.callParent([view]);
	},
	
	onKeyPress: function(cbx, evt) {
		if(evt.getKey() == evt.ENTER) {
			var url = cbx.getRawValue().trim();
			if(Ext.form.VTypes.url(url)) {
				// Avoid URL duplication
				if(cbx.store.find('url', url) != -1) return;

				// Add URL in the list
				var newService = cbx.store.createModel({
					'name': false,
					'title': url,
					'url': url,
					'type': cbx.service
				});
				cbx.store.add(newService);

				// Charge le getcapabilities (simule select ds la liste)
				cbx.fireEvent('select', cbx, newService, cbx.store.getTotalCount());
			} else {
				Ck.alert("Add Layer", "This is not a valid URL : " + url);
			}
		}
	}
});
