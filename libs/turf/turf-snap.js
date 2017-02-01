
turf.snap = function(feature, fc, tolerance) {
    
    // TODO : filtrer le fc pour ne garder que les poly qui intersecte la bbox du feature
    // TODO : gestion Multipolygones
    
    var sqrD = function(c1, c2) {
        var dx = c2[0] - c1[0];
        var dy = c2[1] - c1[1];
        return dx * dx + dy * dy;
    };
    var t = tolerance *tolerance;
    
    var coordinates = feature.geometry.coordinates[0];
    // Boucle sur les coord du feature
    coordinates.forEach(function(coord, idx, coords){
        // boucle sur la collection de feature
        fc.forEach(function(p){
            if(p === feature) return;
            // Boucle sur les coord du feature de la collection
            var cs = p.geometry.coordinates[0];
            cs.forEach(function(c){
                if(coord === c) return;
                if(sqrD(coord, c) <= t) {
                    coords[idx] = c;
                }
            });
        });
    });
    
    return feature;
};