CREATE ROLE jscs NOINHERIT PASSWORD 'password';

GRANT jscs TO openchs;

GRANT ALL ON ALL TABLES IN SCHEMA public TO jscs;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO jscs;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO jscs;

INSERT into organisation(name, db_user, uuid, parent_organisation_id)
    SELECT 'JSCS', 'jscs', '95021fc0-e414-4b29-b140-0b315dd23ca2', id FROM organisation WHERE name = 'OpenCHS';
