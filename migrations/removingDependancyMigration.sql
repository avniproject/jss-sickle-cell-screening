-- JSCS implementation migration plan
--
-- Create an implementation bundle which not inherits data from org. 1
-- Some concepts are used twice in the screening form but on prod, it will not support the duplicate concept in one form
--  Solution:- create a separate form for each encounter.
--
-- Update the skip logics, visit scheduling,encounterEligibility check rules
--
-- Test this bundle on staging.(Dev & QA) - Done
-- Setup pre-release environment and import the latest production dump. - Done
-- Remove the dependency of jscs
-- Upload the bundle
-- Update the transactional data
--
-- Test the app on the prerelease environment (Dev & QA) - Done
-- Ask the user to sync their application
-- Ask the user to upload the database (for backup)
-- Ask the user to stop using the application
-- Migration process starts
--
--
--
-- Migration Process
-- Note:- Always run sql query by setting organisation role
-- fresh sync time ~5min
--Uploded catchment db
-- later sync 1.36 min

-- Insert gender
set role jscs;
select 'gender' table_name, count(*)
from gender
group by table_name
union all
select 'concept_answer' table_name, count(*)
from concept_answer
group by table_name
union all
select 'form_element' table_name, count(*)
from form_element
group by table_name
union all
select 'group_privilege' table_name, count(*)
from group_privilege
group by table_name
union all
select 'group_role' table_name, count(*)
from group_role
group by table_name
union all
select 'form' table_name, count(*)
from form
group by table_name
union all
select 'form_element' table_name, count(*)
from form_element
group by table_name
union all
select 'form_element_group' table_name, count(*)
from form_element_group
group by table_name
union all
select 'form_mapping' table_name, count(*)
from form_mapping
group by table_name
union all
select 'concept' table_name, count(*)
from concept
group by table_name
union all
select 'program' table_name, count(*)
from program
group by table_name
union all
select 'encounter_type' table_name, count(*)
from encounter_type
group by table_name
union all
select 'subject_type' table_name, count(*)
from subject_type
group by table_name
union all
select 'individual_relationship_type' table_name, count(*)
from individual_relationship_type
group by table_name
union all
select 'operational_encounter_type' table_name, count(*)
from operational_encounter_type
group by table_name
union all
select 'operational_program' table_name, count(*)
from operational_program
group by table_name
union all
select 'platform_translation' table_name, count(*)
from platform_translation
group by table_name
union all
select 'privilege' table_name, count(*)
from privilege
group by table_name
union all
select 'program_organisation_config' table_name, count(*)
from program_organisation_config
group by table_name
union all
select 'rule' table_name, count(*)
from rule
group by table_name
union all
select 'rule_dependency' table_name, count(*)
from rule_dependency
group by table_name
union all
select 'users' table_name, count(*)
from users
group by table_name
union all
select 'user_group' table_name, count(*)
from user_group
group by table_name
order by table_name;

-- table_name,count
-- concept,1336
-- concept_answer,1437
-- encounter_type,24
-- form,39
-- form_element,543
-- form_element,543
-- form_element_group,121
-- form_mapping,73
-- gender,3
-- group_privilege,184
-- group_role,2
-- individual_relationship_type,12
-- operational_encounter_type,8
-- operational_program,1
-- platform_translation,12
-- privilege,26
-- program,4
-- program_organisation_config,2
-- rule,8
-- rule_dependency,1
-- subject_type,3
-- user_group,47
-- users,48









reset role
select *
from concept_answer
where id in (select id
             from concept_answer
             where organisation_id = 1
               and is_voided = true)
  and organisation_id = 21;---0

select c1.id, c2.id
from concept_answer c1
         left outer join concept_answer c2 on c1.uuid = c2.uuid and c2.organisation_id = 21
where c1.organisation_id = 1
group by c1.id, c2.id
having c2.id isnull---0
;

select *
from concept_answer
where organisation_id in (1, 21);--1437
c1 left join concept_answer c2 on c1.uuid=c2.uuid

