
Ext.define("Ck.Forms",{
    extend: "Ext.form.Panel",
    alias: "widget.ckforms",
    
    requires: [
        'Ext.layout.*',
        'Ext.form.*',
        'Ext.tab.*',
        'Ext.grid.*',
		'Ck.forms.*'
        //'Ext.ux.printer.*',
    ],
    
    controller: "ckforms",
    viewModel: {
        type: "ckforms"
    },
    
    config: {
        layer: null,    // nom du layer = nom de la table
		formName: null,  // nom du formulaire
        fid: null,        // Feature ID : recup depuis le geoJSON 
        sid: null,        // Storage ID (peut être = au fid) : Identifiant unique de la base (utile avec persistencejs)
        isSubForm: false
    },
    
    layout: 'form',
    
    dockedItems: [{
        xtype: 'toolbar',
        dock: 'bottom',
        ui: 'footer',
        defaults: {minWidth: 150},
        items: ['->',{
            xtype: "button",
            text: "Save",
            handler: 'formSaveClick'
        },{
            xtype: "button",
            text: "Cancel",
            handler: 'formCloseClick'
        }]
    }],
	
	cls: 'ckforms'
});