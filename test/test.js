import {SickleCellScreeningHandlerJSS} from "../rules";
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
import screeningForm from '../sickleCellScreening/screeningForm.json';
import screeningConcepts from '../sickleCellScreening/screeningConcepts';
import {ProgramEncounter, ProgramEnrolment} from "openchs-models";
import EnrolmentFiller from "openchs-models/test/ref/EnrolmentFiller";
import EncounterFiller from "openchs-models/test/ref/EncounterFiller";
import ProgramFactory from "openchs-models/test/ref/ProgramFactory";
import programs
    from "../programs";
import commonConcepts from "openchs-health-modules/health_modules/commonConcepts";
import enrolmentForm
    from "../sickleCellScreening/sickleCellScreeningProgramEnrolmentNullForm";
import IndividualBuilder from "openchs-models/test/ref/IndividualBuilder";

describe('sickleCellScreeningForm', () => {
    let programData, enrolment, individual;
    let sickleCellProgram = programs[0];

    beforeEach(() => {
        programData = new ProgramFactory(sickleCellProgram)
            .withConcepts(commonConcepts)
            .withConcepts(screeningConcepts)
            .withEnrolmentform(enrolmentForm)
            .withEncounterForm(screeningForm)
            .build();
        individual = new IndividualBuilder(programData)
            .withName("Test", "Mother")
            .withAge(25)
            .withGender("Female")
            .withSingleCodedObservation("Blood group", "B+")
            .build();
        enrolment = new EnrolmentFiller(programData, individual, new Date())
            .build();
    })

    test('hemoglobinGenotypeFromOldReport is not visible when scConfirmatoryReportAvailable answer is no', () => {
        let screeningEncounter = new EncounterFiller(programData, enrolment, "ANC", new Date())
            .forSingleCoded("Whether SC confirmatory report available", "No")
            .build();
        let formElementGroup = programData.forms[1].getFormElementGroups()
            .find(feg => feg.name === "Sickle cell screening history");
        let fe = formElementGroup.getFormElements().find(el => el.matches("SC confirmatory report available?"));
        let handler = new SickleCellScreeningHandlerJSS();
        let statusBuilder = new FormElementStatusBuilder({programEncounter: screeningEncounter, formElement:fe});
        let r = handler.hemoglobinGenotypeFromOldReport([], statusBuilder);
        // let r = SickleCellScreeningHandlerJSS.exec(screeningEncounter, formElementGroup);
        console.log(`${JSON.stringify(r, null, 4)}`);
    });
});
;

