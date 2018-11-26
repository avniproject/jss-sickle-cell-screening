DROP TABLE IF EXISTS raw_village;
DROP TABLE IF EXISTS village;
DROP TABLE IF EXISTS block;

CREATE TABLE raw_village (
  id       VARCHAR,
  block    VARCHAR,
  village      VARCHAR
);

CREATE TABLE block (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR,
  uuid        VARCHAR DEFAULT uuid_generate_v4()
);

CREATE TABLE village (
  id       SERIAL PRIMARY KEY,
  name     VARCHAR,
  uuid     VARCHAR DEFAULT uuid_generate_v4(),
  block_id INT REFERENCES block (id)
);

COPY raw_village (id,block,village) FROM '/Users/garima/Google Drive/ID_docs/OpenCHS/openchs/unicef-moha/raw_address_levels/SickleCell/List of Tehsil and Villages.csv' WITH CSV header delimiter',';

INSERT INTO block (name) SELECT DISTINCT initcap(lower(trim(block)))
FROM raw_village;

INSERT INTO village (block_id, name)
SELECT DISTINCT
b.id,
initcap(lower(trim(rv.village)))
FROM raw_village rv
INNER JOIN block b ON initcap(lower(trim(rv.block))) = b.name
WHERE rv.village IS NOT NULL;
