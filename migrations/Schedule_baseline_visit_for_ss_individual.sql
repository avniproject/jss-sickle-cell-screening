
set role jscs;
insert into program_encounter(observations,
                              earliest_visit_date_time,
                              program_enrolment_id,
                              uuid,
                              version,
                              encounter_type_id,
                              name,
                              max_visit_date_time,
                              organisation_id,
                              audit_id,
                              created_by_id,
                              last_modified_by_id,
                              created_date_time,
                              last_modified_date_time)

select '{}'::jsonb,
       current_timestamp,
       pe.id,
       uuid_generate_v4(),
       0,
       229,
       'Baseline Form',
       current_timestamp + interval '15 day',
       21,
       create_audit((select id from users where username = 'dataimporter@jscs')),
       83,
       83,
       current_timestamp,
       current_timestamp
from program_encounter enc
         left join program_enrolment pe on enc.program_enrolment_id = pe.id
where enc.encounter_type_id = 45
  and pe.legacy_id notnull
  and enc.legacy_id notnull
  and single_select_coded(enc.observations ->> '0cb6e694-fc5f-45cb-ad71-0bd22ef8b381') = 'SS';