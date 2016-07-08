/**
 * Edit tool used to end new feature creation.
 * this.layer define with layer will be used for snapping
 */
Ext.define('Ck.edit.action.EndCreate', {
	extend: 'Ck.edit.Action',
	alias: 'widget.ckEditEndCreate',

	/**
	 * Default properties when this action is used through a button
	 */
	itemId: 'edit-end-create',
	iconCls: 'fa fa-check',
	tooltip: 'End creation',

	/**
	 * End the geometry creation interaction
	 **/
	toggleAction: function(btn, status) {
		this.callParent(arguments);
		
		if(status) {
			var createAction = Ck.getActionByItemId("edit-create");
		
			if(createAction && createAction.drawInteraction) {
				createAction.drawInteraction.finishDrawing();
			} else {
				Ck.Msg.show({
					title: "Create features",
					message: "You need to activate creation mode first before using this feature.",
					buttons: Ext.Msg.OK,
					icon: Ext.Msg.ERROR
				});
			}
			
			btn.toggle(false);
		}		
	},

	doAction: function(btn) {
		this.callParent(arguments);
	}
});