/**
 *
 */
Ext.define("Ck.Map", {
    extend: "Ext.Panel",
    alias: "widget.ckmap",
    
    requires: [
        'Ck.map.*'
    ],

    controller: "ckmap",
    
    viewModel: {
        type: "ckmap"
    },

    layout: {
        type: 'fit'
    },
    
    config: {
        map: null,
        
        coordPrecision: 2
    },

    listeners: {
        resize: 'resize' // The resize handle is necessary to set the map!
    }
});