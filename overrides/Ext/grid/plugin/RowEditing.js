/**
 * A Column definition class which renders a passed date according to the default locale, or a configured
 *
 * Adding altFormats to read Date properly...
 */
Ext.define('Ext.overrides.grid.plugin.RowEditing', {
    override: 'Ext.grid.plugin.RowEditing',

    getContextFieldValues: function() {
        var editor = this.editor,
            context = this.context,
            record = context.record,
            newValues = {},
            originalValues = {},

                // Get all input form (not only first level)
                //  > used if editor is a fieldcontainer
                // editors = editor.query('>[isFormField]'),
                editors = editor.query('[isFormField]'),
                //

            len = editors.length,
            i, name, item;
        for (i = 0; i < len; i++) {
            item = editors[i];

                // add item.name for fieldcontainer
                // name = item.dataIndex
                name = item.dataIndex || item.name;

                // Ignore fields without dataIndex & name
                if (!name) continue;
                // Check if field exist (auto name when no dataIndex)
                if (!record.getField(name)) continue;
                //

            newValues[name] = item.getValue();
            originalValues[name] = record.get(name);
        }
        Ext.apply(context, {
            newValues: newValues,
            originalValues: originalValues
        });
    }
});
