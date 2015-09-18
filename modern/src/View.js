/**
 *
 */
Ext.define("Ck.View", {
    extend: 'Ext.Container',
    
    requires: [
        'Ck.view.*',
		
		'Ck.Controller',
		'Ck.Ajax',
		'Ck.Map',
		'Ck.Zip'
    ],
    
    controller: 'ckview',
    
    viewModel: {
        type: 'ckview'
    },
    
    layout: {
        type: 'fit'
    }

});
