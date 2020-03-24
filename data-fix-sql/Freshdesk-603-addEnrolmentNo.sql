with audit as (update program_enrolment set observations = (
    CASE
        WHEN id = 42709 THEN jsonb_set(observations, '{8f852186-ccf1-4898-b581-99b37bcae2f1}',
                                       '"SM00839"')
        WHEN id = 14394 THEN jsonb_set(observations, '{8f852186-ccf1-4898-b581-99b37bcae2f1}',
                                       '"MD01229"')
        WHEN id = 16972 THEN jsonb_set(observations, '{8f852186-ccf1-4898-b581-99b37bcae2f1}',
                                       '"SJ02819"')
        WHEN id = 19030 THEN jsonb_set(observations, '{8f852186-ccf1-4898-b581-99b37bcae2f1}',
                                       '"SJ03005"')
        WHEN id = 50988 THEN jsonb_set(observations, '{8f852186-ccf1-4898-b581-99b37bcae2f1}',
                                       '"KJ07120"')
        WHEN id = 44635 THEN jsonb_set(observations, '{8f852186-ccf1-4898-b581-99b37bcae2f1}',
                                       '"NT04006"')
        WHEN id = 14912 THEN jsonb_set(observations, '{8f852186-ccf1-4898-b581-99b37bcae2f1}',
                                       '"KJ01718"')
        END
    ) where id in (42709,
                   14394,
                   16972,
                   19030,
                   50988,
                   44635,
                   14912
    ) returning audit_id)
update audit
set last_modified_date_time = current_timestamp
where id in (select audit_id from audit);