select *
from concept_answer
where concept_id = 85187;
select ca.id, ca1.id, c1.name, c2.name, ca.is_voided
from concept_answer ca
         inner join concept c1 on ca.concept_id = c1.id
         inner join concept c2 on ca.answer_concept_id = c2.id
         left outer join concept c3 on c1.uuid = c3.uuid and c3.organisation_id = 21 and c1.organisation_id = 1
         left outer join concept c4 on c2.uuid = c4.uuid and c4.organisation_id = 21 and c2.organisation_id = 1
         left outer join concept_answer ca1 on ca1.concept_id = c3.id and ca1.answer_concept_id = c4.id
where ca.organisation_id = 1
  and ca1.id is null;

reset role

select et1.name, et2.name
from encounter_type et1
         left join encounter_type et2 on et1.uuid = et2.uuid
    and et1.organisation_id = 1 and et2.organisation_id = 21
where et1.organisation_id = 1 and et2.id is null;

select *
from group_role where organisation_id=21;

set role jscs;
select *
from organisation;
select *
from gender; -- expect only 3 rows-right
insert into gender (uuid, name, concept_id, version, audit_id, is_voided, organisation_id)
    (select uuid,
            name,
            concept_id,
            version,
            create_audit((select id from users where username = ${user_name})),
            is_voided,
            ${org_id}
     from gender
     where id in (select id from gender where organisation_id = 1)); --3 rows affected

select count(*)
from gender;
-- expect only 6 rows--right

set role jscs
-- Delete concept answers (inherited from 1)
select count(*)
from concept_answer;--1437 rows-right
select count(*)
from concept_answer
where organisation_id = 21; -- expect only 257 rows-right

delete
from concept_answer
where organisation_id = 21;---257 rows affected

select count(*)
from concept_answer
where organisation_id = 21; -- expect only 0 rows-right
select count(*)
from concept_answer;
--1180 rows--right

-- Delete form_elements (inherited from 1)
select count(*)
from form_element
where organisation_id = 21; -- expect only 173 rows--right
select count(*)
from form_element;--543 rows--right
delete
from form_element
where organisation_id = 21;----173 rows affected

select count(*)
from form_element
where organisation_id = 21; -- expect only 0 rows --right
select count(*)
from form_element;
--370 rows--right

-- Delete group_privillages (inherited from 1)
select count(*)
from group_privilege
where organisation_id = 21; -- expect only 184 rows--right
select count(*)
from group_privilege;--184 rows--right
delete
from group_privilege
where organisation_id = 21;---184 rows affected
select count(*)
from group_privilege
where organisation_id = 21; -- expect only 0 rows--right
select count(*)
from group_privilege;
--0 rows--right

-- Delete group_role
select count(*)
from group_role
where organisation_id = 21; -- expect only 2 rows--right
select count(*)
from group_role;--2 rows--right
delete
from group_role
where organisation_id = 21;--2 rows affected
select count(*)
from group_role
where organisation_id = 21; -- expect only 0 rows
select count(*)
from group_role;
--0 rows--right


-- Remove dependency
select count(*)
from organisation;-- expect only 2 rows--right
update organisation
set parent_organisation_id=null
where id = 21;

select count(*)
from organisation;-- expect only 1 rows
commit;
-- refresh connection
set role jscs;
-- TODO--upload bundle

select 'gender' table_name, count(*)
from gender
group by table_name
union all
select 'concept_answer' table_name, count(*)
from concept_answer
group by table_name
union all
select 'form_element' table_name, count(*)
from form_element
group by table_name
union all
select 'group_privilege' table_name, count(*)
from group_privilege
group by table_name
union all
select 'group_role' table_name, count(*)
from group_role
group by table_name
union all
select 'form' table_name, count(*)
from form
group by table_name
union all
select 'form_element' table_name, count(*)
from form_element
group by table_name
union all
select 'form_element_group' table_name, count(*)
from form_element_group
group by table_name
union all
select 'form_mapping' table_name, count(*)
from form_mapping
group by table_name
union all
select 'concept' table_name, count(*)
from concept
group by table_name
union all
select 'program' table_name, count(*)
from program
group by table_name
union all
select 'encounter_type' table_name, count(*)
from encounter_type
group by table_name
union all
select 'subject_type' table_name, count(*)
from subject_type
group by table_name
union all
select 'individual_relationship_type' table_name, count(*)
from individual_relationship_type
group by table_name
union all
select 'operational_encounter_type' table_name, count(*)
from operational_encounter_type
group by table_name
union all
select 'operational_program' table_name, count(*)
from operational_program
group by table_name
union all
select 'platform_translation' table_name, count(*)
from platform_translation
group by table_name
union all
select 'privilege' table_name, count(*)
from privilege
group by table_name
union all
select 'program_organisation_config' table_name, count(*)
from program_organisation_config
group by table_name
union all
select 'rule' table_name, count(*)
from rule
group by table_name
union all
select 'rule_dependency' table_name, count(*)
from rule_dependency
group by table_name
union all
select 'users' table_name, count(*)
from users
group by table_name
union all
select 'user_group' table_name, count(*)
from user_group
group by table_name
order by table_name;



