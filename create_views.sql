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

set role none;
