
Ext.define('Ext.overrides.String', {
	override: 'Ext.String',

    // JMA - http://stackoverflow.com/questions/990904/javascript-remove-accents-in-strings
    stripAccent: function(s) {
        if(!s) return s;
        var non_asciis = {'a':'[àáâãäå]', 'ae':'æ', 'c':'ç', 'e':'[èéêë]', 'i':'[ìíîï]', 'n':'ñ', 'o':'[òóôõö]', 'oe':'œ','u':'[ùúûuü]','y':'[ýÿ]','A':'[ÀÁÂÃÄÅ]', 'AE':'Æ', 'C':'Ç', 'E':'[ÈÉÊË]', 'I':'[ÌÍÎÏ]', 'N':'Ñ', 'O':'[ÒÓÔÕÖ]', 'OE':'Œ', 'U':'[ÙÚÛUÜ]', 'Y':'[ÝŸ]'};
        for (i in non_asciis) {
            s = s.replace(new RegExp(non_asciis[i], 'g'), i);
        }
        return s;
    }
});

