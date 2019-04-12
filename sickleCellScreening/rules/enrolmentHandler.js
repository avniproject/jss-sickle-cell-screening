import {
    RuleFactory,
    FormElementsStatusHelper,
    FormElementStatusBuilder,
    StatusBuilderAnnotationFactory,
    FormElementStatus,
    VisitScheduleBuilder,
    ProgramRule,
    RuleCondition
} from 'rules-config/rules';

@ProgramRule({
    name: "Sickle cell screening program summary",
    uuid: "7fed3ab2-1a5e-4667-a7bf-e8d9ed66e615",
    programUUID: "e93303fa-f465-4db7-a945-d4fd6295f2b9",
    executionOrder: 100.0,
    metadata: {}
})

class SickleCellScreeningProgramRuleJSS {
    static exec(programEnrolment, summaries, context, today) {
        const hb = programEnrolment.findObservationInEntireEnrolment('Hb');
        if (!_.isNil(hb)) {
            summaries.push({name: 'Hb', value: hb.getValue()});
        }
        const bloodGroup = programEnrolment.findObservationInEntireEnrolment('Blood group');
        if (!_.isNil(bloodGroup)) {
            summaries.push({name: 'Blood group', value: bloodGroup.getValue()});
        }
        const genotype = programEnrolment.findLatestObservationInEntireEnrolment('Hemoglobin genotype');
        if (!_.isNil(genotype)) {
            summaries.push({name: 'Hemoglobin genotype', value: genotype.getValue()});
        } else {
            const electrophoresisResult = programEnrolment.findObservationInEntireEnrolment('Electrophoresis result');
            if (!_.isNil(electrophoresisResult)) {
                summaries.push({name: 'Electrophoresis result', value: electrophoresisResult.getValue()});
            }
        }
        return summaries;
    }
}


module.exports = {SickleCellScreeningProgramRuleJSS};
