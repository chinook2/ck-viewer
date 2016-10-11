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
				Ext.Msg.alert("Add Layer", "This is not a valid URL : " + url);
			}
		}
	}
});
