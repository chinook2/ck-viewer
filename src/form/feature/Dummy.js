/**
 * from Ext.grid.feature.AbstractSummary & Ext.grid.feature.Summary
 */
Ext.define('Ck.form.feature.Dummy', {
    extend: 'Ext.grid.feature.Feature',

    alias: 'feature.dummy',

    panelBodyCls: Ext.baseCSSPrefix + 'dummy-',
    dummyItemCls: Ext.baseCSSPrefix + 'grid-item',
    dummyRowCls: Ext.baseCSSPrefix + 'grid-row '+ Ext.baseCSSPrefix +'grid-row-dummy',
    dummyRowSelector: '.' + Ext.baseCSSPrefix + 'grid-row-dummy',

    /**
     * @cfg {Boolean}
     * True to show the dummy row.
     */
    showDummyRow: true,

    // High priority rowTpl interceptor which sees summary rows early, and renders them correctly and then aborts the row rendering chain.
    // This will only see action when summary rows are being updated and Table.onUpdate->Table.bufferRender renders the individual updated sumary row.
    dummyRowTpl: {
        fn: function(out, values, parent) {
            // If a summary record comes through the rendering pipeline, render it simply instead of proceeding through the tplchain
            if (values.record.isDummy && this.dummyFeature.showDummyRow) {
                this.dummyFeature.outputDummyRecord(values.record, values, out, parent);
            } else {
                this.nextTpl.applyOut(values, out, parent);
            }
        },
        priority: 1000
    },

    init: function(grid) {
        var me = this,
            view = me.view;
        
        me.callParent([grid]);

        me.view.dummyFeature = me;
        me.rowTpl = me.view.self.prototype.rowTpl;

        // Add a high priority interceptor which renders summary records simply
        // This will only see action ona bufferedRender situation where summary records are updated.
        me.view.addRowTpl(me.dummyRowTpl).dummyFeature = me;

        // Cell widths in the summary table are set directly into the cells. There's no <colgroup><col>
        // Some browsers use content box and some use border box when applying the style width of a TD
        //if (!me.summaryTableCls) {
        //    me.summaryTableCls = Ext.baseCSSPrefix + 'grid-item';
        //}

        if (grid.bufferedRenderer) {
            me.wrapsItem = true;
            view.on('refresh', me.onViewRefresh, me);
        } else {
            me.wrapsItem = false;
            me.view.addFooterFn(me.renderDummyRow);
        }

        // Listen to dummy row click
        grid.on({
            click: this.onDummyClick,
            element: 'body',
            delegate: this.dummyRowSelector,
            scope: me
        });

        grid.ownerGrid.on({
            beforereconfigure: me.onBeforeReconfigure,
            columnmove: me.onStoreUpdate,
            scope: me
        });
        me.bindStore(grid, grid.getStore());

        var c = grid.getConfig();
        if ((grid.editing === true) || (c && c.editing === true)){
            this.showDummyRow = true;
        } else {
            this.showDummyRow = false;
        }
    },

    onBeforeReconfigure: function(grid, store) {
        this.dummyRecord = null;

        if (store) {
            this.bindStore(grid, store);
        }
    },

    bindStore: function(grid, store) {
        var me = this;

        Ext.destroy(me.storeListeners);
        me.storeListeners = store.on({
            scope: me,
            destroyable: true,
            update: me.onStoreUpdate,
            datachanged: me.onStoreUpdate
        });
    },

    outputDummyRecord: function(dummyRecord, contextValues, out) {
        var view = contextValues.view,
            savedRowValues = view.rowValues,
            columns = contextValues.columns || view.headerCt.getVisibleGridColumns(),
            colCount = columns.length, i, column,
            // Set up a row rendering values object so that we can call the rowTpl directly to inject
            // the markup of a grid row into the output stream.
            values = {
                view: view,
                record: dummyRecord,
                rowStyle: '',
                rowClasses: [ this.dummyRowCls ],
                itemClasses: [],
                recordIndex: -1,
                rowId: view.getRowId(dummyRecord),
                columns: columns
            };

        // Use the base template to render a summary row
        view.rowValues = values;
        view.self.prototype.rowTpl.applyOut(values, out, parent);
        view.rowValues = savedRowValues;
    },

    renderDummyRow: function(values, out, parent) {
        var view = values.view,
            me = view.findFeature('dummy'),
            record, rows;

        // If we get to here we won't be buffered
        if (!me.disabled && me.showDummyRow) {
            record = me.dummyRecord;

            out.push('<table cellpadding="0" cellspacing="0" class="' +  me.dummyItemCls + '" style="width: 0;">');
            me.outputDummyRecord((record && record.isModel) ? record : me.createDummyRecord(view), values, out, parent);
            out.push('</table>');
        }
    },
    getSummaryRowPlaceholder: function(view) {
        var placeholderCls = this.dummyItemCls,
            nodeContainer, row;
 
        nodeContainer = Ext.fly(view.getNodeContainer());
 
        if (!nodeContainer) {
            return null;
        }
 
        row = nodeContainer.down('.' + placeholderCls, true);
 
        if (!row) {
            row = nodeContainer.createChild({
                tag: 'table',
                cellpadding: 0,
                cellspacing: 0,
                cls: placeholderCls,
                style: 'table-layout: fixed; width: 100%',
                children: [{
                    tag: 'tbody' // Ensure tBodies property is present on the row
                }]
            }, false, true);
        }
 
        return row;
    },

    /*
    vetoEvent: function(record, row, rowIndex, e) {
        return !e.getTarget(this.dummyRowSelector);
    },
    */
    onViewRefresh: function(view) {
        var me = this,
            record, row;

        // Dummt row already here
        if(view.el.down(me.dummyRowSelector, true)) {
            this.onStoreUpdate();
            return;
        }

        // Only add this listener if in buffered mode, if there are no rows then
        // we won't have anything rendered, so we need to push the row in here
        if (!me.disabled && me.showDummyRow) {
            record = me.createDummyRecord(view);
            row = me.getSummaryRowPlaceholder(view);

            var el = view.createRowElement(record, -1).querySelector(me.dummyRowSelector);
            if(el) row.tBodies[0].appendChild(el);
        }
    },

    createDummyRecord: function (view) {
        var me = this,
            dummyRecord = me.dummyRecord,
            modelData;

        if (!dummyRecord) {
            modelData = view.store.getModel();
            dummyRecord = me.dummyRecord = Ext.create(modelData);
        }

        dummyRecord.isDummy = true;
        dummyRecord.isSummary = true;

        return dummyRecord;
    },

    onStoreUpdate: function() {
        //return;
        var me = this,
            view = me.view,
            selector = me.dummyRowSelector,
            dummyRowDom;

        if (!view.rendered) {
            return;
        }

        // Move always dummy row to the bottom
        dummyRowDom = view.el.down(selector);
        if (dummyRowDom) {
            //view.getNodeContainer()
            view.body.appendChild(dummyRowDom.getParent().dom);
        }
    },

    onDummyClick: function () {
        if (this.grid.fireEvent('beforedummyclick', this) !== false) {
            // Add new empty line
            var rec = this.grid.getStore().add({}).pop();

            // Start editing
            var plg = this.grid.findPlugin('rowediting');
            if(plg) plg.startEdit(rec, 0);

            this.grid.fireEvent('dummyclick', this);
        }
    },

    destroy: function() {
        var me = this;
        me.dummyRecord = me.storeListeners = Ext.destroy(me.storeListeners);
        me.callParent();
    }
});
