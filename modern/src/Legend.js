/**
 * été
 */

Ext.define("ck.Legend", {
    extend: "Ext.list.Tree",
    alias: "widget.cklegend",
    
    requires: [
        'ck.legend.*'
    ],

    controller: "cklegend",
    
    viewModel: {
        type: "cklegend"
    },

    // layout: {
        // type: 'fit'
    // },
    
    config: {
        map: null
    },
    
    bind: {
        store: '{layers}'
    },
    useArrows: true,
    rootVisible: false
});