-- table_name,count
-- concept,1337
-- concept_answer,1428
-- encounter_type,8
-- form,42
-- form_element,556
-- form_element,556
-- form_element_group,124
-- form_mapping,54
-- gender,3
-- group_privilege,140
-- group_role,2
-- individual_relationship_type,12
-- operational_encounter_type,8
-- operational_program,1
-- platform_translation,12
-- privilege,26
-- program,1
-- rule,8
-- rule_dependency,1
-- subject_type,3
-- user_group,47
-- users,47



set role jscs
-- Add dependency (to compare data from org 1 for updating old ids to new one)
select count(*)
from organisation;-- 1row only
update organisation
set parent_organisation_id=1
where id = 21;

select count(*)
from organisation;
-- 2 rows only

-- Update transaction gender_type
select gender_id, g.organisation_id, count(*)
from individual
         inner join gender g on individual.gender_id = g.id
group by 1, 2; -- orgnisation id should be 1


update individual
set gender_id = g1.id
from gender g1
         join gender g on g.name = g1.name and g1.organisation_id = 21
where individual.gender_id = g.id
  and individual.organisation_id = 21 ;--57944 rows affected

select gender_id, g.organisation_id, count(*)
from individual
         inner join gender g on individual.gender_id = g.id
group by 1, 2;-- org id should be 21


select count(*)
from individual;-- should match the updated rows

set role jscs;


select gender_id, g.organisation_id, count(*)
from individual
         inner join gender g on individual.gender_id = g.id
group by 1, 2;
-- orgnisation id should be 21 no of rows updated

-- Update subject_type of individual
select subject_type_id, g.organisation_id, count(*)
from individual
         inner join subject_type g on individual.subject_type_id = g.id
group by 1, 2;---count 57944


update individual
set subject_type_id = g1.id
from subject_type g1
         join subject_type g on g.uuid = g1.uuid and g1.organisation_id = 21
where individual.subject_type_id = g.id
  and individual.organisation_id = 21;--57945 rows affected


select subject_type_id, g.organisation_id, count(*)
from individual
         inner join subject_type g on individual.subject_type_id = g.id
group by 1, 2;

-- Update relation_type of individual_relationship
set role jscs
select relationship_type_id, g.organisation_id, count(*)
from individual_relationship
         inner join individual_relationship_type g on individual_relationship.relationship_type_id = g.id
group by 1, 2;

update individual_relationship
set relationship_type_id = g1.id
from individual_relationship_type g1
         join individual_relationship_type g on g.uuid = g1.uuid and g1.organisation_id = 21
where individual_relationship.relationship_type_id = g.id
  and individual_relationship.organisation_id = 21;--11101 rows affected

select count(*)
from individual_relationship;--10976

select relationship_type_id, g.organisation_id, count(*)
from individual_relationship
         inner join individual_relationship_type g on individual_relationship.relationship_type_id = g.id
group by 1, 2;


-- Remove dependency
update organisation
set parent_organisation_id=null
where id = 21;

select *
from organisation;
--- only one row

-- Test the application(dev & QA)
-- Ask the user to delete data & sync
--
-- All users upload data
-- All users uninstall application - Rahul to send out an email to us when this is done
-- --- start maintenance activity ----
-- Take our complete production DB backup
-- Migration activity - 1 hour
-- Vacuum analyze - 10 mins
-- Create db and upload for fast sync -
-- QA - testing and sanity testing for other organisation
-- --- maintenance activity ends ---
-- Send email
-- Ask the users to install and fast sync





