const rulesConfigInfra = require('rules-config/infra');
const IDI = require('openchs-idi');
const secrets = require('../secrets.json');

module.exports = IDI.configure({
    "name": "jss",
    "chs-admin": "admin",
    "org-name": "JSS",
    "org-admin": "jscs-admin",
    "secrets": secrets,
    "files": {
        "adminUsers": {
            // "prod": [],
            "dev": ["./users/dev-admin-user.json"],
        },
        "forms": [
            "./registration/registrationForm.json",
            "./sickleCellScreening/sickleCellScreeningProgramEnrolmentNullForm.json",
            "./sickleCellScreening/screeningForm.json",
        ],
        "formMappings": ["./formMappings.json"],
        "formDeletions": [],
        "formAdditions": [],
        "catchments": ["./catchments.json"],
        "checklistDetails": [],
        "concepts": [
            "./registration/registrationConcepts.json",
            "./sickleCellScreening/screeningConcepts.json"
        ],
        "locations": [
            "./locations/districts.json",
            "./locations/blocks.json",
             "./locations/villages.json",
        ],
        "programs": [
            "./programs.json"
        ],
        "encounterTypes": ["./encounterTypes.json"],
        "operationalEncounterTypes": ["./operationalModules/operationalEncounterTypes.json"],
        "operationalPrograms": ["./operationalModules/operationalPrograms.json"],
        "operationalSubjectTypes": ["./operationalModules/operationalSubjectTypes.json"],
        "users": {
            "dev": ["./users/dev-users.json"]
        },
        "rules": [
            "./rules.js",
        ],
        "organisationSql": [
            /* "create_organisation.sql"*/
        ]
    }
}, rulesConfigInfra);
