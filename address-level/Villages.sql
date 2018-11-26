SELECT json_agg(json_build_object('uuid', uuid, 'name', name, 'level', level, 'type', type, 'parents', parents))
FROM
  (
    SELECT
      v.uuid,
      v.name,
      1                       AS "level",
      'Village'               AS "type",
      json_build_array(json_build_object('uuid',b.uuid)) AS "parents"
    FROM village v
      INNER JOIN block b ON b.id = v.block_id) AS v;
