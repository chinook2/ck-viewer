Ext.define('Ck.form.field.EditableComboboxGridColumn', {
	extend: 'Ext.grid.column.Column',

	xtype: 'editableComboboxGridColumn',	
	width: 200,
	tdCls: 'editableCell',
		
	//Required property: dataIndex
	initComponent: function() 
	{
		var nameCamel = Ck.toCamelCase(this.dataIndex);
		nameCamel = Ck.removeId(nameCamel);
		
		if (this.text == ' ')
			this.text = Ck.fieldNameToLabel(this.dataIndex);

		if (!this.itemId)
			this.itemId = Ck.removeId(this.dataIndex) + "GridFld";
		
		if (!this.store)
			this.store = 'maint.' + nameCamel;
		
		if (!this.editor)
		{
			this.editor =
			{
				xtype: 'combobox',					
				queryMode: 'local',
				valueField: (this.valueField ? this.valueField : 'id'),
				displayField: (this.displayField ? this.displayField : 'description'),
				typeAhead: true,
				forceSelection: true,
				store: this.store,
				allowBlank: false
			}
		}
		
		if (!this.renderer)
		{
			this.renderer = function (value, metaData, record)
			{
				var editor = metaData.column.getEditor(record);
				var storeRecord = editor.store.getById(value);
				if(storeRecord)
					return storeRecord.data[editor.displayField];
				else
					return null;
			}
		}
		
		this.callParent(arguments);
	}
});