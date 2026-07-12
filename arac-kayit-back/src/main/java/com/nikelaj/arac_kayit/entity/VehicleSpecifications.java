package com.nikelaj.arac_kayit.entity;

import com.nikelaj.arac_kayit.util.PlakaUtils;
import org.springframework.data.jpa.domain.Specification;

public class VehicleSpecifications {

    public static Specification<Vehicle> hasPlaka(String plaka) {
        return (root, query, cb) ->
                plaka == null ? null : cb.equal(root.get("plaka"), PlakaUtils.normalize(plaka));
    }

    public static Specification<Vehicle> hasModelYili(Integer modelYili) {
        return (root, query, cb) ->
                modelYili == null ? null : cb.equal(root.get("modelYili"), modelYili);
    }

    public static Specification<Vehicle> hasDurum(VehicleStatus durum) {
        return (root, query, cb) ->
                durum == null ? null : cb.equal(root.get("durum"), durum);
    }
}