/**
 *
 */
Ext.define("Ck.View", {
    extend: 'Ext.Container',
    
    requires: [
        'Ck.view.*',
		
		'Ck.Controller',
		'Ck.Ajax',
		'Ck.Map'
    ],
    
    controller: 'ckview',
    
    viewModel: {
        type: 'ckview'
    },
    
    layout: {
        type: 'fit'
    }

});
