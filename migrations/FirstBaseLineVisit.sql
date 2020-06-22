with data as (
    select pe.*,
           row_number() over (partition by program_enrolment_id order by encounter_date_time desc) rank
    from program_enrolment p
             join program_encounter pe on pe.program_enrolment_id = p.id
    where 1 = 1
      and (pe.observations ->> '3f0d938b-d7e6-4372-b2a0-e787430880f8' notnull
        OR pe.observations ->> '93eb5a4d-b399-46d3-86d0-6fd4d6443d44' notnull
        OR pe.observations ->> '0cb6e694-fc5f-45cb-ad71-0bd22ef8b381' notnull)
      and p.program_exit_date_time isnull
      and not pe.is_voided
      and not p.is_voided
      --this is to restrict already scheduled visits
      and p.id not in ((select abc.program_enrolment_id from program_encounter abc where name = 'Baseline Form'))
),
     new_visit_data as (select distinct program_enrolment_id
                        from data
                        where rank = 1
                          and (
                                    single_select_coded(observations ->> '3f0d938b-d7e6-4372-b2a0-e787430880f8') =
                                    ANY (ARRAY ['SS', 'Beta Thal','S-Beta thal'])
                                OR
                                    single_select_coded(observations ->> '93eb5a4d-b399-46d3-86d0-6fd4d6443d44') =
                                        ANY (ARRAY ['SS', 'Beta Thal','S-Beta thal'])
                                OR
                                    single_select_coded(observations ->> '0cb6e694-fc5f-45cb-ad71-0bd22ef8b381') =
                                        ANY (ARRAY ['SS', 'Beta Thal','S-Beta thal'])
                            ))
insert
into program_encounter (observations,
                        earliest_visit_date_time,
                        max_visit_date_time,
                        program_enrolment_id,
                        uuid,
                        version,
                        encounter_type_id,
                        name,
                        organisation_id,
                        audit_id)
select jsonb '{}',
       TIMESTAMPTZ '2020-06-22',
       TIMESTAMPTZ '2020-09-22',
       program_enrolment_id,
       uuid_generate_v4(),
       1,
       (select id from encounter_type where name = 'Baseline'),
       'Baseline Form',
       (select id from organisation where name = 'JSCS'),
       create_audit((select id from users where username = 'dataimporter@jscs'))
from new_visit_data;
