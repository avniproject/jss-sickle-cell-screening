set role jscs;

--below is the select query given to Rahul to verify the results and modify Other option.
with relation_data as (
    select individual_a_id,
           individual_b_id,
           single_select_coded(a.observations ->> 'e2c7cacd-03f7-4228-b0ce-4ddb2e220974') is_a_pregnant_women,
           single_select_coded(b.observations ->> 'e2c7cacd-03f7-4228-b0ce-4ddb2e220974') is_b_pregnant_women,
           a.registration_date                                                            a_reg_date,
           b.registration_date                                                            b_reg_date
    from individual_relationship r
             join individual a on r.individual_a_id = a.id
             join individual b on r.individual_b_id = b.id
    where not r.is_voided
),
     a_audits as (
         select i.id,
                i.first_name,
                i.last_name,
                i.gender_id,
                i.address_id,
                date_of_birth,
                case
                    when is_a_pregnant_women = 'Yes' then jsonb_set(observations,
                                                                    '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                                                    '"b86a3c8e-1a51-41dd-a53d-8769302addac"') --Pregnant
                    when is_b_pregnant_women = 'Yes' then jsonb_set(observations,
                                                                    '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                                                    '"5dcdbebc-913e-46a5-a254-dd38d2956c80"') --Relative
                    when a_reg_date::date > b_reg_date::date then jsonb_set(observations,
                                                                            '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                                                            '"5dcdbebc-913e-46a5-a254-dd38d2956c80"') --Relative
                    else jsonb_set(observations, '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                   '"05ea583c-51d2-412d-ad00-06c432ffe538"') --Other
                    end
         from individual i
                  join relation_data r on r.individual_a_id = i.id
--              and i.id not in (select individual_b_id from relation_data)
             and i.observations ->> 'c254e204-3a7c-4e13-bac2-abfca94c9528' isnull
     ),
     b_audits as (
         select i.id,
                i.first_name,
                i.last_name,
                i.gender_id,
                i.address_id,
                date_of_birth,
                case
                    when is_a_pregnant_women = 'Yes' then jsonb_set(observations,
                                                                    '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                                                    '"5dcdbebc-913e-46a5-a254-dd38d2956c80"') --Relative
                    when is_b_pregnant_women = 'Yes' then jsonb_set(observations,
                                                                    '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                                                    '"b86a3c8e-1a51-41dd-a53d-8769302addac"') --Pregnant
                    when a_reg_date::date > b_reg_date::date then jsonb_set(observations,
                                                                            '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                                                            '"05ea583c-51d2-412d-ad00-06c432ffe538"') --Other
                    else jsonb_set(observations, '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                   '"5dcdbebc-913e-46a5-a254-dd38d2956c80"') --Relative
                    end
         from individual i
                  join relation_data r on r.individual_b_id = i.id
--              and i.id not in (select individual_a_id from relation_data)
             and i.observations ->> 'c254e204-3a7c-4e13-bac2-abfca94c9528' isnull
     ),
     c_audits as (
         select id,
                first_name,
                last_name,
                gender_id,
                address_id,
                date_of_birth,
                case
                    when single_select_coded(observations ->> 'e2c7cacd-03f7-4228-b0ce-4ddb2e220974') = 'Yes'
                        then jsonb_set(observations, '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                       '"b86a3c8e-1a51-41dd-a53d-8769302addac"') --Pregnant
                    else jsonb_set(observations, '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                   '"05ea583c-51d2-412d-ad00-06c432ffe538"') --Other
                    end
         from individual
         where id not in (
             select individual_a_id
             from relation_data
             union all
             select individual_b_id
             from relation_data
         )
           and observations ->> 'c254e204-3a7c-4e13-bac2-abfca94c9528' isnull
           and subject_type_id = (select id from subject_type where name = 'Individual')
     ),
     all_data(id, first_name, last_name, gender_id, address_id, dob, observations) as (
         select *
         from a_audits
         union all
         select *
         from b_audits
         union all
         select *
         from c_audits
     )
select distinct on (a.id) first_name                                                 as      "First name",
                          last_name                                                  as      "Last name",
                          g.name                                                     as      "Gender",
                          dob                                                        as      "Date of birth",
                          date_part('year', age(dob))                                as      "Age",
                          village.title                                              as      "Village",
                          block.title                                                as      "Block",
                          a.observations ->> 'd70c62f2-52c8-4a3a-8c65-c6fc1b84e1fb'  as      "Other village",
                          a.observations ->> '5f28bfdc-b4f4-4560-bafa-66690d9a9dcc'  as      "Addeess",
                          pe.enrolment_date_time::date                               as      "Enrolment Date",
                          pe.observations ->> '8f852186-ccf1-4898-b581-99b37bcae2f1' as      "Enrolment Number",
                          single_select_coded(
                                      a.observations ->> 'e2c7cacd-03f7-4228-b0ce-4ddb2e220974') "Whether registration for pregnant woman (Old)",
                          single_select_coded(
                                      a.observations ->> 'c254e204-3a7c-4e13-bac2-abfca94c9528') "Type of person screened (New)"
from all_data a
         join gender g on g.id = a.gender_id
         join address_level village on village.id = a.address_id
         join address_level block on block.id = village.parent_id
         join program_enrolment pe on pe.individual_id = a.id;



--TODO: 1. need to fix this update according to above select query before executing.
--TODO: 2. run the fixed rule migration along with this migration.

-- - go through all relationship (Person A <> Person B)
-- - check if Person A is a pregnant woman
-- - If yes, mark A as pregnant woman and B as relative
-- - If no, check if person B is pregnant woman
-- - If yes, mark B as pregnant woman and A as relative
-- - If no, check Person A registration date is less than Person B
-- - If yes, mark A as other and B as relative
-- - If no, mark B as other and A as relative
-- - If no relationship is defined for individual then check if it is a Pregnant women, if yes then mark Pregnant else Other.

with relation_data as (
    select individual_a_id,
           individual_b_id,
           single_select_coded(a.observations ->> 'e2c7cacd-03f7-4228-b0ce-4ddb2e220974') is_a_pregnant_women,
           single_select_coded(b.observations ->> 'e2c7cacd-03f7-4228-b0ce-4ddb2e220974') is_b_pregnant_women,
           a.registration_date                                                            a_reg_date,
           b.registration_date                                                            b_reg_date
    from individual_relationship r
             join individual a on r.individual_a_id = a.id
             join individual b on r.individual_b_id = b.id
    where not r.is_voided
),
     a_audits as (
         update individual i
             set observations =
                     case
                         when is_a_pregnant_women = 'Yes' then jsonb_set(observations,
                                                                         '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                                                         '"b86a3c8e-1a51-41dd-a53d-8769302addac"') --Pregnant
                         when is_b_pregnant_women = 'Yes' then jsonb_set(observations,
                                                                         '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                                                         '"5dcdbebc-913e-46a5-a254-dd38d2956c80"') --Relative
                         when a_reg_date::date > b_reg_date::date then jsonb_set(observations,
                                                                                 '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                                                                 '"5dcdbebc-913e-46a5-a254-dd38d2956c80"') --Relative
                         else jsonb_set(observations, '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                        '"05ea583c-51d2-412d-ad00-06c432ffe538"') --Other
                         end
             from relation_data r
             where r.individual_a_id = i.id
             returning i.audit_id
     ),
     b_audits as (
         update individual i
             set observations =
                     case
                         when is_a_pregnant_women = 'Yes' then jsonb_set(observations,
                                                                         '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                                                         '"5dcdbebc-913e-46a5-a254-dd38d2956c80"') --Relative
                         when is_b_pregnant_women = 'Yes' then jsonb_set(observations,
                                                                         '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                                                         '"b86a3c8e-1a51-41dd-a53d-8769302addac"') --Pregnant
                         when a_reg_date::date > b_reg_date::date then jsonb_set(observations,
                                                                                 '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                                                                 '"05ea583c-51d2-412d-ad00-06c432ffe538"') --Other
                         else jsonb_set(observations, '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                        '"5dcdbebc-913e-46a5-a254-dd38d2956c80"') --Relative
                         end
             from relation_data r
             where r.individual_b_id = i.id
             returning i.audit_id
     ),
     c_audits as (
         update individual set observations =
                 case
                     when single_select_coded(observations ->> 'e2c7cacd-03f7-4228-b0ce-4ddb2e220974') = 'Yes'
                         then jsonb_set(observations, '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                        '"b86a3c8e-1a51-41dd-a53d-8769302addac"') --Pregnant
                     else jsonb_set(observations, '{c254e204-3a7c-4e13-bac2-abfca94c9528}',
                                    '"05ea583c-51d2-412d-ad00-06c432ffe538"') --Other
                     end
             where
                         observations ->> 'c254e204-3a7c-4e13-bac2-abfca94c9528' isnull -- "Type of person screened" is still null
                     and subject_type_id = (select id from subject_type where name = 'Individual')
             returning audit_id
     )
update audit
set last_modified_date_time = current_timestamp
where id in (
    select audit_id
    from a_audits
    union all
    select audit_id
    from b_audits
    union all
    select audit_id
    from c_audits
);
