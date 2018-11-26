SELECT json_agg(json_build_object('uuid', uuid, 'name', name, 'level', level, 'type', type, 'parents', parents))
FROM (
  SELECT
  uuid,
  name,
  3            AS "level",
  'block'   AS "type",
  '[]' :: JSON AS "parents"
FROM block) AS b;