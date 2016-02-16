/**
 *
 */
Ext.define('Ck.result.feature.Controller', {
	extend: 'Ck.Controller',
	alias: 'controller.ckresult.feature',
	
	/**
	 * @protected
	 */
	init: function(view) {
		var menu = view.getExtraMenu();
		if(menu.length > 0) {
			var gridCols = view.getHeaderContainer().getMenu();
			
			for(var i = 0; i < menu.length; i++) {	
				var majBtn = Ext.create(menu[i]);
				gridCols.add(majBtn);
			}
		}
		
	}
});
