Ext.define('Ext.overrides.form.field.Text', {    
    override: 'Ext.form.field.Text',
    labelSeparator: '',
    initComponent : function () {
        this.callParent();
        this.on({
          change : function (field, value) {
            if (field.el) {
                field.el.toggleCls('not-empty', value || field.emptyText);
            }
          },
          render : function (ths, width, height, eOpts) {
            if ((ths.getValue() || ths.emptyText) && ths.el) {
                ths.el.addCls('not-empty');
            }
          },
          scope : this
        });
    }
}); 