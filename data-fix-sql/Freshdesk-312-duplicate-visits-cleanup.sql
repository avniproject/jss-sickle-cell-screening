set role jscs;
select current_user;
select * from users where id=83;
select *
from encounter_type where organisation_id=21;
select * from organisation where id=21;


with duplicates as (
  select enl.id
  from program_encounter enc
         join operational_encounter_type oet on oet.encounter_type_id = enc.encounter_type_id
         join program_enrolment enl on enc.program_enrolment_id = enl.id
  where 1 = 1
  group by oet.name, enl.id
  having count(enc.id) = 2
), to_be_voided as (
  select * from (
                  select row_number() over (partition by enl.id, oet.name order by enc.encounter_date_time) as rn,
                         enl.id as enl_id,
                         enl.observations->>concept_uuid('Enrolment number') as "Enl Number",
                         enc.id as enc_id,
                         oet.name,
                         to_char(earliest_visit_date_time, 'YYYY-MM-DD') scheduled_date,
                         enc.observations,
                         enc.is_voided
                  from program_encounter enc
                         join program_enrolment enl on enc.program_enrolment_id = enl.id
                         join operational_encounter_type oet on oet.encounter_type_id = enc.encounter_type_id
                  where 1 = 1
                    and enl.id in (select id from duplicates)
                    and oet.name = 'HPLC sample collection'
                    ) foo
  where foo.rn=2 and foo.observations = '{}'
)
   --select * from to_be_voided;
   , updates as (
  update program_encounter set is_voided=true
    where id in (select enc_id from to_be_voided)
    returning audit_id
)
update audit a
set last_modified_date_time = current_timestamp + id * ('1 millisecond' :: interval), last_modified_by_id = 83
from updates
where updates.audit_id = a.id;

select * from program_encounter where observations = '{}' and observations is not null and is_voided=true