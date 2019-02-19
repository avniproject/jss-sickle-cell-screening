set role jscs ;

drop view if exists jscs_lab_name_view;
create or replace view jscs_lab_name_view as (select * from concept where id in (select answer_concept_id
                                   from concept_answer
                                   where concept_id = (select id
                                                       from concept
                                                       where name = 'Laboratory')));

drop view if exists jscs_block_view;
create or replace view jscs_block_view as (
  select * from address_level where level = 3 and title in ('Anuppur','Kotma','Pushparajgarh','Jaithari')
);

drop view if exists jscs_villages_view;
create or replace view jscs_villages_view as (
  select villages.*,block.id blockid, block.title blocktitle from address_level villages
  join location_location_mapping m2 on villages.id = m2.location_id
  join address_level block on block.id = m2.parent_location_id
  where block.level = 3 and block.title in ('Anuppur','Kotma','Pushparajgarh','Jaithari')
    and villages.level = 1
);

set role none;

SELECT grant_all_on_all(a.rolname)
FROM pg_roles a
WHERE pg_has_role('openchs', a.oid, 'member')
  and a.rolsuper is false
  and a.rolname not like 'pg%'
  and a.rolname not like 'rds%'
order by a.rolname;
