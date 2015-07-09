/**
 *
 */

Ext.define("ck.Map", {
    extend: "Ext.panel.Panel",
    alias: "widget.ckmap",
    
    requires: [
        'ck.map.*'
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
        
        center: [0, 0],
        zoom: 2,
        
        coordPrecision: 2
    },

    /* TODO : voir si peut simplifier des choses ?
    publishes: [
        'center',
        'zoom',
        'coordPrecision'
    ],
    */
    
    listeners: {
        resize: 'resize' // The resize handle is necessary to set the map!
    }
});