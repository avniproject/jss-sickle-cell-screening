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
import lib from './lib';
import moment from 'moment';
const _ = require("lodash");



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

        const hydroxyureaDate = programEnrolment.findLatestObservationFromEncounters('Date of starting of Hydroxyurea');
        
        const encounters = programEnrolment.encounters;
        let followup = _.filter(encounters, e => e.encounterType.uuid === 'e6ee694a-d70f-413c-b0f7-3520e7cdb6af' )
        if(!_.isNil(followup))
        const followUpEncounterDate = followup[0].encounterDateTime;
         

        const hBDate = programEnrolment.findLatestObservationFromEncounters('Date of HB');
            if(!_.isNil(hBDate) || !_.isNil(hydroxyureaDate)){
                var scheduleDate;
                if(!_.isNil(hBDate)){
                    scheduleDate = lib.C.addMonths(hBDate.getValue(), 1);
                    if(moment().isSameOrBefore(scheduleDate))
                    summaries.push({name:'HB Schedule',value: moment(scheduleDate).format("DD/MMM/YYYY") });
                   else
                    summaries.push({name:'HB Test Status',value:'Overdue'});          
                }            
                else {
                    if(!_.isNil(followUpEncounterDate)){
                    scheduleDate = followUpEncounterDate;
                    summaries.push({name:'HB Schedule',value: moment(scheduleDate).format("DD/MMM/YYYY") });
                    }
                } 
        }
            
        const creatinineDate = programEnrolment.findLatestObservationFromEncounters('Date of Creatinine');
            if(!_.isNil(creatinineDate)|| !_.isNil(hydroxyureaDate)){
                var scheduleDate;
                if(!_.isNil(creatinineDate)){
                 scheduleDate = lib.C.addMonths(creatinineDate.getValue(), 12);
                 if(moment().isSameOrBefore(scheduleDate))
                 summaries.push({name:'Creatinine Schedule',value: moment(scheduleDate).format("DD/MMM/YYYY") });
                else
                 summaries.push({name:'Creatinine Test Status',value:'Overdue'});
 
                }
                else { 
                    if(!_.isNil(followUpEncounterDate)){
                    scheduleDate = followUpEncounterDate;
                    summaries.push({name:'Creatinine Schedule',value: moment(scheduleDate).format("DD/MMM/YYYY") });               
                    }
                }
            }  

            const eyeExaminationDate = programEnrolment.findLatestObservationFromEncounters('Date of Eye examination');
            if(!_.isNil(eyeExaminationDate) || !_.isNil(hydroxyureaDate)){
                var scheduleDate;
                if(!_.isNil(eyeExaminationDate)){
                 scheduleDate = lib.C.addMonths(eyeExaminationDate.getValue(), 12);
                 if(moment().isSameOrBefore(scheduleDate))
                     summaries.push({name:'Eye Examination Schedule',value: moment(scheduleDate).format("DD/MMM/YYYY") });
                    else
                     summaries.push({name:'Eye Examination Status',value:'Overdue'});
  
                }
                else  {
                    if(!_.isNil(followUpEncounterDate)){
                    scheduleDate = followUpEncounterDate;
                    summaries.push({name:'Eye Examination Schedule',value: moment(scheduleDate).format("DD/MMM/YYYY") });
                    }
                }
            
                             } 

           
        const cbcDate = programEnrolment.findLatestObservationFromEncounters('Date of CBC Test');
            if(!_.isNil(cbcDate) || !_.isNil(hydroxyureaDate)){
                var scheduleDate;
                if(!_.isNil(cbcDate)){
                 scheduleDate = lib.C.addMonths(cbcDate.getValue(), 3);
                        if(moment().isSameOrBefore(scheduleDate))
                             summaries.push({name:'CBC Schedule',value: moment(scheduleDate).format("DD/MMM/YYYY") });
                        else
                             summaries.push({name:'CBC Test Status',value:'Overdue'});
              }
                else  {
                    if(!_.isNil(followUpEncounterDate)){
                    scheduleDate = followUpEncounterDate;
                    summaries.push({name:'CBC Schedule',value: moment(scheduleDate).format("DD/MMM/YYYY") });
                    }
                }
                                }  

            const lftDate = programEnrolment.findLatestObservationFromEncounters('Date of Liver Function Test');
                 if(!_.isNil(lftDate) || !_.isNil(hydroxyureaDate)){
                    var scheduleDate;
                    if(!_.isNil(lftDate)){
                        scheduleDate = lib.C.addMonths(lftDate.getValue(), 12);
                        if(moment().isSameOrBefore(scheduleDate))
                        summaries.push({name:'Liver Function Test Schedule',value: moment(scheduleDate).format("DD/MMM/YYYY") });
                       else
                        summaries.push({name:'Liver Function Test Status',value:'Overdue'});
       
                    }
                     
                    else  {
                        if(!_.isNil(followUpEncounterDate)){
                        scheduleDate = followUpEncounterDate;
                        summaries.push({name:'Liver Function Test Schedule',value: moment(scheduleDate).format("DD/MMM/YYYY") });
                        }                    
                    }

                                }  
               
        return summaries;
    }
}


module.exports = {SickleCellScreeningProgramRuleJSS};
