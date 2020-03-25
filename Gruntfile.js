const rulesConfigInfra = require('rules-config/infra');
const IDI = require('openchs-idi');

module.exports = IDI.configure({
    "name": "jss",
    "chs-admin": "admin",
    "org-name": "JSS",
    "org-admin": "admin@jscs",
    "secrets": "../secrets.json",
    "files": {
        "adminUsers": {
            // "prod": [],
            "dev": ["./users/dev-admin-user.json"],
        },
        "forms": [
            "./registration/registrationForm.json",
            "./sickleCellScreening/sickleCellScreeningProgramEnrolmentNullForm.json",
            "./sickleCellScreening/screeningForm.json",
            "./forms/Baseline Form.json",
            "./forms/Check Up Form.json",
            "./forms/Followup Form.json",
            "./forms/Lab Test Form.json"
        ],
        "formMappings": ["./formMappings.json"],
        "formDeletions": [],
        "formAdditions": [],
        "catchments": ["./catchments.json"],
        "checklistDetails": [],
        "concepts": [
            "./concepts.json"
            // "./registration/registrationConcepts.json",
            // "./sickleCellScreening/screeningConcepts.json"
        ],
        "locations": [
            "./locations/districts.json",
            "./locations/blocks.json",
            "./locations/villages.json",
        ],
        "programs": [
            "./programs.json"
        ],
        "identifierSource": {
            "dev": ["./identifier/dev/idSource.json"]
        },
        "identifierUserAssignments": {
            "dev": ["./identifier/dev/userIdSource.json"]
        },
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
        ],
        "organisationConfig": ["organisationConfig.json"],
        "translations": [
            "translations/en.json",
            "translations/hi_IN.json",
        ]
    }
}, rulesConfigInfra);
