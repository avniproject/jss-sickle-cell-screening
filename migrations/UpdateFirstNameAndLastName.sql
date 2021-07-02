-- Card : https://app.zenhub.com/workspaces/avni-5cf8e458bf08585333fd64ac/issues/avniproject/jss-sickle-cell-screening/31

--
-- Context: There are some users who fills full name in the first_name field and caste in last_name.
-- This migration will merge first_name and last_name in case last name is not 'NA'. It'll then move "Caste (Free Text)"
-- Concept to last_name. Using translations we'll change label First Name -> "Full name" and Last Name -> "Caste".
-- Form element "Caste (Free Text)" will be voided.
--


-- Update first_name to full name only when last_name is not NA and last_name is not
-- caste(some users have filled caste here and have left "Caste (Free Text)" question empty)
update individual set first_name = concat(first_name, ' ', last_name)
where last_name not ilike 'NA'
  and observations ->> '60c44aa2-3635-487d-8962-43000e77d382' notnull;

-- Move caste to last name
update individual set last_name = observations ->> '60c44aa2-3635-487d-8962-43000e77d382'
where observations ->> '60c44aa2-3635-487d-8962-43000e77d382' notnull;
