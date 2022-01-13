/**
 * Created by fri on 13 Jan 2022
 * Specific column to display an icon instead of value.
 */
Ext.define('Ck.grid.column.Icon', {
	extend: 'Ext.grid.column.Template',
	alias: 'widget.ckiconcolumn',
	align: 'center',
	tdCls: 'ckcolumntplicon',
	withBorders: true,
	initComponent: function() {
		this.tpl = '<span class="ckcolumnicon' + (this.withBorders ? ' bordered' : '') + '"><span class=" {' + this.dataIndex + '}"></span></span>';
		this.callParent();
	}
});
