set role jscs ;

drop view if exists jscs_lab_name_view;
create or replace view jscs_lab_name_view as (select * from concept where id in (select answer_concept_id
                                   from concept_answer
                                   where concept_id = (select id
                                                       from concept
                                                       where name = 'Laboratory')));

drop view if exists jscs_block_view;
create or replace view jscs_block_view as (
  select al.* from address_level al
  join address_level_type alt on alt.id = al.type_id
  where alt.level = 3 and al.title in ('Anuppur','Kotma','Pushparajgarh','Jaithari')
);

drop view if exists jscs_villages_view;
create or replace view jscs_villages_view as (
  select villages.*,block.id blockid, block.title blocktitle from address_level villages
  join address_level_type villages_type on villages_type.id = villages.type_id
  join location_location_mapping m2 on villages.id = m2.location_id
  join address_level block on block.id = m2.parent_location_id
  join address_level_type block_type on block_type.id = block.type_id
  where block_type.level = 3 and block.title in ('Anuppur','Kotma','Pushparajgarh','Jaithari')
    and villages_type.level = 1
);

create or replace view latest_encounter_by_name as (select individual_id,
                                                oet.id                                                                           encounter_id,
                                                u.username                                                                    as username,
                                                enc.*,
                                                row_number()
                                                over (partition by individual_id, oet.name order by encounter_date_time desc) as rank
                                         from program_encounter enc
                                                  join program_enrolment enl on enc.program_enrolment_id = enl.id
                                                  join operational_encounter_type oet
                                                       on oet.encounter_type_id = enc.encounter_type_id
                                                  join audit a on enc.audit_id = a.id
                                                  join users u on a.created_by_id = u.id
                                         where enc.cancel_date_time isnull
                                           and enc.encounter_date_time notnull
);

create or replace view latest_hplc_result as (select *
                                   from latest_encounter_by_name
                                   where rank = 1
                                     and single_select_coded(
                                                     observations ->> '645d4c3d-8b8a-4de6-85f2-87b5ba73fe86')::TEXT =
                                         'Yes'
                                     and encounter_id = 89);

create or replace view electrophoresis_result as (select *,
                                              row_number()
                                              over (partition by individual_id order by encounter_date_time desc) as rank1
                                       from latest_encounter_by_name
                                       where encounter_id = 89
                                         and (observations ->> '0cb6e694-fc5f-45cb-ad71-0bd22ef8b381'::TEXT notnull
                                           or observations ->> 'd41b5986-e8b1-41dc-8685-beb4d86abf79'::TEXT notnull));
create or replace view latest_electrophoresis_result as (select *
                                              from electrophoresis_result
                                              where rank1 = 1);
create or replace view latest_sample_shipment as (select *
                                       from latest_encounter_by_name
                                       where rank = 1
                                         and (multi_select_coded(
                                                          observations -> '92e5fc81-5c6f-473a-8d13-415cf45720e2')::TEXT =
                                              'Electrophoresis ,Solubility' or multi_select_coded(
                                                          observations -> '92e5fc81-5c6f-473a-8d13-415cf45720e2')::TEXT isnull)
                                         and encounter_id not in
                                             (89, 87, 90)
);
create or replace view latest_hplc_shipment as (select *
                                     from latest_encounter_by_name
                                     where rank = 1
                                       and multi_select_coded(
                                                       observations -> '92e5fc81-5c6f-473a-8d13-415cf45720e2')::TEXT =
                                           'HPLC'
                                       and encounter_id not in
                                           (89, 87, 90)
);

set role none;
