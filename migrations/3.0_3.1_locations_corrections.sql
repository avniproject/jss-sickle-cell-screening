-- Move core health modules' locations to sickle cell
with core_locs as (select * from address_level where organisation_id = 1),
     updates(id) as (update location_location_mapping
            set organisation_id = (select id from organisation where db_user = 'jscs')
            where parent_location_id in (select id from core_locs) or location_id in (select id from core_locs)
            returning audit_id)

update audit
set last_modified_date_time = current_timestamp,
    last_modified_by_id     = (select id from users where username = 'admin@jscs'),
    created_by_id           = (select id from users where username = 'admin@jscs')
where audit.id in (select id from updates);

-- Move core health modules' location-mappings to sickle cell
with core_locs as (select * from address_level where organisation_id = 1),
     updates(id) as (update address_level
          set organisation_id = (select id from organisation where db_user = 'jscs')
          where id in (select id from core_locs)
          returning audit_id)

update audit
set last_modified_date_time = current_timestamp,
    last_modified_by_id     = (select id from users where username = 'admin@jscs'),
    created_by_id           = (select id from users where username = 'admin@jscs')
where audit.id in (select id from updates);
