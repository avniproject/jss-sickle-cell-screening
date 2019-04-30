-- Verify if all update scripts update one row.
-- Rerunnable

update users set settings = settings || '{"idPrefix": "KJ"}' where username = 'kajalp@jscs';
update users set settings = settings || '{"idPrefix": "MD"}' where username = 'madhuc@jscs';
update users set settings = settings || '{"idPrefix": "SM"}' where username = 'anm6@jscs';
update users set settings = settings || '{"idPrefix": "SJ"}' where username = 'rahulsp@jscs';
update users set settings = settings || '{"idPrefix": "MS"}' where username = 'manoramas@jscs';
update users set settings = settings || '{"idPrefix": "DS"}' where username = 'durgas@jscs';
update users set settings = settings || '{"idPrefix": "NT"}' where username = 'nityas@jscs';
update users set settings = settings || '{"idPrefix": "SJ"}' where username = 'Central lab';
update users set settings = settings || '{"idPrefix": "LM"}' where username = 'Logistic Manager';