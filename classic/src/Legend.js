/**
 * été
 */

Ext.define("ck.Legend", {
    extend: "Ext.tree.Panel",
    alias: "widget.cklegend",
    
    requires: [
        'ck.legend.*'
    ],

    controller: "cklegend",
    
    viewModel: {
        type: "cklegend"
    },

    plugins: ['treechecker'],
    
    viewConfig: {
        plugins: { 
            ptype: 'treeviewdragdrop' 
        }
    },
    
    // listeners: {
        // checkchange: 'onCheckChange'
    // },
    
    config: {
        map: null
    },
    
    useArrows: true,
    rootVisible: false
});