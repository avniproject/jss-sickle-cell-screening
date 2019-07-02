--These program_encounter ids were voided [247914,251068,251948,252476,252536,252551,252557,252572,253128,253114,254698,256701,257070,258074,258362,258470,258509,259743,260091,246607,247062,236544,236671,236784,236788,236842,237710,238586,238922,240848,243224,265744,268105,271166,271421]

with to_be_voided as (
  select program_encounter.id
  from program_encounter
         join operational_encounter_type
              on operational_encounter_type.encounter_type_id = program_encounter.encounter_type_id
  where operational_encounter_type.name = 'Sample shipment'
    and program_enrolment_id in (
    select enc.program_enrolment_id
    from program_encounter enc
           join operational_encounter_type oet on oet.encounter_type_id = enc.encounter_type_id
    where oet.name = 'Base screening'
      and observations ->> '66b7dc27-d719-4348-ac01-e8f6e7a3930a' = 'ad1f0481-a8ed-411a-ac00-d0435a670269'
      and enc.encounter_date_time is not null
    group by enc.program_enrolment_id, oet.name
    having count(*) = 1
  )
    and program_encounter.encounter_date_time is null
    and program_encounter.earliest_visit_date_time is not null
    and program_encounter.is_voided = false
),
     updates as (
       update program_encounter set is_voided = true where id in (
         select id
         from to_be_voided
       )
         returning audit_id
     )
update audit
set last_modified_date_time=current_timestamp,
    last_modified_by_id=(select id from users where username = 'dataimporter@jscs')
where id in (select updates.audit_id from updates);
