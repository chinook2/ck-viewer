/**
 * This class is the view model for the Main view of the application.
 */
Ext.define('ck.view.Model', {
    extend: 'Ext.app.ViewModel',

    alias: 'viewmodel.ckview',

    data: {
        name: Ext.manifest.name
    }

    //TODO - add data, formulas and/or methods to support your view
});