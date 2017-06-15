/**
 *
 */
Ext.define('Ck.store.Projection', {
    extend: 'Ext.data.Store',
	autoLoad: false,
	fields: [{
        name: "id",
        type: "string"
    },{
        name: "name",
        type: "string"
    },{
        name: "code",
        type: "string",
        calculate: function (data) {
            return "EPSG:" + data.id;
        }
    },{
        name: "label",
        type: "string",
        calculate: function (data) {
            return data.name + " ("+ data.code +")";
        }
    }],

    data: [{
		id: "2154",
		name: "Lamber 93"
	},{
        id: '4326',
        name: 'WGS 84'
    }]
});

// Init store and add it to StoreManager
Ck.store.Projection.create({
	storeId: 'ckProjection'
});
