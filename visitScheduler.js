import {RuleFactory} from 'rules-config/rules';
import RuleHelper from "./RuleHelper";
import lib from './lib';
import _ from 'lodash';

@RuleFactory("0723fd75-dc66-4aae-a3c9-31a09c9c4c7a", "VisitSchedule")
("99de0f1b-5453-4ae6-9a53-72c92d4cdd26", "ScheduleVisitsDuringScreening", 10.0)
class ScheduleVisitsDuringScreening {
    static exec(programEncounter, visitSchedule = [], scheduleConfig) {
        let scheduleBuilder = RuleHelper.createProgramEncounterVisitScheduleBuilder(programEncounter, visitSchedule);
        let visitDate = programEncounter.earliestVisitDateTime;
        var hplc = programEncounter.getObservationReadableValue('Result from old sickle cell test report')
         || programEncounter.getObservationReadableValue('HPLC result');
         var values = ['SS', 'Beta Thal','S-Beta thal'];
        //  console.log('hplc',hplc);
        //  console.log('hplc',_.includes(values,hplc));
        if(_.includes(values,hplc))
        scheduleBuilder
        .add({
          name: "Baseline Form",
          encounterType: "Baseline",
          earliestDate: visitDate,
          maxDate: lib.C.addMonths(visitDate, 3)
        });
        return scheduleBuilder.getAllUnique("encounterType");
    }
}


export {
    ScheduleVisitsDuringScreening
}