drop view if exists jscs_lab_name_view;
create or replace view jscs_lab_name_view as (select * from concept where id in (select answer_concept_id
                                   from concept_answer
                                   where concept_id = (select id
                                                       from concept
                                                       where name = 'Laboratory')));
