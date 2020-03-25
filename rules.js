const _ = require('lodash');

module.exports = _.merge({},
    require('./registration/registrationFormHandler'),
    require('./sickleCellScreening/rules/enrolmentHandler'),
    require('./sickleCellScreening/rules/screeningFormHandler'),
    require('./sickleCellScreening/rules/visitSchedule'),
    require('./visitScheduler.js')
);
